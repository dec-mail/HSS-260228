import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './LandingPage.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LandingPage = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [carouselIndex, setCarouselIndex] = useState(0);

  useEffect(() => {
    axios.get(`${API}/properties`).then(res => setProperties(res.data)).catch(() => {});
  }, []);

  const visibleCount = 3;
  const maxIndex = Math.max(0, properties.length - visibleCount);

  const nextSlide = useCallback(() => {
    setCarouselIndex(i => i >= maxIndex ? 0 : i + 1);
  }, [maxIndex]);

  const prevSlide = () => {
    setCarouselIndex(i => i <= 0 ? maxIndex : i - 1);
  };

  useEffect(() => {
    if (properties.length <= visibleCount) return;
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [properties.length, nextSlide]);

  return (
    <div className="landing-page">
      {/* Header */}
      <header className="landing-header">
        <div className="container">
          <div className="header-content">
            <div className="logo">
              <img src="/logo.png" alt="House Sharing Seniors" className="logo-image" />
            </div>
            <nav className="header-nav">
              <button 
                className="btn btn-secondary" 
                onClick={() => navigate('/properties')}
                data-testid="browse-properties-btn"
                style={{ marginRight: '12px' }}
              >
                Browse Properties
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={() => navigate('/login')}
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
              Reduce Your Rent & <br />Living Costs Through <br />Shared Housing
            </h1>
            <p className="hero-subtitle" data-testid="hero-subtitle">
              Australian Age Pensioners reducing housing costs by 40-60% through <br />
              safe, vetted shared living arrangements. Cut rent, electricity bills, <br />
              and household expenses while living in a compatible community.
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

      {/* Property Carousel */}
      {properties.length > 0 && (
        <section className="property-carousel-section" data-testid="property-carousel">
          <div className="container">
            <h2 className="section-title">Available Properties</h2>
            <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '32px' }}>Browse our current shared housing options</p>
            <div className="carousel-wrapper">
              <button className="carousel-arrow carousel-prev" onClick={prevSlide} data-testid="carousel-prev">&lsaquo;</button>
              <div className="carousel-track-wrapper">
                <div className="carousel-track" style={{ transform: `translateX(-${carouselIndex * (100 / visibleCount)}%)` }}>
                  {properties.map((prop) => (
                    <div key={prop.property_id} className="carousel-card" onClick={() => navigate(`/properties/${prop.property_id}`)} data-testid={`carousel-card-${prop.property_id}`}>
                      <div className="carousel-card-image">
                        {prop.images && prop.images.length > 0 ? (
                          <img src={prop.images[0]} alt={prop.city} />
                        ) : (
                          <div className="carousel-placeholder">No Image</div>
                        )}
                      </div>
                      <div className="carousel-card-info">
                        <h3>{prop.address || `${prop.city}, ${prop.state}`}</h3>
                        <p className="carousel-location">{prop.city}, {prop.state} {prop.postcode || ''}</p>
                        <div className="carousel-price">${prop.weekly_rent_per_person}<span>/week per bedroom</span></div>
                        <div style={{ fontSize: '11px', color: '#059669' }}>
                          Maximum CRA:<br/>Singles ${Math.max(0, prop.weekly_rent_per_person - 71.80).toFixed(2)}<br/>Couples ${Math.max(0, prop.weekly_rent_per_person - 101.50).toFixed(2)}
                        </div>
                        <div className="carousel-meta">
                          {prop.available_bedrooms && <span>{prop.available_bedrooms} bed{prop.available_bedrooms > 1 ? 's' : ''} avail</span>}
                          {prop.property_type && <span>{prop.property_type}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <button className="carousel-arrow carousel-next" onClick={nextSlide} data-testid="carousel-next">&rsaquo;</button>
            </div>
            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <button className="btn btn-primary" onClick={() => navigate('/properties')} data-testid="view-all-properties-btn">
                View All Properties
              </button>
            </div>
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="how-it-works">
        <div className="container">
          <h2 className="section-title" data-testid="how-it-works-title">How It Works</h2>
          <div className="steps-grid">
            <div className="step-card" data-testid="step-1">
              <div className="step-number">1</div>
              <h3>Complete the Application</h3>
              <p>Fill out our detailed intake form about your needs, preferences, and lifestyle.</p>
            </div>
            <div className="step-card" data-testid="step-2">
              <div className="step-number">2</div>
              <h3>Admin Review</h3>
              <p>Our team reviews your application and may contact you for additional information.</p>
            </div>
            <div className="step-card" data-testid="step-3">
              <div className="step-number">3</div>
              <h3>Get Approved</h3>
              <p>Once approved, you'll receive a user account and can view potential housemates.</p>
            </div>
            <div className="step-card" data-testid="step-4">
              <div className="step-number">4</div>
              <h3>Find Your Match</h3>
              <p>Browse anonymised profiles and shortlist compatible housemates.</p>
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
          <h3 className="trust-title" data-testid="trust-title">Reduce Your Living Costs Today</h3>
          <p className="trust-text">
            Typical savings: 40-60% on rent, plus shared electricity, internet, and household expenses. <br />
            All arrangements are vetted and profiles verified for your security.
          </p>
          <div className="trust-badges">
            <div className="trust-badge" data-testid="trust-badge-1">
              <span className="badge-icon">💰</span>
              <span>Reduce Rent & Bills</span>
            </div>
            <div className="trust-badge" data-testid="trust-badge-2">
              <span className="badge-icon">✓</span>
              <span>Vetted & Verified</span>
            </div>
            <div className="trust-badge" data-testid="trust-badge-3">
              <span className="badge-icon">🏘</span>
              <span>Compatible Community</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-section">
              <h4>About</h4>
              <a href="/about">About Us</a>
              <a href="/contact">Contact</a>
              <a href="/faq">FAQ</a>
            </div>
            <div className="footer-section">
              <h4>Resources</h4>
              <a href="/support">Help & Support</a>
              <a href="/resources">Downloads</a>
              <a href="/sitemap">Sitemap</a>
            </div>
            <div className="footer-section">
              <h4>Legal</h4>
              <a href="/privacy">Privacy Policy</a>
              <a href="/terms">Terms of Service</a>
              <a href="/cookies">Cookie Policy</a>
            </div>
            <div className="footer-section">
              <h4>Contact</h4>
              <p>1800 HSS AUS (1800 477 287)</p>
              <p>info@housesharingseniors.com.au</p>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2026 House Sharing Seniors. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
