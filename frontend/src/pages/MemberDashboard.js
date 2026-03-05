import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ChatBox from '../components/ChatBox';
import NotificationBell from '../components/NotificationBell';
import './MemberDashboard.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;


const GroupDirectory = ({ currentUser, getAuthConfig, navigate }) => {
  const [allGroups, setAllGroups] = useState([]);
  const [filter, setFilter] = useState('all'); // all, property, member, open
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupType, setNewGroupType] = useState('Mixed');

  useEffect(() => {
    axios.get(`${API}/groups/directory`).then(r => setAllGroups(r.data)).catch(() => {});
  }, []);

  const createMemberGroup = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/groups`, { name: newGroupName, group_type: newGroupType }, getAuthConfig());
      setShowCreateModal(false);
      setNewGroupName('');
      axios.get(`${API}/groups/directory`).then(r => setAllGroups(r.data));
    } catch (err) { alert(err.response?.data?.detail || 'Failed to create group'); }
  };

  const filtered = allGroups.filter(g => {
    if (search && !`${g.name} ${g.property_city} ${g.property_state}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === 'property' && g.group_category !== 'property') return false;
    if (filter === 'member' && g.group_category !== 'member') return false;
    if (filter === 'open' && g.display_status !== 'Open') return false;
    return true;
  });

  return (
    <div data-testid="group-directory-section">
      <div className="section-header">
        <h2>Group Directory</h2>
        <p>Browse all groups across the site — property groups and member groups</p>
      </div>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text" placeholder="Search groups..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: '200px', padding: '10px 14px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
          data-testid="group-search-input"
        />
        <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ padding: '10px 14px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }} data-testid="group-filter-select">
          <option value="all">All Groups</option>
          <option value="property">Property Groups</option>
          <option value="member">Member Groups</option>
          <option value="open">Open Only</option>
        </select>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)} style={{ padding: '10px 18px' }} data-testid="create-member-group-btn">
          + Create Member Group
        </button>
      </div>
      <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '16px' }}>{filtered.length} groups found</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filtered.map(g => {
          const isMember = g.members?.some(m => m.user_id === currentUser?.user_id);
          return (
            <div key={g.group_id} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }} data-testid={`dir-group-${g.group_id}`}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <strong style={{ fontSize: '15px' }}>{g.name}</strong>
                  <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '10px', background: g.group_category === 'member' ? '#ede9fe' : '#dbeafe', color: g.group_category === 'member' ? '#7c3aed' : '#2563eb', textTransform: 'uppercase' }}>
                    {g.group_category}
                  </span>
                  <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '10px', background: g.display_status === 'Open' ? '#d1fae5' : '#fef2f2', color: g.display_status === 'Open' ? '#059669' : '#ef4444' }}>
                    {g.display_status}
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: '#6b7280', margin: '2px 0' }}>
                  {g.property_city ? `${g.property_city}, ${g.property_state}` : 'No property yet'} &middot; {g.group_type} &middot; {g.spots_taken}/{g.max_spots} members
                  {g.spots_available > 0 && <span style={{ color: '#059669', fontWeight: '600' }}> &middot; {g.spots_available} spot{g.spots_available !== 1 ? 's' : ''} open</span>}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {isMember && <span style={{ fontSize: '12px', color: '#059669', fontWeight: '600', padding: '4px 10px', background: '#d1fae5', borderRadius: '6px' }}>Joined</span>}
                {g.property_id && (
                  <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => navigate(`/properties/${g.property_id}`)} data-testid={`view-property-${g.group_id}`}>
                    View Property
                  </button>
                )}
                {!isMember && g.display_status === 'Open' && (
                  <button className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '12px' }}
                    onClick={async () => {
                      try {
                        await axios.post(`${API}/groups/${g.group_id}/join`, {}, getAuthConfig());
                        axios.get(`${API}/groups/directory`).then(r => setAllGroups(r.data));
                      } catch (err) { alert(err.response?.data?.detail || 'Failed to join'); }
                    }}
                    data-testid={`join-dir-group-${g.group_id}`}
                  >
                    Join
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} data-testid="create-member-group-modal">
            <h2 style={{ margin: '0 0 16px' }}>Create a Member Group</h2>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '20px' }}>
              Start a group to find housemates. Once your group is ready, you can apply for properties together.
            </p>
            <form onSubmit={createMemberGroup}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '14px' }}>Group Name</label>
                <input type="text" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} required placeholder="e.g., Brisbane Buddies" style={{ width: '100%', padding: '10px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} data-testid="member-group-name-input" />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '14px' }}>Group Type</label>
                <select value={newGroupType} onChange={(e) => setNewGroupType(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} data-testid="member-group-type-select">
                  <option value="Mixed">Mixed</option>
                  <option value="SingleFemale">Single Female</option>
                  <option value="SingleMale">Single Male</option>
                  <option value="Couples">Couples</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} data-testid="submit-member-group-btn">Create Group</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)} style={{ flex: 1 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


const MyGroupApplications = ({ currentUser, getAuthConfig }) => {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchApps = async () => {
    try {
      const res = await axios.get(`${API}/group-applications/my`, getAuthConfig());
      setApps(res.data);
    } catch (e) { /* silent */ }
    setLoading(false);
  };

  useEffect(() => { fetchApps(); }, []);

  const withdrawApp = async (appId, status) => {
    const msg = status === 'approved'
      ? 'Withdraw this APPROVED application? Group members will be notified.'
      : status === 'pending'
      ? 'Withdraw this pending application? Group members will be notified.'
      : 'Delete this rejected application?';
    if (!window.confirm(msg)) return;
    try {
      await axios.delete(`${API}/group-applications/${appId}`, getAuthConfig());
      fetchApps();
    } catch (e) { alert(e.response?.data?.detail || 'Failed to withdraw'); }
  };

  if (loading) return <p style={{ color: '#6b7280', fontSize: '14px' }}>Loading...</p>;
  if (apps.length === 0) return <p style={{ color: '#6b7280', fontSize: '14px' }}>No group applications yet. Join a group on a property page, then the group creator can apply.</p>;

  const statusStyle = (s) => ({
    padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase',
    background: s === 'approved' ? '#d1fae5' : s === 'rejected' ? '#fef2f2' : '#fef3c7',
    color: s === 'approved' ? '#059669' : s === 'rejected' ? '#ef4444' : '#d97706'
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }} data-testid="my-group-applications">
      {apps.map(app => (
        <div key={app.application_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }} data-testid={`my-gapp-${app.application_id}`}>
          <div>
            <strong style={{ fontSize: '14px' }}>{app.group_name}</strong>
            <span style={{ fontSize: '13px', color: '#6b7280' }}> — {app.property_city}, {app.property_state}</span>
            <div style={{ marginTop: '4px' }}>
              <span style={statusStyle(app.status)}>{app.status}</span>
              <span style={{ fontSize: '12px', color: '#9ca3af', marginLeft: '8px' }}>{new Date(app.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          <button
            onClick={() => withdrawApp(app.application_id, app.status)}
            style={{ padding: '6px 14px', fontSize: '12px', background: 'none', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
            data-testid={`withdraw-gapp-${app.application_id}`}
          >
            {app.status === 'rejected' ? 'Delete' : 'Withdraw'}
          </button>
        </div>
      ))}
    </div>
  );
};

const MemberDashboard = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [shortlists, setShortlists] = useState([]);
  const [activeTab, setActiveTab] = useState('properties');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Properties state
  const [allProperties, setAllProperties] = useState([]);
  const [propertySearch, setPropertySearch] = useState('');
  const [propertyFilter, setPropertyFilter] = useState({ state: '', bedrooms: '' });

  // Search/Filter state (members)
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
  
  // Groups state
  const [groups, setGroups] = useState([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupForm, setGroupForm] = useState({ name: '', description: '', housing_preference: '' });
  
  // Messages state
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [conversationMessages, setConversationMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [messageRecipient, setMessageRecipient] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchCurrentUser();
    fetchMembers();
    fetchShortlists();
    fetchFavorites();
    fetchGroups();
    fetchConversations();
    fetchProperties();
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

  const fetchProperties = async () => {
    try {
      const res = await axios.get(`${API}/properties`);
      setAllProperties(res.data);
    } catch (e) { /* silent */ }
  };

  const filteredProperties = allProperties.filter(p => {
    if (propertySearch && !`${p.city} ${p.state} ${p.address}`.toLowerCase().includes(propertySearch.toLowerCase())) return false;
    if (propertyFilter.state && p.state !== propertyFilter.state) return false;
    if (propertyFilter.bedrooms && p.bedrooms !== parseInt(propertyFilter.bedrooms)) return false;
    return true;
  });

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

  // Groups functions
  const fetchGroups = async () => {
    try {
      const response = await axios.get(`${API}/groups`, getAuthConfig());
      setGroups(response.data);
    } catch (e) { console.error('Failed to fetch groups:', e); }
  };

  const joinGroup = async (groupId) => {
    try {
      await axios.post(`${API}/groups/${groupId}/join`, {}, getAuthConfig());
      fetchGroups();
    } catch (error) { alert(error.response?.data?.detail || 'Failed to join group'); }
  };

  const leaveGroup = async (groupId) => {
    try {
      await axios.post(`${API}/groups/${groupId}/leave`, {}, getAuthConfig());
      fetchGroups();
    } catch (error) { alert('Failed to leave group'); }
  };

  const deleteGroup = async (groupId) => {
    if (!window.confirm('Delete this group?')) return;
    try {
      await axios.delete(`${API}/groups/${groupId}`, getAuthConfig());
      fetchGroups();
    } catch (error) { alert('Failed to delete group'); }
  };

  // Messages functions
  const fetchConversations = async () => {
    try {
      const response = await axios.get(`${API}/messages/conversations`, getAuthConfig());
      setConversations(response.data);
      const unread = response.data.reduce((sum, c) => sum + c.unread_count, 0);
      setUnreadCount(unread);
    } catch (e) { console.error('Failed to fetch conversations:', e); }
  };

  const openConversation = async (conversationId) => {
    setActiveConversation(conversationId);
    try {
      const response = await axios.get(`${API}/messages/${conversationId}`, getAuthConfig());
      setConversationMessages(response.data);
      fetchConversations();
    } catch (error) { console.error('Failed to fetch messages:', error); }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const toUserId = messageRecipient || (() => {
      const conv = conversations.find(c => c.conversation_id === activeConversation);
      if (!conv) return null;
      const msg = conv.last_message;
      return msg.from_user_id === currentUser?.user_id ? msg.to_user_id : msg.from_user_id;
    })();
    if (!toUserId) return;
    try {
      await axios.post(`${API}/messages`, { to_user_id: toUserId, content: newMessage }, getAuthConfig());
      setNewMessage('');
      if (activeConversation) openConversation(activeConversation);
      else {
        fetchConversations();
        const pair = [currentUser.user_id, toUserId].sort();
        const convId = `conv_${pair[0]}_${pair[1]}`;
        setActiveConversation(convId);
        openConversation(convId);
      }
      setMessageRecipient(null);
    } catch (error) { alert(error.response?.data?.detail || 'Failed to send message'); }
  };

  const startNewMessage = (userId, userName) => {
    setActiveTab('messages');
    setMessageRecipient(userId);
    const pair = [currentUser.user_id, userId].sort();
    const convId = `conv_${pair[0]}_${pair[1]}`;
    const existingConv = conversations.find(c => c.conversation_id === convId);
    if (existingConv) {
      openConversation(convId);
    } else {
      setActiveConversation(null);
      setConversationMessages([]);
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <NotificationBell />
              <button className="btn btn-secondary" onClick={handleLogout} data-testid="logout-btn">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container">
        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button
            className={`tab-btn ${activeTab === 'properties' ? 'active' : ''}`}
            onClick={() => setActiveTab('properties')}
            data-testid="properties-tab"
          >
            Properties
          </button>
          <button
            className={`tab-btn ${activeTab === 'browse' ? 'active' : ''}`}
            onClick={() => setActiveTab('browse')}
            data-testid="browse-tab"
          >
            Members
          </button>
          <button
            className={`tab-btn ${activeTab === 'saved' ? 'active' : ''}`}
            onClick={() => setActiveTab('saved')}
            data-testid="saved-tab"
          >
            Saved ({favorites.length + shortlists.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'group-directory' ? 'active' : ''}`}
            onClick={() => setActiveTab('group-directory')}
            data-testid="group-directory-tab"
          >
            Group Directory
          </button>
          <button
            className={`tab-btn ${activeTab === 'groups' ? 'active' : ''}`}
            onClick={() => setActiveTab('groups')}
            data-testid="groups-tab"
          >
            My Groups ({groups.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'messages' ? 'active' : ''}`}
            onClick={() => { setActiveTab('messages'); fetchConversations(); }}
            data-testid="messages-tab"
          >
            Messages {unreadCount > 0 && <span style={{ background: '#ef4444', color: 'white', borderRadius: '10px', padding: '2px 8px', fontSize: '12px', marginLeft: '4px' }}>{unreadCount}</span>}
          </button>
          <button
            className={`tab-btn ${activeTab === 'community' ? 'active' : ''}`}
            onClick={() => setActiveTab('community')}
            data-testid="community-tab"
          >
            Community Chat
          </button>
          <button
            className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
            data-testid="settings-tab"
          >
            Settings
          </button>
        </div>

        {/* Properties Tab */}
        {activeTab === 'properties' && (
          <div className="properties-section" data-testid="properties-section">
            <div className="section-header">
              <h2>Browse Properties</h2>
              <p>Find shared housing that suits your needs</p>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Search by suburb, state..."
                value={propertySearch}
                onChange={(e) => setPropertySearch(e.target.value)}
                style={{ flex: 1, minWidth: '200px', padding: '10px 14px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
                data-testid="property-search-input"
              />
              <select
                value={propertyFilter.state}
                onChange={(e) => setPropertyFilter({ ...propertyFilter, state: e.target.value })}
                style={{ padding: '10px 14px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
                data-testid="property-state-filter"
              >
                <option value="">All States</option>
                <option value="QLD">QLD</option><option value="NSW">NSW</option><option value="VIC">VIC</option>
                <option value="SA">SA</option><option value="WA">WA</option><option value="TAS">TAS</option>
                <option value="NT">NT</option><option value="ACT">ACT</option>
              </select>
              <select
                value={propertyFilter.bedrooms}
                onChange={(e) => setPropertyFilter({ ...propertyFilter, bedrooms: e.target.value })}
                style={{ padding: '10px 14px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
                data-testid="property-bedrooms-filter"
              >
                <option value="">All Bedrooms</option>
                <option value="2">2 Bed</option><option value="3">3 Bed</option>
                <option value="4">4 Bed</option><option value="5">5+ Bed</option>
              </select>
            </div>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '16px' }}>{filteredProperties.length} properties found</p>
            {filteredProperties.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>No properties match your search.</div>
            ) : (
              <div className="members-grid">
                {filteredProperties.map(prop => {
                  const r = prop.weekly_rent_per_person || 0;
                  const sCRA = Math.min(71.80, Math.max(0, 0.75 * (r - 76)));
                  const netSingle = (r - sCRA).toFixed(2);
                  return (
                    <div
                      key={prop.property_id}
                      className="member-card"
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/properties/${prop.property_id}`)}
                      data-testid={`property-card-${prop.property_id}`}
                    >
                      {prop.images?.[0] && (
                        <div style={{ width: '100%', height: '140px', overflow: 'hidden', borderRadius: '8px', marginBottom: '10px' }}>
                          <img src={prop.images[0]} alt={prop.city} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      )}
                      <div className="member-info">
                        <h3 style={{ margin: '0 0 4px' }}>{prop.city}, {prop.state}</h3>
                        <p style={{ fontSize: '13px', color: '#6b7280', margin: '2px 0' }}>{prop.bedrooms} bed &middot; {prop.bathrooms} bath &middot; {prop.property_type}</p>
                        <p style={{ color: '#2563eb', fontWeight: '700', fontSize: '18px', margin: '6px 0 2px' }}>${r}/wk per bedroom</p>
                        {sCRA > 0 && <p style={{ fontSize: '12px', color: '#059669', margin: 0 }}>With CRA: ${netSingle}/wk (single)</p>}
                        {prop.property_code && <p style={{ fontSize: '11px', color: '#9ca3af', margin: '4px 0 0' }}>Code: {prop.property_code}</p>}
                      </div>
                      <div className="member-actions" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => toggleFavorite(prop.property_id, 'property')}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: isFavorited(prop.property_id, 'property') ? '#ef4444' : '#d1d5db' }}
                          data-testid={`fav-prop-btn-${prop.property_id}`}
                          title={isFavorited(prop.property_id, 'property') ? 'Remove from saved' : 'Save property'}
                        >
                          {isFavorited(prop.property_id, 'property') ? '♥' : '♡'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

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
                        <img src={member.picture} alt={member.username || member.name} />
                      ) : (
                        <div className="avatar-placeholder">{(member.username || member.name).charAt(0)}</div>
                      )}
                    </div>
                    <div className="member-info">
                      <h3 style={{ cursor: 'pointer', color: '#2563eb' }} onClick={() => navigate(`/members/${member.user_id}`)} data-testid={`member-name-${member.user_id}`}>{member.username || member.name}</h3>
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
                      <button
                        className="btn btn-sm"
                        onClick={() => startNewMessage(member.user_id, member.username || member.name)}
                        style={{ marginRight: '8px', fontSize: '12px', padding: '4px 10px' }}
                        data-testid={`msg-member-btn-${member.user_id}`}
                      >
                        Message
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

        {/* Saved Tab (merged Shortlist + Favorites) */}
        {activeTab === 'saved' && (
          <div className="saved-section" data-testid="saved-section">
            <div className="section-header">
              <h2>Saved Items</h2>
              <p>Properties and members you've saved or shortlisted</p>
            </div>

            {favorites.length === 0 && shortlists.length === 0 ? (
              <div className="empty-shortlist">
                <p>Nothing saved yet. Browse properties or members and click the heart icon to save them.</p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <button className="btn btn-primary" onClick={() => setActiveTab('properties')} data-testid="browse-properties-btn">
                    Browse Properties
                  </button>
                  <button className="btn btn-secondary" onClick={() => setActiveTab('browse')} data-testid="browse-members-from-saved-btn">
                    Browse Members
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Saved Properties */}
                {favorites.filter(f => f.item_type === 'property').length > 0 && (
                  <div style={{ marginBottom: '32px' }}>
                    <h3 style={{ color: '#1a2332', marginBottom: '16px' }}>Saved Properties ({favorites.filter(f => f.item_type === 'property').length})</h3>
                    <div className="members-grid">
                      {favorites.filter(f => f.item_type === 'property' && f.item_data).map((fav) => (
                        <div key={fav.favorite_id} className="member-card" style={{ cursor: 'pointer' }} data-testid={`saved-property-card-${fav.favorite_id}`}>
                          <div className="member-info" onClick={() => navigate(`/properties/${fav.item_id}`)}>
                            <h3>{fav.item_data.city}, {fav.item_data.state}</h3>
                            <p style={{ color: '#2563eb', fontWeight: '700', fontSize: '18px' }}>${fav.item_data.weekly_rent_per_person}/wk per bedroom</p>
                          </div>
                          <div className="member-actions">
                            <button className="btn btn-danger" onClick={() => removeFavorite(fav.favorite_id)} data-testid={`remove-saved-${fav.favorite_id}`}>
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Shortlisted Members */}
                {shortlists.length > 0 && (
                  <div style={{ marginBottom: '32px' }}>
                    <h3 style={{ color: '#1a2332', marginBottom: '16px' }}>Shortlisted Members ({shortlists.length})</h3>
                    <div className="members-grid">
                      {shortlists.map((item) => (
                        <div key={item.shortlist_id} className="member-card" data-testid={`shortlist-card-${item.shortlist_id}`}>
                          <div className="member-avatar">
                            {item.member.picture ? (
                              <img src={item.member.picture} alt={item.member.username || item.member.name} />
                            ) : (
                              <div className="avatar-placeholder">{(item.member.username || item.member.name).charAt(0)}</div>
                            )}
                          </div>
                          <div className="member-info">
                            <h3>{item.member.username || item.member.name}</h3>
                            <p className="member-date">Added {new Date(item.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="member-actions">
                            <button className="btn btn-danger" onClick={() => removeFromShortlist(item.shortlist_id)} data-testid={`remove-shortlist-${item.shortlist_id}`}>
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Saved Members */}
                {favorites.filter(f => f.item_type === 'member').length > 0 && (
                  <div>
                    <h3 style={{ color: '#1a2332', marginBottom: '16px' }}>Saved Members ({favorites.filter(f => f.item_type === 'member').length})</h3>
                    <div className="members-grid">
                      {favorites.filter(f => f.item_type === 'member' && f.item_data).map((fav) => (
                        <div key={fav.favorite_id} className="member-card" data-testid={`saved-member-card-${fav.favorite_id}`}>
                          <div className="member-avatar">
                            <div className="avatar-placeholder">{(fav.item_data.name || 'M').charAt(0)}</div>
                          </div>
                          <div className="member-info">
                            <h3>{fav.item_data.name}</h3>
                            <p className="member-date">Saved {new Date(fav.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="member-actions">
                            <button className="btn btn-danger" onClick={() => removeFavorite(fav.favorite_id)} data-testid={`remove-saved-${fav.favorite_id}`}>
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
        )}}
        {/* Group Directory Tab */}
        {activeTab === 'group-directory' && (
          <GroupDirectory currentUser={currentUser} getAuthConfig={getAuthConfig} navigate={navigate} />
        )}

        {/* Groups Tab */}
        {activeTab === 'groups' && (
          <div className="groups-section" data-testid="groups-section">
            <div className="section-header">
              <h2>Property Groups</h2>
              <p>Groups form around properties. Browse properties to create or join a group.</p>
            </div>

            {groups.length === 0 ? (
              <div className="empty-shortlist">
                <p>No groups yet. Visit a property page to create a group for it.</p>
                <button className="btn btn-primary" onClick={() => navigate('/properties')} data-testid="browse-props-for-groups">
                  Browse Properties
                </button>
              </div>
            ) : (
              <div className="members-grid">
                {groups.map(group => {
                  const isMember = group.members?.some(m => m.user_id === currentUser?.user_id);
                  const isWaitlisted = group.waitlist?.some(w => w.user_id === currentUser?.user_id);
                  const isCreator = group.created_by === currentUser?.user_id;
                  const statusColors = { vacancies: '#059669', full: '#d97706', fulfilled: '#2563eb', on_hold: '#6b7280' };
                  return (
                    <div key={group.group_id} className="member-card" data-testid={`group-card-${group.group_id}`}>
                      <div className="member-info">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h3 style={{ margin: 0 }}>{group.name}</h3>
                          <span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '12px', background: statusColors[group.status] || '#6b7280', color: 'white', textTransform: 'uppercase' }}>{group.status?.replace('_', ' ')}</span>
                        </div>
                        <p style={{ color: '#2563eb', fontSize: '13px', margin: '4px 0', cursor: 'pointer' }} onClick={() => navigate(`/properties/${group.property_id}`)}>
                          {group.property_city}, {group.property_state} — ${group.property_rent}/wk per bedroom
                        </p>
                        <p style={{ fontSize: '13px', color: '#6b7280', margin: '2px 0' }}>
                          Type: {group.group_type} &middot; {group.spots_taken}/{group.max_spots} members
                          {group.spots_available > 0 && <span style={{ color: '#059669', fontWeight: '600' }}> &middot; {group.spots_available} spot{group.spots_available !== 1 ? 's' : ''} left</span>}
                          {group.waitlist_count > 0 && <span style={{ color: '#d97706' }}> &middot; {group.waitlist_count} waitlisted</span>}
                        </p>
                        {group.members?.length > 0 && (
                          <div style={{ fontSize: '12px', color: '#4b5563', marginTop: '6px' }}>
                            Members: {group.members.map((m, i) => (
                              <span key={m.user_id}>{i > 0 ? ', ' : ''}<span style={{ cursor: 'pointer', color: '#2563eb' }} onClick={() => navigate(`/members/${m.user_id}`)}>{m.name}{m.is_couple ? ' (couple)' : ''}</span></span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="member-actions" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {isMember ? (
                          <>
                            <span style={{ fontSize: '12px', color: '#059669', fontWeight: '600' }}>Joined</span>
                            {!isCreator && <button className="btn btn-sm btn-danger" onClick={() => leaveGroup(group.group_id)}>Leave</button>}
                          </>
                        ) : isWaitlisted ? (
                          <>
                            <span style={{ fontSize: '12px', color: '#d97706', fontWeight: '600' }}>Waitlisted</span>
                            <button className="btn btn-sm" onClick={() => leaveGroup(group.group_id)}>Leave Waitlist</button>
                          </>
                        ) : group.status !== 'fulfilled' && group.status !== 'on_hold' ? (
                          <button className="btn btn-sm btn-primary" onClick={() => joinGroup(group.group_id)} data-testid={`join-group-${group.group_id}`}>
                            {group.spots_available > 0 ? 'Join' : 'Join Waitlist'}
                          </button>
                        ) : null}
                        {isCreator && <button className="btn btn-sm btn-danger" onClick={() => deleteGroup(group.group_id)} style={{ marginTop: '4px' }}>Delete</button>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div className="messages-section" data-testid="messages-section" style={{ display: 'flex', gap: '20px', minHeight: '500px' }}>
            {/* Conversations List */}
            <div style={{ width: '280px', flexShrink: 0, background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb', fontWeight: '700', color: '#1a2332' }}>
                Conversations
              </div>
              {conversations.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
                  No messages yet.<br/>Click "Message" on a member to start.
                </div>
              ) : (
                conversations.map(conv => {
                  const msg = conv.last_message;
                  const otherName = msg.from_user_id === currentUser?.user_id ? msg.to_name : msg.from_name;
                  return (
                    <div
                      key={conv.conversation_id}
                      onClick={() => openConversation(conv.conversation_id)}
                      style={{
                        padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6',
                        background: activeConversation === conv.conversation_id ? '#eff6ff' : 'white'
                      }}
                      data-testid={`conv-${conv.conversation_id}`}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '14px' }}>{otherName}</strong>
                        {conv.unread_count > 0 && <span style={{ background: '#ef4444', color: 'white', borderRadius: '10px', padding: '2px 8px', fontSize: '11px' }}>{conv.unread_count}</span>}
                      </div>
                      <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {msg.content}
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Chat Area */}
            <div style={{ flex: 1, background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' }}>
              {activeConversation || messageRecipient ? (
                <>
                  <div style={{ flex: 1, padding: '16px', overflowY: 'auto', maxHeight: '400px' }}>
                    {conversationMessages.length === 0 ? (
                      <div style={{ textAlign: 'center', color: '#9ca3af', padding: '40px' }}>Start the conversation!</div>
                    ) : (
                      conversationMessages.map(msg => (
                        <div key={msg.message_id} style={{ marginBottom: '12px', display: 'flex', justifyContent: msg.from_user_id === currentUser?.user_id ? 'flex-end' : 'flex-start' }}>
                          <div style={{
                            maxWidth: '70%', padding: '10px 14px', borderRadius: '12px',
                            background: msg.from_user_id === currentUser?.user_id ? '#2563eb' : '#f3f4f6',
                            color: msg.from_user_id === currentUser?.user_id ? 'white' : '#1a2332'
                          }} data-testid={`msg-${msg.message_id}`}>
                            <p style={{ margin: 0, fontSize: '14px' }}>{msg.content}</p>
                            <p style={{ margin: '4px 0 0', fontSize: '10px', opacity: 0.7 }}>{new Date(msg.created_at).toLocaleTimeString()}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <form onSubmit={sendMessage} style={{ display: 'flex', gap: '8px', padding: '12px', borderTop: '1px solid #e5e7eb' }}>
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      style={{ flex: 1, padding: '10px 14px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
                      data-testid="message-input"
                    />
                    <button type="submit" className="btn btn-primary" style={{ padding: '10px 20px' }} data-testid="send-message-btn">Send</button>
                  </form>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#9ca3af' }}>
                  Select a conversation or message a member to start chatting
                </div>
              )}
            </div>
          </div>
        )}


        {/* Community Chat Tab */}
        {activeTab === 'community' && (
          <div className="community-chat-section" data-testid="community-chat-dashboard">
            <div className="section-header">
              <h2>Community Chat</h2>
              <p>Chat with all members of the House Sharing Seniors community</p>
            </div>
            <div style={{ maxWidth: '700px' }}>
              <ChatBox
                channelType="community"
                channelId="community"
                currentUser={currentUser}
                title="Community Chat"
                height="500px"
              />
            </div>
          </div>
        )}


        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="settings-section" data-testid="settings-section">
            <div className="section-header">
              <h2>Account Settings</h2>
              <p>Manage your profile, notifications, and password</p>
            </div>

            <div style={{ maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

              {/* Profile Section */}
              <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 style={{ margin: '0 0 20px 0', color: '#1a2332' }}>Profile</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                  <div style={{ position: 'relative' }}>
                    {currentUser?.avatar_url ? (
                      <img src={currentUser.avatar_url} alt="Avatar" style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #e5e7eb' }} />
                    ) : (
                      <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: '700', color: '#6b7280' }}>
                        {currentUser?.name?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <label style={{ position: 'absolute', bottom: '-4px', right: '-4px', background: '#2563eb', color: 'white', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '12px', border: '2px solid white' }}>
                      <i className="fa fa-camera" />
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={async (e) => {
                          const file = e.target.files[0];
                          if (!file) return;
                          const formData = new FormData();
                          formData.append('file', file);
                          try {
                            const res = await axios.post(`${API}/users/avatar`, formData, {
                              ...getAuthConfig(),
                              headers: { ...getAuthConfig().headers, 'Content-Type': 'multipart/form-data' }
                            });
                            setCurrentUser(prev => ({ ...prev, avatar_url: res.data.avatar_url }));
                            alert('Avatar updated!');
                          } catch (err) { alert(err.response?.data?.detail || 'Upload failed'); }
                        }}
                        data-testid="avatar-upload-input"
                      />
                    </label>
                  </div>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '16px', color: '#1a2332' }}>{currentUser?.name}</div>
                    <div style={{ fontSize: '13px', color: '#6b7280' }}>@{currentUser?.username || 'no-username'}</div>
                  </div>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '14px' }}>Display Name</label>
                  <input
                    type="text"
                    defaultValue={currentUser?.display_name || ''}
                    placeholder="How you appear to other members"
                    onBlur={async (e) => {
                      const val = e.target.value.trim();
                      try {
                        const res = await axios.patch(`${API}/users/profile`, { display_name: val }, getAuthConfig());
                        setCurrentUser(prev => ({ ...prev, display_name: res.data.display_name }));
                      } catch (err) { /* silent */ }
                    }}
                    style={{ width: '100%', padding: '10px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                    data-testid="display-name-input"
                  />
                  <span style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px', display: 'block' }}>Leave blank to use your username publicly</span>
                </div>
              </div>

              {/* About Me - Editable Profile */}
              <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 style={{ margin: '0 0 20px 0', color: '#1a2332' }}>About Me</h3>
                {[
                  { key: 'bio', label: 'Short Bio', type: 'textarea', placeholder: 'Tell other members a bit about yourself...' },
                  { key: 'interests', label: 'Interests & Hobbies', type: 'textarea', placeholder: 'e.g., gardening, reading, cooking...' },
                  { key: 'daily_routine', label: 'Daily Routine', type: 'textarea', placeholder: 'e.g., Early riser, enjoy quiet evenings...' },
                  { key: 'location', label: 'Location', type: 'text', placeholder: 'e.g., Brisbane, QLD' },
                  { key: 'housing_preference', label: 'Housing Preference', type: 'text', placeholder: 'e.g., Shared house, close to transport' },
                  { key: 'dietary_preferences', label: 'Dietary Preferences', type: 'text', placeholder: 'e.g., Vegetarian, no allergies' },
                ].map(({ key, label, type, placeholder }) => (
                  <div key={key} style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '14px' }}>{label}</label>
                    {type === 'textarea' ? (
                      <textarea
                        defaultValue={currentUser?.[key] || ''}
                        placeholder={placeholder}
                        rows={3}
                        onBlur={async (e) => {
                          try { await axios.patch(`${API}/users/profile`, { [key]: e.target.value }, getAuthConfig()); } catch (err) { /* silent */ }
                        }}
                        style={{ width: '100%', padding: '10px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical' }}
                        data-testid={`profile-${key}-input`}
                      />
                    ) : (
                      <input
                        type="text"
                        defaultValue={currentUser?.[key] || ''}
                        placeholder={placeholder}
                        onBlur={async (e) => {
                          try { await axios.patch(`${API}/users/profile`, { [key]: e.target.value }, getAuthConfig()); } catch (err) { /* silent */ }
                        }}
                        style={{ width: '100%', padding: '10px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                        data-testid={`profile-${key}-input`}
                      />
                    )}
                  </div>
                ))}
                <p style={{ fontSize: '12px', color: '#9ca3af' }}>Changes save automatically when you click away from a field.</p>
              </div>

              {/* My Group Applications */}
              <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 style={{ margin: '0 0 20px 0', color: '#1a2332' }}>My Group Applications</h3>
                <MyGroupApplications currentUser={currentUser} getAuthConfig={getAuthConfig} />
              </div>

              {/* Notification Preferences */}
              <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 style={{ margin: '0 0 20px 0', color: '#1a2332' }}>Notification Preferences</h3>
                {[
                  { key: 'push', label: 'In-App Notifications', desc: 'Bell icon alerts in the dashboard' },
                  { key: 'email', label: 'Email Notifications', desc: 'Receive email for important updates' },
                  { key: 'sms', label: 'SMS Notifications', desc: 'Text messages for urgent alerts (coming soon)' }
                ].map(({ key, label, desc }) => (
                  <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '14px', color: '#1a2332' }}>{label}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>{desc}</div>
                    </div>
                    <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={currentUser?.notification_prefs?.[key] ?? (key !== 'sms')}
                        onChange={async (e) => {
                          const newPrefs = { ...(currentUser?.notification_prefs || { email: true, sms: false, push: true }), [key]: e.target.checked };
                          try {
                            await axios.patch(`${API}/users/profile`, { notification_prefs: newPrefs }, getAuthConfig());
                            setCurrentUser(prev => ({ ...prev, notification_prefs: newPrefs }));
                          } catch (err) { /* silent */ }
                        }}
                        style={{ opacity: 0, width: 0, height: 0 }}
                        data-testid={`notif-toggle-${key}`}
                      />
                      <span style={{
                        position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                        background: (currentUser?.notification_prefs?.[key] ?? (key !== 'sms')) ? '#2563eb' : '#d1d5db',
                        borderRadius: '12px', transition: 'background 0.2s'
                      }}>
                        <span style={{
                          position: 'absolute', content: '""', height: '18px', width: '18px', left: (currentUser?.notification_prefs?.[key] ?? (key !== 'sms')) ? '22px' : '3px',
                          bottom: '3px', background: 'white', borderRadius: '50%', transition: 'left 0.2s'
                        }} />
                      </span>
                    </label>
                  </div>
                ))}
              </div>

              {/* Change Password */}
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
