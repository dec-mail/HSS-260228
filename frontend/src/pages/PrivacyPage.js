import React from 'react';
import { useNavigate } from 'react-router-dom';
import './StaticPages.css';

const PrivacyPage = () => {
  const navigate = useNavigate();

  return (
    <div className="static-page" data-testid="privacy-page">
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
          <h1>Privacy Policy</h1>
          <p>How we collect, use, and protect your personal information.</p>
        </div>
      </section>

      {/* Content */}
      <section className="page-content">
        <div className="container">
          <div className="content-section">
            <p className="last-updated">Last updated: February 24, 2026</p>

            <div className="policy-section">
              <h2>1. Information We Collect</h2>
              <h3>Personal Information</h3>
              <p>When you apply to become a member or use our services, we collect:</p>
              <ul>
                <li>Name, email address, phone number, and date of birth</li>
                <li>Current residential address</li>
                <li>Financial information (income sources, budget preferences)</li>
                <li>Lifestyle preferences and housing requirements</li>
                <li>Photos (optional, for profile purposes)</li>
              </ul>

              <h3>Automatically Collected Information</h3>
              <p>When you visit our website, we automatically collect:</p>
              <ul>
                <li>IP address and browser type</li>
                <li>Device information</li>
                <li>Pages visited and time spent on site</li>
                <li>Referring website</li>
              </ul>
            </div>

            <div className="policy-section">
              <h2>2. How We Use Your Information</h2>
              <p>We use your personal information to:</p>
              <ul>
                <li>Process and manage your membership application</li>
                <li>Match you with compatible housemates and properties</li>
                <li>Communicate with you about your application status and opportunities</li>
                <li>Verify your identity and conduct safety checks</li>
                <li>Improve our services and user experience</li>
                <li>Comply with legal obligations</li>
              </ul>
            </div>

            <div className="policy-section">
              <h2>3. Information Sharing</h2>
              <p>We may share your information with:</p>
              <ul>
                <li><strong>Other Members:</strong> Limited profile information to facilitate matches (never financial details)</li>
                <li><strong>Service Providers:</strong> Third parties who assist in operating our services</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
              </ul>
              <p>We never sell your personal information to third parties for marketing purposes.</p>
            </div>

            <div className="policy-section">
              <h2>4. Data Security</h2>
              <p>
                We implement industry-standard security measures to protect your information, including:
              </p>
              <ul>
                <li>SSL encryption for all data transmission</li>
                <li>Secure servers with restricted access</li>
                <li>Regular security audits and updates</li>
                <li>Staff training on data protection</li>
              </ul>
            </div>

            <div className="policy-section">
              <h2>5. Your Rights</h2>
              <p>Under Australian Privacy Law, you have the right to:</p>
              <ul>
                <li>Access the personal information we hold about you</li>
                <li>Request correction of inaccurate information</li>
                <li>Request deletion of your information</li>
                <li>Opt-out of marketing communications</li>
                <li>Lodge a complaint with the OAIC if you believe we've breached privacy laws</li>
              </ul>
            </div>

            <div className="policy-section">
              <h2>6. Cookies</h2>
              <p>
                We use cookies to improve your experience on our website. See our 
                <a href="/cookies" style={{ color: '#2563eb' }}> Cookie Policy</a> for more details.
              </p>
            </div>

            <div className="policy-section">
              <h2>7. Contact Us</h2>
              <p>
                If you have questions about this Privacy Policy or wish to exercise your rights, 
                please contact our Privacy Officer at:
              </p>
              <ul>
                <li>Email: privacy@housesharingseniors.com.au</li>
                <li>Phone: 1800 HSS AUS (1800 477 287)</li>
                <li>Mail: Level 12, 100 George Street, Sydney NSW 2000</li>
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
            <a href="/terms">Terms of Service</a> |
            <a href="/cookies">Cookie Policy</a> |
            <a href="/contact">Contact Us</a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPage;
