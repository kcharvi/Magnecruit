# magnecruit_backend\app\websockets.py

from . import socketio, db
from flask_socketio import emit, join_room, leave_room
from flask import request, session
from .models import Message, Conversation
from .services import chat_service
import traceback

@socketio.on('connect')
def handle_connect(auth):
    if auth and isinstance(auth, dict):
        user_id = auth.get('userId')
        username = auth.get('username')
        email = auth.get('email') 
        if user_id and username: 
            session['user_id'] = user_id 
            session['username'] = username
            session['email'] = email
            user_room = f'user_{user_id}'
            join_room(user_room) 
            emit('status', {'msg': f'Connected as {username}'}, room=request.sid)
            return
        else:
            print(f'(WS Connect - handle_connect) REJECTED: Missing userId or username in auth data. Auth: {auth}')
            return False 
    else:
        print(f'(WS Connect - handle_connect) REJECTED: No authentication data provided. SID: {request.sid}')
        return False 

@socketio.on('disconnect')
def handle_disconnect():
    user_id = session.get('user_id')
    user_room = f'user_{user_id}' if user_id else None
    if user_id and user_room:
        print(f'(WS Disconnect - handle_disconnect) Leaving room {user_room} for user {user_id}')
        leave_room(user_room)

@socketio.on('send_user_message')
def handle_user_message(data):
    user_id = session.get('user_id')
    
    if not user_id:
        print(f"(WS) Error: Received message from unauthenticated user SID {request.sid}")
        emit('error', {'msg': 'Authentication error.'}, room=request.sid)
        return

    message_content = data.get('content')
    conversation_id = data.get('conversationId') 
    active_view = data.get('activeView', 'actions') 

    if not message_content or not isinstance(message_content, str) or not message_content.strip():
        print(f"(WS - handle_user_message) Error: Invalid message content from user {user_id}. Data: {data}")
        emit('error', {'msg': 'Invalid message content.'}, room=request.sid)
        return
    
    user_room = f'user_{user_id}'

    result = chat_service.process_incoming_message(
        user_id=user_id,
        current_conversation_id=conversation_id,
        message_content=message_content,
        active_view=active_view 
    )

    if result["success"]:

        if result.get("new_conversation_data"):
            new_convo_payload = result["new_conversation_data"]
            emit('conversation_created', new_convo_payload, room=user_room)

        if result.get("new_ai_message_data"):
            ai_msg_payload = result["new_ai_message_data"]
            emit('ai_response', ai_msg_payload, room=user_room)
        else:
            print(f"(WS - handle_user_message) Note: Chat service succeeded but returned no explicit AI text response.")

        if result.get("updated_sequence_data"):
            sequence_payload = result["updated_sequence_data"]
            emit('sequence_updated', sequence_payload, room=user_room)

    else:
        error_msg = result.get("error_message", "An unknown error occurred.")
        print(f"(WS) Error processing message for user {user_id}: {error_msg}")
        emit('error', {'msg': error_msg}, room=request.sid)

def _is_likely_json(content: str) -> bool:
    if not content:
        return False
    stripped_content = content.strip()
    if stripped_content.startswith('```json') and stripped_content.endswith('```'):
        stripped_content = stripped_content[7:-3].strip()
    
    return (
        (stripped_content.startswith('{') and stripped_content.endswith('}')) or
        (stripped_content.startswith('[') and stripped_content.endswith(']'))
    )

@socketio.on('request_conversation_messages')
def handle_request_conversation_messages(data):
    user_id = session.get('user_id')
    conversation_id = data.get('conversationId')

    if not conversation_id or not user_id:
        print(f"(WS) Invalid request for messages: User {user_id}, Convo {conversation_id}")
        emit('error', {'msg': 'Invalid request for conversation messages.'}, room=request.sid)
        return
        
    user_room = f'user_{user_id}'

    try:
        conversation = db.session.query(Conversation).filter_by(id=conversation_id, user_id=user_id).first()

        if not conversation:
            print(f"(WS) Access denied or not found: User {user_id}, Convo {conversation_id}")
            emit('error', {'msg': 'Conversation not found or access denied.'}, room=request.sid)
            return

        messages = db.session.query(Message).filter_by(conversation_id=conversation_id).order_by(Message.timestamp).all()
        
        messages_data = []
        friendly_sequence_update_msg = "Okay, I've updated the job description sequence in the workspace. Take a look and let me know if you need further changes!"
        
        for msg in messages:
            display_content = msg.content
            if msg.sender == 'ai' and _is_likely_json(msg.content):
                display_content = friendly_sequence_update_msg
            
            messages_data.append({
                'id': msg.id,
                'sender': msg.sender,
                'content': display_content,
                'timestamp': msg.timestamp.isoformat(),
                'conversation_id': msg.conversation_id 
            })

        emit('conversation_messages', {'conversationId': conversation_id, 'messages': messages_data}, room=user_room)

    except Exception as e:
        print(f"(WS) Error fetching conversation messages for user {user_id}, convo {conversation_id}: {e}")
        traceback.print_exc()
        emit('error', {'msg': 'Failed to fetch conversation messages.'}, room=request.sid)