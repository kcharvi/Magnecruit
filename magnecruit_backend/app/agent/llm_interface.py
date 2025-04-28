# magnecruit_backend\app\agent\llm_interface.py

import google.generativeai as genai
import os

API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    print("Error: GEMINI_API_KEY environment variable not set.")

if API_KEY:
    genai.configure(api_key=API_KEY)

MODEL_NAME = 'gemini-2.5-flash-preview-04-17' 

def get_gemini_model():
    return genai.GenerativeModel(MODEL_NAME)

def get_generation_config_params():
    return { 
        "temperature": 0.8, "top_p": 0.95, "top_k": 40, "max_output_tokens": 4096,
    }

def get_gemini_response(user_message_content: str, conversation_history: list = None, tools: list = None):
    if not API_KEY:
        return {"error": "AI service is not configured. Please check the API key."} 
    
    try:
        model = genai.GenerativeModel(
            MODEL_NAME, 
            tools=tools 
        )

        chat_session = model.start_chat(history=conversation_history or [])
        response = chat_session.send_message(user_message_content)
        return response 

    except Exception as e:
        print(f"Error calling Google Gemini API: {e}")
        return {"error": f"Sorry, I encountered an error calling the AI: {e}"} 