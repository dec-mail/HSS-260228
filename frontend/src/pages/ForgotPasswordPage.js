import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './StaticPages.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await axios.post(`${API}/auth/forgot-password`, { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="static-page" data-testid="forgot-password-page">
      <header className="static-header">
        <div className="container">
          <div className="header-content">
            <img src="/logo.png" alt="House Sharing Seniors" className="logo-image" onClick={() => navigate('/')} style={{ cursor: 'pointer' }} />
          </div>
        </div>
      </header>

      <section className="page-hero">
        <div className="container">
          <h1>Forgot Password</h1>
          <p>Enter your email to receive a password reset link</p>
        </div>
      </section>

      <section className="page-content">
        <div className="container" style={{ maxWidth: '450px' }}>
          <div className="content-section">
            {sent ? (
              <div data-testid="forgot-password-success">
                <div style={{ background: '#d1fae5', border: '1px solid #059669', borderRadius: '8px', padding: '20px', textAlign: 'center', marginBottom: '20px' }}>
                  <h3 style={{ color: '#065f46', margin: '0 0 8px 0' }}>Check Your Email</h3>
                  <p style={{ color: '#047857', margin: 0 }}>If an account exists with <strong>{email}</strong>, we've sent a password reset link. Please check your inbox and spam folder.</p>
                </div>
                <button
                  onClick={() => navigate('/login')}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '14px', fontSize: '16px' }}
                  data-testid="back-to-login-btn"
                >
                  Back to Login
                </button>
              </div>
            ) : (
              <>
                {error && (
                  <div style={{ background: '#fef2f2', border: '1px solid #ef4444', borderRadius: '8px', padding: '12px', color: '#b91c1c', marginBottom: '20px' }}>
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="Enter your registered email"
                      style={{ width: '100%', padding: '12px', fontSize: '16px', border: '2px solid #e5e7eb', borderRadius: '8px', boxSizing: 'border-box' }}
                      data-testid="forgot-email-input"
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                    style={{ width: '100%', padding: '14px', fontSize: '16px' }}
                    data-testid="forgot-submit-btn"
                  >
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #e5e7eb' }}>
                  <button
                    onClick={() => navigate('/login')}
                    style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: '600', cursor: 'pointer' }}
                    data-testid="back-to-login-link"
                  >
                    Back to Login
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default ForgotPasswordPage;
