import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ResumeApplication.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ResumeApplication = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleResume = async (e) => {
    e.preventDefault();
    
    if (!email.trim() || !accessCode.trim()) {
      setError('Please enter both email and access code');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axios.post(`${API}/applications/resume`, { 
        email, 
        access_code: accessCode.toUpperCase() 
      });
      
      // Navigate to form with saved data
      navigate('/apply/form', { 
        state: { 
          email, 
          access_code: accessCode.toUpperCase(),
          savedData: response.data.application,
          isNew: false 
        } 
      });
    } catch (err) {
      console.error('Failed to resume application:', err);
      setError('Invalid email or access code. Please check and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="resume-application">
      <div className="resume-container">
        <a href="/" className="back-home" data-testid="back-home-link">
          <span className="home-icon">🏠</span> Back to Home
        </a>

        <h1>Resume Your Application</h1>
        <p className="resume-subtitle">
          Enter the email and access code you received when you started your application.
        </p>

        <form onSubmit={handleResume} className="resume-form">
          <div className="form-group">
            <label className="input-label">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              className="input-field"
              placeholder="your.email@example.com"
              data-testid="email-input"
            />
          </div>

          <div className="form-group">
            <label className="input-label">Access Code</label>
            <input
              type="text"
              value={accessCode}
              onChange={(e) => {
                setAccessCode(e.target.value.toUpperCase());
                setError('');
              }}
              className="input-field"
              placeholder="E.G., ABC123"
              maxLength={6}
              data-testid="access-code-input"
            />
            <p className="field-hint">The 6-character code you received when you started your application.</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button 
            type="submit" 
            className="btn btn-primary btn-large" 
            disabled={isSubmitting}
            data-testid="continue-btn"
          >
            {isSubmitting ? 'Loading...' : 'Continue Application →'}
          </button>
        </form>

        <p className="start-link">
          Don't have an application yet?{' '}
          <a href="/apply" data-testid="start-link">Start a new one</a>
        </p>
      </div>
    </div>
  );
};

export default ResumeApplication;
