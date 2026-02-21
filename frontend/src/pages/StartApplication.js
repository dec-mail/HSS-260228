import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './StartApplication.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const StartApplication = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStart = async (e) => {
    e.preventDefault();
    
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    try {
      // Generate access code and create draft application
      const response = await axios.post(`${API}/applications/start`, { email });
      const { access_code } = response.data;
      
      // Navigate to application form with access code
      navigate('/apply/form', { state: { email, access_code, isNew: true } });
    } catch (err) {
      console.error('Failed to start application:', err);
      setError('Failed to start application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="start-application">
      <div className="start-container">
        <a href="/" className="back-home" data-testid="back-home-link">
          <span className="home-icon">🏠</span> Back to Home
        </a>

        <h1>Start Your Application</h1>
        <p className="start-subtitle">
          Enter your email to begin. We'll save your progress so you can continue anytime.
        </p>

        <form onSubmit={handleStart} className="start-form">
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
            {error && <span className="error-message">{error}</span>}
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-large" 
            disabled={isSubmitting}
            data-testid="continue-btn"
          >
            {isSubmitting ? 'Starting...' : 'Continue →'}
          </button>
        </form>

        <p className="resume-link">
          Already started an application?{' '}
          <a href="/apply/resume" data-testid="resume-link">Resume here</a>
        </p>
      </div>
    </div>
  );
};

export default StartApplication;
