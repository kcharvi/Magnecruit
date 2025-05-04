# magnecruit_backend\app\services\chat_service.py

from .. import db
import traceback
from datetime import datetime, timezone
from . import job_sections_service
from ..agent import llm_interface
from ..models import Conversations, Messages
from ..agent.prompts import GENERAL_CHAT_PROMPT

# Fetch and format the conversation history and return a list of messages in the format required by the frontend
def fetch_and_format_history(conversation_id, db_session):
    '''
    Returns a list of messages in the format required by LLM for the general chat prompt
    '''
    messages = db_session.query(Messages).filter_by(conversation_id=conversation_id).order_by(Messages.timestamp).all()
    history = []
    for msg in messages:
        if msg.sender == 'user':
            history.append({'role': 'user', 'parts': [msg.content]})
        elif msg.sender == 'ai':
             history.append({'role': 'model', 'parts': [msg.content]})
    return history

# Get the general AI message response
def _get_general_ai_response(user_message_content: str, conversation_history: list) -> tuple[str | None, str | None]:
    '''
    Returns the text response from the LLM and the error message, if any
    '''
    try:
        model = llm_interface.get_gemini_model(system_instruction=GENERAL_CHAT_PROMPT)
        formatted_history = []
        for item in conversation_history:
            role = item.get('role')
            parts = item.get('parts')
            if role and parts:
                formatted_history.append({"role": role, "parts": parts})

        full_content = [
            *formatted_history,
            {"role": "user", "parts": [user_message_content]}
        ]

        llm_response = model.generate_content(full_content)
        text_response = None
        error_message = None
        try:
            text_response = llm_response.text
        except Exception as text_extract_err:
            print(f"(ChatService) Error extracting text from LLM response (General): {text_extract_err}")
            if llm_response.prompt_feedback and llm_response.prompt_feedback.block_reason:
                error_message = f"The request was blocked by the AI for safety reasons: {llm_response.prompt_feedback.block_reason.name}"
            else:
                error_message = "Sorry, I received an unusual response from the AI and couldn't extract the text."

        return text_response, error_message

    except Exception as e:
        print(f"(ChatService) Critical error in _get_general_ai_response: {e}")
        traceback.print_exc()
        return None, "Sorry, an internal error occurred while getting a general AI response."

# Process the incoming message from the frontend client and return the response data based on the active view
def process_incoming_message(user_id: int, current_conversation_id: int | None, message_content: str, active_view: str | None) -> dict:
    '''
    Returns the reponse_data to the client based on the active view
    '''
    conversation_id = current_conversation_id
    new_conversation_data = None
    new_ai_message_data = None
    updated_job_sections_object = None
    updated_job_sections_data = None
    ai_message_content_to_save = None
    ai_message_content_to_send = None
    error_message_for_client = None
    updated_field_keys = None

    try:
        if not conversation_id:
            new_conversation = Conversations(user_id=user_id, created_at=datetime.now(timezone.utc))
            db.session.add(new_conversation)
            db.session.flush()
            conversation_id = new_conversation.id
            new_conversation_data = {
                'conversationId': conversation_id,
                'title': None
            }
        if not conversation_id:
            raise ValueError("Failed to obtain a valid conversation ID.")
            
        user_message_db = Messages(
            conversation_id=conversation_id,
            sender='user',
            content=message_content,
            timestamp=datetime.now(timezone.utc)
        )
        db.session.add(user_message_db)
        db.session.flush()

        conversation_history = fetch_and_format_history(conversation_id, db.session)

        if active_view == 'job-sections':
            text_for_chat, updated_job_sections_object, service_error, updated_field_keys = job_sections_service.process_chat_for_job_sections(
                user_id, conversation_id, message_content, conversation_history
            )
            error_message_for_client = service_error
            
            if text_for_chat:
                ai_message_content_to_save = text_for_chat
                ai_message_content_to_send = text_for_chat
            elif error_message_for_client:
                ai_message_content_to_save = None
                ai_message_content_to_send = None
        # TODO: Add other active view handlers here to process the incoming message for other views
        else:
            general_text_response, general_error = _get_general_ai_response(
                message_content, conversation_history
            )
            error_message_for_client = general_error
            if general_text_response:
                ai_message_content_to_save = general_text_response
                ai_message_content_to_send = general_text_response
            updated_job_sections_object = None

        # Save the AI Message to the database if there was no error and there is content to save
        ai_message_db = None
        if ai_message_content_to_save and not error_message_for_client:
            ai_message_db = Messages(
                conversation_id=conversation_id,
                sender='ai',
                content=ai_message_content_to_save,
                timestamp=datetime.now(timezone.utc)
            )
            db.session.add(ai_message_db)
            db.session.flush()
            
            if ai_message_content_to_send:
                new_ai_message_data = {
                    'id': ai_message_db.id,
                    'conversation_id': conversation_id,
                    'sender': 'ai',
                    'content': ai_message_content_to_send,
                    'timestamp': ai_message_db.timestamp.isoformat()
                }
        elif not error_message_for_client:
            print("(ChatService) No AI message content to save or send, and no client error.")
        else:
             print(f"(ChatService) Not saving AI message due to client error: {error_message_for_client}")

        db.session.commit()

        # Format the updated job sections object to the updated job sections data, if it exists
        if updated_job_sections_object:
            db.session.refresh(updated_job_sections_object)
            sorted_sections = sorted(updated_job_sections_object.sections, key=lambda s: s.section_number)
            updated_job_sections_data = {
                'id': updated_job_sections_object.id,
                'conversation_id': updated_job_sections_object.conversation_id,
                'user_id': updated_job_sections_object.user_id,
                'jobrole': updated_job_sections_object.jobrole,
                'description': updated_job_sections_object.description,
                'created_at': updated_job_sections_object.created_at.isoformat() if updated_job_sections_object.created_at else None,
                'sections': [
                    {
                        'id': section.id,
                        'section_number': section.section_number,
                        'heading': section.heading,
                        'body': section.body
                    }
                    for section in sorted_sections
                ]
            }

        # Return the response data to the client if there was no error
        if error_message_for_client:
            return {
                "success": False,
                "error_message": error_message_for_client
            }
        else:
            response_data = {
                "success": True,
                "new_conversation_data": new_conversation_data,
                "new_ai_message_data": new_ai_message_data,
                "updated_job_sections_data": updated_job_sections_data,
            }
            if updated_field_keys is not None:
                 response_data["updated_field_keys"] = updated_field_keys
            return response_data

    except Exception as e:
        db.session.rollback()
        print(f"(ChatService) Critical error in process_incoming_message: {e}")
        traceback.print_exc()
        return {
            "success": False,
            "error_message": f"An unexpected server error occurred: {e}"
        } 