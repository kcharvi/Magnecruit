# magnecruit_backend/app/routes/linkedin_post_routes.py

from flask import Blueprint, request, jsonify
from ..services import linkedin_post_service

linkedin_post_bp = Blueprint('linkedin_post_bp', __name__)

# Route to generate a LinkedIn job post for the user 
@linkedin_post_bp.route('/generate', methods=['POST'])
def generate_post():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    conversation_id = data.get('conversation_id')
    company_name = data.get('company_name')
    job_description_summary = data.get('job_description_summary')
    tone = data.get('tone', 'professional')
    length = data.get('length', 'medium')

    if not conversation_id:
        return jsonify({"error": "conversation_id is required"}), 400
    if not company_name:
        return jsonify({"error": "company_name is required"}), 400

    try:
        post_content, error = linkedin_post_service.generate_linkedin_post_from_conversation(
            conversation_id=conversation_id,
            company_name_input=company_name,
            job_description_summary_input=job_description_summary or "",
            tone=tone,
            length=length
        )

        if error:
            if "No job details found" in error or "Job title is missing" in error:
                return jsonify({"error": error}), 404
            if "Content generation blocked" in error:
                return jsonify({"error": error}), 400
            return jsonify({"error": error}), 500
        
        return jsonify({"linkedin_post": post_content}), 200

    except Exception as e:
        print(f"Error in /generate LinkedIn post route: {str(e)}")
        return jsonify({"error": f"An unexpected error occurred in the API route: {str(e)}"}), 500 