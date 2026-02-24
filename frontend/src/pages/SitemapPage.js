import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './StaticPages.css';

const SitemapPage = () => {
  const navigate = useNavigate();

  const siteStructure = [
    {
      title: "Main Pages",
      links: [
        { name: "Home", path: "/" },
        { name: "About Us", path: "/about" },
        { name: "Contact Us", path: "/contact" },
        { name: "FAQ", path: "/faq" },
        { name: "Support / Help", path: "/support" }
      ]
    },
    {
      title: "Properties",
      links: [
        { name: "Browse Properties", path: "/properties" },
        { name: "Add Property", path: "/properties/add", auth: true }
      ]
    },
    {
      title: "Application",
      links: [
        { name: "Start Application", path: "/apply" },
        { name: "Resume Application", path: "/apply/resume" }
      ]
    },
    {
      title: "Member Area",
      links: [
        { name: "Member Dashboard", path: "/dashboard", auth: true },
        { name: "Admin Dashboard", path: "/admin", auth: true }
      ]
    },
    {
      title: "Resources",
      links: [
        { name: "Resources & Downloads", path: "/resources" }
      ]
    },
    {
      title: "Legal",
      links: [
        { name: "Privacy Policy", path: "/privacy" },
        { name: "Terms of Service", path: "/terms" },
        { name: "Cookie Policy", path: "/cookies" }
      ]
    }
  ];

  return (
    <div className="static-page" data-testid="sitemap-page">
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
          <h1>Sitemap</h1>
          <p>A complete overview of all pages on our website.</p>
        </div>
      </section>

      {/* Content */}
      <section className="page-content">
        <div className="container">
          <div className="content-section">
            <h2>All Pages</h2>
            <div className="sitemap-grid">
              {siteStructure.map((section, index) => (
                <div className="sitemap-section" key={index}>
                  <h3>{section.title}</h3>
                  <ul>
                    {section.links.map((link, linkIndex) => (
                      <li key={linkIndex}>
                        <Link to={link.path}>
                          {link.name}
                          {link.auth && <span style={{ fontSize: '10px', color: '#6b7280' }}> (Login required)</span>}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
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

export default SitemapPage;
