# magnecruit_backend\app\agent\job_sections_tools.py

from google.generativeai import types

# Generate the job description sections in the format as specified below
generate_job_sections_declaration = {
    "name": "generate_job_sections",
    "description": "Generate or update a structured job description with distinct sections like About the Company, Responsibilities, Qualifications, Benefits, etc., based on user-provided details (partially or completely missing sections).",
    "parameters": {
        "type": "object", 
        "properties": {
            'target_role': { 
                "type": "string",
                "description": "The specific job title or role (e.g., 'Senior Software Engineer', 'Sales Manager', 'Customer Support Specialist' etc). This will be the main title of the job."
            },
            'target_role_description': {
                "type": "string",
                "description": "A very short two liner and to the point description of the target job role. This will be used to indicaate things like location, salary range, experience level, job type remote or hybrid etc."
            },
            'company_context': {
                "type": "string",
                "description": "Information about the company, team, or mission. Used for the 'About the Company' section. This will be the first section of the job description."
            },
            'responsibilities': {
                "type": "array",
                 "items": {"type": "string"},
                 "description": "List of key job responsibilities for the 'Responsibilities' section. This will be the second section of the job description."
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

# Modify a specific section of the job description sections based on user instruction
modify_job_sections_declared = {
    "name": "modify_job_sections",
    "description": "Modifies a specific section (e.g., Responsibilities, Qualifications) of the *currently existing* job description sections based on user instruction. Use only AFTER a section exists.",
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

# Update a specific section of the job description sections based on user instruction
update_job_sections_declaration = {
    "name": "update_job_sections",
    "description": "Updates specific details of a job sections based on the user conversation. Only call this when new information for the sections is identified.",
    "parameters": {
        "type": "OBJECT",
        "properties": {
            "job_title": {
                "type": "STRING",
                "description": "The specific title of the job role."
            },
            "job_description": {
                "type": "STRING",
                "description": "A general description or summary of the job role. Information like location, job type (Remote, Hybrid etc), Salary range, etc."
            },
            "about_company": {
                "type": "STRING",
                "description": "Information about the company offering the job."
            },
            "candidate_responsibilities": {
                "type": "ARRAY",
                "items": {"type": "STRING"},
                "description": "A list of key responsibilities for the candidate."
            },
            "candidate_qualifications": {
                "type": "ARRAY",
                "items": {"type": "STRING"},
                "description": "A list of required or desired qualifications for the candidate."
            },
            "job_benefits": {
                "type": "ARRAY",
                "items": {"type": "STRING"},
                "description": "A list of benefits offered with the job."
            }
        },
        "required": []
    }
}

# List of tools for the job sections agent
JOB_SECTIONS_TOOLS = [
    types.Tool(function_declarations=[generate_job_sections_declaration]),
    types.Tool(function_declarations=[modify_job_sections_declared]),
    types.Tool(function_declarations=[update_job_sections_declaration])    
]

GENERATE_JOB_SECTIONS_TOOL = types.Tool(function_declarations=[generate_job_sections_declaration])
MODIFY_JOB_SECTIONS_TOOL = types.Tool(function_declarations=[modify_job_sections_declared])
UPDATE_JOB_SECTIONS_TOOL = types.Tool(function_declarations=[update_job_sections_declaration]) 