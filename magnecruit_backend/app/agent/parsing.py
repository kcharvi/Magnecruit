# app/agent/parsing.py
import re
import json

def parse_sequence_from_ai_response(ai_response_content: str) -> dict | None:
    """ 
    Attempts to find and parse a JSON block formatted like ```json ... ```
    containing sequence data ('name', 'description', 'steps').

    Args:
        ai_response_content: The raw string response from the AI.

    Returns:
        A dictionary with the parsed sequence data if found and valid,
        otherwise None.
    """
    try:
        # Look for ```json ... ``` block, ignoring case and whitespace
        match = re.search(r"```json\s*({.*?})\s*```", ai_response_content, re.DOTALL | re.IGNORECASE)
        if match:
            json_str = match.group(1)
            print(f"(Parser) Found JSON block: {json_str[:100]}...")
            parsed_data = json.loads(json_str)
            
            # Basic validation
            if not isinstance(parsed_data, dict):
                print("(Parser) Error: Parsed data is not a dictionary.")
                return None
            if 'steps' not in parsed_data or not isinstance(parsed_data.get('steps'), list):
                print("(Parser) Error: Parsed JSON lacks 'steps' key or steps is not a list.")
                return None
            # Optional: Add more validation for step structure, name/description types etc.
                
            print("(Parser) Successfully parsed sequence data.")
            return parsed_data
        else:
            print("(Parser) No JSON block found in AI response.")
            return None
            
    except json.JSONDecodeError as json_err:
        print(f"(Parser) Failed to parse JSON: {json_err}")
        return None
    except Exception as e:
        print(f"(Parser) Unexpected error during parsing: {e}")
        return None 