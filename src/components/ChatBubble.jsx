import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';
import { FiMessageSquare, FiX, FiSend, FiUser } from 'react-icons/fi';
import './ChatBubble.css';
import SeaTgcLogo from '../assets/Icon_SeaTgc.png'

const ChatBubble = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { text: '¡Hola! Soy SeaTgc, tu asistente de PikaCards. ¿En qué puedo ayudarte hoy?', sender: 'bot' }
  ]);
  const [escribiendo, setEscribiendo] = useState(false);
  const [userAvatar, setUserAvatar] = useState('');
  const messagesEndRef = useRef(null);

  const { isAuthenticated, auth } = useAuth();

  // Load user avatar from localStorage
  useEffect(() => {
    const loadUserAvatar = () => {
      try {
        const username = auth?.user?.username;
        if (username) {
          const key = `pikacards_profile_${username}`;
          const saved = localStorage.getItem(key);
          if (saved) {
            const parsed = JSON.parse(saved);
            setUserAvatar(parsed?.avatar || '');
          }
        }
      } catch (error) {
        console.error('Error loading avatar:', error);
        setUserAvatar('');
      }
    };

    loadUserAvatar();
    
    // Listen for storage changes to update the avatar in real-time
    const handleStorageChange = (e) => {
      if (e.key && e.key.startsWith('pikacards_profile_')) {
        loadUserAvatar();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [auth?.user?.username]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!message.trim()) return;

    // 👇 CORREGIDO: validar bien la autenticación
    if (!isAuthenticated()) {
      setMessages(prev => [
        ...prev,
        {
          text: 'Para poder chatear conmigo debes iniciar sesión. ¡Es rapidito! 😊',
          sender: 'bot'
        }
      ]);
      return;
    }

    // 👤 Mensaje del usuario
    const userMessage = { text: message, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setEscribiendo(true);

    try {
      const response = await axios.post(
        `${API_URL}/ai-chat/`,
        { message },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${auth?.token}`  // 👈 TOKEN AHORA SIEMPRE EXISTE
          },
        }
      );

      setMessages(prev => [
        ...prev,
        { text: response.data.reply, sender: 'bot' }
      ]);

    } catch (error) {
      console.error("Error sending message:", error);

      const errmsg =
        error.response?.data?.error ||
        "Lo siento, ocurrió un error al enviar tu mensaje.";

      setMessages(prev => [
        ...prev,
        { text: errmsg, sender: 'bot' }
      ]);
    } finally {
      setEscribiendo(false);
    }
  };

  return (
    <div className={`chat-container ${isOpen ? 'open' : ''}`}>
      {isOpen ? (
        <div className="chat-window">
          
          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-content">
              <img src={SeaTgcLogo} alt="SeaTgc" className="chat-avatar" />
              <div>
                <h3>SeaTgc</h3>
                <p className="status">En línea</p>
              </div>
            </div>
            <button className="close-button" onClick={() => setIsOpen(false)}>
              <FiX />
            </button>
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.sender}`}>
                {msg.sender === 'bot' ? (
                  <img src={SeaTgcLogo} alt="Bot" className="message-avatar" />
                ) : (
                  <div className="user-avatar">
                    {userAvatar ? (
                      <img src={userAvatar} alt="User" className="user-avatar-img" />
                    ) : (
                      <FiUser className="default-avatar-icon" />
                    )}
                  </div>
                )}

                <div className="message-content">
                  <p>{msg.text}</p>
                </div>
              </div>
            ))}

            {escribiendo && (
              <div className="message bot">
                <img src={SeaTgcLogo} alt="Bot" className="message-avatar" />
                <div className="typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="chat-input-container">
            <input
              type="text"
              value={message}
              placeholder="Escribe tu mensaje..."
              onChange={(e) => setMessage(e.target.value)}
              disabled={!isAuthenticated()}
            />
            <button type="submit" disabled={!message.trim() || !isAuthenticated()}>
              <FiSend />
            </button>
          </form>

          {!isAuthenticated() && (
            <div className="login-prompt">
              Debes iniciar sesión para continuar. 😊
            </div>
          )}

        </div>
      ) : (
        <button className="chat-bubble" onClick={() => setIsOpen(true)}>
          <img src={SeaTgcLogo} alt="Chat" className="chat-logo" />
        </button>
      )}
    </div>
  );
};

export default ChatBubble;
