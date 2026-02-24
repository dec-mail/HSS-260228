import React from 'react';
import { useNavigate } from 'react-router-dom';
import './StaticPages.css';

const AboutPage = () => {
  const navigate = useNavigate();

  return (
    <div className="static-page" data-testid="about-page">
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
          <h1>About House Sharing Seniors</h1>
          <p>Helping Australian Age Pensioners reduce living costs through safe, vetted shared housing arrangements since 2024.</p>
        </div>
      </section>

      {/* Content */}
      <section className="page-content">
        <div className="container">
          {/* Mission */}
          <div className="content-section">
            <h2>Our Mission</h2>
            <p>
              House Sharing Seniors was founded with a simple but powerful mission: to help Australian 
              Age Pensioners live more affordably and less isolated by connecting them with compatible 
              housemates in safe, vetted shared living arrangements.
            </p>
            <p>
              We believe that everyone deserves a comfortable home, regardless of their financial situation. 
              By sharing housing costs, our members typically save 40-60% on rent, electricity, internet, 
              and other household expenses—while gaining companionship and community.
            </p>
          </div>

          {/* History */}
          <div className="content-section">
            <h2>Our Story</h2>
            <p>
              House Sharing Seniors began in 2024 when our founders noticed a growing problem: 
              many Australian seniors were struggling with rising housing costs while living alone 
              in homes that were too big for their needs.
            </p>
            <p>
              We developed a comprehensive vetting process and matching system that prioritizes 
              safety, compatibility, and respect. Today, we've helped hundreds of seniors find 
              affordable, companionable living situations across Australia.
            </p>
          </div>

          {/* Values */}
          <div className="content-section">
            <h2>Our Values</h2>
            <div className="values-grid">
              <div className="value-card">
                <div className="value-icon">🛡️</div>
                <h4>Safety First</h4>
                <p>All members are thoroughly vetted with police checks and references verified.</p>
              </div>
              <div className="value-card">
                <div className="value-icon">🤝</div>
                <h4>Respect & Dignity</h4>
                <p>We treat every member with the respect they deserve at every stage of life.</p>
              </div>
              <div className="value-card">
                <div className="value-icon">💰</div>
                <h4>Affordability</h4>
                <p>Our goal is to help seniors reduce costs without compromising on quality of life.</p>
              </div>
              <div className="value-card">
                <div className="value-icon">🏠</div>
                <h4>Community</h4>
                <p>We foster genuine connections and combat isolation through shared living.</p>
              </div>
            </div>
          </div>

          {/* Team */}
          <div className="content-section">
            <h2>Our Leadership Team</h2>
            <div className="team-grid">
              <div className="team-member">
                <div className="team-avatar">JM</div>
                <h4>Jane Mitchell</h4>
                <p className="role">Founder & CEO</p>
              </div>
              <div className="team-member">
                <div className="team-avatar">RP</div>
                <h4>Robert Patterson</h4>
                <p className="role">Head of Operations</p>
              </div>
              <div className="team-member">
                <div className="team-avatar">SW</div>
                <h4>Sarah Wong</h4>
                <p className="role">Community Manager</p>
              </div>
              <div className="team-member">
                <div className="team-avatar">DK</div>
                <h4>David Kelly</h4>
                <p className="role">Member Support Lead</p>
              </div>
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

export default AboutPage;
