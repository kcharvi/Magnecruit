# magnecruit_backend\app\websockets.py

import traceback
from . import socketio, db
from flask import request, session
from .services import chat_service
from .models import Messages, Conversations
from flask_socketio import emit, join_room, leave_room

# Handles the connection of the user to the websocket
@socketio.on('connect')
def handle_connect(auth):
    '''
    Returns the status of the user's connection to the websocket
    '''
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
            return False 
    else:
        return False 

# Handles the disconnection of the user from the websocket
@socketio.on('disconnect')
def handle_disconnect():
    '''
    Returns the status of the user's disconnection from the websocket
    '''
    user_id = session.get('user_id')
    user_room = f'user_{user_id}' if user_id else None
    if user_id and user_room:
        leave_room(user_room)

# Handles the request for the conversation messages from the user
@socketio.on('request_conversation_messages')
def handle_request_conversation_messages(data):
    '''
    Returns the conversation messages for the given conversation id
    '''
    user_id = session.get('user_id')
    conversation_id = data.get('conversationId')
    user_room = f'user_{user_id}'

    if not conversation_id or not user_id:
        emit('error', {'msg': 'Invalid request for conversation messages.'}, room=request.sid)
        return
    
    try:
        conversation = db.session.query(Conversations).filter_by(id=conversation_id, user_id=user_id).first()

        if not conversation:
            emit('error', {'msg': 'Conversation not found or access denied.'}, room=request.sid)
            return

        messages = db.session.query(Messages).filter_by(conversation_id=conversation_id).order_by(Messages.timestamp).all()        
        messages_data = []
        
        for msg in messages:
            messages_data.append({
                'id': msg.id,
                'sender': msg.sender,
                'content': msg.content,
                'timestamp': msg.timestamp.isoformat(),
                'conversation_id': msg.conversation_id 
            })

        emit('conversation_messages', {'conversationId': conversation_id, 'messages': messages_data}, room=user_room)
    except Exception as e:
        traceback.print_exc()
        emit('error', {'msg': 'Failed to fetch conversation messages.'}, room=request.sid)

# Handles the sending of the user's message to the websocket
@socketio.on('send_user_message')
def handle_user_message(data):
    '''
    Returns the response from the LLM for the user's message
    '''
    user_id = session.get('user_id')
    if not user_id:
        emit('error', {'msg': 'Authentication error.'}, room=request.sid)
        return
    
    message_content = data.get('content')
    conversation_id = data.get('conversationId') 
    active_view = data.get('activeView', 'actions') 
    if not message_content or not isinstance(message_content, str) or not message_content.strip():
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

        if result.get("updated_job_sections_data"):
            job_sections_payload = result["updated_job_sections_data"]
            updated_keys = result.get("updated_field_keys")
            if updated_keys is not None:
                job_sections_payload['updated_field_keys'] = updated_keys

            emit('job_updated', job_sections_payload, room=user_room)

    else:
        error_msg = result.get("error_message", "An unknown error occurred.")
        emit('error', {'msg': error_msg}, room=request.sid)