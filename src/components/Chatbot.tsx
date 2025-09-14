import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import chatbotService, { ChatbotMessage } from '../services/chatbot-service';
import '../styles/Chatbot.css';

const Chatbot: React.FC = () => {
  const { token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatbotMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load messages from localStorage on component mount
  useEffect(() => {
    const savedMessages = chatbotService.loadMessages();
    setMessages(savedMessages);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when chatbot opens
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !token) return;

    const userMessage = chatbotService.createUserMessage(inputMessage.trim());
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await chatbotService.sendMessage(userMessage.message, token);
      
      if (response.success && response.response) {
        const botMessage = chatbotService.createBotMessage(
          response.response,
          response.model_used,
          response.estimated_tokens
        );
        const updatedMessages = [...newMessages, botMessage];
        setMessages(updatedMessages);
        chatbotService.saveMessages(updatedMessages);
      } else {
        const errorMessage = chatbotService.createBotMessage(
          response.message || 'I apologize, but I encountered an error. Please try again.'
        );
        const updatedMessages = [...newMessages, errorMessage];
        setMessages(updatedMessages);
        chatbotService.saveMessages(updatedMessages);
      }
    } catch (error) {
      const errorMessage = chatbotService.createBotMessage(
        'I\'m having trouble connecting right now. Please try again in a moment.'
      );
      const updatedMessages = [...newMessages, errorMessage];
      setMessages(updatedMessages);
      chatbotService.saveMessages(updatedMessages);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    chatbotService.clearMessages();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderWelcomeMessage = () => {
    if (messages.length > 0) return null;
    
    return (
      <div className="welcome-message">
        <div className="lion-avatar large">
          🦁
        </div>
        <h3>Hi! I'm Leo, your financial advisor</h3>
        <p>I'm here to help you with investing, budgeting, and financial planning as a student. Ask me anything!</p>
        <div className="quick-questions">
          <button onClick={() => setInputMessage("How should I start investing as a student?")}>
            How should I start investing?
          </button>
          <button onClick={() => setInputMessage("What's a good budget for a college student?")}>
            Help with budgeting
          </button>
          <button onClick={() => setInputMessage("Explain diversification to me")}>
            What is diversification?
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Chatbot Toggle Button */}
      <button
        className={`chatbot-toggle ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle chatbot"
      >
        <div className="lion-avatar">
          🦁
        </div>
        {!isOpen && messages.length > 0 && (
          <div className="notification-dot"></div>
        )}
      </button>

      {/* Chatbot Window */}
      {isOpen && (
        <div className={`chatbot-window ${isMinimized ? 'minimized' : ''}`}>
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-title">
              <div className="lion-avatar small">🦁</div>
              <span>Leo - Financial Advisor</span>
              <div className="status-indicator online"></div>
            </div>
            <div className="chatbot-controls">
              <button
                className="control-btn"
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? 'Expand' : 'Minimize'}
              >
                {isMinimized ? '⬆️' : '⬇️'}
              </button>
              <button
                className="control-btn"
                onClick={clearChat}
                title="Clear chat"
              >
                🗑️
              </button>
              <button
                className="control-btn close"
                onClick={() => setIsOpen(false)}
                title="Close"
              >
                ✕
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="chatbot-messages">
                {renderWelcomeMessage()}
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`message ${message.isUser ? 'user' : 'bot'}`}
                  >
                    {!message.isUser && (
                      <div className="lion-avatar tiny">🦁</div>
                    )}
                    <div className="message-content">
                      <div className="message-text">{message.message}</div>
                      <div className="message-meta">
                        <span className="message-time">
                          {formatTime(message.timestamp)}
                        </span>
                        {!message.isUser && message.modelUsed && (
                          <span className={`model-badge ${message.modelUsed}`}>
                            {message.modelUsed === 'high' ? '🧠' : '⚡'} {message.modelUsed}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="message bot">
                    <div className="lion-avatar tiny">🦁</div>
                    <div className="message-content">
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="chatbot-input">
                <div className="input-container">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask Leo about investing, budgeting, or financial planning..."
                    disabled={isLoading}
                    maxLength={500}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                    className="send-button"
                  >
                    {isLoading ? '⏳' : '📤'}
                  </button>
                </div>
                <div className="input-footer">
                  <span className="char-counter">
                    {inputMessage.length}/500
                  </span>
                  <span className="powered-by">
                    Powered by AI • Educational purposes only
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default Chatbot;
