import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { FaCog, FaPlus, FaMinus, FaAngleLeft, FaAngleRight, FaEllipsisV } from 'react-icons/fa';
import Modal from 'react-modal';
import { marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css'; // Importing the GitHub Dark theme

Modal.setAppElement('#root');

// Configure marked to use highlight.js for code blocks
marked.setOptions({
  highlight: function (code, lang) {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext';
    return hljs.highlight(code, { language }).value;
  },
});

const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
};

const initializeChats = () => {
  try {
    const storedChats = localStorage.getItem('chats');
    return storedChats ? JSON.parse(storedChats) : [];
  } catch (error) {
    console.error('Failed to parse chats from localStorage:', error);
    return [];
  }
};

function App() {
  const [userInput, setUserInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [response, setResponse] = useState('');
  const [chatTitle, setChatTitle] = useState('New Chat');
  const [chats, setChats] = useState(initializeChats());
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [lineHeight, setLineHeight] = useState(parseFloat(localStorage.getItem('lineHeight')) || 1.2);
  const [fontSize, setFontSize] = useState(parseFloat(localStorage.getItem('fontSize')) || 16);
  const [isAssistantTyping, setIsAssistantTyping] = useState(false);
  const [showSavedChats, setShowSavedChats] = useState(window.innerWidth >= 768);
  const [showChatHistory, setShowChatHistory] = useState(window.innerWidth >= 768);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsModalIsOpen, setSuggestionsModalIsOpen] = useState(false);
  const [viewSuggestionsModalIsOpen, setViewSuggestionsModalIsOpen] = useState(false);
  const [confirmationPopupVisible, setConfirmationPopupVisible] = useState(false);
  const chatLogRef = useRef(null);
  const isInteractingWithMessage = useRef(false);

  useEffect(() => {
    document.title = "Kronos AI";
    document.body.classList.add(theme);
  }, [theme]);

  const escapeHtml = (unsafe) => {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  useEffect(() => {
    const safeParseJSON = (item, fallback) => {
      try {
        return item ? JSON.parse(item) : fallback;
      } catch (error) {
        console.error(`Failed to parse item from localStorage: ${error}`);
        return fallback;
      }
    };

    const savedChatHistory = safeParseJSON(localStorage.getItem('chatHistory'), []);
    const savedChatTitle = localStorage.getItem('chatTitle') || 'New Chat';
    const savedLineHeight = parseFloat(localStorage.getItem('lineHeight')) || 1.2;
    const savedFontSize = parseFloat(localStorage.getItem('fontSize')) || 16;

    setChatHistory(savedChatHistory);
    setChatTitle(savedChatTitle);
    setLineHeight(savedLineHeight);
    setFontSize(savedFontSize);
  }, []);

  useEffect(() => {
    if (!isInteractingWithMessage.current) {
      scrollToBottom();
    }
  }, [chatHistory, loading]);

  useEffect(() => {
    document.addEventListener('click', handleCopyClick);
    return () => {
      document.removeEventListener('click', handleCopyClick);
    };
  }, []);

  useEffect(() => {
    // Apply syntax highlighting after chat history is updated
    hljs.highlightAll();
  }, [chatHistory]);

  const fetchChats = async () => {
    const savedChats = initializeChats();
    setChats(savedChats);
  };

  const sendMessage = async () => {
    if (!userInput.trim()) return;
    const escapedUserInput = escapeHtml(userInput).replace(/\n/g, '<br>');
    setLoading(true);
    setIsAssistantTyping(true);

    const userMessage = { speaker: 'You', content: escapedUserInput, isExpanded: false };

    // Add user message to chat history
    setChatHistory((prevChatHistory) => [...prevChatHistory, userMessage]);
    setUserInput('');

    try {
      const res = await fetch('https://kronosai-59ad0fce9738.herokuapp.com/send_message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_input: escapedUserInput, chat_history: chatHistory, chat_title: chatTitle })
      });

      if (!res.ok) {
        throw new Error(`Error: ${res.status}`);
      }

      const data = await res.json();
      setLoading(false);
      setIsAssistantTyping(false);
      if (chatTitle === 'New Chat') {
        setChatTitle(data.chat_name);
        localStorage.setItem('chatTitle', data.chat_name);
      }

      // Add assistant message to chat history
      setChatHistory((prevChatHistory) => [...prevChatHistory, { speaker: 'Assistant', content: data.response }]);
      localStorage.setItem('chatHistory', JSON.stringify([...chatHistory, userMessage, { speaker: 'Assistant', content: data.response }]));

      const updatedChats = [...chats.filter(chat => chat.title !== chatTitle), { title: chatTitle === 'New Chat' ? data.chat_name : chatTitle, history: [...chatHistory, userMessage, { speaker: 'Assistant', content: data.response }] }];
      setChats(updatedChats);
      localStorage.setItem('chats', JSON.stringify(updatedChats));

      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      setLoading(false);
      setIsAssistantTyping(false);
    }
  };

  const deleteChat = (title) => {
    const updatedChats = chats.filter(chat => chat.title !== title);
    setChats(updatedChats);
    localStorage.setItem('chats', JSON.stringify(updatedChats));

    if (chatTitle === title) {
      setChatTitle('New Chat');
      setChatHistory([]);
      localStorage.removeItem('chatHistory');
      localStorage.removeItem('chatTitle');
    }
  };

  const loadChat = (title) => {
    const chat = chats.find(chat => chat.title === title);
    if (chat) {
      setChatTitle(chat.title);
      setChatHistory(chat.history);
      localStorage.setItem('chatHistory', JSON.stringify(chat.history));
      localStorage.setItem('chatTitle', chat.title);
      if (window.innerWidth < 768) {
        setShowSavedChats(false);
      }
    }
  };

  const newChat = () => {
    setChatTitle('New Chat');
    setChatHistory([]);
    localStorage.removeItem('chatHistory');
    localStorage.removeItem('chatTitle');
    if (window.innerWidth < 768) {
      setShowSavedChats(false);
    }
  };

  const scrollToMessage = (index) => {
    if (chatLogRef.current) {
      const userMessageIndices = chatHistory
        .map((msg, idx) => (msg.speaker === 'You' ? idx : null))
        .filter(idx => idx !== null);

      const targetIndex = userMessageIndices[index];
      const chatLogElement = chatLogRef.current;
      const targetElement = chatLogElement.children[targetIndex];
      if (targetElement) {
        const offsetTop = targetElement.offsetTop;
        chatLogElement.scrollTo({
          top: offsetTop - 100,
          behavior: 'smooth',
        });
      }
    }
  };

  const scrollToBottom = () => {
    if (chatLogRef.current) {
      chatLogRef.current.scrollTo({
        top: chatLogRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const copyToClipboard = (text, button) => {
    const cleanText = text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'");

    const tempElement = document.createElement('textarea');
    tempElement.value = cleanText;
    document.body.appendChild(tempElement);
    tempElement.select();
    document.execCommand('copy');
    document.body.removeChild(tempElement);

    button.textContent = 'Copied!';
    setTimeout(() => {
      button.textContent = 'Copy code';
    }, 2000);
  };

  const handleCopyClick = (e) => {
    if (e.target.classList.contains('copy-button')) {
      const encodedCode = e.target.getAttribute('data-code');
      const code = atob(encodedCode);
      copyToClipboard(code, e.target);
    }
  };

  const handleExpandMessage = (index) => {
    setChatHistory((prevChatHistory) =>
      prevChatHistory.map((msg, idx) => {
        if (idx === index) {
          return { ...msg, isExpanded: !msg.isExpanded };
        }
        return msg;
      })
    );
    isInteractingWithMessage.current = true;
    setTimeout(() => {
      isInteractingWithMessage.current = false;
    }, 100);
  };

  const shouldShowExpandIcon = (content) => {
    const div = document.createElement('div');
    div.innerHTML = content;
    return div.getElementsByTagName('br').length > 1;
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const formatMessage = (msg) => {
    let htmlContent = marked(msg);

    // Ensure new lines and spaces are preserved
    htmlContent = htmlContent.replace(/\n/g, '<br>');

    const codeBlocks = htmlContent.match(/<pre><code class="language-([^"]*)">([\s\S]*?)<\/code><\/pre>/g) || [];

    codeBlocks.forEach((block, index) => {
      const language = block.match(/language-([^"]*)/)[1];
      const codeContent = block.match(/<code class="[^"]*">([\s\S]*?)<\/code>/)[1];
      const encodedCode = btoa(codeContent);
      const button = `<button class="copy-button" data-code="${encodedCode}">Copy code</button>`;
      const modifiedBlock = `<div class="code-block-container">
                                <div class="code-block-header">
                                  <span class="code-type">${language}</span>
                                  ${button}
                                </div>
                                ${block}
                              </div>`;
      htmlContent = htmlContent.replace(block, modifiedBlock);
    });

    return { __html: htmlContent };
  };

  const openModal = () => {
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
  };

  const openSuggestionsModal = () => {
    setSuggestionsModalIsOpen(true);
  };

  const closeSuggestionsModal = () => {
    setSuggestionsModalIsOpen(false);
  };

  const openViewSuggestionsModal = () => {
    setViewSuggestionsModalIsOpen(true);
    fetchSuggestions(); // Fetch suggestions when opening the view modal
  };

  const closeViewSuggestionsModal = () => {
    setViewSuggestionsModalIsOpen(false);
  };

  const changeTheme = (newTheme) => {
    document.body.classList.remove(theme);
    setTheme(newTheme);
    document.body.classList.add(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const handleLineHeightChange = (e) => {
    const newLineHeight = e.target.value;
    setLineHeight(newLineHeight);
    localStorage.setItem('lineHeight', newLineHeight);
  };

  const handleFontSizeChange = (e) => {
    const newFontSize = e.target.value;
    setFontSize(newFontSize);
    localStorage.setItem('fontSize', newFontSize);
  };

  const handleSuggestionSubmit = async (e) => {
    e.preventDefault();
    const suggestion = e.target.elements.suggestion.value;
    const userName = e.target.elements.name.value;

    console.log('Suggestion:', suggestion);
    console.log('UserName:', userName);

    try {
      const res = await fetch('https://kronosai-suggestions-d03c952fecd6.herokuapp.com/submit_suggestion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userName, suggestion })
      });

      if (!res.ok) {
        throw new Error('Failed to submit suggestion');
      }

      const responseText = await res.text();
      console.log('Response:', responseText);

      // Add the new suggestion to the state
      setSuggestions((prevSuggestions) => [...prevSuggestions, { suggestion, userName }]);
      setConfirmationPopupVisible(true);
      setTimeout(() => {
        setConfirmationPopupVisible(false);
      }, 3000); // Hide the popup after 3 seconds
      e.target.reset();
      closeSuggestionsModal();
    } catch (error) {
      console.error('Error submitting suggestion:', error);
    }
  };

  const fetchSuggestions = async () => {
    try {
      const res = await fetch('https://kronosai-suggestions-d03c952fecd6.herokuapp.com/suggestions');

      if (!res.ok) {
        throw new Error('Failed to fetch suggestions');
      }

      const suggestions = await res.json();
      setSuggestions(suggestions);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const handleClickOutside = (event) => {
    if (
      !event.target.closest('.sidebar') &&
      !event.target.closest('.history-sidebar') &&
      !event.target.closest('.toggle-sidebar-button')
    ) {
      if (window.innerWidth < 768) {
        setShowSavedChats(false);
        setShowChatHistory(false);
      }
    }
  };

  const toggleSidebar = debounce((sidebar) => {
    if (sidebar === 'savedChats') {
      setShowSavedChats((prevShowSavedChats) => {
        const newState = !prevShowSavedChats;
        if (newState) {
          setShowChatHistory(false); // Close chatHistory sidebar if opening savedChats
        }
        console.log('Toggled Saved Chats:', newState);
        return newState;
      });
    } else if (sidebar === 'chatHistory') {
      setShowChatHistory((prevShowChatHistory) => {
        const newState = !prevShowChatHistory;
        if (newState) {
          setShowSavedChats(false); // Close savedChats sidebar if opening chatHistory
        }
        console.log('Toggled Chat History:', newState);
        return newState;
      });
    }
  }, 300);

  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const handleRenameChat = (title) => {
    const newTitle = prompt('Enter new chat name:', title);
    if (newTitle) {
      const updatedChats = chats.map(chat =>
        chat.title === title ? { ...chat, title: newTitle } : chat
      );
      setChats(updatedChats);
      localStorage.setItem('chats', JSON.stringify(updatedChats));
      if (chatTitle === title) {
        setChatTitle(newTitle);
        localStorage.setItem('chatTitle', newTitle);
      }
    }
  };

  const toggleOptionsMenu = (index, event) => {
    event.stopPropagation();
    const updatedChats = chats.map((chat, idx) => {
      if (index === idx) {
        chat.showOptions = !chat.showOptions;
        chat.optionsPosition = { top: event.clientY, left: event.clientX };
      } else {
        chat.showOptions = false;
      }
      return chat;
    });
    setChats(updatedChats);
  };

  return (
    <div className={`App ${theme}`}>
      <header className="App-header">
        <button className="toggle-sidebar-button left" onClick={() => toggleSidebar('savedChats')}>
          {showSavedChats ? <FaAngleLeft /> : <FaAngleRight />}
        </button>
        <div className={`sidebar ${showSavedChats ? 'visible' : ''}`}>
          <h2>Saved Chats</h2>
          <ul>
            {chats.map((chat, index) => (
              <li key={index}>
                <button className="options-button" onClick={(event) => toggleOptionsMenu(index, event)}><FaEllipsisV /></button>
                <span onClick={() => loadChat(chat.title)}>{chat.title}</span>
                {chat.showOptions && (
                  <div className="options-menu" style={{ top: chat.optionsPosition.top, left: chat.optionsPosition.left }}>
                    <button onClick={() => deleteChat(chat.title)}>Delete</button>
                    <button onClick={() => handleRenameChat(chat.title)}>Rename</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
          <button className="new-chat-button" onClick={newChat}>New Chat</button>
        </div>
        <div className="chat-container">
          <div className="chat-header">
            <h1>Chat with Assistant</h1>
            <FaCog className="settings-icon" onClick={openModal} />
          </div>
          <div className="chat-log" ref={chatLogRef} style={{ height: isExpanded ? 'calc(100vh - 240px)' : 'calc(100vh - 240px)', lineHeight, fontSize: `${fontSize}px` }}>
            <div className="chat-log-content">
              {chatHistory.map((msg, index) => (
                <div key={index} className={msg.speaker === 'You' ? 'user-message' : 'assistant-message'}>
                  <strong>{msg.speaker}:</strong>
                  {msg.speaker === 'You' ? (
                    <>
                      <span
                        className={`user-message-content ${msg.isExpanded ? 'expanded' : ''}`}
                        onClick={() => handleExpandMessage(index)}
                        dangerouslySetInnerHTML={{ __html: msg.content }}
                      ></span>
                      {shouldShowExpandIcon(msg.content) && (
                        <span className="expand-icon" onClick={() => handleExpandMessage(index)}>
                          {msg.isExpanded ? <FaMinus /> : <FaPlus />}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="assistant-message-content" dangerouslySetInnerHTML={formatMessage(msg.content)}></span>
                  )}
                </div>
              ))}
              {loading && (
                <div className="typing-indicator">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
              )}
            </div>
          </div>
          <div className={`input-container ${isExpanded ? 'expanded' : ''}`}>
            <button onClick={toggleExpand} className="expand-button">
              {isExpanded ? 'Collapse' : 'Expand'}
            </button>
            <textarea
              className={`user-input ${isExpanded ? 'expanded' : ''}`}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Type a message..."
            />
            <button onClick={sendMessage}>Send</button>
          </div>
          <div className="new-line-instruction">
            <small><strong>Shift</strong> + <strong>Return/Enter</strong> to add a new line</small>
          </div>
        </div>
        <button className="toggle-sidebar-button right" onClick={() => toggleSidebar('chatHistory')}>
          {showChatHistory ? <FaAngleRight /> : <FaAngleLeft />}
        </button>
        <div className={`history-sidebar ${showChatHistory ? 'visible' : ''}`}>
          <h2>Chat History</h2>
          <ul>
            {chatHistory
              .filter(msg => msg.speaker === 'You')
              .map((msg, index) => (
                <li key={index} onClick={() => scrollToMessage(index)}>
                  <span>{msg.content}</span>
                </li>
              ))}
          </ul>
        </div>
      </header>
      {confirmationPopupVisible && (
        <div className="confirmation-popup">
          Suggestion submitted successfully!
        </div>
      )}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Settings Modal"
        className="settings-modal"
        overlayClassName="modal-overlay"
      >
        <h2>Settings</h2>
        <p>Version: v 1</p>
        <div className="setting">
          <label>Line Height</label>
          <input
            type="range"
            min="1"
            max="2"
            step="0.1"
            value={lineHeight}
            onChange={handleLineHeightChange}
          />
        </div>
        <div className="setting">
          <label>Font Size</label>
          <input
            type="range"
            min="12"
            max="24"
            step="1"
            value={fontSize}
            onChange={handleFontSizeChange}
          />
        </div>
        <div className="setting">
          <label>Theme</label>
          <select value={theme} onChange={(e) => changeTheme(e.target.value)} className="large-dropdown">
            <option value="dark-theme">Dark</option>
            <option value="light-theme">Light</option>
            <option value="blue-theme">Blue</option>
            <option value="purple-theme">Purple</option>
          </select>
        </div>
        <button onClick={openSuggestionsModal}>Suggestion</button>
        <button onClick={openViewSuggestionsModal}>View Suggestions</button>
        <button onClick={closeModal}>Close</button>
      </Modal>
      <Modal
        isOpen={suggestionsModalIsOpen}
        onRequestClose={closeSuggestionsModal}
        contentLabel="Suggestion Modal"
        className="settings-modal"
        overlayClassName="modal-overlay"
      >
        <h2>Suggestion</h2>
        <form onSubmit={handleSuggestionSubmit}>
          <div className="setting">
            <label>Name</label>
            <input type="text" name="name" required />
          </div>
          <div className="setting">
            <label>Suggestion</label>
            <textarea name="suggestion" required></textarea>
          </div>
          <button type="submit">Submit</button>
          <button type="button" onClick={closeSuggestionsModal}>Close</button>
        </form>
      </Modal>
      <Modal
        isOpen={viewSuggestionsModalIsOpen}
        onRequestClose={closeViewSuggestionsModal}
        contentLabel="View Suggestions Modal"
        className="settings-modal"
        overlayClassName="modal-overlay"
      >
        <h2>Suggestions</h2>
        <ul>
          {suggestions.map((s, index) => (
            <li key={index}>
              <strong>{s.userName}</strong>: {s.suggestion}
            </li>
          ))}
        </ul>
        <button onClick={closeViewSuggestionsModal}>Close</button>
      </Modal>
    </div>
  );
}

export default App;
