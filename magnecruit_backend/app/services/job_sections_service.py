# magnecruit_backend\app\services\job_sections_service.py

import json
import traceback
from .. import db 
from typing import List, Tuple, Optional
from google.protobuf.struct_pb2 import Struct
from google.protobuf.json_format import MessageToDict
from ..models import Jobs, JobSections
from ..agent import llm_interface
from ..agent.prompts import (
    SYSTEM_PROMPT_JOB_SECTIONS,
    BUILD_JOB_SECTIONS_PROMPT,
    CONFIRMATION_PROMPT_TEMPLATE
)
from ..agent.job_sections_tools import JOB_SECTIONS_TOOLS

# Get the job data for the conversation from the database Jobs table
def get_job_data_for_conversation(conversation_id: int) -> Optional[Jobs]:
    '''
    Returns the job data for the given conversation id from the database Jobs table
    '''
    try:
        return db.session.query(Jobs).options(db.joinedload(Jobs.sections)).filter_by(conversation_id=conversation_id).first()
    except Exception as e:
        print(f"(JobSectionsService) Error fetching job data for convo {conversation_id}: {e}")
        return None

# Save the job sections data from the function call args
def _save_job_sections_data(user_id: int, conversation_id: int, function_args: dict) -> Tuple[Optional[Jobs], List[str]]:
    '''
    Returns the job data and the updated fields keys from the given function call args
    '''
    updated_fields_keys = list(function_args.keys())
    job_data = None
    try:
        job_data = get_job_data_for_conversation(conversation_id)
        if not job_data:
            job_data = Jobs(user_id=user_id, conversation_id=conversation_id)
            db.session.add(job_data)
            db.session.flush()

        if 'target_role' in function_args:
            job_data.jobrole = function_args['target_role']
        if 'target_role_description' in function_args:
            job_data.description = function_args['target_role_description']

        job_sections_related_args = {'company_context', 'responsibilities', 'required_qualifications', 'preferred_qualifications', 'benefits', 'additional_information'}
        if any(key in function_args for key in job_sections_related_args):
            JobSections.query.filter_by(job_id=job_data.id).delete()
            db.session.flush()

            new_job_sections_data = []
            job_sections_counter = 1
            company_context = function_args.get('company_context', None)
            responsibilities = function_args.get('responsibilities', None)
            required_qualifications = function_args.get('required_qualifications', None)
            preferred_qualifications = function_args.get('preferred_qualifications', None)
            benefits = function_args.get('benefits', None)
            additional_information = function_args.get('additional_information', None)

            if company_context is not None:
                new_job_sections_data.append({"section_number": job_sections_counter, "heading": "About the Company", "body": company_context or ""})
                job_sections_counter += 1
            if responsibilities is not None:
                new_job_sections_data.append({"section_number": job_sections_counter, "heading": "Responsibilities", "body": "\n".join([f"- {r}" for r in responsibilities]) if responsibilities else ""})
                job_sections_counter += 1
            if required_qualifications is not None:
                new_job_sections_data.append({"section_number": job_sections_counter, "heading": "Required Qualifications", "body": "\n".join([f"- {q}" for q in required_qualifications]) if required_qualifications else ""})
                job_sections_counter += 1
            if preferred_qualifications is not None:
                new_job_sections_data.append({"section_number": job_sections_counter, "heading": "Preferred Qualifications", "body": "\n".join([f"- {q}" for q in preferred_qualifications]) if preferred_qualifications else ""})
                job_sections_counter += 1
            if benefits is not None:
                new_job_sections_data.append({"section_number": job_sections_counter, "heading": "Benefits and Offers", "body": "\n".join([f"- {b}" for b in benefits]) if benefits else ""})
                job_sections_counter += 1
            if additional_information is not None:
                new_job_sections_data.append({"section_number": job_sections_counter, "heading": "Additional Information", "body": additional_information or ""})
                job_sections_counter += 1

            job_sections_added = []
            for section_data in new_job_sections_data:
                if isinstance(section_data, dict) and 'heading' in section_data and 'body' in section_data and 'section_number' in section_data:
                    new_job_section = JobSections(
                        job_id=job_data.id,
                        section_number=section_data['section_number'],
                        heading=section_data['heading'],
                        body=section_data['body']
                    )
                    db.session.add(new_job_section)
                    job_sections_added.append(new_job_section)

            if job_sections_added:
                db.session.flush()

        return job_data, updated_fields_keys

    except Exception as e:
        print(f"(JobSectionsService) Error saving Job data from function call: {e}")
        traceback.print_exc()
        db.session.rollback()
        return job_data, []

