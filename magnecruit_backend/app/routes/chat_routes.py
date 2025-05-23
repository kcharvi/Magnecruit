# magnecruit_backend\app\routes\chat_routes.py

from .. import db
from ..models import Conversations
from flask import Blueprint, jsonify, session

chat_bp = Blueprint('chat_bp', __name__, url_prefix='/api/chat')

# Route to get all conversations for the user
@chat_bp.route('/conversations', methods=['GET'])
def get_conversations():
    '''
    Returns all the conversations for the user to display in the sidebar history
    '''
    user_id = session.get('user_id') 
    if not user_id:
         return jsonify({"error": "Authentication required to fetch conversations"}), 401
    
    try:
        conversations = db.session.query(Conversations).filter_by(user_id=user_id).order_by(Conversations.created_at.desc()).all()
        conversation_data = []
        for conv in conversations:
            title = conv.title or f"Chat {conv.id}" 
            conversation_data.append({
                'id': conv.id,
                'title': title,
                'created_at': conv.created_at.isoformat()
            })            
        return jsonify(conversation_data), 200
    
    except Exception as e:
        return jsonify({"error": "Failed to fetch conversations"}), 500