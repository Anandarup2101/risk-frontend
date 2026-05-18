import React, { useEffect, useRef, useState, useCallback } from 'react';
import api from '../api';
import './ChatbotAssistant.css';

const AssistantIcon = ({ size = 18, color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" />
  </svg>
);

const PlusIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const TrashIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

function ChatbotAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi, I can help explain hospital risk, SHAP drivers, dashboard patterns, and business actions.'
    }
  ]);
  
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const fetchSessions = useCallback(async () => {
    try {
      const response = await api.get('/chat/sessions');
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch sessions', error);
      return [];
    }
  }, []);

  const handleOpen = async () => {
    setIsOpen(true);
    const fetchedSessions = await fetchSessions();
    setSessions(fetchedSessions);
    
    // Auto-load the most recent session if no session is currently active
    if (!activeSessionId && fetchedSessions.length > 0) {
      handleSelectSession(fetchedSessions[0].id, fetchedSessions);
    } else if (!activeSessionId && fetchedSessions.length === 0) {
      // Automatically create a first chat if none exist
      await handleNewChat();
    }
  };

  const handleNewChat = async () => {
    try {
      // INSTANTLY create session in backend and update left pane
      const response = await api.post('/chat/session');
      const newSessionId = response.data.session_id;
      const updatedSessions = response.data.sessions || [];
      
      setActiveSessionId(newSessionId);
      setSessions(updatedSessions);
      setMessages([
        {
          role: 'assistant',
          content: 'Starting a new conversation. Ask me about hospital risk, SHAP drivers, exposure, or business actions.'
        }
      ]);
    } catch (error) {
      console.error('Failed to create new chat session', error);
    }
  };

  const handleSelectSession = async (sessionId, currentSessions = null) => {
    try {
      const response = await api.get(`/chat/history/${sessionId}`);
      setActiveSessionId(sessionId);
      setMessages(response.data || []);
      
      if (!currentSessions) {
        const fetchedSessions = await fetchSessions();
        setSessions(fetchedSessions);
      } else {
        setSessions(currentSessions);
      }
    } catch (error) {
      console.error('Failed to load session history', error);
    }
  };

  const handleDeleteSession = async (e, sessionId) => {
    e.stopPropagation();
    try {
      await api.delete(`/chat/session/${sessionId}`);
      
      if (activeSessionId === sessionId) {
        const fetchedSessions = await fetchSessions();
        setSessions(fetchedSessions);
        
        if (fetchedSessions.length > 0) {
          handleSelectSession(fetchedSessions[0].id, fetchedSessions);
        } else {
          await handleNewChat();
        }
      } else {
        const fetchedSessions = await fetchSessions();
        setSessions(fetchedSessions);
      }
    } catch (error) {
      console.error('Failed to delete session', error);
    }
  };

  const renderFormattedText = (text) => {
    if (!text) return null;

    return text
      .split('\n')
      .filter((line) => line.trim() !== '')
      .map((line, lineIndex) => {
        const parts = line.split(/(\*\*.*?\*\*)/g);

        return (
          <p key={lineIndex}>
            {parts.map((part, partIndex) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={partIndex}>{part.slice(2, -2)}</strong>;
              }

              return <span key={partIndex}>{part}</span>;
            })}
          </p>
        );
      });
  };

  const handleSend = async () => {
    const userMessage = input.trim();

    if (!userMessage || loading) return;

    setInput('');

    const newMessages = [
      ...messages,
      {
        role: 'user',
        content: userMessage
      }
    ];

    setMessages(newMessages);
    setLoading(true);

    try {
      const response = await api.post('/llm/ask', {
        session_id: activeSessionId,
        prompt: userMessage
      });

      const answer = response.data?.answer || 'Unable to generate response.';
      const returnedSessionId = response.data?.session_id;

      // If backend updated the title (first message), refresh sidebar
      if (returnedSessionId) {
        const fetchedSessions = await fetchSessions();
        setSessions(fetchedSessions);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: answer
        }
      ]);
    } catch (error) {
      console.error('Chatbot error:', error);

      const backendMessage =
        error?.response?.data?.answer ||
        error?.response?.data?.detail ||
        'Unable to reach the AI assistant right now.';

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: backendMessage
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <button
        className="chatbot-sidebar-action-btn"
        onClick={handleOpen}
        type="button"
      >
        <div className="chatbot-sidebar-icon-wrapper">
          <AssistantIcon size={18} />
        </div>
        <span>Ask AI Assistant</span>
      </button>

      {isOpen && (
        <div className="chatbot-modal-backdrop" onClick={() => setIsOpen(false)}>
          <div className="chatbot-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="chatbot-modal-header">
              <div>
                <div className="chatbot-modal-label">Risk Intelligence AI</div>
                <h3>AI Assistant</h3>
              </div>

              <button
                className="chatbot-modal-close"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                ×
              </button>
            </div>

            <div className="chatbot-layout">
              <div className="chatbot-sidebar-history">
                <div className="chatbot-sidebar-header">
                  <button className="chatbot-new-chat-btn" onClick={handleNewChat} type="button">
                    <PlusIcon size={14} /> New Chat
                  </button>
                </div>
                
                <div className="chatbot-sessions-list">
                  {sessions.length === 0 && (
                    <div className="chatbot-no-sessions">No previous chats</div>
                  )}
                  
                  {sessions.map((session) => (
                    <div 
                      key={session.id} 
                      className={`chatbot-session-item ${activeSessionId === session.id ? 'active' : ''}`}
                      onClick={() => handleSelectSession(session.id)}
                    >
                      <span className="chatbot-session-title">{session.title || 'New Chat'}</span>
                      <button 
                        className="chatbot-session-delete" 
                        onClick={(e) => handleDeleteSession(e, session.id)}
                        type="button"
                      >
                        <TrashIcon size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="chatbot-main-area">
                <div className="chatbot-messages">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`chatbot-message-row ${
                        message.role === 'user' ? 'user' : 'assistant'
                      }`}
                    >
                      <div className="chatbot-message-bubble">
                        {renderFormattedText(message.content)}
                      </div>
                    </div>
                  ))}

                  {loading && (
                    <div className="chatbot-message-row assistant">
                      <div className="chatbot-message-bubble loading">Thinking...</div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                <div className="chatbot-footer">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about risk drivers, hospitals, SHAP, or actions..."
                    rows={2}
                  />

                  <div className="chatbot-actions">
                    <button
                      className="chatbot-send-btn"
                      onClick={handleSend}
                      type="button"
                      disabled={loading || !input.trim()}
                    >
                      {loading ? 'Sending...' : 'Send'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ChatbotAssistant;