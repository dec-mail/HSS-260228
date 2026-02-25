import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './StaticPages.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LoginPage = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin 
        ? { email: formData.email, password: formData.password }
        : { email: formData.email, password: formData.password, name: formData.name };
      
      const response = await axios.post(`${API}${endpoint}`, payload, { withCredentials: true });
      
      // Store token in localStorage as backup
      if (response.data.token) {
        localStorage.setItem('auth_token', response.data.token);
      }
      
      // Redirect based on role
      if (response.data.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="static-page" data-testid="login-page">
      <header className="static-header">
        <div className="container">
          <div className="header-content">
            <img src="/logo.png" alt="House Sharing Seniors" className="logo-image" onClick={() => navigate('/')} />
          </div>
        </div>
      </header>

      <section className="page-hero">
        <div className="container">
          <h1>{isLogin ? 'Login' : 'Create Account'}</h1>
          <p>{isLogin ? 'Welcome back!' : 'Join House Sharing Seniors'}</p>
        </div>
      </section>

      <section className="page-content">
        <div className="container" style={{ maxWidth: '450px' }}>
          <div className="content-section">
            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #ef4444', borderRadius: '8px', padding: '12px', color: '#b91c1c', marginBottom: '20px' }}>
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              {!isLogin && (
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required={!isLogin}
                    style={{ width: '100%', padding: '12px', fontSize: '16px', border: '2px solid #e5e7eb', borderRadius: '8px' }}
                    data-testid="register-name"
                  />
                </div>
              )}
              
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                  style={{ width: '100%', padding: '12px', fontSize: '16px', border: '2px solid #e5e7eb', borderRadius: '8px' }}
                  data-testid="login-email"
                />
              </div>
              
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                  minLength={6}
                  style={{ width: '100%', padding: '12px', fontSize: '16px', border: '2px solid #e5e7eb', borderRadius: '8px' }}
                  data-testid="login-password"
                />
              </div>
              
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={loading}
                style={{ width: '100%', padding: '14px', fontSize: '16px' }}
                data-testid="login-submit"
              >
                {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Create Account')}
              </button>
            </form>
            
            {isLogin && (
              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <button
                  onClick={() => navigate('/forgot-password')}
                  style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '14px', textDecoration: 'underline' }}
                  data-testid="forgot-password-link"
                >
                  Forgot your password?
                </button>
              </div>
            )}

            {!isLogin && (
              <div style={{ background: '#eff6ff', border: '1px solid #3b82f6', borderRadius: '8px', padding: '12px', marginTop: '16px', fontSize: '14px', color: '#1e40af' }}>
                <strong>Note:</strong> Registration is only available for applicants whose application has been approved. If you haven't applied yet, please <a href="/apply" style={{ color: '#2563eb', fontWeight: '600' }}>submit an application</a> first.
              </div>
            )}

            <div style={{ textAlign: 'center', marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #e5e7eb' }}>
              <p style={{ color: '#6b7280' }}>
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                <button 
                  onClick={() => { setIsLogin(!isLogin); setError(null); }}
                  style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: '600', cursor: 'pointer', marginLeft: '8px' }}
                >
                  {isLogin ? 'Register' : 'Login'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LoginPage;