# Get a brief confirmation message from the LLM for the job sections update 
def _get_confirmation_message() -> str:
    '''
    Returns a confirmation message from the LLM for the job sections update
    '''
    try:
        model = llm_interface.get_gemini_model()
        response = model.generate_content(CONFIRMATION_PROMPT_TEMPLATE)

        if not response or not hasattr(response, 'text'):
             return "OK, job description and its sections updated."

        return response.text.strip()
    except Exception as e:
        print(f"(JobSectionsService) Exception getting confirmation message: {e}")
        return "OK, job description and its sections updated."

# Process the incoming message from the frontend client and return the response data based on the active view
def process_chat_for_job_sections(user_id: int,
                                  conversation_id: int,
                                  message_content: str,
                                  conversation_history: list) -> tuple[Optional[str], Optional[JobSections], Optional[str], Optional[List[str]]]:
    '''
    Returns a Tuple of (text_response_for_chat, updated_job, error_for_client, updated_field_keys)
    '''
    text_response_for_chat = None
    updated_job = None
    error_message_for_client = None
    updated_field_keys = None

    try:
        job_data = get_job_data_for_conversation(conversation_id)
        current_job_state_json = "null"
        if job_data:
            current_job_state_dict = {
                "jobrole": job_data.jobrole,
                "description": job_data.description,
                "sections": sorted([
                    {"section_number": s.section_number, "heading": s.heading, "body": s.body}
                    for s in job_data.sections
                ], key=lambda x: x['section_number'])
            }
            try:
                current_job_state_dict = json.dumps(current_job_state_dict, indent=2)
            except Exception as json_err:
                print(f"(JobSectionsService) Error formatting current state as JSON for context: {json_err}")
                current_job_state_dict = "{\"error\": \"Could not format current state\"}"

        user_turn_content = BUILD_JOB_SECTIONS_PROMPT.format(
            current_job_state_json=current_job_state_json,
            user_message=message_content
        )

        formatted_history = []
        for item in conversation_history:
            role = item.get('role')
            parts = item.get('parts')
            if role and parts:
                formatted_history.append({"role": role, "parts": parts})

        model = llm_interface.get_gemini_model(tools=JOB_SECTIONS_TOOLS, system_instruction=SYSTEM_PROMPT_JOB_SECTIONS)

        full_content = [
            *formatted_history,
            {"role": "user", "parts": [user_turn_content]}
        ]

        llm_response = model.generate_content(contents=full_content)

        function_call_detected = False
        if llm_response.candidates and llm_response.candidates[0].content.parts:
            for part in llm_response.candidates[0].content.parts:
                if part.function_call:
                    fc = part.function_call
                    if fc.name == "generate_job_sections":
                        function_call_detected = True
                        args_dict = {}
                        try:
                            if isinstance(fc.args, (Struct, dict)) or hasattr(fc.args, 'items'):
                                try:
                                     args_dict = MessageToDict(fc.args)
                                except AttributeError:
                                     args_dict = dict(fc.args.items() if hasattr(fc.args, 'items') else fc.args)
                            else:
                                error_message_for_client = "AI tried to update the job, but the argument format was unexpected."
                                break

                            for key, value in args_dict.items():
                                if isinstance(value, list):
                                     args_dict[key] = list(value)
                        except Exception as parse_err:
                             print(f"(JobSectionsService) Error parsing function call arguments: {parse_err}")
                             error_message_for_client = "AI tried to update the job description and its sections, but parsing arguments failed."
                             break

                        if not error_message_for_client:
                            updated_job, updated_field_keys = _save_job_sections_data(user_id, conversation_id, args_dict)

                            if updated_job:
                                text_for_chat = _get_confirmation_message()
                            else:
                                updated_field_keys = list(args_dict.keys())
                                error_message_for_client = "Failed to save the updated job data due to an internal error after function call."

        if not function_call_detected and not updated_job:
            try:
                text_for_chat = llm_response.text
            except Exception as text_extract_err:
                if llm_response.prompt_feedback and llm_response.prompt_feedback.block_reason:
                     error_message_for_client = f"The request was blocked by the AI for safety reasons: {llm_response.prompt_feedback.block_reason.name}"
                else:
                     error_message_for_client = "Sorry, I couldn't process that request properly."
        return text_for_chat, updated_job, error_message_for_client, updated_field_keys

    except Exception as e:
        print(f"(JobSectionsService) Critical error in process_chat_for_job_sections (Function Calling Mode): {e}")
        traceback.print_exc()
        return None, None, "Sorry, an internal error occurred while processing the job request.", None 