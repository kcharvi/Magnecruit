# magnecruit_backend\app\routes\chat_routes.py

from flask import Blueprint, jsonify, session
from .. import db
from ..models import Conversation
from datetime import datetime, timezone

chat_bp = Blueprint('chat_bp', __name__, url_prefix='/api/chat')

@chat_bp.route('/conversations', methods=['GET'])
def get_conversations():
    user_id = session.get('user_id') 
    if not user_id:
         print("Attempted to fetch conversations with no user logged in.")
         return jsonify({"error": "Authentication required to fetch conversations"}), 401
    
    try:
        conversations = db.session.query(Conversation).filter_by(user_id=user_id).order_by(Conversation.created_at.desc()).all()
        conversation_data = []
        for conv in conversations:
            title = conv.title or f"Recruit Outreach {conv.id}" 
            conversation_data.append({
                'id': conv.id,
                'title': title,
                'created_at': conv.created_at.isoformat()
            })
            
        return jsonify(conversation_data), 200
    except Exception as e:
        print(f"Error fetching conversations for user {user_id}: {e}")
        return jsonify({"error": "Failed to fetch conversations"}), 500
