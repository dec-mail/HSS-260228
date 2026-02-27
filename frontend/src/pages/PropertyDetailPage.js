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
  const [showInterestModal, setShowInterestModal] = useState(false);
  const [interestForm, setInterestForm] = useState({ message: '', phone: '' });
  const [interestLoading, setInterestLoading] = useState(false);
  const [interestSent, setInterestSent] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteId, setFavoriteId] = useState(null);
  const [propertyGroups, setPropertyGroups] = useState([]);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [createGroupForm, setCreateGroupForm] = useState({ group_type: 'Mixed', is_couple: false });

  useEffect(() => {
    fetchCurrentUser();
    fetchProperty();
    fetchPropertyGroups();
  }, [propertyId]);

  const getAuthConfig = () => {
    const token = localStorage.getItem('auth_token');
    return { withCredentials: true, headers: token ? { Authorization: `Bearer ${token}` } : {} };
  };

  const fetchCurrentUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`, getAuthConfig());
      setCurrentUser(response.data);
      checkFavoriteStatus(response.data.user_id);
      checkInterestStatus(response.data.user_id);
    } catch (error) {
      console.log('Not authenticated');
    }
  };

  const checkFavoriteStatus = async () => {
    try {
      const response = await axios.get(`${API}/favorites?item_type=property`, getAuthConfig());
      const fav = response.data.find(f => f.item_id === propertyId);
      if (fav) {
        setIsFavorited(true);
        setFavoriteId(fav.favorite_id);
      }
    } catch (e) { /* not logged in */ }
  };

  const checkInterestStatus = async () => {
    try {
      const response = await axios.get(`${API}/interests/my`, getAuthConfig());
      if (response.data.some(i => i.property_id === propertyId)) {
        setInterestSent(true);
      }
    } catch (e) { /* not logged in */ }
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

  const handleExpressInterest = async (e) => {
    e.preventDefault();
    setInterestLoading(true);
    try {
      await axios.post(`${API}/interests`, {
        property_id: propertyId,
        message: interestForm.message,
        phone: interestForm.phone
      }, getAuthConfig());
      setInterestSent(true);
      setShowInterestModal(false);
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to express interest');
    } finally {
      setInterestLoading(false);
    }
  };

  const toggleFavorite = async () => {
    try {
      if (isFavorited && favoriteId) {
        await axios.delete(`${API}/favorites/${favoriteId}`, getAuthConfig());
        setIsFavorited(false);
        setFavoriteId(null);
      } else {
        const response = await axios.post(`${API}/favorites`, {
          item_id: propertyId,
          item_type: 'property'
        }, getAuthConfig());
        setIsFavorited(true);
        setFavoriteId(response.data.favorite?.favorite_id);
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const fetchPropertyGroups = async () => {
    try {
      const response = await axios.get(`${API}/groups?property_id=${propertyId}`, getAuthConfig());
      setPropertyGroups(response.data);
    } catch (e) { /* not logged in */ }
  };

  const createPropertyGroup = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/groups`, {
        property_id: propertyId,
        group_type: createGroupForm.group_type,
        is_couple: createGroupForm.is_couple
      }, getAuthConfig());
      setShowCreateGroupModal(false);
      setCreateGroupForm({ group_type: 'Mixed', is_couple: false });
      fetchPropertyGroups();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to create group');
    }
  };

  const joinPropertyGroup = async (groupId) => {
    try {
      const res = await axios.post(`${API}/groups/${groupId}/join`, {}, getAuthConfig());
      alert(res.data.message);
      fetchPropertyGroups();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to join');
    }
  };

  const leavePropertyGroup = async (groupId) => {
    try {
      await axios.post(`${API}/groups/${groupId}/leave`, {}, getAuthConfig());
      fetchPropertyGroups();
    } catch (error) {
      alert('Failed to leave group');
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
            &larr; Back to Properties
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div className="property-type-badge">{property.property_type}</div>
              {currentUser && (
                <button
                  onClick={toggleFavorite}
                  style={{
                    background: 'none', border: '2px solid ' + (isFavorited ? '#ef4444' : '#d1d5db'),
                    borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', fontSize: '18px',
                    color: isFavorited ? '#ef4444' : '#9ca3af', transition: 'all 0.2s'
                  }}
                  data-testid="favorite-btn"
                  title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                >
                  {isFavorited ? '♥' : '♡'} {isFavorited ? 'Saved' : 'Save'}
                </button>
              )}
            </div>
            <h1 className="property-title" data-testid="property-title">
              {property.city}, {property.state} {property.postcode}
            </h1>

            <div className="price-box">
              {property.total_bedrooms && <div style={{ fontSize: '16px', color: '#4b5563', fontWeight: '600', marginBottom: '8px' }}>Total rent: ${(property.weekly_rent_per_person * property.total_bedrooms).toFixed(0)}/week<br/>({property.total_bedrooms} bedrooms)</div>}
              <div className="price-amount">${property.weekly_rent_per_person}</div>
              <div className="price-period">weekly rent per bedroom</div>
              <div style={{ marginTop: '12px', padding: '12px', background: '#eff6ff', borderRadius: '8px', fontSize: '16px' }}>
                <div style={{ fontWeight: '700', color: '#059669', marginBottom: '6px' }}>After CRA (Commonwealth Rent Assistance):</div>
                {(() => {
                  const r = property.weekly_rent_per_person;
                  const sCRA = Math.min(71.80, Math.max(0, 0.75 * (r - 76)));
                  const cCRA = Math.min(101.50, Math.max(0, 0.75 * (r - 123.10)));
                  return <>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#4b5563' }}>Singles:</span>
                      <span style={{ fontWeight: '700', color: '#059669', fontSize: '20px' }}>${(r - sCRA).toFixed(2)}/wk</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                      <span style={{ color: '#4b5563' }}>Couples:</span>
                      <span style={{ fontWeight: '700', color: '#059669', fontSize: '20px' }}>${(r - cCRA).toFixed(2)}/wk</span>
                    </div>
                  </>;
                })()}
              </div>
            </div>

            <div className="property-highlights">
              <div className="highlight-item">
                <span className="highlight-icon">Bed</span>
                <div className="highlight-text">
                  <strong>{property.available_bedrooms || '-'}</strong>
                  <span>bedrooms available</span>
                </div>
              </div>
              <div className="highlight-item">
                <span className="highlight-icon">Home</span>
                <div className="highlight-text">
                  <strong>{property.total_bedrooms || '-'}</strong>
                  <span>total bedrooms</span>
                </div>
              </div>
              <div className="highlight-item">
                <span className="highlight-icon">Bath</span>
                <div className="highlight-text">
                  <strong>{property.total_bathrooms || '-'}</strong>
                  <span>bathrooms</span>
                </div>
              </div>
            </div>

            {currentUser && (
              <div className="property-actions">
                {interestSent ? (
                  <button className="btn btn-secondary btn-large" disabled data-testid="interest-sent-btn">
                    Interest Sent
                  </button>
                ) : (
                  <button
                    className="btn btn-primary btn-large contact-btn"
                    onClick={() => setShowInterestModal(true)}
                    data-testid="express-interest-btn"
                  >
                    Express Interest
                  </button>
                )}
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
          {property.description && (
            <div className="detail-section">
              <h2>About This Property</h2>
              <p className="description-text">{property.description}</p>
            </div>
          )}

          {property.amenities && property.amenities.length > 0 && (
            <div className="detail-section">
              <h2>Amenities</h2>
              <div className="amenities-grid">
                {property.amenities.map((amenity, index) => (
                  <div key={index} className="amenity-item">
                    <span className="amenity-check">&#10003;</span>
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {property.house_rules && (
            <div className="detail-section">
              <h2>House Rules</h2>
              <p className="rules-text">{property.house_rules}</p>
            </div>
          )}

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

      {/* Property Groups Section */}
      {currentUser && (
        <div className="details-sections" style={{ marginTop: '0' }}>
          <div className="detail-section" data-testid="property-groups-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0 }}>Groups for This Property</h2>
              <button
                className="btn btn-primary"
                onClick={() => setShowCreateGroupModal(true)}
                style={{ padding: '8px 16px', fontSize: '14px' }}
                data-testid="create-group-btn"
              >
                + Create Group
              </button>
            </div>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '16px' }}>
              Form a group with other members to share this property. Each group is tied to this property.
            </p>
            {propertyGroups.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', background: '#f9fafb', borderRadius: '8px', color: '#6b7280' }} data-testid="no-groups-msg">
                No groups yet. Be the first to create one!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {propertyGroups.map(group => {
                  const isMember = group.members?.some(m => m.user_id === currentUser?.user_id);
                  const isWaitlisted = group.waitlist?.some(w => w.user_id === currentUser?.user_id);
                  const isCreator = group.created_by === currentUser?.user_id;
                  const occupied = group.spots_taken ?? group.members?.length ?? 0;
                  const maxSpots = group.max_spots ?? 4;
                  const available = Math.max(0, maxSpots - occupied);
                  const statusColors = { vacancies: '#059669', full: '#d97706', fulfilled: '#2563eb', on_hold: '#6b7280' };
                  return (
                    <div
                      key={group.group_id}
                      style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}
                      data-testid={`property-group-card-${group.group_id}`}
                    >
                      <div style={{ flex: 1, minWidth: '200px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <strong style={{ fontSize: '16px' }}>{group.name}</strong>
                          <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '12px', background: statusColors[group.status] || '#6b7280', color: 'white', textTransform: 'uppercase' }}>
                            {group.status?.replace('_', ' ')}
                          </span>
                        </div>
                        <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0' }}>
                          Type: {group.group_type} &middot; {occupied}/{maxSpots} members
                          {available > 0 && <span style={{ color: '#059669', fontWeight: '600' }}> &middot; {available} spot{available !== 1 ? 's' : ''} left</span>}
                          {(group.waitlist_count ?? group.waitlist?.length ?? 0) > 0 && (
                            <span style={{ color: '#d97706' }}> &middot; {group.waitlist_count ?? group.waitlist?.length} waitlisted</span>
                          )}
                        </p>
                        {group.members?.length > 0 && (
                          <div style={{ fontSize: '12px', color: '#4b5563', marginTop: '4px' }}>
                            Members: {group.members.map((m, i) => (
                              <span key={m.user_id}>{i > 0 ? ', ' : ''}{m.name}{m.is_couple ? ' (couple)' : ''}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {isMember ? (
                          <>
                            <span style={{ fontSize: '12px', color: '#059669', fontWeight: '600', padding: '4px 10px', background: '#d1fae5', borderRadius: '6px' }}>Joined</span>
                            {!isCreator && (
                              <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => leavePropertyGroup(group.group_id)} data-testid={`leave-group-${group.group_id}`}>
                                Leave
                              </button>
                            )}
                          </>
                        ) : isWaitlisted ? (
                          <>
                            <span style={{ fontSize: '12px', color: '#d97706', fontWeight: '600', padding: '4px 10px', background: '#fef3c7', borderRadius: '6px' }}>Waitlisted</span>
                            <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => leavePropertyGroup(group.group_id)}>
                              Leave Waitlist
                            </button>
                          </>
                        ) : group.status !== 'fulfilled' && group.status !== 'on_hold' ? (
                          <button className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '13px' }} onClick={() => joinPropertyGroup(group.group_id)} data-testid={`join-group-${group.group_id}`}>
                            {available > 0 ? 'Join Group' : 'Join Waitlist'}
                          </button>
                        ) : null}
                        {isCreator && (
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '12px', color: '#ef4444', borderColor: '#ef4444' }}
                            onClick={async () => {
                              if (window.confirm('Delete this group?')) {
                                try {
                                  await axios.delete(`${API}/groups/${group.group_id}`, getAuthConfig());
                                  fetchPropertyGroups();
                                } catch (e) { alert('Failed to delete group'); }
                              }
                            }}
                            data-testid={`delete-group-${group.group_id}`}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateGroupModal && (
        <div className="modal-overlay" onClick={() => setShowCreateGroupModal(false)} data-testid="create-group-modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()} data-testid="create-group-modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: '#1a2332' }}>Create a Group</h2>
              <button onClick={() => setShowCreateGroupModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6b7280' }}>&times;</button>
            </div>
            <p style={{ color: '#6b7280', marginBottom: '20px', fontSize: '14px' }}>
              Start a group for <strong>{property.city}, {property.state}</strong>. Other members can then join.
            </p>
            <form onSubmit={createPropertyGroup}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '14px' }}>Group Type</label>
                <select
                  value={createGroupForm.group_type}
                  onChange={(e) => setCreateGroupForm({...createGroupForm, group_type: e.target.value})}
                  style={{ width: '100%', padding: '10px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                  data-testid="group-type-select"
                >
                  <option value="Mixed">Mixed</option>
                  <option value="SingleFemale">Single Female</option>
                  <option value="SingleMale">Single Male</option>
                  <option value="Couples">Couples</option>
                </select>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={createGroupForm.is_couple}
                    onChange={(e) => setCreateGroupForm({...createGroupForm, is_couple: e.target.checked})}
                    style={{ width: '18px', height: '18px' }}
                    data-testid="is-couple-checkbox"
                  />
                  I am joining as a couple (counts as 1 spot)
                </label>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} data-testid="create-group-submit">
                  Create Group
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateGroupModal(false)} style={{ flex: 1 }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Express Interest Modal */}
      {showInterestModal && (
        <div className="modal-overlay" onClick={() => setShowInterestModal(false)} data-testid="interest-modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()} data-testid="interest-modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: '#1a2332' }}>Express Interest</h2>
              <button onClick={() => setShowInterestModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6b7280' }}>&times;</button>
            </div>
            <p style={{ color: '#6b7280', marginBottom: '20px' }}>
              Let us know you're interested in <strong>{property.city}, {property.state}</strong>. The admin team will be notified.
            </p>
            <form onSubmit={handleExpressInterest}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '14px' }}>Your Phone (optional)</label>
                <input
                  type="tel"
                  value={interestForm.phone}
                  onChange={(e) => setInterestForm({...interestForm, phone: e.target.value})}
                  placeholder="e.g. 0412 345 678"
                  style={{ width: '100%', padding: '10px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                  data-testid="interest-phone-input"
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '14px' }}>Message (optional)</label>
                <textarea
                  value={interestForm.message}
                  onChange={(e) => setInterestForm({...interestForm, message: e.target.value})}
                  placeholder="Tell us why you're interested in this property..."
                  rows={4}
                  style={{ width: '100%', padding: '10px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box' }}
                  data-testid="interest-message-input"
                />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" className="btn btn-primary" disabled={interestLoading} style={{ flex: 1 }} data-testid="interest-submit-btn">
                  {interestLoading ? 'Sending...' : 'Send Interest'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowInterestModal(false)} style={{ flex: 1 }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyDetailPage;
