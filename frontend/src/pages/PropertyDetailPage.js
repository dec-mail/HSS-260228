import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './PropertyDetailPage.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PropertyDetailPage = () => {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    fetchCurrentUser();
    fetchProperty();
  }, [propertyId]);

  const fetchCurrentUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`, { withCredentials: true });
      setCurrentUser(response.data);
    } catch (error) {
      console.log('Not authenticated');
    }
  };

  const fetchProperty = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/properties/${propertyId}`);
      setProperty(response.data);
    } catch (error) {
      console.error('Failed to fetch property:', error);
      setError('Property not found');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="property-detail-page">
        <div className="container">
          <div className="loading">Loading property details...</div>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="property-detail-page">
        <div className="container">
          <div className="error-state">
            <h2>Property Not Found</h2>
            <p>The property you're looking for doesn't exist or has been removed.</p>
            <button className="btn btn-primary" onClick={() => navigate('/properties')}>
              Browse Properties
            </button>
          </div>
        </div>
      </div>
    );
  }

  const images = property.images?.length > 0 ? property.images : [];
  const hasImages = images.length > 0;

  return (
    <div className="property-detail-page" data-testid="property-detail-page">
      <div className="detail-header">
        <div className="container">
          <button className="back-btn" onClick={() => navigate('/properties')} data-testid="back-btn">
            ← Back to Properties
          </button>
        </div>
      </div>

      <div className="container">
        <div className="property-detail-layout">
          {/* Image Gallery */}
          <div className="image-gallery">
            <div className="main-image">
              {hasImages ? (
                <img src={images[selectedImage]} alt={property.address} />
              ) : (
                <div className="placeholder-image-large">
                  <span>No Images Available</span>
                </div>
              )}
            </div>
            {hasImages && images.length > 1 && (
              <div className="thumbnail-row">
                {images.map((img, index) => (
                  <div
                    key={index}
                    className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                    onClick={() => setSelectedImage(index)}
                  >
                    <img src={img} alt={`View ${index + 1}`} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Property Info */}
          <div className="property-info-section">
            <div className="property-type-badge">{property.property_type}</div>
            <h1 className="property-title" data-testid="property-title">
              {property.address}
            </h1>
            <p className="property-location">{property.city}, {property.state} {property.postcode}</p>

            <div className="price-box">
              <div className="price-amount">${property.weekly_rent_per_person}</div>
              <div className="price-period">per week per person</div>
            </div>

            <div className="property-highlights">
              <div className="highlight-item">
                <span className="highlight-icon">🛏</span>
                <div className="highlight-text">
                  <strong>{property.available_bedrooms || '-'}</strong>
                  <span>bedrooms available</span>
                </div>
              </div>
              <div className="highlight-item">
                <span className="highlight-icon">🏠</span>
                <div className="highlight-text">
                  <strong>{property.total_bedrooms || '-'}</strong>
                  <span>total bedrooms</span>
                </div>
              </div>
              <div className="highlight-item">
                <span className="highlight-icon">🚿</span>
                <div className="highlight-text">
                  <strong>{property.total_bathrooms || '-'}</strong>
                  <span>bathrooms</span>
                </div>
              </div>
            </div>

            {currentUser && (
              <div className="property-actions">
                <button className="btn btn-primary btn-large contact-btn" data-testid="contact-btn">
                  Express Interest
                </button>
                {(currentUser.user_id === property.added_by_user_id || currentUser.role === 'admin') && (
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => navigate(`/properties/${propertyId}/edit`)}
                    data-testid="edit-property-btn"
                  >
                    Edit Property
                  </button>
                )}
              </div>
            )}
            {!currentUser && (
              <p className="login-prompt">
                <a href="/apply">Apply to become a member</a> to express interest in this property.
              </p>
            )}
          </div>
        </div>

        {/* Details Sections */}
        <div className="details-sections">
          {/* Description */}
          {property.description && (
            <div className="detail-section">
              <h2>About This Property</h2>
              <p className="description-text">{property.description}</p>
            </div>
          )}

          {/* Amenities */}
          {property.amenities && property.amenities.length > 0 && (
            <div className="detail-section">
              <h2>Amenities</h2>
              <div className="amenities-grid">
                {property.amenities.map((amenity, index) => (
                  <div key={index} className="amenity-item">
                    <span className="amenity-check">✓</span>
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* House Rules */}
          {property.house_rules && (
            <div className="detail-section">
              <h2>House Rules</h2>
              <p className="rules-text">{property.house_rules}</p>
            </div>
          )}

          {/* Additional Info */}
          <div className="detail-section">
            <h2>Additional Information</h2>
            <div className="info-grid">
              {property.pet_policy && (
                <div className="info-item">
                  <span className="info-label">Pet Policy:</span>
                  <span className="info-value">{property.pet_policy}</span>
                </div>
              )}
              {property.smoking_policy && (
                <div className="info-item">
                  <span className="info-label">Smoking Policy:</span>
                  <span className="info-value">{property.smoking_policy}</span>
                </div>
              )}
              {property.lease_term && (
                <div className="info-item">
                  <span className="info-label">Lease Term:</span>
                  <span className="info-value">{property.lease_term}</span>
                </div>
              )}
              {property.available_from && (
                <div className="info-item">
                  <span className="info-label">Available From:</span>
                  <span className="info-value">{new Date(property.available_from).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailPage;
