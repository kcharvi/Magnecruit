# magnecruit_backend\app\agent\llm_interface.py

import os
import google.generativeai as genai
from google.generativeai.types import GenerationConfigDict, Tool

API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    print("Error: GEMINI_API_KEY environment variable not set.")

MODEL_NAME = os.getenv("GEMINI_MODEL_NAME", 'gemini-1.5-flash-latest')

# Get the generation config parameters for the LLM
def get_generation_config_params() -> GenerationConfigDict:
    '''
    Returns the generation config parameters for the LLM
    '''
    return GenerationConfigDict(
        temperature=0.7,
        top_p=0.95,
        top_k=40,
        max_output_tokens=4096,
    )

# Get the Gemini model with the specified parameters
def get_gemini_model(model_name: str = MODEL_NAME,
                     tools: list[Tool | dict] | None = None,
                     system_instruction: str | None = None):
    '''
    Returns the Gemini model with the specified config parameters
    '''
    if not API_KEY:
        raise ValueError("AI service is not configured. GEMINI_API_KEY missing.")
    
    genai.configure(api_key=API_KEY)
    try:
        model_args = {
            "model_name": model_name,
            "tools": tools,
            "generation_config": get_generation_config_params()
        }
        if system_instruction:
            model_args["system_instruction"] = system_instruction

        model = genai.GenerativeModel(**model_args)
        return model
    except Exception as e:
        print(f"Error initializing Google Generative AI model: {e}")
        raise

# Get the chat response from the gemini model
def get_gemini_chat_response(user_message_content: str, 
                             conversation_history: list = None, 
                             tools: list[Tool | dict] | None = None, 
                             system_instruction: str | None = None):
    '''
    Returns the chat response from the gemini model
    '''
    if not API_KEY:
        return {"error": "AI service is not configured. Please check the API key."}

    try:
        model = get_gemini_model(tools=tools, system_instruction=system_instruction)
        chat_session = model.start_chat(history=conversation_history or [])
        response = chat_session.send_message(user_message_content)
        return response
    except ValueError as ve:
        print(f"Configuration error calling Google Gemini API: {ve}")
        return {"error": str(ve)}
    except Exception as e:
        print(f"Error calling Google Gemini API: {e}")
        return {"error": f"Sorry, I encountered an error calling the AI: {e}"}