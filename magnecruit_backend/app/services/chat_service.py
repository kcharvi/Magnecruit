# magnecruit_backend\app\services\chat_service.py

from . import job_sequence_service
from .. import db
from ..models import Conversation, Message, Sequence, SequenceStep
from ..agent import llm_interface
from ..agent.prompt_builder import GENERAL_CHAT_PROMPT
from datetime import datetime, timezone
import traceback

def fetch_and_format_history(conversation_id, db_session):
    messages = db_session.query(Message).filter_by(conversation_id=conversation_id).order_by(Message.timestamp).all()
    history = []
    for msg in messages:
        if msg.sender == 'user':
            history.append({'role': 'user', 'parts': [msg.content]})
        elif msg.sender == 'ai':
            history.append({'role': 'model', 'parts': [msg.content]})
    return history

def _get_general_ai_response(user_message_content: str, conversation_history: list) -> tuple[str | None, str | None]:
    print("(ChatService) Getting general AI response (no tools)...")
    try:
        ai_input_content = f"{GENERAL_CHAT_PROMPT}\n\nLatest User Message: {user_message_content}"
        llm_response = llm_interface.get_gemini_response(ai_input_content, conversation_history, tools=None)
        
        if isinstance(llm_response, dict) and "error" in llm_response:
            error_msg = llm_response["error"]
            print(f"(ChatService) LLM Interface Error (General): {error_msg}")
            return None, error_msg
            
        text_response = None
        error_message = None
        try:
            text_response = llm_response.text
        except Exception as text_extract_err:
            print(f"(ChatService) Error extracting text from LLM response (General): {text_extract_err}")
            error_message = "Sorry, I received an unusual response from the AI and couldn't extract the text."

        return text_response, error_message

    except Exception as e:
        print(f"(ChatService) Critical error in _get_general_ai_response: {e}")
        traceback.print_exc()
        return None, "Sorry, an internal error occurred while getting a general AI response."

def process_incoming_message(user_id: int, current_conversation_id: int | None, message_content: str, active_view: str | None) -> dict:
    conversation_id = current_conversation_id
    new_conversation_data = None
    new_ai_message_data = None
    updated_sequence_object = None
    updated_sequence_data = None
    ai_message_content_to_save = None
    ai_message_content_to_send = None
    error_message_for_client = None
    
    try:
        if not conversation_id:
            print(f"(ChatService) Creating new conversation for user {user_id}.")
            new_conversation = Conversation(user_id=user_id, created_at=datetime.now(timezone.utc))
            db.session.add(new_conversation)
            db.session.flush()
            conversation_id = new_conversation.id
            new_conversation_data = {
                'conversationId': conversation_id,
                'title': None
            }
        if not conversation_id:
            raise ValueError("Failed to obtain a valid conversation ID.")
            
        user_message_db = Message(
            conversation_id=conversation_id,
            sender='user',
            content=message_content,
            timestamp=datetime.now(timezone.utc)
        )
        db.session.add(user_message_db)
        db.session.flush()

        conversation_history = fetch_and_format_history(conversation_id, db.session)
        raw_json_str_from_llm = None

        if active_view == 'job-sequence':
            text_for_chat, updated_sequence_object, service_error, raw_json_str_from_llm = job_sequence_service.process_chat_for_sequence(
                user_id, conversation_id, message_content, conversation_history
            )
            error_message_for_client = service_error
            
            if updated_sequence_object:
                ai_message_content_to_save = raw_json_str_from_llm
                ai_message_content_to_send = text_for_chat
            elif text_for_chat:
                ai_message_content_to_save = text_for_chat
                ai_message_content_to_send = text_for_chat

        else:
            print(f"(ChatService) Routing to General AI handler for activeView: {active_view}")
            general_text_response, general_error = _get_general_ai_response(
                message_content, conversation_history
            )
            error_message_for_client = general_error
            if general_text_response:
                ai_message_content_to_save = general_text_response
                ai_message_content_to_send = general_text_response
            updated_sequence_object = None

        ai_message_db = None
        if ai_message_content_to_save and not error_message_for_client:
            ai_message_db = Message(
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

        db.session.commit()
        print("(ChatService) Database transaction committed.")

        if updated_sequence_object:
            db.session.refresh(updated_sequence_object)
            updated_sequence_data = {
                'id': updated_sequence_object.id,
                'conversation_id': updated_sequence_object.conversation_id,
                'user_id': updated_sequence_object.user_id,
                'jobrole': updated_sequence_object.jobrole,
                'description': updated_sequence_object.description,
                'created_at': updated_sequence_object.created_at.isoformat() if updated_sequence_object.created_at else None,
                'steps': sorted([
                    {
                        'id': step.id,
                        'step_number': step.step_number,
                        'heading': step.heading,
                        'body': step.body
                    }
                    for step in updated_sequence_object.steps 
                ], key=lambda s: s['step_number'])
            }

        if error_message_for_client:
            return {
                "success": False,
                "error_message": error_message_for_client
            }
        else:
            return {
                "success": True,
                "new_conversation_data": new_conversation_data,
                "new_ai_message_data": new_ai_message_data,
                "updated_sequence_data": updated_sequence_data
            }

    except Exception as e:
        db.session.rollback()
        print(f"(ChatService) Critical error in process_incoming_message: {e}")
        traceback.print_exc()
        return {
            "success": False,
            "error_message": f"An unexpected server error occurred: {e}"
        } 