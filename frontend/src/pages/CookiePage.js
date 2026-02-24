import React from 'react';
import { useNavigate } from 'react-router-dom';
import './StaticPages.css';

const CookiePage = () => {
  const navigate = useNavigate();

  return (
    <div className="static-page" data-testid="cookie-page">
      {/* Header */}
      <header className="static-header">
        <div className="container">
          <div className="header-content">
            <img 
              src="/logo.png" 
              alt="House Sharing Seniors" 
              className="logo-image" 
              onClick={() => navigate('/')}
            />
            <nav>
              <button className="btn btn-secondary" onClick={() => navigate('/properties')}>
                Browse Properties
              </button>
              <button className="btn btn-primary" onClick={() => navigate('/apply')}>
                Apply Now
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="page-hero">
        <div className="container">
          <h1>Cookie Policy</h1>
          <p>Information about how we use cookies on our website.</p>
        </div>
      </section>

      {/* Content */}
      <section className="page-content">
        <div className="container">
          <div className="content-section">
            <p className="last-updated">Last updated: February 24, 2026</p>

            <div className="policy-section">
              <h2>What Are Cookies?</h2>
              <p>
                Cookies are small text files that are stored on your device when you visit a website. 
                They help websites remember your preferences and improve your browsing experience.
              </p>
            </div>

            <div className="policy-section">
              <h2>Types of Cookies We Use</h2>
              
              <h3>Essential Cookies</h3>
              <p>
                These cookies are necessary for the website to function properly. They enable core 
                functionality such as security, network management, and account authentication.
              </p>
              <ul>
                <li><strong>session_id:</strong> Maintains your login session</li>
                <li><strong>csrf_token:</strong> Protects against cross-site request forgery</li>
              </ul>

              <h3>Functional Cookies</h3>
              <p>
                These cookies enable enhanced functionality and personalization, such as remembering 
                your preferences and settings.
              </p>
              <ul>
                <li><strong>language_preference:</strong> Remembers your language setting</li>
                <li><strong>accessibility_settings:</strong> Stores accessibility preferences</li>
              </ul>

              <h3>Analytics Cookies</h3>
              <p>
                These cookies help us understand how visitors interact with our website, helping us 
                improve our services.
              </p>
              <ul>
                <li><strong>_ga:</strong> Google Analytics - tracks unique visitors</li>
                <li><strong>_gid:</strong> Google Analytics - distinguishes users</li>
              </ul>
            </div>

            <div className="policy-section">
              <h2>Third-Party Cookies</h2>
              <p>We use services from third parties that may set their own cookies:</p>
              <ul>
                <li><strong>Google Analytics:</strong> Website usage analysis</li>
                <li><strong>Google OAuth:</strong> Login authentication</li>
              </ul>
            </div>

            <div className="policy-section">
              <h2>Managing Cookies</h2>
              <p>
                You can control and manage cookies in several ways:
              </p>
              <h3>Browser Settings</h3>
              <p>
                Most browsers allow you to view, manage, and delete cookies. Here's how to access 
                cookie settings in popular browsers:
              </p>
              <ul>
                <li><strong>Chrome:</strong> Settings → Privacy and security → Cookies</li>
                <li><strong>Firefox:</strong> Options → Privacy & Security → Cookies</li>
                <li><strong>Safari:</strong> Preferences → Privacy → Cookies</li>
                <li><strong>Edge:</strong> Settings → Cookies and site permissions</li>
              </ul>

              <h3>Opt-Out Tools</h3>
              <p>
                You can opt out of Google Analytics by installing the 
                <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}> Google Analytics Opt-out Browser Add-on</a>.
              </p>
            </div>

            <div className="policy-section">
              <h2>Impact of Disabling Cookies</h2>
              <p>
                Please note that disabling certain cookies may affect the functionality of our website:
              </p>
              <ul>
                <li>You may not be able to log in to your account</li>
                <li>Your preferences may not be saved</li>
                <li>Some features may not work correctly</li>
              </ul>
            </div>

            <div className="policy-section">
              <h2>Contact Us</h2>
              <p>
                If you have questions about our use of cookies, please contact us at:
              </p>
              <ul>
                <li>Email: privacy@housesharingseniors.com.au</li>
                <li>Phone: 1800 HSS AUS (1800 477 287)</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="static-footer">
        <div className="container">
          <p>&copy; 2026 House Sharing Seniors. All rights reserved.</p>
          <p className="footer-links">
            <a href="/privacy">Privacy Policy</a> |
            <a href="/terms">Terms of Service</a> |
            <a href="/contact">Contact Us</a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default CookiePage;
