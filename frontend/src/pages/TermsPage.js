import React from 'react';
import { useNavigate } from 'react-router-dom';
import './StaticPages.css';

const TermsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="static-page" data-testid="terms-page">
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
          <h1>Terms of Service</h1>
          <p>Please read these terms carefully before using our services.</p>
        </div>
      </section>

      {/* Content */}
      <section className="page-content">
        <div className="container">
          <div className="content-section">
            <p className="last-updated">Last updated: February 24, 2026</p>

            <div className="policy-section">
              <h2>1. Acceptance of Terms</h2>
              <p>
                By accessing or using the House Sharing Seniors website and services, you agree to be 
                bound by these Terms of Service. If you do not agree to these terms, please do not use 
                our services.
              </p>
            </div>

            <div className="policy-section">
              <h2>2. Eligibility</h2>
              <p>To use our services, you must:</p>
              <ul>
                <li>Be an Australian Age Pensioner or meet our eligibility criteria</li>
                <li>Be at least 55 years of age</li>
                <li>Provide accurate and complete information during registration</li>
                <li>Be legally able to enter into contracts in Australia</li>
              </ul>
            </div>

            <div className="policy-section">
              <h2>3. Account Responsibilities</h2>
              <p>As a registered member, you are responsible for:</p>
              <ul>
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Keeping your profile information accurate and up-to-date</li>
                <li>Notifying us immediately of any unauthorized account access</li>
              </ul>
            </div>

            <div className="policy-section">
              <h2>4. Acceptable Use</h2>
              <p>You agree NOT to:</p>
              <ul>
                <li>Provide false, misleading, or inaccurate information</li>
                <li>Use the service for any illegal or unauthorized purpose</li>
                <li>Harass, abuse, or harm other members</li>
                <li>Share other members' personal information without consent</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Use automated systems or bots to access the service</li>
                <li>Interfere with the proper functioning of the website</li>
              </ul>
            </div>

            <div className="policy-section">
              <h2>5. House Sharing Arrangements</h2>
              <p>
                House Sharing Seniors facilitates connections between potential housemates but is not 
                a party to any housing arrangement between members. You acknowledge that:
              </p>
              <ul>
                <li>We do not guarantee compatibility between members</li>
                <li>Housing arrangements are private agreements between members</li>
                <li>We are not responsible for disputes between housemates</li>
                <li>You should conduct your own due diligence before entering any arrangement</li>
              </ul>
            </div>

            <div className="policy-section">
              <h2>6. Safety and Vetting</h2>
              <p>
                While we conduct safety checks on all members, including police checks and reference 
                verification, we cannot guarantee the conduct of any member. You should:
              </p>
              <ul>
                <li>Meet potential housemates in public places first</li>
                <li>Trust your instincts about potential matches</li>
                <li>Report any concerning behavior to our team immediately</li>
                <li>Never share financial information with other members</li>
              </ul>
            </div>

            <div className="policy-section">
              <h2>7. Fees and Payments</h2>
              <p>
                Our basic membership is currently free. We may introduce premium features or 
                subscription plans in the future, which will be clearly communicated to you 
                before any charges apply.
              </p>
            </div>

            <div className="policy-section">
              <h2>8. Termination</h2>
              <p>
                We reserve the right to suspend or terminate your account if you violate these 
                Terms of Service. You may also terminate your account at any time by contacting 
                our support team.
              </p>
            </div>

            <div className="policy-section">
              <h2>9. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by law, House Sharing Seniors and its affiliates 
                shall not be liable for any indirect, incidental, special, consequential, or 
                punitive damages arising from your use of our services.
              </p>
            </div>

            <div className="policy-section">
              <h2>10. Changes to Terms</h2>
              <p>
                We may update these Terms of Service from time to time. We will notify you of 
                significant changes via email or through the website. Continued use of our 
                services after changes constitutes acceptance of the new terms.
              </p>
            </div>

            <div className="policy-section">
              <h2>11. Governing Law</h2>
              <p>
                These Terms of Service are governed by the laws of New South Wales, Australia. 
                Any disputes shall be resolved in the courts of New South Wales.
              </p>
            </div>

            <div className="policy-section">
              <h2>12. Contact</h2>
              <p>
                For questions about these Terms of Service, please contact us at:
              </p>
              <ul>
                <li>Email: legal@housesharingseniors.com.au</li>
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
            <a href="/privacy">Privacy Policy</a> |
            <a href="/cookies">Cookie Policy</a> |
            <a href="/contact">Contact Us</a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default TermsPage;
