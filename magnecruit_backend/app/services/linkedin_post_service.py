import traceback
from ..models import Jobs   
from ..services import job_sections_service
from ..agent import llm_interface
from ..agent.prompts import SYSTEM_PROMPT_LINKEDIN_POST, USER_PROMPT_LINKEDIN_POST_TEMPLATE

# Service to generate a LinkedIn job post for the user 
def generate_linkedin_post_from_conversation(
    conversation_id: int, 
    company_name_input: str, 
    job_description_summary_input: str, 
    tone: str, 
    length: str
) -> tuple[str | None, str | None]:
    """
    Fetches job details for the conversation and generates a LinkedIn post using LLM.
    Returns (post_content, error_message)
    """
    try:
        job_data_object = job_sections_service.get_job_data_for_conversation(conversation_id)

        if not job_data_object:
            return None, "No job details found for this conversation to generate a LinkedIn post."

        if not job_data_object.jobrole:
            return None, "Job title is missing, which is essential for a LinkedIn post."

        job_title = job_data_object.jobrole or "Not specified"
        company_name = company_name_input.strip() if company_name_input.strip() else "Our Company" # Default if not provided
        description_summary = job_description_summary_input.strip() if job_description_summary_input.strip() else (job_data_object.description or "An exciting role.")

        about_company_body = "Not specified"
        responsibilities_body = "Key responsibilities for this role."
        qualifications_body = "Relevant skills and experience."
        
        if job_data_object.sections:
            for section in job_data_object.sections:
                heading_lower = section.heading.lower()
                if "about the company" in heading_lower or "company context" in heading_lower:
                    about_company_body = section.body or about_company_body
                elif "responsibilities" in heading_lower:
                    responsibilities_body = section.body or responsibilities_body
                elif "qualifications" in heading_lower or "requirements" in heading_lower:
                    qualifications_body = section.body or qualifications_body
        
        company_name_hashtag = company_name.replace(' ', '').replace('.', '').replace(',', '')
        job_title_hashtag = job_title.replace(' ', '')

        formatted_user_prompt = USER_PROMPT_LINKEDIN_POST_TEMPLATE.format(
            job_title=job_title,
            company_name=company_name,
            job_description_summary=description_summary,
            key_responsibilities=responsibilities_body,
            key_qualifications=qualifications_body,
            about_company=about_company_body,
            tone=tone,
            length=length,
            company_name_hashtag=company_name_hashtag,
            job_title_hashtag=job_title_hashtag
        )
        
        llm_response_data = llm_interface.get_gemini_chat_response(
            user_message_content=formatted_user_prompt, 
            system_instruction=SYSTEM_PROMPT_LINKEDIN_POST
        )

        if isinstance(llm_response_data, dict) and llm_response_data.get("error"):
            return None, llm_response_data.get("error")
        
        try:
            post_content = llm_response_data.text
        except AttributeError:
            if hasattr(llm_response_data, 'prompt_feedback') and llm_response_data.prompt_feedback.block_reason:
                return None, f"Content generation blocked: {llm_response_data.prompt_feedback.block_reason.name}"
            return None, "Failed to extract text from AI response."

        return post_content, None

    except Exception as e:
        print(f"(LinkedInPostService) Error generating LinkedIn post: {str(e)}")
        traceback.print_exc()
        return None, f"An internal error occurred: {str(e)}" 