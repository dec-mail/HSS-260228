import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './StaticPages.css';

const NotFoundPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    // In production, this would navigate to a search results page
    navigate(`/properties?search=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <div className="error-page" data-testid="not-found-page">
      <div className="error-content">
        <div className="error-code">404</div>
        <h1>Page Not Found</h1>
        <p>
          Oops! The page you're looking for doesn't exist or has been moved. 
          Don't worry, let's get you back on track.
        </p>
        
        <div className="error-actions">
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Go Home
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/properties')}>
            Browse Properties
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/contact')}>
            Contact Us
          </button>
        </div>

        <form className="error-search" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search for properties..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="404-search"
          />
          <button type="submit" className="btn btn-primary">
            Search
          </button>
        </form>

        <div style={{ marginTop: '40px' }}>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>
            Popular pages: 
            <a href="/" style={{ color: '#2563eb', marginLeft: '8px' }}>Home</a> • 
            <a href="/apply" style={{ color: '#2563eb', marginLeft: '8px' }}>Apply</a> • 
            <a href="/faq" style={{ color: '#2563eb', marginLeft: '8px' }}>FAQ</a> • 
            <a href="/support" style={{ color: '#2563eb', marginLeft: '8px' }}>Support</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
