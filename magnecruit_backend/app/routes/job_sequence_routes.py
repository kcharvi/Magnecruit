# magnecruit_backend/app/routes/job_sequence_routes.py

from flask import Blueprint, request, jsonify
from ..models import Sequence, SequenceStep, db
from datetime import datetime

job_sequence_bp = Blueprint('job_sequence', __name__)

@job_sequence_bp.route('/get/<int:conversation_id>', methods=['GET'])
def get_sequence(conversation_id):
    try:
        sequence = Sequence.query.filter_by(conversation_id=conversation_id).first()
        if not sequence:
            return jsonify({"error": "No job sequence found for this conversation"}), 404
        
        steps = SequenceStep.query.filter_by(sequence_id=sequence.id).order_by(SequenceStep.step_number).all()
        
        sequence_data = {
            "id": sequence.id,
            "conversation_id": sequence.conversation_id,
            "user_id": sequence.user_id,
            "jobrole": sequence.jobrole or sequence.name or "",
            "description": sequence.description or "",
            "created_at": sequence.created_at.isoformat() if sequence.created_at else None,
            "steps": [
                {
                    "id": step.id,
                    "step_number": step.step_number,
                    "heading": step.heading or step.subject or f"Step {step.step_number}",
                    "body": step.body
                }
                for step in steps
            ]
        }
        
        return jsonify(sequence_data), 200
        
    except Exception as e:
        print(f"Error fetching job sequence: {str(e)}")
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

@job_sequence_bp.route('/save', methods=['POST'])
def save_sequence():
    """Save or update a job sequence"""
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        # Check required fields
        if 'jobrole' not in data or not data['jobrole']:
            return jsonify({"error": "Job title is required"}), 400
        
        sequence_id = data.get('id')
        conversation_id = data.get('conversation_id')
        user_id = data.get('user_id')
        
        # For new sequences, conversation_id and user_id are required
        if not sequence_id and (not conversation_id or not user_id):
            return jsonify({"error": "Conversation ID and user ID are required for new sequences"}), 400
        
        # Either update existing sequence or create new one
        if sequence_id:
            sequence = Sequence.query.get(sequence_id)
            if not sequence:
                return jsonify({"error": f"Sequence with ID {sequence_id} not found"}), 404
        else:
            sequence = Sequence(
                conversation_id=conversation_id,
                user_id=user_id,
                created_at=datetime.utcnow()
            )
            db.session.add(sequence)
        
        # Update sequence fields
        sequence.jobrole = data['jobrole']
        sequence.description = data.get('description', '')
        
        # Save to get the sequence ID if it's new
        db.session.commit()
        
        # Handle the steps
        if 'steps' in data and isinstance(data['steps'], list):
            # Delete existing steps if updating
            if sequence_id:
                SequenceStep.query.filter_by(sequence_id=sequence.id).delete()
            
            # Add new steps
            for step_data in data['steps']:
                step = SequenceStep(
                    sequence_id=sequence.id,
                    step_number=step_data.get('step_number', 0),
                    heading=step_data.get('heading', ''),
                    channel='job_description',  # Set a default channel for job descriptions
                    body=step_data.get('body', '')
                )
                db.session.add(step)
        
        # Commit all changes
        db.session.commit()
        
        # Return the saved sequence
        return jsonify({
            "id": sequence.id,
            "message": "Job sequence saved successfully"
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Error saving job sequence: {str(e)}")
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

@job_sequence_bp.route('/generate', methods=['POST'])
def generate_sequence():
    """Generate a new job sequence using AI"""
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        jobrole = data.get('jobrole')
        if not jobrole:
            return jsonify({"error": "Job title is required"}), 400
            
        # In a real implementation, this would call an AI service
        # For now, return a sample sequence
        sample_sequence = {
            "jobrole": jobrole,
            "description": f"This is a generated description for the {jobrole} position.",
            "steps": [
                {
                    "id": 1,
                    "step_number": 1,
                    "heading": "About the Company",
                    "body": "Our company is a leading provider of innovative solutions in the industry. We are committed to excellence and creating a positive work environment."
                },
                {
                    "id": 2,
                    "step_number": 2,
                    "heading": "Responsibilities in this role",
                    "body": f"As a {jobrole}, you will be responsible for developing and implementing solutions, collaborating with team members, and contributing to company growth."
                },
                {
                    "id": 3,
                    "step_number": 3,
                    "heading": "Qualifications for this role",
                    "body": "Bachelor's degree in a relevant field\n3+ years of experience in a similar role\nStrong communication skills\nProblem-solving abilities"
                },
                {
                    "id": 4,
                    "step_number": 4,
                    "heading": "Benefits in this role",
                    "body": "Competitive salary\nHealth insurance\nFlexible work schedule\nProfessional development opportunities"
                },
                {
                    "id": 5,
                    "step_number": 5,
                    "heading": "Additional information",
                    "body": "This position is available immediately. We are an equal opportunity employer and value diversity in our company."
                }
            ]
        }
        
        return jsonify(sample_sequence), 200
        
    except Exception as e:
        print(f"Error generating job sequence: {str(e)}")
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500 