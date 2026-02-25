import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './MemberDashboard.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MemberDashboard = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [shortlists, setShortlists] = useState([]);
  const [activeTab, setActiveTab] = useState('browse');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Search/Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    housingType: '',
    state: '',
    smokingStatus: ''
  });
  
  // Change password state
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState(null);
  const [passwordError, setPasswordError] = useState(null);
  
  // Favorites state
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    fetchCurrentUser();
    fetchMembers();
    fetchShortlists();
    fetchFavorites();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [members, searchTerm, filters]);

  const applyFilters = () => {
    let filtered = [...members];
    
    // Search by name
    if (searchTerm) {
      filtered = filtered.filter(m => 
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by housing type preference (if available in member data)
    if (filters.housingType) {
      filtered = filtered.filter(m => 
        m.application_data?.shared_housing_type === filters.housingType
      );
    }
    
    // Filter by state (if available)
    if (filters.state) {
      filtered = filtered.filter(m => 
        m.application_data?.state === filters.state
      );
    }
    
    // Filter by smoking status (if available)
    if (filters.smokingStatus) {
      filtered = filtered.filter(m => 
        m.application_data?.smoking_status === filters.smokingStatus
      );
    }
    
    setFilteredMembers(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilters({
      housingType: '',
      state: '',
      smokingStatus: ''
    });
  };

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const config = { withCredentials: true, headers: token ? { Authorization: `Bearer ${token}` } : {} };
      const response = await axios.get(`${API}/auth/me`, config);
      setCurrentUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
    }
  };

  const getAuthConfig = () => {
    const token = localStorage.getItem('auth_token');
    return { withCredentials: true, headers: token ? { Authorization: `Bearer ${token}` } : {} };
  };

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/members`, getAuthConfig());
      setMembers(response.data);
    } catch (error) {
      console.error('Failed to fetch members:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchShortlists = async () => {
    try {
      const response = await axios.get(`${API}/shortlists`, getAuthConfig());
      setShortlists(response.data);
    } catch (error) {
      console.error('Failed to fetch shortlists:', error);
    }
  };

  const fetchFavorites = async () => {
    try {
      const response = await axios.get(`${API}/favorites`, getAuthConfig());
      setFavorites(response.data);
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
    }
  };

  const toggleFavorite = async (itemId, itemType) => {
    try {
      const existing = favorites.find(f => f.item_id === itemId && f.item_type === itemType);
      if (existing) {
        await axios.delete(`${API}/favorites/${existing.favorite_id}`, getAuthConfig());
        setFavorites(favorites.filter(f => f.favorite_id !== existing.favorite_id));
      } else {
        const response = await axios.post(`${API}/favorites`, { item_id: itemId, item_type: itemType }, getAuthConfig());
        const newFav = response.data.favorite;
        if (newFav) {
          setFavorites([...favorites, newFav]);
        }
        fetchFavorites();
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const isFavorited = (itemId, itemType) => {
    return favorites.some(f => f.item_id === itemId && f.item_type === itemType);
  };

  const removeFavorite = async (favoriteId) => {
    try {
      await axios.delete(`${API}/favorites/${favoriteId}`, getAuthConfig());
      setFavorites(favorites.filter(f => f.favorite_id !== favoriteId));
    } catch (error) {
      console.error('Failed to remove favorite:', error);
    }
  };

  const addToShortlist = async (userId) => {
    try {
      await axios.post(`${API}/shortlists?shortlisted_user_id=${userId}`, {}, getAuthConfig());
      alert('Added to your shortlist!');
      fetchShortlists();
    } catch (error) {
      console.error('Failed to add to shortlist:', error);
      alert('Failed to add to shortlist');
    }
  };

  const removeFromShortlist = async (shortlistId) => {
    try {
      await axios.delete(`${API}/shortlists/${shortlistId}`, getAuthConfig());
      alert('Removed from shortlist');
      fetchShortlists();
    } catch (error) {
      console.error('Failed to remove from shortlist:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
      localStorage.removeItem('auth_token');
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
      localStorage.removeItem('auth_token');
      navigate('/');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordMessage(null);

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setPasswordLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const config = { withCredentials: true, headers: token ? { Authorization: `Bearer ${token}` } : {} };
      const response = await axios.post(`${API}/auth/change-password`, {
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword
      }, config);
      setPasswordMessage(response.data.message);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setPasswordError(error.response?.data?.detail || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const isShortlisted = (userId) => {
    return shortlists.some(sl => sl.member.user_id === userId);
  };

  return (
    <div className="member-dashboard" data-testid="member-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="container">
          <div className="header-content">
            <div className="header-left">
              <img src="/logo.png" alt="House Sharing Seniors" className="dashboard-logo" />
              <div>
                <h1>Member Dashboard</h1>
                {currentUser && <p className="welcome-text">Welcome, {currentUser.name}!</p>}
              </div>
            </div>
            <button className="btn btn-secondary" onClick={handleLogout} data-testid="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="container">
        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button
            className={`tab-btn ${activeTab === 'browse' ? 'active' : ''}`}
            onClick={() => setActiveTab('browse')}
            data-testid="browse-tab"
          >
            Browse Members
          </button>
          <button
            className={`tab-btn ${activeTab === 'shortlist' ? 'active' : ''}`}
            onClick={() => setActiveTab('shortlist')}
            data-testid="shortlist-tab"
          >
            My Shortlist ({shortlists.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'favorites' ? 'active' : ''}`}
            onClick={() => setActiveTab('favorites')}
            data-testid="favorites-tab"
          >
            Favorites ({favorites.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
            data-testid="settings-tab"
          >
            Settings
          </button>
        </div>

        {/* Browse Members Tab */}
        {activeTab === 'browse' && (
          <div className="members-section" data-testid="browse-section">
            <div className="section-header">
              <h2>Available Members</h2>
              <p>Connect with verified pensioners to share housing costs</p>
            </div>

            {/* Search and Filter Bar */}
            <div className="search-filter-bar">
              <div className="search-input-wrapper">
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                  data-testid="member-search-input"
                />
              </div>
              <div className="filter-controls">
                <select 
                  value={filters.housingType} 
                  onChange={(e) => setFilters({...filters, housingType: e.target.value})}
                  className="filter-select-sm"
                  data-testid="housing-type-filter"
                >
                  <option value="">All Housing Types</option>
                  <option value="single_female">Female Community</option>
                  <option value="single_male">Male Community</option>
                  <option value="couples">Couples Community</option>
                </select>
                <select 
                  value={filters.state} 
                  onChange={(e) => setFilters({...filters, state: e.target.value})}
                  className="filter-select-sm"
                  data-testid="state-filter"
                >
                  <option value="">All States</option>
                  <option value="NSW">NSW</option>
                  <option value="VIC">VIC</option>
                  <option value="QLD">QLD</option>
                  <option value="SA">SA</option>
                  <option value="WA">WA</option>
                  <option value="TAS">TAS</option>
                  <option value="NT">NT</option>
                  <option value="ACT">ACT</option>
                </select>
                <select 
                  value={filters.smokingStatus} 
                  onChange={(e) => setFilters({...filters, smokingStatus: e.target.value})}
                  className="filter-select-sm"
                  data-testid="smoking-filter"
                >
                  <option value="">Any Smoking Status</option>
                  <option value="non_smoker">Non-smoker</option>
                  <option value="smoker_outside">Smoker (outside)</option>
                  <option value="vaper">Vaper</option>
                </select>
                {(searchTerm || filters.housingType || filters.state || filters.smokingStatus) && (
                  <button className="clear-filters-btn-sm" onClick={clearFilters} data-testid="clear-filters-btn">
                    Clear
                  </button>
                )}
              </div>
            </div>

            <p className="results-count">{filteredMembers.filter(m => m.user_id !== currentUser?.user_id).length} members found</p>

            {loading ? (
              <div className="loading">Loading members...</div>
            ) : filteredMembers.length === 0 ? (
              <p className="no-members">No members found matching your criteria</p>
            ) : (
              <div className="members-grid">
                {filteredMembers.filter(m => m.user_id !== currentUser?.user_id).map((member) => (
                  <div key={member.user_id} className="member-card" data-testid={`member-card-${member.user_id}`}>
                    <div className="member-avatar">
                      {member.picture ? (
                        <img src={member.picture} alt={member.name} />
                      ) : (
                        <div className="avatar-placeholder">{member.name.charAt(0)}</div>
                      )}
                    </div>
                    <div className="member-info">
                      <h3>{member.name}</h3>
                      <p className="member-email">{member.email}</p>
                      <p className="member-date">Member since {new Date(member.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="member-actions">
                      <button
                        onClick={() => toggleFavorite(member.user_id, 'member')}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: isFavorited(member.user_id, 'member') ? '#ef4444' : '#d1d5db', marginRight: '8px' }}
                        data-testid={`fav-member-btn-${member.user_id}`}
                        title={isFavorited(member.user_id, 'member') ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        {isFavorited(member.user_id, 'member') ? '♥' : '♡'}
                      </button>
                      {isShortlisted(member.user_id) ? (
                        <button 
                          className="btn btn-secondary" 
                          disabled
                          data-testid={`shortlisted-btn-${member.user_id}`}
                        >
                          ✓ Shortlisted
                        </button>
                      ) : (
                        <button 
                          className="btn btn-primary"
                          onClick={() => addToShortlist(member.user_id)}
                          data-testid={`add-shortlist-btn-${member.user_id}`}
                        >
                          Add to Shortlist
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Shortlist Tab */}
        {activeTab === 'shortlist' && (
          <div className="shortlist-section" data-testid="shortlist-section">
            <div className="section-header">
              <h2>My Shortlist</h2>
              <p>Members you're interested in sharing costs with</p>
            </div>

            {shortlists.length === 0 ? (
              <div className="empty-shortlist">
                <p>Your shortlist is empty</p>
                <button 
                  className="btn btn-primary" 
                  onClick={() => setActiveTab('browse')}
                  data-testid="browse-members-btn"
                >
                  Browse Members
                </button>
              </div>
            ) : (
              <div className="shortlist-grid">
                {shortlists.map((item) => (
                  <div key={item.shortlist_id} className="shortlist-card" data-testid={`shortlist-card-${item.shortlist_id}`}>
                    <div className="member-avatar">
                      {item.member.picture ? (
                        <img src={item.member.picture} alt={item.member.name} />
                      ) : (
                        <div className="avatar-placeholder">{item.member.name.charAt(0)}</div>
                      )}
                    </div>
                    <div className="member-info">
                      <h3>{item.member.name}</h3>
                      <p className="member-email">{item.member.email}</p>
                      <p className="member-date">Added {new Date(item.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="member-actions">
                      <button 
                        className="btn btn-danger"
                        onClick={() => removeFromShortlist(item.shortlist_id)}
                        data-testid={`remove-btn-${item.shortlist_id}`}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {/* Favorites Tab */}
        {activeTab === 'favorites' && (
          <div className="favorites-section" data-testid="favorites-section">
            <div className="section-header">
              <h2>My Favorites</h2>
              <p>Properties and members you've saved</p>
            </div>

            {favorites.length === 0 ? (
              <div className="empty-shortlist">
                <p>No favorites yet. Browse properties or members and click the heart icon to save them.</p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <button className="btn btn-primary" onClick={() => navigate('/properties')} data-testid="browse-properties-btn">
                    Browse Properties
                  </button>
                  <button className="btn btn-secondary" onClick={() => setActiveTab('browse')} data-testid="browse-members-from-fav-btn">
                    Browse Members
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Favorite Properties */}
                {favorites.filter(f => f.item_type === 'property').length > 0 && (
                  <div style={{ marginBottom: '32px' }}>
                    <h3 style={{ color: '#1a2332', marginBottom: '16px' }}>Saved Properties ({favorites.filter(f => f.item_type === 'property').length})</h3>
                    <div className="members-grid">
                      {favorites.filter(f => f.item_type === 'property' && f.item_data).map((fav) => (
                        <div key={fav.favorite_id} className="member-card" style={{ cursor: 'pointer' }} data-testid={`fav-property-card-${fav.favorite_id}`}>
                          <div className="member-info" onClick={() => navigate(`/properties/${fav.item_id}`)}>
                            <h3>{fav.item_data.address || `${fav.item_data.city}, ${fav.item_data.state}`}</h3>
                            <p className="member-email">{fav.item_data.city}, {fav.item_data.state}</p>
                            <p style={{ color: '#2563eb', fontWeight: '700', fontSize: '18px' }}>${fav.item_data.weekly_rent_per_person}/week</p>
                          </div>
                          <div className="member-actions">
                            <button className="btn btn-danger" onClick={() => removeFavorite(fav.favorite_id)} data-testid={`remove-fav-${fav.favorite_id}`}>
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Favorite Members */}
                {favorites.filter(f => f.item_type === 'member').length > 0 && (
                  <div>
                    <h3 style={{ color: '#1a2332', marginBottom: '16px' }}>Saved Members ({favorites.filter(f => f.item_type === 'member').length})</h3>
                    <div className="members-grid">
                      {favorites.filter(f => f.item_type === 'member' && f.item_data).map((fav) => (
                        <div key={fav.favorite_id} className="member-card" data-testid={`fav-member-card-${fav.favorite_id}`}>
                          <div className="member-avatar">
                            <div className="avatar-placeholder">{(fav.item_data.name || 'M').charAt(0)}</div>
                          </div>
                          <div className="member-info">
                            <h3>{fav.item_data.name}</h3>
                            <p className="member-date">Saved {new Date(fav.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="member-actions">
                            <button className="btn btn-danger" onClick={() => removeFavorite(fav.favorite_id)} data-testid={`remove-fav-${fav.favorite_id}`}>
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="settings-section" data-testid="settings-section">
            <div className="section-header">
              <h2>Account Settings</h2>
              <p>Manage your account preferences</p>
            </div>

            <div style={{ maxWidth: '500px' }}>
              <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 style={{ margin: '0 0 20px 0', color: '#1a2332' }}>Change Password</h3>

                {passwordMessage && (
                  <div style={{ background: '#d1fae5', border: '1px solid #059669', borderRadius: '8px', padding: '12px', color: '#065f46', marginBottom: '16px' }} data-testid="password-success-msg">
                    {passwordMessage}
                  </div>
                )}
                {passwordError && (
                  <div style={{ background: '#fef2f2', border: '1px solid #ef4444', borderRadius: '8px', padding: '12px', color: '#b91c1c', marginBottom: '16px' }} data-testid="password-error-msg">
                    {passwordError}
                  </div>
                )}

                <form onSubmit={handleChangePassword}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '14px' }}>Current Password</label>
                    <input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                      required
                      style={{ width: '100%', padding: '10px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                      data-testid="current-password-input"
                    />
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '14px' }}>New Password</label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                      required
                      minLength={6}
                      style={{ width: '100%', padding: '10px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                      data-testid="new-password-input"
                    />
                  </div>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '14px' }}>Confirm New Password</label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                      required
                      minLength={6}
                      style={{ width: '100%', padding: '10px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                      data-testid="confirm-new-password-input"
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={passwordLoading}
                    style={{ padding: '12px 24px' }}
                    data-testid="change-password-submit"
                  >
                    {passwordLoading ? 'Changing...' : 'Change Password'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberDashboard;
