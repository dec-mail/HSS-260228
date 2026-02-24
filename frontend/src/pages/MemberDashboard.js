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

  useEffect(() => {
    fetchCurrentUser();
    fetchMembers();
    fetchShortlists();
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
      const response = await axios.get(`${API}/auth/me`, { withCredentials: true });
      setCurrentUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
    }
  };

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/members`, { withCredentials: true });
      setMembers(response.data);
    } catch (error) {
      console.error('Failed to fetch members:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchShortlists = async () => {
    try {
      const response = await axios.get(`${API}/shortlists`, { withCredentials: true });
      setShortlists(response.data);
    } catch (error) {
      console.error('Failed to fetch shortlists:', error);
    }
  };

  const addToShortlist = async (userId) => {
    try {
      await axios.post(
        `${API}/shortlists?shortlisted_user_id=${userId}`,
        {},
        { withCredentials: true }
      );
      alert('Added to your shortlist!');
      fetchShortlists();
    } catch (error) {
      console.error('Failed to add to shortlist:', error);
      alert('Failed to add to shortlist');
    }
  };

  const removeFromShortlist = async (shortlistId) => {
    try {
      await axios.delete(`${API}/shortlists/${shortlistId}`, { withCredentials: true });
      alert('Removed from shortlist');
      fetchShortlists();
    } catch (error) {
      console.error('Failed to remove from shortlist:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
      navigate('/');
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
      </div>
    </div>
  );
};

export default MemberDashboard;
