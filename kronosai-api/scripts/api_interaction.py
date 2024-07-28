import os
import openai
import json
import time
import tiktoken

# Initialize the tokenizer
tokenizer = tiktoken.get_encoding("cl100k_base")

# Global model variable
MODEL = "gpt-4"  # Corrected model name
MAX_TOKENS = 8192 if MODEL == "gpt-4" else 4096

# Function to read the API key from an external file
def read_api_key(file_path):
    with open(file_path, 'r') as file:
        return file.read().strip()

# Function to summarize a given text using GPT
def summarize_text(text, api_key, model=MODEL, max_retries=5):
    openai.api_key = api_key
    retries = 0
    while retries < max_retries:
        try:
            response = openai.chat.completions.create(
                model=model,
                messages=[{"role": "system", "content": f"Please summarize the following user's prompt to the minimal amount of characters necessary, ensuring that the key information is retained for maintaining context in future conversations. Focus on the main points and core details:\n\n{text}"}],
                max_tokens=100,  # Adjust max tokens as needed
                temperature=0.5
            )
            return response.choices[0].message.content
        except openai._exceptions.RateLimitError as e:
            retries += 1
            wait_time = 2 ** retries  # Exponential backoff
            print(f"Rate limit exceeded. Retrying in {wait_time} seconds...")
            time.sleep(wait_time)
        except openai._exceptions.OpenAIError as e:
            print(f"An error occurred: {e}")
            break
    return "Summary could not be generated."

# Function to chat with GPT with retry logic and chat history
def chat_with_gpt(prompt, summarized_context, api_key, model=MODEL, max_retries=5):
    openai.api_key = api_key
    retries = 0
    while retries < max_retries:
        try:
            # Prepare the messages for the API request
            messages = [{"role": "system", "content": "You are a helpful assistant."}]
            if summarized_context:
                messages.append({"role": "system", "content": f"Previous context: {summarized_context}"})
            messages.append({"role": "user", "content": prompt})
            
            response = openai.chat.completions.create(
                model=model,
                messages=messages
            )
            return response.choices[0].message.content
        except openai._exceptions.RateLimitError as e:
            retries += 1
            wait_time = 2 ** retries  # Exponential backoff
            print(f"Rate limit exceeded. Retrying in {wait_time} seconds...")
            time.sleep(wait_time)
        except openai._exceptions.OpenAIError as e:
            print(f"An error occurred: {e}")
            break
    return "Sorry, I am unable to process your request at the moment."

# Function to generate response from GPT and name the chat
def generate_response_and_name_chat(user_input, summarized_context, api_key, chat_title):
    if chat_title == 'New Chat':
        nameChatQuestion = f"What would be an appropriate name for the chat with this starting response: {user_input}. Please just respond with the name."
        chatNameResp = chat_with_gpt(nameChatQuestion, summarized_context, api_key)
        chat_name = chatNameResp.replace('"', '')
    else:
        chat_name = chat_title

    context_file_path = os.path.join("chat_sessions", f"{chat_name}_context.json")
    
    # Generate the main response
    response = chat_with_gpt(user_input, summarized_context, api_key)

    # Update summarized context
    summarized_context = update_summarized_context(user_input, response, summarized_context, api_key)
    
    # Ensure the context fits within the token limit
    while get_token_count(summarized_context) > MAX_TOKENS:
        summarized_context = summarize_oldest_context(summarized_context, api_key)

    # Save summarized context after updating it
    save_summarized_context(context_file_path, summarized_context)

    return chat_name, response

# Function to update summarized context
def update_summarized_context(prompt, response, current_summary, api_key):
    new_summary = summarize_text(f"User prompt: {prompt}\nAssistant response: {response}", api_key)
    return f"{current_summary}\n{new_summary}"

# Function to save summarized context to a file
def save_summarized_context(file_path, summarized_context):
    with open(file_path, 'w') as file:
        json.dump({"summarized_context": summarized_context}, file)

# Function to load summarized context from a file
def load_summarized_context(file_path):
    try:
        with open(file_path, 'r') as file:
            data = json.load(file)
            return data.get("summarized_context", "")
    except FileNotFoundError:
        return ""

# Function to count tokens in a given text using tiktoken
def get_token_count(text, model=MODEL):
    tokens = tokenizer.encode(text)
    return len(tokens)

# Function to summarize the oldest context
def summarize_oldest_context(context, api_key):
    # Split the context into individual exchanges
    exchanges = context.split('\nUser prompt:')
    # Summarize the oldest exchange
    if len(exchanges) > 1:
        oldest_exchange = exchanges.pop(1)  # Summarize only the first complete exchange (after initial split)
        summarized_oldest = summarize_text(f"User prompt:{oldest_exchange}", api_key)
        # Combine the summarized oldest exchange with the remaining context
        new_context = '\nUser prompt:'.join([exchanges[0]] + [summarized_oldest] + exchanges[1:])
        return new_context
    return context
