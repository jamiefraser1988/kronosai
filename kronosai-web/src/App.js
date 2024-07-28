import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { FaCog, FaPlus, FaMinus, FaChevronLeft, FaChevronRight, FaEllipsisV } from 'react-icons/fa';
import Modal from 'react-modal';
import { marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';

Modal.setAppElement('#root');

// Configure marked to use highlight.js for code blocks
marked.setOptions({
  highlight: function (code, lang) {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext';
    return hljs.highlight(code, { language }).value;
  },
});

function App() {
  const [userInput, setUserInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [response, setResponse] = useState('');
  const [chatTitle, setChatTitle] = useState('New Chat');
  const [chats, setChats] = useState(JSON.parse(localStorage.getItem('chats')) || []);
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'purple');
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [suggestionsModalIsOpen, setSuggestionsModalIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [lineHeight, setLineHeight] = useState(parseFloat(localStorage.getItem('lineHeight')) || 1.2);
  const [fontSize, setFontSize] = useState(parseFloat(localStorage.getItem('fontSize')) || 16);
  const [isAssistantTyping, setIsAssistantTyping] = useState(false);
  const [showSavedChats, setShowSavedChats] = useState(window.innerWidth >= 768);
  const [showChatHistory, setShowChatHistory] = useState(window.innerWidth >= 768);
  const [suggestion, setSuggestion] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [userName, setUserName] = useState('');
  const chatLogRef = useRef(null);
  const isInteractingWithMessage = useRef(false);

  useEffect(() => {
    document.title = 'Kronos AI'; // Set the browser tab title

    const savedChatHistory = localStorage.getItem('chatHistory');
    if (savedChatHistory) {
      setChatHistory(JSON.parse(savedChatHistory));
    }
    const savedChatTitle = localStorage.getItem('chatTitle');
    if (savedChatTitle) {
      setChatTitle(savedChatTitle);
    }
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

  const sendMessage = async () => {
    if (!userInput.trim()) return;
    const escapedUserInput = escapeHtml(userInput).replace(/\n/g, '<br>');
    setLoading(true);
    setIsAssistantTyping(true);

    try {
      const res = await fetch('https://kronosai-suggestions-d03c952fecd6.herokuapp.com/send_message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_input: escapedUserInput, chat_history: chatHistory, chat_title: chatTitle })
      });

      if (!res.ok) {
        throw new Error(`Error: ${res.status}`);
      }

      const data = await res.json();
      setResponse(data.response);
      setLoading(false);
      setIsAssistantTyping(false);

      if (chatTitle === 'New Chat') {
        setChatTitle(data.chat_name);
        localStorage.setItem('chatTitle', data.chat_name);
      }

      const updatedChatHistory = [...chatHistory, { speaker: 'You', content: escapedUserInput, isExpanded: false }, { speaker: 'Assistant', content: data.response }];
      setChatHistory(updatedChatHistory);
      localStorage.setItem('chatHistory', JSON.stringify(updatedChatHistory));

      const updatedChats = [...chats.filter(chat => chat.title !== chatTitle), { title: chatTitle === 'New Chat' ? data.chat_name : chatTitle, history: updatedChatHistory }];
      setChats(updatedChats);
      localStorage.setItem('chats', JSON.stringify(updatedChats));

      setUserInput('');
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
    }
  };

  const newChat = () => {
    setChatTitle('New Chat');
    setChatHistory([]);
    localStorage.removeItem('chatHistory');
    localStorage.removeItem('chatTitle');
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
          top: offsetTop - 110,
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
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
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

  const formatMessage = (msg) => {
    let htmlContent = marked(msg);

    // Ensure new lines and spaces are preserved
    htmlContent = htmlContent.replace(/\n/g, '<br>');

    const codeBlocks = htmlContent.match(/<pre><code class="language-([^"]*)">([\s\S]*?)<\/code><\/pre>/g) || [];

    codeBlocks.forEach((block, index) => {
      const language = block.match(/language-([^"]*)/)[1];
      const codeContent = block.match(/<code class="[^"]*">([\s\S]*?)<\/code>/)[1];
      const encodedCode = btoa(codeContent);
      const button = `<button className="copy-button" data-code="${encodedCode}">Copy code</button>`;
      const modifiedBlock = `<div className="code-block-container">
                                <div className="code-block-header">
                                  <span className="code-type">${language}</span>
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

  const openSuggestionsModal = async () => {
    try {
      const res = await fetch('https://kronosai-suggestions-d03c952fecd6.herokuapp.com/suggestions');
      if (!res.ok) {
        throw new Error('Failed to fetch suggestions.');
      }
      const data = await res.json();
      setSuggestions(data);
      setSuggestionsModalIsOpen(true);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      alert('Failed to fetch suggestions.');
    }
  };

  const closeSuggestionsModal = () => {
    setSuggestionsModalIsOpen(false);
  };

  const changeTheme = (newTheme) => {
    setTheme(newTheme);
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

  const handleSubmitSuggestion = async (e) => {
    e.preventDefault();
    if (!suggestion.trim() || !userName.trim()) return;
    try {
      const res = await fetch('https://kronosai-suggestions-d03c952fecd6.herokuapp.com/submit_suggestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suggestion, userName })
      });
      if (!res.ok) {
        throw new Error('Failed to submit suggestion.');
      }
      setSuggestion('');
      setUserName('');
      alert('Suggestion submitted successfully!');
    } catch (error) {
      console.error('Error submitting suggestion:', error);
      alert('Failed to submit suggestion.');
    }
  };

  const themeClasses = `${theme}-theme`;

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const shouldShowExpandIcon = (content) => {
    const div = document.createElement('div');
    div.innerHTML = content;
    return div.getElementsByTagName('br').length > 1;
  };

  const toggleOptionsMenu = (index, event) => {
    event.stopPropagation(); // Prevent triggering document click event
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

  const toggleSidebar = (sidebar) => {
    if (sidebar === 'savedChats') {
      setShowSavedChats(!showSavedChats);
      if (!showSavedChats) {
        setShowChatHistory(false);
      }
    } else if (sidebar === 'chatHistory') {
      setShowChatHistory(!showChatHistory);
      if (!showChatHistory) {
        setShowSavedChats(false);
      }
    }
  };

  const escapeHtml = (unsafe) => {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const handleClickOutside = (event) => {
    setChats((prevChats) => prevChats.map((chat) => ({ ...chat, showOptions: false })));
  };

  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  return (
    <div className={`App ${themeClasses}`}>
      <header className="App-header">
        <button className="toggle-sidebar-button left" onClick={() => toggleSidebar('savedChats')}>
          {showSavedChats ? <FaChevronLeft /> : <FaChevronRight />}
        </button>
        {showSavedChats && (
          <div className="sidebar visible">
            <h2>Saved Chats</h2>
            <ul>
              {chats.map((chat, index) => (
                <li key={index}>
                  <button className="options-button" onClick={(event) => toggleOptionsMenu(index, event)}><FaEllipsisV /></button>
                  <span onClick={() => loadChat(chat.title)}>{chat.title}</span>
                  {chat.showOptions && (
                    <div className="options-menu" style={{ top: chat.optionsPosition.top, left: chat.optionsPosition.left }}>
                      <button onClick={() => deleteChat(chat.title)}>Delete</button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
            <button className="new-chat-button" onClick={newChat}>New Chat</button>
          </div>
        )}
        <div className="chat-container">
          <h1>Chat with Assistant</h1>
          <FaCog className="settings-icon" onClick={openModal} />
          <div className="chat-log" ref={chatLogRef} style={{ height: isExpanded ? 'calc(100vh - 240px)' : 'calc(100vh - 240px)', lineHeight, fontSize: `${fontSize}px` }}>
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
                  setUserInput('');
                }
              }}
              placeholder="Type a message..."
            />
            <button onClick={() => { sendMessage(); setUserInput(''); }}>Send</button>
          </div>
          {window.innerWidth >= 768 && (
            <div className="new-line-instruction">
              <small><strong>Shift</strong> + <strong>Return/Enter</strong> to add a new line</small>
            </div>
          )}
        </div>
        <button className="toggle-sidebar-button right" onClick={() => toggleSidebar('chatHistory')}>
          {showChatHistory ? <FaChevronRight /> : <FaChevronLeft />}
        </button>
        {showChatHistory && (
          <div className="history-sidebar visible">
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
        )}
      </header>
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Settings Modal"
        className="settings-modal"
        overlayClassName="modal-overlay"
      >
        <h2>Settings</h2>
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
        <button onClick={() => changeTheme('light')}>Light Theme</button>
        <button onClick={() => changeTheme('purple')}>Purple Theme</button>
        <button onClick={() => changeTheme('blue')}>Blue Theme</button>
        <button onClick={() => changeTheme('black')}>Black Theme</button>
        <button onClick={closeModal}>Close</button>
        <div className="setting">
          <h3>Submit Suggestion</h3>
          <form onSubmit={handleSubmitSuggestion}>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter your name..."
              required
            />
            <textarea
              value={suggestion}
              onChange={(e) => setSuggestion(e.target.value)}
              placeholder="Enter your suggestion..."
              required
            />
            <button type="submit">Submit</button>
          </form>
          <button onClick={openSuggestionsModal}>View Suggestions</button>
        </div>
      </Modal>
      <Modal
        isOpen={suggestionsModalIsOpen}
        onRequestClose={closeSuggestionsModal}
        contentLabel="Suggestions Modal"
        className="suggestions-modal"
        overlayClassName="modal-overlay"
      >
        <h2>Suggestions</h2>
        <div className="suggestions-list">
          {suggestions.map((suggestion, index) => (
            <div key={index} className="suggestion-item">
              <p><strong>{suggestion.userName}:</strong> {suggestion.suggestion}</p>
            </div>
          ))}
        </div>
        <button onClick={closeSuggestionsModal}>Close</button>
      </Modal>
    </div>
  );
}

export default App;
