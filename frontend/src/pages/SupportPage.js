import React from 'react';
import { useNavigate } from 'react-router-dom';
import './StaticPages.css';

const SupportPage = () => {
  const navigate = useNavigate();

  const supportCategories = [
    {
      icon: "🚀",
      title: "Getting Started",
      description: "New to House Sharing Seniors? Learn how to apply and get started.",
      link: "/faq"
    },
    {
      icon: "👤",
      title: "Account Help",
      description: "Manage your profile, update preferences, or reset your password.",
      link: "/contact"
    },
    {
      icon: "🏠",
      title: "Property Questions",
      description: "Help with browsing properties or listing your own property.",
      link: "/faq"
    },
    {
      icon: "🤝",
      title: "Finding Housemates",
      description: "Tips for finding compatible housemates and making connections.",
      link: "/faq"
    },
    {
      icon: "🔒",
      title: "Safety & Security",
      description: "Learn about our safety measures and how to stay secure.",
      link: "/faq"
    },
    {
      icon: "💬",
      title: "Contact Support",
      description: "Can't find your answer? Talk to our friendly support team.",
      link: "/contact"
    }
  ];

  return (
    <div className="static-page" data-testid="support-page">
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
          <h1>Help & Support</h1>
          <p>We're here to help you every step of the way.</p>
        </div>
      </section>

      {/* Content */}
      <section className="page-content">
        <div className="container">
          {/* Support Categories */}
          <div className="content-section">
            <h2>How Can We Help?</h2>
            <div className="support-categories">
              {supportCategories.map((category, index) => (
                <div 
                  className="support-category" 
                  key={index}
                  onClick={() => navigate(category.link)}
                  data-testid={`support-category-${index}`}
                >
                  <div className="support-category-icon">{category.icon}</div>
                  <h4>{category.title}</h4>
                  <p>{category.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="content-section">
            <h2>Quick Links</h2>
            <ul>
              <li><a href="/faq" style={{ color: '#2563eb' }}>Frequently Asked Questions</a></li>
              <li><a href="/about" style={{ color: '#2563eb' }}>About House Sharing Seniors</a></li>
              <li><a href="/privacy" style={{ color: '#2563eb' }}>Privacy Policy</a></li>
              <li><a href="/terms" style={{ color: '#2563eb' }}>Terms of Service</a></li>
              <li><a href="/resources" style={{ color: '#2563eb' }}>Resources & Downloads</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="content-section">
            <h2>Contact Our Support Team</h2>
            <div className="contact-info-grid">
              <div className="contact-info-item">
                <span className="contact-icon">📞</span>
                <div>
                  <h4>Phone Support</h4>
                  <p>1800 HSS AUS (1800 477 287)</p>
                  <p>Mon-Fri 9am-5pm, Sat 10am-2pm</p>
                </div>
              </div>
              <div className="contact-info-item">
                <span className="contact-icon">✉️</span>
                <div>
                  <h4>Email Support</h4>
                  <p>support@housesharingseniors.com.au</p>
                  <p>We respond within 24 hours</p>
                </div>
              </div>
            </div>
          </div>

          {/* Emergency */}
          <div className="content-section" style={{ background: '#fef3c7', borderLeft: '4px solid #f59e0b' }}>
            <h2 style={{ borderBottom: 'none', paddingBottom: 0 }}>Emergency Contacts</h2>
            <p>
              <strong>If you feel unsafe or in danger, please contact emergency services:</strong>
            </p>
            <ul>
              <li><strong>Emergency:</strong> 000</li>
              <li><strong>Police Non-Emergency:</strong> 131 444</li>
              <li><strong>Lifeline:</strong> 13 11 14</li>
            </ul>
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

export default SupportPage;
