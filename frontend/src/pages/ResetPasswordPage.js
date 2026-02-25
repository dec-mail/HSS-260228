import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import './StaticPages.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await axios.post(`${API}/auth/reset-password`, { token, password });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="static-page" data-testid="reset-password-page">
        <header className="static-header">
          <div className="container">
            <div className="header-content">
              <img src="/logo.png" alt="House Sharing Seniors" className="logo-image" onClick={() => navigate('/')} style={{ cursor: 'pointer' }} />
            </div>
          </div>
        </header>
        <section className="page-content">
          <div className="container" style={{ maxWidth: '450px', textAlign: 'center', paddingTop: '60px' }}>
            <div style={{ background: '#fef2f2', border: '1px solid #ef4444', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
              <h3 style={{ color: '#b91c1c', margin: '0 0 8px 0' }}>Invalid Reset Link</h3>
              <p style={{ color: '#991b1b', margin: 0 }}>This password reset link is invalid. Please request a new one.</p>
            </div>
            <button onClick={() => navigate('/forgot-password')} className="btn btn-primary" style={{ padding: '14px 28px' }} data-testid="request-new-link-btn">
              Request New Reset Link
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="static-page" data-testid="reset-password-page">
      <header className="static-header">
        <div className="container">
          <div className="header-content">
            <img src="/logo.png" alt="House Sharing Seniors" className="logo-image" onClick={() => navigate('/')} style={{ cursor: 'pointer' }} />
          </div>
        </div>
      </header>

      <section className="page-hero">
        <div className="container">
          <h1>Reset Password</h1>
          <p>Enter your new password below</p>
        </div>
      </section>

      <section className="page-content">
        <div className="container" style={{ maxWidth: '450px' }}>
          <div className="content-section">
            {success ? (
              <div data-testid="reset-password-success">
                <div style={{ background: '#d1fae5', border: '1px solid #059669', borderRadius: '8px', padding: '20px', textAlign: 'center', marginBottom: '20px' }}>
                  <h3 style={{ color: '#065f46', margin: '0 0 8px 0' }}>Password Reset Successful</h3>
                  <p style={{ color: '#047857', margin: 0 }}>Your password has been updated. You can now login with your new password.</p>
                </div>
                <button
                  onClick={() => navigate('/login')}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '14px', fontSize: '16px' }}
                  data-testid="go-to-login-btn"
                >
                  Go to Login
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
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>New Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      placeholder="At least 6 characters"
                      style={{ width: '100%', padding: '12px', fontSize: '16px', border: '2px solid #e5e7eb', borderRadius: '8px', boxSizing: 'border-box' }}
                      data-testid="reset-password-input"
                    />
                  </div>

                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      placeholder="Re-enter your new password"
                      style={{ width: '100%', padding: '12px', fontSize: '16px', border: '2px solid #e5e7eb', borderRadius: '8px', boxSizing: 'border-box' }}
                      data-testid="reset-confirm-password-input"
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                    style={{ width: '100%', padding: '14px', fontSize: '16px' }}
                    data-testid="reset-submit-btn"
                  >
                    {loading ? 'Resetting...' : 'Reset Password'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default ResetPasswordPage;
