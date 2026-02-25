import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './StaticPages.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MemberProfilePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  const getAuthConfig = () => {
    const token = localStorage.getItem('auth_token');
    return { withCredentials: true, headers: token ? { Authorization: `Bearer ${token}` } : {} };
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [meRes, profileRes] = await Promise.all([
          axios.get(`${API}/auth/me`, getAuthConfig()).catch(() => null),
          axios.get(`${API}/members/${userId}`, getAuthConfig())
        ]);
        if (meRes) setCurrentUser(meRes.data);
        setProfile(profileRes.data);
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  const startMessage = () => {
    navigate('/dashboard');
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('startMessage', { detail: { userId: profile.user_id, name: profile.name } }));
    }, 500);
  };

  if (loading) return <div className="static-page"><div className="container" style={{ padding: '60px 0', textAlign: 'center' }}>Loading...</div></div>;
  if (!profile) return <div className="static-page"><div className="container" style={{ padding: '60px 0', textAlign: 'center' }}>Member not found</div></div>;

  const infoItems = [
    { label: 'Location', value: profile.location },
    { label: 'Housing Preference', value: profile.housing_type?.replace(/_/g, ' ') },
    { label: 'Preferred Location', value: profile.preferred_location },
    { label: 'Preferred Age Range', value: profile.preferred_age_range },
    { label: 'Weekly Budget', value: profile.weekly_budget ? `$${profile.weekly_budget}` : null },
    { label: 'Mobility', value: profile.mobility_level?.replace(/_/g, ' ') },
    { label: 'Smoker', value: profile.is_smoker !== undefined ? (profile.is_smoker ? 'Yes' : 'No') : null },
    { label: 'Has Pets', value: profile.has_pets !== undefined ? (profile.has_pets ? 'Yes' : 'No') : null },
    { label: 'Dietary Preferences', value: profile.dietary_preferences },
  ].filter(item => item.value);

  return (
    <div className="static-page" data-testid="member-profile-page">
      <header className="static-header">
        <div className="container">
          <div className="header-content">
            <img src="/logo.png" alt="House Sharing Seniors" className="logo-image" onClick={() => navigate('/')} style={{ cursor: 'pointer' }} />
          </div>
        </div>
      </header>

      <section className="page-content" style={{ paddingTop: '40px' }}>
        <div className="container" style={{ maxWidth: '700px' }}>
          <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '14px', marginBottom: '20px' }} data-testid="back-to-dashboard">
            &larr; Back to Dashboard
          </button>

          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: '700', color: '#6b7280', flexShrink: 0 }}>
                {profile.name?.charAt(0) || 'M'}
              </div>
              <div>
                <h1 style={{ margin: '0 0 4px 0', fontSize: '24px', color: '#1a2332' }} data-testid="profile-name">{profile.name}</h1>
                <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
                  Member since {new Date(profile.created_at).toLocaleDateString()}
                  {profile.location && ` · ${profile.location}`}
                </p>
              </div>
            </div>

            {/* Actions */}
            {currentUser && currentUser.user_id !== profile.user_id && (
              <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                <button className="btn btn-primary" onClick={startMessage} data-testid="profile-message-btn">
                  Send Message
                </button>
              </div>
            )}

            {/* Interests */}
            {profile.interests && (
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#1a2332' }}>Interests</h3>
                <p style={{ margin: 0, color: '#4b5563', lineHeight: '1.6' }}>{profile.interests}</p>
              </div>
            )}

            {/* Daily Routine */}
            {profile.daily_routine && (
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#1a2332' }}>Daily Routine</h3>
                <p style={{ margin: 0, color: '#4b5563', lineHeight: '1.6' }}>{profile.daily_routine}</p>
              </div>
            )}

            {/* Details Grid */}
            {infoItems.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#1a2332' }}>Details</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {infoItems.map(item => (
                    <div key={item.label} style={{ background: '#f9fafb', borderRadius: '8px', padding: '12px' }}>
                      <div style={{ fontSize: '12px', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '4px' }}>{item.label}</div>
                      <div style={{ fontSize: '14px', color: '#1a2332', fontWeight: '600' }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default MemberProfilePage;
