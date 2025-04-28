# magnecruit_backend\app\agent\job_sequence_tools.py

from google.generativeai import types

generate_job_sequences_declaration = {
    "name": "generate_job_sequences",
    "description": "Generates or updates a structured job description sequence with distinct sections like About, Responsibilities, Qualifications, Benefits, etc., based on user-provided details.",
    "parameters": {
        "type": "object", 
        "properties": {
            'target_role': { 
                "type": "string",
                "description": "The specific job title or role (e.g., 'Senior Software Engineer'). This will be the main title of the sequence."
            },
            'company_context': {
                "type": "string",
                "description": "Information about the company, team, or mission. Used for the 'About the Company' section."
            },
            'responsibilities': {
                "type": "array",
                 "items": {"type": "string"},
                 "description": "List of key job responsibilities for the 'Responsibilities' section."
            },
            'required_qualifications': {
                "type": "array",
                "items": {"type": "string"},
                "description": "List of essential skills, experience, or education required for the role. Used for the 'Required Qualifications' section."
            },
            'preferred_qualifications': {
                 "type": "array",
                 "items": {"type": "string"},
                 "description": "Optional. List of nice-to-have skills or qualifications for the 'Preferred Qualifications' section."
            },
            'benefits': {
                "type": "array",
                "items": {"type": "string"},
                "description": "Optional. List of benefits, perks, or compensation details for the 'Benefits and Offers' section."
            },
            'additional_information': {
                 "type": "string",
                 "description": "Optional. Any other relevant information, like location, work policy, EEO statement, etc., for the 'Additional Information' section."
             },
        },
    }
}

modify_job_sequences_declared = {
    "name": "modify_job_sequence_step",
    "description": "Modifies a specific section/step (e.g., Responsibilities, Qualifications) of the *currently existing* job description sequence based on user instruction. Use only AFTER a sequence exists.",
    "parameters": {
        "type": "object",
        "properties": {
            "target_section_heading": {
                 "type": "string",
                 "description": "The exact heading of the section to modify (e.g., 'Responsibilities', 'Required Qualifications')."
            },
            "modification_instruction": {
                "type": "string",
                "description": "The user's specific request for how to change the content of the target section (e.g., 'Add Python experience to required qualifications', 'Rewrite the company context to sound more dynamic')."
            }
        },
        "required": ["target_section_heading", "modification_instruction"] 
    }
}

JOB_SEQUENCE_TOOLS = [
    types.Tool(function_declarations=[generate_job_sequences_declaration]),
    types.Tool(function_declarations=[modify_job_sequences_declared])
]

GENERATE_SEQUENCES_TOOL = types.Tool(function_declarations=[generate_job_sequences_declaration])
MODIFY_SEQUENCES_TOOL = types.Tool(function_declarations=[modify_job_sequences_declared])