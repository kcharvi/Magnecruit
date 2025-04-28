# magnecruit_backend\app\services\job_sequence_service.py

from .. import db 
from ..models import Sequence, SequenceStep
from ..agent import llm_interface
from ..agent import parsing
# Import the new prompt structures
from ..agent.prompt_builder import (
    SYSTEM_PROMPT_JOB_SEQUENCE, 
    BUILD_JOB_SEQUENCE_PROMPT,
    CONFIRMATION_PROMPT_TEMPLATE
)
import traceback
import json

def get_sequence_for_conversation(conversation_id: int) -> Sequence | None:
    try:
        return db.session.query(Sequence).options(db.joinedload(Sequence.steps)).filter_by(conversation_id=conversation_id).first()
    except Exception as e:
        print(f"(JobSequenceService) Error fetching sequence for convo {conversation_id}: {e}")
        return None

def _save_sequence_data(user_id: int, conversation_id: int, parsed_data: dict) -> Sequence | None:
    print(f"(JobSequenceService) Saving full sequence from parsed JSON for conversation {conversation_id}")
    try:
        sequence = get_sequence_for_conversation(conversation_id)
        if not sequence:
            sequence = Sequence(user_id=user_id, conversation_id=conversation_id)
            db.session.add(sequence)
            db.session.flush()
        
        sequence.jobrole = parsed_data.get('jobrole', sequence.jobrole)
        sequence.description = parsed_data.get('description', sequence.description)

        print(f"(JobSequenceService) Deleting existing steps for sequence {sequence.id}")
        SequenceStep.query.filter_by(sequence_id=sequence.id).delete()
        db.session.flush() 

        new_steps_data = parsed_data.get('steps', [])
        steps_added = []
        print(f"(JobSequenceService) Adding {len(new_steps_data)} steps from parsed JSON for sequence {sequence.id}")
        for step_data in new_steps_data:
            if isinstance(step_data, dict) and 'heading' in step_data and 'body' in step_data and 'step_number' in step_data:
                new_step = SequenceStep(
                    sequence_id=sequence.id,
                    step_number=step_data['step_number'], 
                    heading=step_data['heading'],
                    body=step_data['body']
                )
                db.session.add(new_step)
                steps_added.append(new_step)
            else:
                print(f"(JobSequenceService) Warning: Skipping invalid step data format in parsed JSON: {step_data}")
        
        if steps_added:
             db.session.flush()

        print(f"(JobSequenceService) Sequence {sequence.id} data overwrite successful (commit pending).")
        return sequence

    except Exception as e:
        print(f"(JobSequenceService) Error saving sequence data from JSON (overwrite): {e}")
        traceback.print_exc()
        db.session.rollback() 
        return None

def _get_confirmation_message() -> str:
    """Calls LLM to get a brief confirmation message."""
    print("(JobSequenceService) Getting confirmation message from LLM...")
    try:
        response = llm_interface.get_gemini_response(CONFIRMATION_PROMPT_TEMPLATE)
        if isinstance(response, dict) and "error" in response:
            print(f"(JobSequenceService) Error getting confirmation message: {response['error']}")
            return "OK, sequence updated." 
        return response.text.strip() if response and hasattr(response, 'text') else "OK, sequence updated."
    except Exception as e:
        print(f"(JobSequenceService) Exception getting confirmation message: {e}")
        return "OK, sequence updated."

def process_chat_for_sequence(user_id: int, 
                               conversation_id: int, 
                               message_content: str, 
                               conversation_history: list) -> tuple[str | None, Sequence | None, str | None, str | None]:
    """
    Handles chat in 'job-sequence' JSON mode.
    1. Calls LLM to get updated JSON state.
    2. Parses JSON, saves sequence data.
    3. If successful, calls LLM again for a confirmation message.
    Returns: Tuple of (confirmation_or_error_text, updated_sequence_obj, error_for_client, raw_json_str)
    """
    raw_json_response = None
    updated_sequence = None
    error_message_for_client = None
    text_for_chat = None 

    try:
        sequence = get_sequence_for_conversation(conversation_id)
        current_state_json = "null"
        if sequence:
            current_state_dict = {
                "jobrole": sequence.jobrole,
                "description": sequence.description,
                "steps": sorted([
                    {"step_number": s.step_number, "heading": s.heading, "body": s.body}
                    for s in sequence.steps
                ], key=lambda x: x['step_number'])
            }
            try:
                 current_state_json = json.dumps(current_state_dict, indent=2)
            except Exception as json_err:
                print(f"(JobSequenceService) Error formatting current state as JSON for context: {json_err}")
                current_state_json = "{\"error\": \"Could not format current state\"}"

        user_turn_content = BUILD_JOB_SEQUENCE_PROMPT.format(
            current_state_json=current_state_json,
            user_message=message_content
        )

        # llm_response_obj = llm_interface.get_gemini_response(user_turn_content, conversation_history, tools=None)
        llm_response_obj = llm_interface.get_gemini_model().generate_content(
            contents=[user_turn_content],
            generation_config=llm_interface.get_genneration_config_params
        )

        print(f"(Job Sequence Update) LLM Response: {llm_response_obj.text}")
        
        if isinstance(llm_response_obj, dict) and "error" in llm_response_obj:
            error_message_for_client = llm_response_obj["error"]
            print(f"(JobSequenceService) LLM Interface Error: {error_message_for_client}")
            return None, None, error_message_for_client, None
        
        try:
            raw_json_response = llm_response_obj.text
        except Exception as text_extract_err:
             print(f"(JobSequenceService) Error extracting text from LLM response object: {text_extract_err}")
             error_message_for_client = "Sorry, I received an unusual response structure from the AI."
             return None, None, error_message_for_client, None

        if raw_json_response:
            print("(JobSequenceService) Received raw text response, attempting to parse JSON...")
            parsed_data = parsing.parse_sequence_from_ai_response(raw_json_response)
            
            if parsed_data:
                print("(JobSequenceService) Successfully parsed JSON, attempting to save...")
                updated_sequence = _save_sequence_data(user_id, conversation_id, parsed_data)
                if updated_sequence:
                    text_for_chat = _get_confirmation_message()
                    print(f"(JobSequenceService) Sequence {updated_sequence.id} updated. Got confirmation: '{text_for_chat}'")
                else:
                    error_message_for_client = "Failed to save the updated sequence data due to an internal error."
                    text_for_chat = f"Error: Could not save sequence. AI suggested JSON:\n```json\n{json.dumps(parsed_data, indent=2)}\n```" # Show user the JSON on save error
            else:
                print("(JobSequenceService) Failed to parse valid sequence JSON from AI response. Treating as text.")
                text_for_chat = raw_json_response 
                raw_json_response = None 
        else:
            print("(JobSequenceService) LLM response had no text content.")
            error_message_for_client = "The AI did not provide a response."

        return text_for_chat, updated_sequence, error_message_for_client, raw_json_response

    except Exception as e:
        print(f"(JobSequenceService) Critical error in process_chat_for_sequence (JSON Mode): {e}")
        traceback.print_exc()
        return None, None, "Sorry, an internal error occurred while processing the sequence request.", None 