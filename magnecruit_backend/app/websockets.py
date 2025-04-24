# magnecruit_backend\app\websockets.py

from . import socketio
from flask_socketio import emit, join_room, leave_room, disconnect
from flask import request, session
from . import db
from .agent.llm_interface import get_gemini_response
from .models import Message, Conversation
from datetime import datetime, timezone

@socketio.on('connect')
def handle_connect(auth):
    print(f'Client attempting connection: SID {request.sid}')
    
    if auth and isinstance(auth, dict):
        user_id = auth.get('userId')
        username = auth.get('username')
        email = auth.get('email') 
        print(f"Connection auth data received: {auth}")

        if user_id and username: 
            session['user_id'] = user_id 
            session['username'] = username
            session['email'] = email
            print(f'Client connected via auth: User ID {user_id} ({username}), SID {request.sid}')
            join_room(f'user_{user_id}') 
            emit('status', {'msg': f'Connected as {username}'}, room=request.sid)
            return 
        else:
            print(f'Connection rejected: Missing userId or username in auth data. Auth: {auth}')
            return False 
    else:
        print(f'Connection rejected: No authentication data provided. SID {request.sid}')
        return False 

@socketio.on('disconnect')
def handle_disconnect():
    user_id = session.get('user_id')

    if user_id:
        print(f'Client disconnected: User ID {user_id}, SID {request.sid}')
        leave_room(f'user_{user_id}')
    else:
        print(f'Unauthenticated client disconnected: SID {request.sid}')

def fetch_and_format_history(conversation_id, db_session):
    messages = db_session.query(Message).filter_by(conversation_id=conversation_id).order_by(Message.timestamp).all()
    history = []
    for msg in messages:
        if msg.sender == 'user':
            history.append({'role': 'user', 'parts': [msg.content]})
        elif msg.sender == 'ai':
            history.append({'role': 'model', 'parts': [msg.content]})
    return history

@socketio.on('send_user_message')
def handle_user_message(data):
    user_id = session.get('user_id')
    
    if not user_id:
        emit('error', {'msg': 'Authentication error. Cannot process message. Please log in again.'}, room=request.sid)
        print(f"Error: User ID not found in session for SID {request.sid} during message send.")
        return

    message_content = data.get('content')
    conversation_id = data.get('conversationId')

    if not message_content:
        emit('error', {'msg': 'Invalid message data: content missing.'}, room=request.sid)
        return

    print(f"Received message from user {user_id}. Content: '{message_content}'. Target Conversation ID: {conversation_id}")

    try:
        new_conversation_created = False
        if not conversation_id:
            print(f"No conversationId provided. Creating a new conversation for user {user_id}.")
            new_conversation = Conversation(
                user_id=user_id, 
                created_at=datetime.now(timezone.utc)
            )
            db.session.add(new_conversation)
            db.session.flush() 
            conversation_id = new_conversation.id
            new_conversation_created = True
            print(f"New conversation created with ID: {conversation_id}")
        
        new_user_message_db = Message(
            conversation_id=conversation_id,
            sender='user',
            content=message_content,
            timestamp=datetime.now(timezone.utc)
        )
        db.session.add(new_user_message_db)

        print(f"Calling AI service (Gemini Flash 1.5) for conversation {conversation_id}...")
        conversation_history = fetch_and_format_history(conversation_id, db.session)
        ai_response_content = get_gemini_response(message_content, conversation_history)

        print(f"Received AI response for conversation {conversation_id}: {ai_response_content[:100]}...")

        if ai_response_content.startswith("AI service is not configured") or ai_response_content.startswith("Sorry, I encountered an error"):
             db.session.rollback() 
             emit('error', {'msg': ai_response_content}, room=request.sid)
             print(f"AI Service Error for conversation {conversation_id}: {ai_response_content}")
             return

        new_ai_message_db = Message(
            conversation_id=conversation_id,
            sender='ai',
            content=ai_response_content,
            timestamp=datetime.now(timezone.utc)
        )
        db.session.add(new_ai_message_db)
        
        db.session.commit()
        print(f"User and AI messages saved for conversation {conversation_id}.")

        emit('ai_response', {
            'id': new_ai_message_db.id,
            'conversationId': conversation_id, 
            'sender': 'ai',
            'content': ai_response_content,
        }, room=f'user_{user_id}') 

        if new_conversation_created:
             emit('conversation_created', {
                'conversationId': conversation_id, 
                'title': None 
             }, room=f'user_{user_id}') 

    except Exception as e:
        db.session.rollback()
        print(f"Error processing message for conversation {conversation_id} / user {user_id}: {e}")
        import traceback
        traceback.print_exc() 
        emit('error', {'msg': f'An internal error occurred while processing your message.'}, room=request.sid)

@socketio.on('request_conversation_messages')
def handle_request_conversation_messages(data):
    user_id = session.get('user_id')
    conversation_id = data.get('conversationId')

    if not conversation_id or not user_id:
        emit('error', {'msg': 'Invalid request for conversation messages (missing ID or not authenticated).'}, room=request.sid)
        return

    print(f"User {user_id} requested messages for conversation {conversation_id}")

    try:
        conversation = db.session.query(Conversation).filter_by(id=conversation_id, user_id=user_id).first()
        
        if not conversation:
            print(f"Access denied: User {user_id} tried to access conversation {conversation_id} not belonging to them or non-existent.")
            emit('error', {'msg': 'Conversation not found or access denied.'}, room=request.sid)
            return
            
        messages = db.session.query(Message).filter_by(conversation_id=conversation_id).order_by(Message.timestamp).all()
        messages_data = [{
            'id': msg.id,
            'sender': msg.sender,
            'content': msg.content,
            'timestamp': msg.timestamp.isoformat()
        } for msg in messages]
        emit('conversation_messages', {'conversationId': conversation_id, 'messages': messages_data}, room=f'user_{user_id}')
    except Exception as e:
        print(f"Error fetching conversation messages for user {user_id}, convo {conversation_id}: {e}")
        emit('error', {'msg': 'Failed to fetch conversation messages.'}, room=request.sid)

# TODO: Define other backend Socket.IO handlers here for things like:
# - Updating sequence steps from the workspace (@socketio.on('update_sequence_step'))