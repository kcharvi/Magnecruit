# magnecruit_backend\app\agent\llm_interface.py

import google.generativeai as genai
import os

API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    print("Error: GEMINI_API_KEY environment variable not set.")

if API_KEY:
    genai.configure(api_key=API_KEY)

MODEL_NAME = 'gemini-1.5-flash-latest'

def get_gemini_response(user_message_content:str, conversation_history: list = None):
    if not API_KEY:
        return "AI service is not configured. Please check the API key."
    
    try:
        model = genai.GenerativeModel(MODEL_NAME)

        chat_session = model.start_chat(history=conversation_history or [])
        response = chat_session.send_message(user_message_content)

        if response and response.text:
            return response.text
        else:
            print("Warning: Gemini API returned a response with no text content.", response)
            return "I'm sorry, I couldn't generate a text response."
    except Exception as e:
        print(f"Error calling Google Gemini API: {e}")
        return "Sorry, I encountered an error while getting a response from the AI."

# Other functions here for processing messages, managing memory, etc.
# For example, a function to fetch and format history from your DB:
# def fetch_and_format_history(conversation_id, db_session):
#     # Query Message model for messages related to conversation_id, ordered by timestamp
#     # Format results into [{'role': 'user'|'model', 'parts': [content]}, ...]
#     pass
