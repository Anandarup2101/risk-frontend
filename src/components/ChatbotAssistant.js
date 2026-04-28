import React, { useEffect, useRef, useState } from 'react';
import api from '../api';
import './ChatbotAssistant.css';

function getChatSessionId() {
  let sessionId = localStorage.getItem('risk_chat_session_id');

  if (!sessionId) {
    sessionId = `risk_session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem('risk_chat_session_id', sessionId);
  }

  return sessionId;
}

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

function ChatbotAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        'Hi, I can help explain hospital risk, SHAP drivers, dashboard patterns, and business actions.'
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

    setMessages((prev) => [
      ...prev,
      {
        role: 'user',
        content: userMessage
      }
    ]);

    setLoading(true);

    try {
      const response = await api.post('/llm/ask', {
        session_id: getChatSessionId(),
        prompt: userMessage
      });

      const answer = response.data?.answer || 'Unable to generate response.';

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

  const handleClearChat = () => {
    localStorage.removeItem('risk_chat_session_id');

    setMessages([
      {
        role: 'assistant',
        content:
          'Chat reset. Ask me about hospital risk, SHAP drivers, exposure, or business actions.'
      }
    ]);
  };

  return (
    <>
      <button
        className="chatbot-sidebar-action-btn"
        onClick={() => setIsOpen(true)}
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
                  className="chatbot-clear-btn"
                  onClick={handleClearChat}
                  type="button"
                  disabled={loading}
                >
                  Reset
                </button>

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
      )}
    </>
  );
}

export default ChatbotAssistant;