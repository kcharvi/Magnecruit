# magnecruit_backend\app\websockets.py

from . import socketio
from flask_socketio import emit, join_room, leave_room, disconnect
from flask import request, session
from . import db
from .agent import sequence_service
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
        emit('error', {'msg': 'Authentication error.'}, room=request.sid)
        return

    message_content = data.get('content')
    conversation_id = data.get('conversationId')

    if not message_content:
        emit('error', {'msg': 'Invalid message data.'}, room=request.sid)
        return

    print(f"(WS) Received message from user {user_id}. Convo ID: {conversation_id}")

    try:
        # --- Create Conversation if needed ---
        new_conversation_created = False
        if not conversation_id:
            print(f"(WS) Creating new conversation for user {user_id}.")
            # Create conversation but commit later with messages
            new_conversation = Conversation(user_id=user_id, created_at=datetime.now(timezone.utc))
            db.session.add(new_conversation)
            db.session.flush() 
            conversation_id = new_conversation.id
            new_conversation_created = True
            print(f"(WS) New conversation ID: {conversation_id}")
        
        # --- Save User Message --- 
        # Add user message to session first, THEN fetch history
        new_user_message_db = Message(
            conversation_id=conversation_id,
            sender='user',
            content=message_content,
            timestamp=datetime.now(timezone.utc)
        )
        db.session.add(new_user_message_db)
        db.session.flush() # Ensure message exists before history fetch
        
        # --- Process Chat via Sequence Service ---
        conversation_history = fetch_and_format_history(conversation_id, db.session)
        raw_ai_response, updated_sequence = sequence_service.process_chat_for_sequence(
            user_id, conversation_id, message_content, conversation_history
        )

        # --- Save AI Response Message --- 
        new_ai_message_db = Message(
            conversation_id=conversation_id,
            sender='ai',
            content=raw_ai_response, # Save the raw response from the service
            timestamp=datetime.now(timezone.utc)
        )
        db.session.add(new_ai_message_db)
        
        # --- Commit Messages --- 
        # Sequence saving is handled within the service, just commit messages here
        db.session.commit() 
        print("(WS) User and AI messages committed.")

        # --- Emit Responses to Frontend ---
        # 1. Emit the raw AI response for chat history
        emit('ai_response', {
            'id': new_ai_message_db.id,
            'conversationId': conversation_id, 
            'sender': 'ai',
            'content': raw_ai_response, 
        }, room=f'user_{user_id}') 
        print("(WS) Emitted ai_response.")

        # 2. Emit conversation_created if it was a new one
        if new_conversation_created:
             emit('conversation_created', {
                'conversationId': conversation_id, 
                'title': None # Title might be set by sequence later
             }, room=f'user_{user_id}') 
             print("(WS) Emitted conversation_created.")
        
        # 3. Emit sequence_updated if the service returned an updated sequence
        if updated_sequence:
            # Format the payload correctly for the frontend
            updated_sequence_payload = {
                'id': updated_sequence.id,
                'conversation_id': updated_sequence.conversation_id,
                'user_id': updated_sequence.user_id,
                'name': updated_sequence.name,
                'description': updated_sequence.description,
                'created_at': updated_sequence.created_at.isoformat() if updated_sequence.created_at else None,
                # Ensure steps are loaded and sorted
                'steps': sorted([
                    {
                        'id': step.id,
                        'step_number': step.step_number,
                        'channel': step.channel,
                        'delay_days': step.delay_days,
                        'subject': step.subject,
                        'body': step.body
                    }
                    for step in updated_sequence.steps # Access steps relation
                ], key=lambda s: s['step_number'])
            }
            print(f"(WS) Emitting sequence_updated for sequence {updated_sequence.id}")
            emit('sequence_updated', updated_sequence_payload, room=f'user_{user_id}')

    except Exception as e:
        db.session.rollback()
        print(f"(WS) Critical error in handle_user_message: {e}")
        import traceback
        traceback.print_exc() 
        emit('error', {'msg': 'An internal server error occurred.'}, room=request.sid)

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