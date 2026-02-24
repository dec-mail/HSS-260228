import React from 'react';
import { useNavigate } from 'react-router-dom';
import './StaticPages.css';

const ResourcesPage = () => {
  const navigate = useNavigate();

  const resources = [
    {
      icon: "📋",
      title: "Application Checklist",
      description: "A complete checklist of everything you need to prepare before applying.",
      type: "PDF Guide",
      downloadUrl: "#"
    },
    {
      icon: "🏠",
      title: "Shared Living Guide",
      description: "Tips and best practices for successful shared living arrangements.",
      type: "PDF Guide",
      downloadUrl: "#"
    },
    {
      icon: "💰",
      title: "Budget Planning Template",
      description: "A spreadsheet to help you plan shared household expenses.",
      type: "Excel Template",
      downloadUrl: "#"
    },
    {
      icon: "📝",
      title: "Housemate Agreement Template",
      description: "A template agreement to establish ground rules with your housemates.",
      type: "Word Document",
      downloadUrl: "#"
    },
    {
      icon: "🔍",
      title: "Property Inspection Checklist",
      description: "What to look for when inspecting potential shared housing.",
      type: "PDF Checklist",
      downloadUrl: "#"
    },
    {
      icon: "🤝",
      title: "Communication Tips",
      description: "Guide to effective communication with potential and current housemates.",
      type: "PDF Guide",
      downloadUrl: "#"
    }
  ];

  const externalResources = [
    {
      title: "Centrelink - Age Pension",
      description: "Official information about the Australian Age Pension.",
      url: "https://www.servicesaustralia.gov.au/age-pension"
    },
    {
      title: "My Aged Care",
      description: "Government portal for aged care services in Australia.",
      url: "https://www.myagedcare.gov.au/"
    },
    {
      title: "Seniors.gov.au",
      description: "Australian Government portal for seniors.",
      url: "https://www.australia.gov.au/information-and-services/family-and-community/seniors"
    },
    {
      title: "Fair Trading - Renting",
      description: "Know your rights as a renter in Australia.",
      url: "https://www.fairtrading.nsw.gov.au/housing-and-property/renting"
    }
  ];

  return (
    <div className="static-page" data-testid="resources-page">
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
          <h1>Resources & Downloads</h1>
          <p>Helpful guides, templates, and tools to support your shared housing journey.</p>
        </div>
      </section>

      {/* Content */}
      <section className="page-content">
        <div className="container">
          {/* Downloadable Resources */}
          <div className="content-section">
            <h2>Free Downloads</h2>
            <div className="resources-grid">
              {resources.map((resource, index) => (
                <div className="resource-card" key={index} data-testid={`resource-${index}`}>
                  <div className="resource-icon">{resource.icon}</div>
                  <h4>{resource.title}</h4>
                  <p>{resource.description}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>{resource.type}</span>
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => alert('Download coming soon!')}
                    >
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* External Resources */}
          <div className="content-section">
            <h2>Helpful External Resources</h2>
            <p>Links to government services and information relevant to Australian seniors.</p>
            <div style={{ marginTop: '24px' }}>
              {externalResources.map((resource, index) => (
                <div 
                  key={index}
                  style={{ 
                    padding: '16px 20px', 
                    background: '#f8fafb', 
                    borderRadius: '8px', 
                    marginBottom: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '16px' }}>{resource.title}</h4>
                    <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>{resource.description}</p>
                  </div>
                  <a 
                    href={resource.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-secondary btn-sm"
                  >
                    Visit →
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Educational Content */}
          <div className="content-section">
            <h2>Educational Articles</h2>
            <p>Coming soon: Blog posts and articles about shared living, financial planning, and senior lifestyle.</p>
            <div style={{ textAlign: 'center', padding: '40px', background: '#f8fafb', borderRadius: '12px', marginTop: '24px' }}>
              <p style={{ fontSize: '48px', marginBottom: '16px' }}>📚</p>
              <p style={{ color: '#6b7280' }}>Stay tuned for helpful articles and tips!</p>
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

export default ResourcesPage;
