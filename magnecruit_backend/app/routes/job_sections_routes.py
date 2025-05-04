# magnecruit_backend/app/routes/job_sections_routes.py

from datetime import datetime
from ..models import Jobs, JobSections, db
from flask import Blueprint, request, jsonify

job_sections_bp = Blueprint('job_sections_bp', __name__)

# Get job sections for a conversation
@job_sections_bp.route('/get/<int:conversation_id>', methods=['GET'])
def get_job(conversation_id):
    '''
    Returns the job for the given conversation id, if it exists else returns error stating no job description found
    '''
    try:
        jobs = Jobs.query.filter_by(conversation_id=conversation_id).first()
        if not jobs:
            return jsonify({"error": "No job description found for this conversation"}), 404
        
        job_sections = JobSections.query.filter_by(job_id=jobs.id).order_by(JobSections.section_number).all()
        job_data = {
            "id": jobs.id,
            "conversation_id": jobs.conversation_id,
            "user_id": jobs.user_id,
            "jobrole": jobs.jobrole or "",
            "description": jobs.description or "",
            "created_at": jobs.created_at.isoformat() if jobs.created_at else None,
            "sections": [
                {
                    "id": section.id,
                    "section_number": section.section_number,
                    "heading": section.heading or section.subject or f"Section {section.section_number}",
                    "body": section.body
                }
                for section in job_sections
            ]
        }
        return jsonify(job_data), 200
    except Exception as e:
        print(f"Error fetching job sections: {str(e)}")
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

# Save job sections for a conversation
@job_sections_bp.route('/save', methods=['POST'])
def save_job():
    '''
    Returns a message indicating that the job has been saved successfully for the given job id, including its corresponding sections
    '''
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        if 'jobrole' not in data or not data['jobrole']:
            return jsonify({"error": "Job title is required"}), 400
        
        job_id = data.get('id')
        conversation_id = data.get('conversation_id')
        user_id = data.get('user_id')
        
        if not job_id and (not conversation_id or not user_id):
            return jsonify({"error": "Conversation ID and user ID are required for new jobs"}), 400
        
        if job_id:
            job = Jobs.query.get(job_id)
            if not job:
                return jsonify({"error": f"Job with ID {job_id} not found"}), 404
        else:
            job = Jobs(
                conversation_id=conversation_id,
                user_id=user_id,
                created_at=datetime.utcnow()
            )
            db.session.add(job)
        
        job.jobrole = data['jobrole']
        job.description = data.get('description', '')
        
        db.session.commit()
        
        if 'sections' in data and isinstance(data['sections'], list):
            if job_id:
                JobSections.query.filter_by(job_id=job.id).delete()
            
            for job_section_data in data['sections']:
                job_section = JobSections(
                    job_id=job.id,
                    section_number=job_section_data.get('section_number', 0),
                    heading=job_section_data.get('heading', ''),
                    body=job_section_data.get('body', '')
                )
                db.session.add(job_section)
        
        db.session.commit()
        
        return jsonify({
            "id": job.id,
            "message": "Job saved successfully"
        }), 201    
    except Exception as e:
        db.session.rollback()
        print(f"Error saving job: {str(e)}")
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

# Generate job sections for a job
@job_sections_bp.route('/generate', methods=['POST'])
def generate_job_sections():
    '''
    Returns a sample job description for the given job role in json format
    '''
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        jobrole = data.get('jobrole')
        if not jobrole:
            return jsonify({"error": "Job title is required"}), 400
            
        sample_job = {
            "jobrole": jobrole,
            "description": f"This is a generated description for the {jobrole} position.",
            "sections": [
                {
                    "id": 1,
                    "section_number": 1,
                    "heading": "About the Company",
                    "body": "Our company is a leading provider of innovative solutions in the industry. We are committed to excellence and creating a positive work environment."
                },
                {
                    "id": 2,
                    "section_number": 2,
                    "heading": "Responsibilities in this role",
                    "body": f"As a {jobrole}, you will be responsible for developing and implementing solutions, collaborating with team members, and contributing to company growth."
                },
                {
                    "id": 3,
                    "section_number": 3,
                    "heading": "Qualifications for this role",
                    "body": "Bachelor's degree in a relevant field\n3+ years of experience in a similar role\nStrong communication skills\nProblem-solving abilities"
                },
                {
                    "id": 4,
                    "section_number": 4,
                    "heading": "Benefits in this role",
                    "body": "Competitive salary\nHealth insurance\nFlexible work schedule\nProfessional development opportunities"
                },
                {
                    "id": 5,
                    "section_number": 5,
                    "heading": "Additional information",
                    "body": "This position is available immediately. We are an equal opportunity employer and value diversity in our company."
                }
            ]
        }
        
        return jsonify(sample_job), 200
        
    except Exception as e:
        print(f"Error generating job: {str(e)}")
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500 