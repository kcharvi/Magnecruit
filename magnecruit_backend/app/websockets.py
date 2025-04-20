from . import socketio
from flask_socketio import emit, join_room, leave_room, disconnect
from flask import request, session
from . import db
from .agent.llm_interface import get_gemini_response
from .models import Message, Conversation

@socketio.on('connect')
def handle_connect():
    print(f'Session SID: {request.sid}')
    
    temporary_user_id = 1
    session['user_id'] = temporary_user_id
    user_id = session.get('user_id')
    
    if user_id:
        print(f'TEMPORARY (Auth Bypassed): Client connected with Dummy User ID {user_id}, SID {request.sid}')
        join_room(f'user_{user_id}')
        emit('status', {'msg': f'Connected! as user {user_id}'}, room=request.sid)
    else:
        print(f'Unauthenticated client attempted connection: SID {request.sid}')
        emit('error', {'msg': 'Autherntication required. Please log in.'}, room=request.sid)
        disconnect()

@socketio.on('disconnect')
def handle_disconnect():
    user_id = session.get('user_id')

    if user_id:
        print(f'Client disconnected: User ID {user_id}, SID {request.sid}')
        leave_room(f'user_{user_id}')
    else:
        print(f'Unauthenticated client disconnected: SID {request.sid}')

@socketio.on('send_user_message')
def handle_user_message(data):
    user_id = session.get('user_id')
    # if not user_id:
    #     emit('error', {'msg': 'Authentication required to send messages.'}, room = request.sid)
    #     return
    message_content = data.get('content')
    conversation_id = data.get('conversationId')

    if not message_content or not conversation_id:
        emit('error', {'msg': 'Invalid message data.'}, room=request.sid)
        return
    
    print(f"Received message from user {user_id} in conversation {conversation_id}: {message_content}")

    try:
        new_user_message_db = Message(
            conversation_id=conversation_id,
            sender='user',
            content=message_content
        )
        # db.session.add(new_user_message_db)
        
        print("Calling AI service (Gemini Flash 1.5)...")

        # TODO: Fetch conversation history for context
        # conversation_history = fetch_and_format_history(conversation_id, db.session)
        # ai_response_content = get_gemini_response(message_content, conversation_history)

        ai_response_content = get_gemini_response(message_content)

        print(f"Received AI response: {ai_response_content}")
        if ai_response_content.startswith("AI service is not configured") or ai_response_content.startswith("Sorry, I encountered an error"):
             db.session.rollback() 
             emit('error', {'msg': ai_response_content}, room=request.sid)
             return

        new_ai_message_db = Message(
            conversation_id=conversation_id,
            sender='ai',
            content=ai_response_content
        )

        # db.session.add(new_ai_message_db)
        # db.session.commit()

        emit('ai_response', {
            'id': new_ai_message_db.id,
            'conversationId': conversation_id,
            'sender': 'ai',
            'content': ai_response_content,
        }, room=f'user_{user_id}')

        # TODO: If the AI response triggers a workspace update (Sequence/Steps),
        # emit a separate event (e.g., 'sequence_updated') to the user's room
        # emit('sequence_updated', { ... sequence_data ... }, room=f'user_{user_id}')

    except Exception as e:
        db.session.rollback()
        print(f"Error handling message or saving to DB: {e}")
        emit('error', {'msg': 'An internal error occurred.'}, room=request.sid)

# TODO: Define other backend Socket.IO handlers here for things like:
# - Updating sequence steps from the workspace (@socketio.on('update_sequence_step'))
# - Requesting initial conversation data if not using HTTP API (@socketio.on('request_conversation_data'))
# - etc.