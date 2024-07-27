import tkinter as tk
from tkinter import scrolledtext, Listbox, Scrollbar

def setup_gui(root, send_message_callback, new_chat_callback, clear_chats_callback, load_chat_callback, scroll_to_prompt_callback, create_chat_from_link_callback, delete_selected_chat_callback):
    # Apply dark theme colors
    bg_color = "#2E2E2E"
    fg_color = "#FFFFFF"
    user_color = "#00FF00"  # Green for user prompts
    assistant_color = "#FFFFFF"  # White for assistant prompts

    root.configure(bg=bg_color)

    # Frame for chat list, chat log and history
    main_frame = tk.Frame(root, bg=bg_color)
    main_frame.pack(padx=10, pady=10, fill=tk.BOTH, expand=True)

    # Frame for chat list
    chat_list_frame = tk.Frame(main_frame, bg=bg_color)
    chat_list_frame.pack(side=tk.LEFT, fill=tk.Y)

    # Label for chat list
    chat_list_label = tk.Label(chat_list_frame, text="Chats", bg=bg_color, fg=fg_color, font=("Fira Sans", 12))
    chat_list_label.pack()

    # Create a listbox for chat sessions with a scrollbar
    chat_list_scrollbar = Scrollbar(chat_list_frame, orient='vertical')
    chat_listbox = Listbox(chat_list_frame, selectmode=tk.SINGLE, yscrollcommand=chat_list_scrollbar.set, bg=bg_color, fg=fg_color, selectbackground="#444444", font=("Fira Sans", 12))
    chat_list_scrollbar.config(command=chat_listbox.yview)
    chat_list_scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
    chat_listbox.pack(side=tk.LEFT, fill=tk.Y, expand=True)
    chat_listbox.bind('<<ListboxSelect>>', load_chat_callback)    

    # Frame for chat log and history
    chat_frame = tk.Frame(main_frame, bg=bg_color)
    chat_frame.pack(side=tk.LEFT, padx=10, fill=tk.BOTH, expand=True)

    # Create a scrolled text area for the chat log
    chat_log = scrolledtext.ScrolledText(chat_frame, wrap=tk.WORD, width=60, height=20, state='normal', bg=bg_color, fg=fg_color, insertbackground=fg_color, font=("Fira Sans", 12))
    chat_log.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

    # Make user prompts bold and green
    chat_log.tag_config('user_bold', font=('Fira Sans', 12, 'bold'), foreground=user_color)
    chat_log.tag_config('user', font=('Fira Sans', 12), foreground=user_color)
    chat_log.tag_config('assistant', font=('Fira Sans', 12), foreground=assistant_color)
    chat_log.tag_config('assistant_typing', font=('Fira Sans', 12), foreground=assistant_color, background=bg_color)

    # Frame for history listbox and label
    history_frame = tk.Frame(chat_frame, bg=bg_color)
    history_frame.pack(side=tk.RIGHT, fill=tk.Y)

    history_label = tk.Label(history_frame, text="Chat History", bg=bg_color, fg=fg_color, font=("Fira Sans", 12))
    history_label.pack()

    scrollbar = Scrollbar(history_frame, orient='vertical')
    history_listbox = Listbox(history_frame, selectmode=tk.SINGLE, yscrollcommand=scrollbar.set, bg=bg_color, fg=fg_color, selectbackground="#444444", font=("Fira Sans", 12))
    scrollbar.config(command=history_listbox.yview)
    scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
    history_listbox.pack(side=tk.LEFT, fill=tk.Y, expand=True)

    # Bind the listbox selection event to scroll to the prompt
    history_listbox.bind('<<ListboxSelect>>', scroll_to_prompt_callback)

    # Frame for user input and buttons
    input_frame = tk.Frame(root, bg=bg_color)
    input_frame.pack(padx=10, pady=10, fill=tk.X, side=tk.BOTTOM)

    # Create an entry box for user input
    user_entry = tk.Entry(input_frame, width=50, bg=bg_color, fg=fg_color, insertbackground=fg_color, font=("Fira Sans", 12))
    user_entry.pack(padx=10, pady=5, side=tk.LEFT, fill=tk.X, expand=True)
    user_entry.bind("<Return>", send_message_callback)  # Bind Enter key to send_message function

    # Create a button to send the message
    send_button = tk.Button(input_frame, text="Send", command=send_message_callback, bg=bg_color, fg=fg_color, font=("Fira Sans", 12))
    send_button.pack(pady=5, padx=5, side=tk.LEFT)

    # Create an entry box for shared link input
    shared_link_entry = tk.Entry(input_frame, width=50, bg=bg_color, fg=fg_color, insertbackground=fg_color, font=("Fira Sans", 12))
    shared_link_entry.pack(padx=10, pady=5, side=tk.LEFT, fill=tk.X, expand=True)

    # Create a button to create a chat from the shared link
    create_chat_button = tk.Button(input_frame, text="Create Chat from Link", command=lambda: create_chat_from_link_callback(shared_link_entry.get()), bg=bg_color, fg=fg_color, font=("Fira Sans", 12))
    create_chat_button.pack(pady=5, padx=5, side=tk.LEFT)

    # Frame for bottom buttons
    button_frame = tk.Frame(root, bg=bg_color)
    button_frame.pack(padx=10, pady=10, fill=tk.X, side=tk.BOTTOM)

    # Create a button to create a new chat
    new_chat_button = tk.Button(button_frame, text="New Chat", command=new_chat_callback, bg=bg_color, fg=fg_color, font=("Fira Sans", 12))
    new_chat_button.pack(pady=5, padx=5, side=tk.LEFT)

    # Create a button to clear all chats
    clear_chats_button = tk.Button(button_frame, text="Clear All Chats", command=clear_chats_callback, bg=bg_color, fg=fg_color, font=("Fira Sans", 12))
    clear_chats_button.pack(pady=5, padx=5, side=tk.LEFT)

    # Create a button to delete the selected chat
    delete_chat_button = tk.Button(button_frame, text="Delete Chat", command=delete_selected_chat_callback, bg=bg_color, fg=fg_color, font=("Fira Sans", 12))
    delete_chat_button.pack(pady=5, padx=5, side=tk.LEFT)

    return chat_listbox, chat_log, history_listbox, user_entry, send_button, shared_link_entry, create_chat_button, delete_chat_button