import tkinter as tk
import json
import os
from tkinter import messagebox
from scripts.api_interaction import chat_with_gpt

# Function to handle sending a message
def send_message(chat_log, user_entry, history_listbox, chat_history, current_chat, generate_response_and_name_chat, generate_response, chat_sessions_dir, chat_listbox, save_chat, send_button, api_key):
    user_input = user_entry.get()
    if user_input.strip():
        current_line_index = chat_log.index(tk.END)
        chat_log.insert(tk.END, "You: ", 'user_bold')
        chat_log.insert(tk.END, user_input + "\n\n\n", 'user')  # Add extra newlines for spacing
        chat_log.insert(tk.END, "Assistant is typing...\n", 'assistant_typing')
        chat_log.see(tk.END)  # Auto-scroll to the end
        user_entry.delete(0, tk.END)
        history_listbox.insert(tk.END, user_input)
        chat_history.append(("You", user_input, current_line_index))
        if current_chat.get() == "":
            chat_log.after(100, generate_response_and_name_chat, user_input, current_line_index, chat_log, chat_history, current_chat, chat_listbox, save_chat, chat_sessions_dir, user_entry, send_button, api_key)
        else:
            chat_log.after(100, generate_response, user_input, current_line_index, chat_log, chat_history, user_entry, send_button, save_chat, chat_sessions_dir, current_chat, api_key)

# Function to scroll to a selected user prompt in the chat log
def scroll_to_prompt(event, chat_history, chat_log):
    selection = event.widget.curselection()
    if selection:
        index = selection[0]
        # Find the line number corresponding to the selected user prompt
        user_prompts = [entry for entry in chat_history if entry[0] == "You"]
        if index < len(user_prompts):
            line_number = user_prompts[index][2]
            chat_log.see(line_number)
            chat_log.yview_moveto(float(line_number.split('.')[0]) / float(chat_log.index('end-1c').split('.')[0]))

# Function to save chat history to a file
def save_chat(chat_sessions_dir, current_chat, chat_history):
    chat_title = current_chat.get()
    file_path = os.path.join(chat_sessions_dir, chat_title + ".json")
    with open(file_path, 'w') as file:
        json.dump({"title": chat_title, "history": chat_history}, file)

# Function to load chat history from a file
def load_chat(event, chat_sessions_dir, chat_listbox, chat_log, chat_history, history_listbox, current_chat):
    selection = event.widget.curselection()
    if selection:
        index = selection[0]
        chat_title = chat_listbox.get(index)
        file_path = os.path.join(chat_sessions_dir, chat_title + ".json")
        with open(file_path, 'r') as file:
            chat_data = json.load(file)
            chat_log.delete("1.0", tk.END)
            chat_history.clear()
            history_listbox.delete(0, tk.END)
            for entry in chat_data["history"]:
                speaker, content, line_index = entry
                if speaker == "You":
                    chat_log.insert(tk.END, "You: ", 'user_bold')
                    chat_log.insert(tk.END, content + "\n\n\n", 'user')  # Add extra newlines for spacing
                    history_listbox.insert(tk.END, content)
                else:
                    chat_log.insert(tk.END, "Assistant: " + content + "\n\n\n", 'assistant')  # Add extra newlines for spacing
                chat_history.append((speaker, content, line_index))
            current_chat.set(chat_title)

# Function to create a new chat
def new_chat(current_chat, chat_log, chat_history, history_listbox):
    current_chat.set("")
    chat_log.delete("1.0", tk.END)
    chat_history.clear()
    history_listbox.delete(0, tk.END)

# Function to clear all chats
def clear_chats(chat_sessions_dir, chat_listbox, new_chat):
    if messagebox.askokcancel("Clear All Chats", "Are you sure you want to delete all chats?"):
        for file_name in os.listdir(chat_sessions_dir):
            file_path = os.path.join(chat_sessions_dir, file_name)
            if os.path.isfile(file_path):
                os.remove(file_path)
        chat_listbox.delete(0, tk.END)
        new_chat()

# Function to handle deleting a selected chat
def delete_selected_chat(chat_listbox, chat_sessions_dir, current_chat, chat_log, chat_history, history_listbox):
    selection = chat_listbox.curselection()
    if selection:
        index = selection[0]
        chat_title = chat_listbox.get(index)
        if messagebox.askokcancel("Delete Chat", f"Are you sure you want to delete the chat '{chat_title}'?"):
            # Remove chat file
            file_path = os.path.join(chat_sessions_dir, chat_title + ".json")
            if os.path.exists(file_path):
                os.remove(file_path)

            # Remove chat from listbox
            chat_listbox.delete(index)

            # Clear current chat if it was the one being deleted
            if current_chat.get() == chat_title:
                current_chat.set("")
                chat_log.delete("1.0", tk.END)
                chat_history.clear()
                history_listbox.delete(0, tk.END)

# Function to generate response from GPT and name the chat
def generate_response_and_name_chat(user_input, current_line_index, chat_log, chat_history, current_chat, chat_listbox, save_chat, chat_sessions_dir, user_entry, send_button, api_key):
    nameChatQuestion = f"What would be an appropriate name for the chat with this starting response: {user_input}. Please just respond with the name."
    chatNameResp = generate_response(nameChatQuestion, current_line_index, chat_log, chat_history, user_entry, send_button, save_chat, chat_sessions_dir, current_chat, api_key, name_chat=False, hidden=True)

    response = generate_response(user_input, current_line_index, chat_log, chat_history, user_entry, send_button, save_chat, chat_sessions_dir, current_chat, api_key, name_chat=True)
    # Determine chat name based on the prompt
    chat_name = chatNameResp.replace('"', '')
    current_chat.set(chat_name)
    chat_listbox.insert(tk.END, chat_name)
    save_chat(chat_sessions_dir, current_chat, chat_history)

# Function to generate response from GPT
def generate_response(user_input, current_line_index, chat_log, chat_history, user_entry, send_button, save_chat, chat_sessions_dir, current_chat, api_key, name_chat=False, hidden=False):
    user_entry.config(state=tk.DISABLED)
    send_button.config(state=tk.DISABLED)
    response = chat_with_gpt(user_input, chat_history, api_key)
    typing_message_index = chat_log.search("Assistant is typing...", current_line_index)
    if typing_message_index:
        chat_log.delete(typing_message_index, typing_message_index + " + 1 line")
    
    if not hidden:
        response_line_index = chat_log.index(tk.END)
        chat_log.insert(tk.END, "Assistant: " + response + "\n\n\n", 'assistant')  # Add extra newlines for spacing
        chat_log.see(tk.END)  # Auto-scroll to the end
        chat_history.append(("Assistant", response, response_line_index))
        if not name_chat:
            save_chat(chat_sessions_dir, current_chat, chat_history)
    
    user_entry.config(state=tk.NORMAL)
    send_button.config(state=tk.NORMAL)
    user_entry.focus()
    
    return response
