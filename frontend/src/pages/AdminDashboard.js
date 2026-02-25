import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('applications');
  const [applications, setApplications] = useState([]);
  const [properties, setProperties] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [adminNotes, setAdminNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [stats, setStats] = useState({ applications: 0, pending: 0, properties: 0, members: 0 });

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    if (activeTab === 'applications') fetchApplications();
  }, [filterStatus]);

  const fetchAllData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const config = { withCredentials: true, headers: { Authorization: `Bearer ${token}` } };
      
      const [appsRes, propsRes, membersRes] = await Promise.all([
        axios.get(`${API}/applications`, config),
        axios.get(`${API}/properties`),
        axios.get(`${API}/members`, config).catch(() => ({ data: [] }))
      ]);
      
      setApplications(appsRes.data);
      setProperties(propsRes.data);
      setMembers(membersRes.data);
      
      setStats({
        applications: appsRes.data.length,
        pending: appsRes.data.filter(a => a.status === 'pending').length,
        properties: propsRes.data.length,
        members: membersRes.data.length
      });
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const url = filterStatus === 'all' 
        ? `${API}/applications` 
        : `${API}/applications?status=${filterStatus}`;
      const response = await axios.get(url, { 
        withCredentials: true,
        headers: { Authorization: `Bearer ${token}` }
      });
      setApplications(response.data);
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewApplication = async (app) => {
    setSelectedApp(app);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API}/admin-notes/${app.application_id}`, {
        withCredentials: true,
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdminNotes(response.data);
    } catch (error) {
      console.error('Failed to fetch notes:', error);
    }
  };

  const updateApplicationStatus = async (applicationId, status) => {
    try {
      const token = localStorage.getItem('auth_token');
      await axios.patch(
        `${API}/applications/${applicationId}/status?status=${status}`,
        {},
        { withCredentials: true, headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`Application ${status} successfully! Email sent to applicant.`);
      setSelectedApp(null);
      fetchApplications();
      fetchAllData();
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update application status');
    }
  };

  const addNote = async () => {
    if (!newNote.trim()) return;
    try {
      const token = localStorage.getItem('auth_token');
      await axios.post(
        `${API}/admin-notes?application_id=${selectedApp.application_id}&note=${encodeURIComponent(newNote)}`,
        {},
        { withCredentials: true, headers: { Authorization: `Bearer ${token}` } }
      );
      setNewNote('');
      const response = await axios.get(`${API}/admin-notes/${selectedApp.application_id}`, {
        withCredentials: true, headers: { Authorization: `Bearer ${token}` }
      });
      setAdminNotes(response.data);
    } catch (error) {
      console.error('Failed to add note:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
      localStorage.removeItem('auth_token');
      navigate('/');
    } catch (error) {
      localStorage.removeItem('auth_token');
      navigate('/');
    }
  };

  const deleteProperty = async (propertyId) => {
    if (!window.confirm('Are you sure you want to delete this property?')) return;
    try {
      const token = localStorage.getItem('auth_token');
      await axios.delete(`${API}/properties/${propertyId}`, {
        withCredentials: true, headers: { Authorization: `Bearer ${token}` }
      });
      setProperties(properties.filter(p => p.property_id !== propertyId));
      setStats(prev => ({ ...prev, properties: prev.properties - 1 }));
    } catch (error) {
      alert('Failed to delete property');
    }
  };

  return (
    <div className="admin-dashboard" data-testid="admin-dashboard">
      <header className="dashboard-header">
        <div className="container">
          <div className="header-content">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <img src="/logo.png" alt="House Sharing Seniors" className="dashboard-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }} />
              <h1>Admin Dashboard</h1>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-primary" onClick={() => navigate('/properties/add')}>+ Add Property</button>
              <button className="btn btn-secondary" onClick={handleLogout} data-testid="logout-btn">Logout</button>
            </div>
          </div>
        </div>
      </header>

      <div className="container">
        {/* Stats Cards */}
        <div className="stats-row">
          <div className="stat-card" onClick={() => setActiveTab('applications')}>
            <div className="stat-number">{stats.applications}</div>
            <div className="stat-label">Total Applications</div>
          </div>
          <div className="stat-card stat-pending" onClick={() => { setActiveTab('applications'); setFilterStatus('pending'); }}>
            <div className="stat-number">{stats.pending}</div>
            <div className="stat-label">Pending Review</div>
          </div>
          <div className="stat-card" onClick={() => setActiveTab('properties')}>
            <div className="stat-number">{stats.properties}</div>
            <div className="stat-label">Properties</div>
          </div>
          <div className="stat-card" onClick={() => setActiveTab('members')}>
            <div className="stat-number">{stats.members}</div>
            <div className="stat-label">Approved Members</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="admin-tabs">
          <button className={`admin-tab ${activeTab === 'applications' ? 'active' : ''}`} onClick={() => setActiveTab('applications')}>
            Applications
          </button>
          <button className={`admin-tab ${activeTab === 'properties' ? 'active' : ''}`} onClick={() => setActiveTab('properties')}>
            Properties
          </button>
          <button className={`admin-tab ${activeTab === 'members' ? 'active' : ''}`} onClick={() => setActiveTab('members')}>
            Members
          </button>
        </div>

        {/* Applications Tab */}
        {activeTab === 'applications' && (
          <div className="dashboard-content">
            <div className="applications-sidebar">
              <div className="filter-bar">
                <h2>Applications</h2>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="filter-select">
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              {loading ? (
                <div className="loading">Loading...</div>
              ) : applications.length === 0 ? (
                <p className="no-applications">No applications found</p>
              ) : (
                <div className="applications-list">
                  {applications.map((app) => (
                    <div key={app.application_id} className={`application-item ${selectedApp?.application_id === app.application_id ? 'active' : ''}`} onClick={() => viewApplication(app)}>
                      <div className="app-item-header">
                        <h3>{app.given_name || app.first_name} {app.family_name || app.last_name}</h3>
                        <span className={`status-badge status-${app.status}`}>{app.status}</span>
                      </div>
                      <p className="app-item-email">{app.email}</p>
                      <p className="app-item-date">{new Date(app.created_at).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="application-details">
              {!selectedApp ? (
                <div className="no-selection"><p>Select an application to view details</p></div>
              ) : (
                <div data-testid="app-details">
                  <div className="details-header">
                    <h2>{selectedApp.given_name || selectedApp.first_name} {selectedApp.family_name || selectedApp.last_name}</h2>
                    <div className="action-buttons">
                      {selectedApp.status === 'pending' && (
                        <>
                          <button className="btn btn-success" onClick={() => updateApplicationStatus(selectedApp.application_id, 'approved')}>Approve</button>
                          <button className="btn btn-danger" onClick={() => updateApplicationStatus(selectedApp.application_id, 'rejected')}>Reject</button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="details-sections">
                    <div className="details-section">
                      <h3>Contact</h3>
                      <div className="detail-row"><span className="detail-label">Email:</span><span>{selectedApp.email}</span></div>
                      <div className="detail-row"><span className="detail-label">Phone:</span><span>{selectedApp.phone || 'N/A'}</span></div>
                    </div>
                    <div className="details-section">
                      <h3>Housing Preference</h3>
                      <div className="detail-row"><span className="detail-label">Type:</span><span>{selectedApp.shared_housing_type || 'N/A'}</span></div>
                      <div className="detail-row"><span className="detail-label">Location:</span><span>{selectedApp.preferred_location || selectedApp.city || 'N/A'}</span></div>
                    </div>
                    <div className="details-section notes-section">
                      <h3>Admin Notes</h3>
                      <div className="notes-list">
                        {adminNotes.length === 0 ? <p className="no-notes">No notes yet</p> : adminNotes.map((note) => (
                          <div key={note.note_id} className="note-item"><p>{note.note}</p><small>{new Date(note.created_at).toLocaleString()}</small></div>
                        ))}
                      </div>
                      <div className="add-note">
                        <textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Add a note..." className="input-field" rows="2" />
                        <button className="btn btn-primary" onClick={addNote}>Add Note</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Properties Tab */}
        {activeTab === 'properties' && (
          <div className="admin-table-section">
            <div className="section-header">
              <h2>All Properties ({properties.length})</h2>
              <button className="btn btn-primary" onClick={() => navigate('/properties/add')}>+ Add Property</button>
            </div>
            {properties.length === 0 ? (
              <div className="empty-state">
                <p>No properties yet.</p>
                <button className="btn btn-primary" onClick={() => navigate('/properties/add')}>Add Your First Property</button>
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Location</th>
                    <th>Type</th>
                    <th>Rent/week</th>
                    <th>Bedrooms</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {properties.map((prop) => (
                    <tr key={prop.property_id}>
                      <td>{prop.city}, {prop.state}</td>
                      <td>{prop.property_type}</td>
                      <td>${prop.weekly_rent_per_person}</td>
                      <td>{prop.available_bedrooms || '?'} / {prop.total_bedrooms || '?'}</td>
                      <td><span className={`status-badge status-${prop.status}`}>{prop.status}</span></td>
                      <td>
                        <button className="btn btn-sm" onClick={() => navigate(`/properties/${prop.property_id}`)}>View</button>
                        <button className="btn btn-sm" onClick={() => navigate(`/properties/${prop.property_id}/edit`)}>Edit</button>
                        <button className="btn btn-sm btn-danger" onClick={() => deleteProperty(prop.property_id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Members Tab */}
        {activeTab === 'members' && (
          <div className="admin-table-section">
            <div className="section-header">
              <h2>Approved Members ({members.length})</h2>
            </div>
            {members.length === 0 ? (
              <div className="empty-state"><p>No approved members yet. Approve applications to add members.</p></div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.user_id}>
                      <td>{member.name}</td>
                      <td>{member.email}</td>
                      <td>{member.created_at ? new Date(member.created_at).toLocaleDateString() : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
