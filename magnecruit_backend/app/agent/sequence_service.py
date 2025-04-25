from .. import db # Import db from the app package
from ..models import Sequence, SequenceStep, Conversation, Message # Import necessary models
from . import prompting # Assume prompting functions exist here
from . import llm_interface # Assume AI call function exists here
from . import parsing # Import the new parsing functions
from datetime import datetime, timezone
import traceback

def get_sequence_for_conversation(conversation_id: int) -> Sequence | None:
    """Fetches the sequence associated with a conversation ID."""
    try:
        return db.session.query(Sequence).filter_by(conversation_id=conversation_id).first()
    except Exception as e:
        print(f"(Service) Error fetching sequence for convo {conversation_id}: {e}")
        return None

def _save_sequence_data(user_id: int, conversation_id: int, parsed_data: dict) -> Sequence | None:
    """ 
    Saves the parsed sequence data (name, desc, steps) to the database.
    Finds or creates the Sequence, deletes old steps, adds new steps.
    Returns the updated/created Sequence object or None on error.
    """ 
    print(f"(Service) Saving sequence data for conversation {conversation_id}")
    try:
        # Find or create sequence
        sequence = get_sequence_for_conversation(conversation_id)
        if not sequence:
            sequence = Sequence(user_id=user_id, conversation_id=conversation_id)
            db.session.add(sequence)
            # Flush to ensure sequence has an ID before adding steps
            db.session.flush() 
        
        # Update sequence details
        sequence.name = parsed_data.get('name')
        sequence.description = parsed_data.get('description')
        sequence.updated_at = datetime.now(timezone.utc) # Add/update timestamp

        # Clear old steps 
        for old_step in list(sequence.steps):
            db.session.delete(old_step)
        db.session.flush() 

        # Add new steps
        new_steps_data = parsed_data.get('steps', [])
        for i, step_data in enumerate(new_steps_data):
            if isinstance(step_data, dict):
                new_step = SequenceStep(
                    sequence_id=sequence.id,
                    step_number=step_data.get('step_number', i + 1), 
                    channel=step_data.get('channel', 'unknown'),
                    delay_days=step_data.get('delay_days'),
                    subject=step_data.get('subject'),
                    body=step_data.get('body', '')
                )
                db.session.add(new_step)
            else:
                print(f"(Service) Warning: Invalid step data format: {step_data}")
        
        # Commit changes for this sequence update
        # Note: Messages are committed separately in the websocket handler
        db.session.commit()
        print(f"(Service) Sequence {sequence.id} saved successfully.")
        return sequence

    except Exception as e:
        db.session.rollback()
        print(f"(Service) Error saving sequence data: {e}")
        traceback.print_exc()
        return None

def process_chat_for_sequence(user_id: int, conversation_id: int, message_content: str, conversation_history: list) -> tuple[str, Sequence | None]:
    """
    Orchestrates sequence generation/update based on chat.
    1. Builds prompt.
    2. Calls AI.
    3. Parses response.
    4. Saves sequence data if found.
    Returns: Tuple of (raw_ai_response, updated_sequence_object_or_None)
    """
    try:
        print(f"(Service) Processing chat for sequence, convo {conversation_id}")
        # 1. Build Prompt (Logic will be moved to prompting.py later)
        # TODO: Move this logic to prompting.py
        sequence = get_sequence_for_conversation(conversation_id)
        prompt_instructions = (
            "You are a helpful assistant creating outreach sequences. "
            "Based on the conversation history and the latest message, generate or update the sequence. "
            "Ask clarifying questions if needed. "
            "When providing the sequence, respond ONLY with a JSON object within ```json ... ``` markers. "
            "The JSON should have keys: 'name' (string, sequence title), 'description' (string), "
            "and 'steps' (array of objects, each with 'step_number' (int), 'channel' (string), "
            "'delay_days' (int), 'subject' (string or null), and 'body' (string))."
        )
        current_sequence_context = ""
        if sequence and sequence.steps:
            current_sequence_context += "\n\nCurrent Sequence Steps:\n"
            for step in sorted(sequence.steps, key=lambda s: s.step_number):
                 current_sequence_context += f"- Step {step.step_number} ({step.channel}, Delay {step.delay_days}d): Subject=\"{step.subject}\", Body=\"{step.body[:50]}...\"\n"
        ai_input_content = f"{prompt_instructions}{current_sequence_context}\n\nUser Message: {message_content}"

        # 2. Call AI
        print("(Service) Calling LLM...")
        raw_ai_response = llm_interface.get_gemini_response(ai_input_content, conversation_history)
        print(f"(Service) Received LLM response: {raw_ai_response[:100]}...")

        # Check for basic AI errors before parsing
        if raw_ai_response.startswith("AI service is not configured") or raw_ai_response.startswith("Sorry, I encountered an error"):
             print(f"(Service) AI Service Error: {raw_ai_response}")
             return raw_ai_response, None # Return error message, no sequence

        # 3. Parse Response
        print("(Service) Parsing AI response...")
        parsed_data = parsing.parse_sequence_from_ai_response(raw_ai_response)

        # 4. Save Sequence Data if found
        updated_sequence = None
        if parsed_data:
            print("(Service) Parsed data found, attempting to save...")
            updated_sequence = _save_sequence_data(user_id, conversation_id, parsed_data)
            if updated_sequence:
                 print(f"(Service) Sequence {updated_sequence.id} processed and saved.")
            else:
                 print("(Service) Failed to save sequence data after parsing.")
        else:
             print("(Service) No sequence data parsed from AI response.")

        return raw_ai_response, updated_sequence

    except Exception as e:
        print(f"(Service) Critical error in process_chat_for_sequence: {e}")
        traceback.print_exc()
        # Return a generic error message and no sequence
        return "Sorry, an internal error occurred while processing the sequence.", None 