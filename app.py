import os
from flask import Flask, jsonify, request
from flask_cors import CORS
import logging
import sys
from scripts.api_interaction import read_api_key, generate_response_and_name_chat
import openai
from openai._exceptions import OpenAIError, RateLimitError

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # Allow all origins for now

# Configure logging to stdout
logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)

app.logger.setLevel(logging.DEBUG)
app.logger.info('Kronosai API startup')

# Read the API key from 'api_key.txt'
api_key = read_api_key('api_key.txt')

@app.route('/')
def home():
    return "Welcome to the Kronosai API"

@app.route('/send_message', methods=['POST'])
def send_message():
    try:
        data = request.json
        user_input = data.get('user_input', '').strip()
        chat_history = data.get('chat_history', [])
        if not user_input:
            return jsonify({"error": "User input is required"}), 400

        chat_title = data.get('chat_title', 'New Chat')

        # Generate the chat response
        chat_name, response = generate_response_and_name_chat(user_input, chat_history, api_key, chat_title)

        return jsonify({"response": response, "chat_name": chat_name})
    except RateLimitError as e:
        app.logger.error(f"Rate limit error: {e}")
        return jsonify({"error": "Rate limit error occurred"}), 500
    except OpenAIError as e:
        app.logger.error(f"OpenAI error: {e}")
        return jsonify({"error": "OpenAI error occurred"}), 500
    except Exception as e:
        app.logger.error(f"Error in send_message: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))
