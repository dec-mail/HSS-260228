import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      {/* Header */}
      <header className="landing-header">
        <div className="container">
          <div className="header-content">
            <div className="logo">
              <h2>House Sharing Seniors</h2>
            </div>
            <nav className="header-nav">
              <button 
                className="btn btn-secondary" 
                onClick={() => {
                  // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
                  const redirectUrl = window.location.origin + '/dashboard';
                  window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
                }}
                data-testid="header-login-btn"
              >
                Login
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title" data-testid="hero-title">
              Safe, Affordable & <br />Companionable Housing <br />for Age Pensioners
            </h1>
            <p className="hero-subtitle" data-testid="hero-subtitle">
              Connect with like-minded Australian Age Pensioners for <br />
              trusted house-sharing arrangements. Combat isolation, <br />
              reduce housing costs, and find your ideal housemate.
            </p>
            <div className="hero-cta">
              <button 
                className="btn btn-primary btn-large" 
                onClick={() => navigate('/apply')}
                data-testid="get-started-btn"
              >
                Start Your Application
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <div className="container">
          <h2 className="section-title" data-testid="how-it-works-title">How It Works</h2>
          <div className="steps-grid">
            <div className="step-card" data-testid="step-1">
              <div className="step-number">1</div>
              <h3>Apply Online</h3>
              <p>Complete a simple, guided application form sharing your details, preferences, and what you're looking for in a housemate.</p>
            </div>
            <div className="step-card" data-testid="step-2">
              <div className="step-number">2</div>
              <h3>We Review</h3>
              <p>Our team carefully reviews each application to ensure safety and suitability for the House Sharing Seniors community.</p>
            </div>
            <div className="step-card" data-testid="step-3">
              <div className="step-number">3</div>
              <h3>Get Approved</h3>
              <p>Once approved, you'll receive access to our platform to view profiles of other verified Age Pensioners.</p>
            </div>
            <div className="step-card" data-testid="step-4">
              <div className="step-number">4</div>
              <h3>Find Your Match</h3>
              <p>Browse anonymized profiles, shortlist potential housemates, and connect with people who share your lifestyle and values.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pre-qualification */}
      <section className="prequalification">
        <div className="container">
          <div className="prequalification-box">
            <h2 data-testid="prequalification-title">Are You Eligible?</h2>
            <p>To apply for House Sharing Seniors, you must:</p>
            <ul className="eligibility-list">
              <li data-testid="eligibility-item-1">✓ Be an Australian Age Pensioner</li>
              <li data-testid="eligibility-item-2">✓ Be seeking shared housing in Australia</li>
              <li data-testid="eligibility-item-3">✓ Be committed to respectful co-living</li>
            </ul>
            <button 
              className="btn btn-primary btn-large" 
              onClick={() => navigate('/apply')}
              data-testid="apply-now-btn"
            >
              Apply Now
            </button>
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="trust-signals">
        <div className="container">
          <h3 className="trust-title" data-testid="trust-title">Your Privacy & Safety Matter</h3>
          <p className="trust-text">
            We take your privacy seriously. All applications are confidential, <br />
            and profiles are anonymized until you choose to connect.
          </p>
          <div className="trust-badges">
            <div className="trust-badge" data-testid="trust-badge-1">
              <span className="badge-icon">🔒</span>
              <span>Secure & Private</span>
            </div>
            <div className="trust-badge" data-testid="trust-badge-2">
              <span className="badge-icon">✓</span>
              <span>Verified Members</span>
            </div>
            <div className="trust-badge" data-testid="trust-badge-3">
              <span className="badge-icon">👥</span>
              <span>Community Focused</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="container">
          <p>&copy; 2026 House Sharing Seniors. All rights reserved.</p>
          <p className="footer-links">
            <a href="#privacy">Privacy Policy</a> | <a href="#terms">Terms of Service</a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
