import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const getAuthConfig = () => {
  const token = localStorage.getItem('auth_token');
  return { withCredentials: true, headers: token ? { Authorization: `Bearer ${token}` } : {} };
};

const ChatBox = ({ channelType, channelId, currentUser, title, height = '400px' }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const pollRef = useRef(null);

  const fetchMessages = async () => {
    try {
      const url = channelType === 'community'
        ? `${API}/chat/community`
        : `${API}/chat/group/${channelId}`;
      const config = channelType === 'community' ? {} : getAuthConfig();
      const res = await axios.get(url, config);
      setMessages(res.data);
    } catch (e) { /* silent */ }
  };

  useEffect(() => {
    fetchMessages();
    pollRef.current = setInterval(fetchMessages, 5000);
    return () => clearInterval(pollRef.current);
  }, [channelType, channelId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      const url = channelType === 'community'
        ? `${API}/chat/community`
        : `${API}/chat/group/${channelId}`;
      await axios.post(url, { content: input.trim() }, getAuthConfig());
      setInput('');
      fetchMessages();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height, background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }} data-testid={`chatbox-${channelType}-${channelId}`}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', fontWeight: '700', color: '#1a2332', fontSize: '15px', background: '#f9fafb' }}>
        {title}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#9ca3af', padding: '32px 0', fontSize: '14px' }}>
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map(msg => {
            const isMe = msg.user_id === currentUser?.user_id;
            return (
              <div key={msg.message_id} style={{ marginBottom: '10px', display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                {!isMe && <span style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px', fontWeight: '600' }}>{msg.user_name}</span>}
                <div style={{
                  maxWidth: '75%', padding: '8px 14px', borderRadius: '12px',
                  background: isMe ? '#2563eb' : '#f3f4f6',
                  color: isMe ? '#fff' : '#1a2332', fontSize: '14px', lineHeight: '1.4'
                }} data-testid={`chat-msg-${msg.message_id}`}>
                  {msg.content}
                </div>
                <span style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px' }}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
      {currentUser ? (
        <form onSubmit={handleSend} style={{ display: 'flex', gap: '8px', padding: '10px 12px', borderTop: '1px solid #e5e7eb', background: '#f9fafb' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            style={{ flex: 1, padding: '9px 14px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
            data-testid={`chat-input-${channelType}-${channelId}`}
          />
          <button type="submit" disabled={sending || !input.trim()} style={{
            padding: '9px 18px', background: '#2563eb', color: '#fff', border: 'none',
            borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px',
            opacity: sending || !input.trim() ? 0.5 : 1
          }} data-testid={`chat-send-${channelType}-${channelId}`}>
            Send
          </button>
        </form>
      ) : (
        <div style={{ padding: '12px 16px', borderTop: '1px solid #e5e7eb', textAlign: 'center', color: '#6b7280', fontSize: '14px', background: '#f9fafb' }}>
          <a href="/login" style={{ color: '#2563eb', fontWeight: '600' }}>Log in</a> to join the conversation
        </div>
      )}
    </div>
  );
};

export default ChatBox;
