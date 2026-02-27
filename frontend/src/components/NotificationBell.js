import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const getAuthConfig = () => {
  const token = localStorage.getItem('auth_token');
  return { withCredentials: true, headers: token ? { Authorization: `Bearer ${token}` } : {} };
};

const NotificationBell = () => {
  const [count, setCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const fetchCount = async () => {
    try {
      const res = await axios.get(`${API}/notifications/unread/count`, getAuthConfig());
      setCount(res.data.count);
    } catch (e) { /* silent */ }
  };

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${API}/notifications?limit=15`, getAuthConfig());
      setNotifications(res.data);
    } catch (e) { /* silent */ }
  };

  const markAllRead = async () => {
    try {
      await axios.post(`${API}/notifications/read-all`, {}, getAuthConfig());
      setCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (e) { /* silent */ }
  };

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (open) fetchNotifications();
  }, [open]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const typeIcons = {
    group_join: 'fa-user-plus',
    group_application: 'fa-file-alt',
    group_application_status: 'fa-check-circle',
    new_message: 'fa-envelope',
    group_invite: 'fa-paper-plane'
  };

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }} data-testid="notification-bell-container">
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: 'none', border: '2px solid #e5e7eb', borderRadius: '8px',
          padding: '6px 10px', cursor: 'pointer', position: 'relative', fontSize: '18px', color: '#4b5563'
        }}
        data-testid="notification-bell-btn"
      >
        <i className="fa fa-bell" />
        {count > 0 && (
          <span style={{
            position: 'absolute', top: '-6px', right: '-6px', background: '#ef4444', color: 'white',
            borderRadius: '10px', padding: '1px 6px', fontSize: '11px', fontWeight: '700', minWidth: '18px', textAlign: 'center'
          }} data-testid="notification-count">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: '8px', width: '340px',
          background: 'white', borderRadius: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
          border: '1px solid #e5e7eb', zIndex: 1000, overflow: 'hidden'
        }} data-testid="notification-dropdown">
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 16px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb'
          }}>
            <strong style={{ fontSize: '14px', color: '#1a2332' }}>Notifications</strong>
            {count > 0 && (
              <button onClick={markAllRead} style={{
                background: 'none', border: 'none', color: '#2563eb', fontSize: '12px',
                cursor: 'pointer', fontWeight: '600'
              }} data-testid="mark-all-read-btn">
                Mark all read
              </button>
            )}
          </div>
          <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
                No notifications yet
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.notification_id}
                  style={{
                    padding: '12px 16px', borderBottom: '1px solid #f3f4f6', cursor: 'pointer',
                    background: n.read ? 'white' : '#eff6ff',
                    transition: 'background 0.15s'
                  }}
                  onClick={() => {
                    if (n.link) window.location.href = n.link;
                    if (!n.read) {
                      axios.patch(`${API}/notifications/${n.notification_id}/read`, {}, getAuthConfig());
                      setNotifications(prev => prev.map(x => x.notification_id === n.notification_id ? { ...x, read: true } : x));
                      setCount(c => Math.max(0, c - 1));
                    }
                  }}
                  data-testid={`notification-item-${n.notification_id}`}
                >
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <i className={`fa ${typeIcons[n.type] || 'fa-bell'}`} style={{ color: '#2563eb', marginTop: '3px', fontSize: '14px' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: n.read ? '400' : '600', color: '#1a2332' }}>
                        {n.title}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{n.message}</div>
                      <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                        {new Date(n.created_at).toLocaleString()}
                      </div>
                    </div>
                    {!n.read && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563eb', marginTop: '4px', flexShrink: 0 }} />}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
