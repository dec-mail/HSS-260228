import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './StaticPages.css';

const ContactPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // In production, this would send to backend
    console.log('Contact form submitted:', formData);
    setSubmitted(true);
  };

  return (
    <div className="static-page" data-testid="contact-page">
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
          <h1>Contact Us</h1>
          <p>Have questions? We're here to help. Reach out to our friendly team.</p>
        </div>
      </section>

      {/* Content */}
      <section className="page-content">
        <div className="container">
          {/* Contact Info */}
          <div className="content-section">
            <h2>Get In Touch</h2>
            <div className="contact-info-grid">
              <div className="contact-info-item">
                <span className="contact-icon">📞</span>
                <div>
                  <h4>Phone</h4>
                  <p>1800 HSS AUS (1800 477 287)</p>
                  <p>Mon-Fri 9am-5pm AEST</p>
                </div>
              </div>
              <div className="contact-info-item">
                <span className="contact-icon">✉️</span>
                <div>
                  <h4>Email</h4>
                  <p>info@housesharingseniors.com.au</p>
                  <p>We respond within 24 hours</p>
                </div>
              </div>
              <div className="contact-info-item">
                <span className="contact-icon">📍</span>
                <div>
                  <h4>Office Address</h4>
                  <p>Level 12, 100 George Street</p>
                  <p>Sydney NSW 2000</p>
                </div>
              </div>
              <div className="contact-info-item">
                <span className="contact-icon">🕐</span>
                <div>
                  <h4>Business Hours</h4>
                  <p>Monday - Friday: 9am - 5pm</p>
                  <p>Saturday: 10am - 2pm</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="content-section">
            <h2>Send Us a Message</h2>
            {submitted ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
                <h3>Thank You!</h3>
                <p>Your message has been sent. We'll get back to you within 24 hours.</p>
                <button className="btn btn-primary" onClick={() => setSubmitted(false)}>
                  Send Another Message
                </button>
              </div>
            ) : (
              <form className="contact-form" onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Your Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                      data-testid="contact-name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Email Address *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                      data-testid="contact-email"
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      data-testid="contact-phone"
                    />
                  </div>
                  <div className="form-group">
                    <label>Subject *</label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({...formData, subject: e.target.value})}
                      required
                      data-testid="contact-subject"
                    >
                      <option value="">Select a subject...</option>
                      <option value="application">Application Inquiry</option>
                      <option value="property">Property Inquiry</option>
                      <option value="membership">Membership Question</option>
                      <option value="technical">Technical Support</option>
                      <option value="feedback">Feedback</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Your Message *</label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    required
                    placeholder="How can we help you?"
                    data-testid="contact-message"
                  />
                </div>
                <button type="submit" className="btn btn-primary" data-testid="contact-submit">
                  Send Message
                </button>
              </form>
            )}
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
            <a href="/about">About Us</a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default ContactPage;
