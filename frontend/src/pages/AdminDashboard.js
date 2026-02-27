import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import NotificationBell from '../components/NotificationBell';
import './AdminDashboard.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('applications');
  const [applications, setApplications] = useState([]);
  const [properties, setProperties] = useState([]);
  const [members, setMembers] = useState([]);
  const [interests, setInterests] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [adminNotes, setAdminNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [stats, setStats] = useState({ applications: 0, pending: 0, properties: 0, members: 0, interests: 0 });
  const [selectedApps, setSelectedApps] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [groupApplications, setGroupApplications] = useState([]);

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
      
      const [appsRes, propsRes, membersRes, interestsRes, groupAppsRes] = await Promise.all([
        axios.get(`${API}/applications`, config).catch(() => ({ data: [] })),
        axios.get(`${API}/properties`).catch(() => ({ data: [] })),
        axios.get(`${API}/members`, config).catch(() => ({ data: [] })),
        axios.get(`${API}/interests`, config).catch(() => ({ data: [] })),
        axios.get(`${API}/group-applications`, config).catch(() => ({ data: [] }))
      ]);
      
      setApplications(appsRes.data);
      setProperties(propsRes.data);
      setMembers(membersRes.data);
      setInterests(interestsRes.data);
      setGroupApplications(groupAppsRes.data);
      
      setStats({
        applications: appsRes.data.length,
        pending: appsRes.data.filter(a => a.status === 'pending').length,
        properties: propsRes.data.length,
        members: membersRes.data.length,
        interests: interestsRes.data.filter(i => i.status === 'new').length
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

  const updateInterestStatus = async (interestId, status) => {
    try {
      const token = localStorage.getItem('auth_token');
      await axios.patch(`${API}/interests/${interestId}/status`, { status }, {
        withCredentials: true, headers: { Authorization: `Bearer ${token}` }
      });
      setInterests(interests.map(i => i.interest_id === interestId ? { ...i, status } : i));
      if (status === 'reviewed') {
        setStats(prev => ({ ...prev, interests: Math.max(0, prev.interests - 1) }));
      }
    } catch (error) {
      alert('Failed to update interest status');
    }
  };

  const toggleSelectApp = (appId) => {
    setSelectedApps(prev => prev.includes(appId) ? prev.filter(id => id !== appId) : [...prev, appId]);
  };

  const toggleSelectAll = () => {
    const filtered = filteredApplications();
    if (selectedApps.length === filtered.length) {
      setSelectedApps([]);
    } else {
      setSelectedApps(filtered.map(a => a.application_id));
    }
  };

  const bulkAction = async (status) => {
    if (selectedApps.length === 0) return alert('No applications selected');
    if (!window.confirm(`${status === 'approved' ? 'Approve' : 'Reject'} ${selectedApps.length} application(s)?`)) return;
    setBulkLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await axios.post(`${API}/applications/bulk-action`, {
        application_ids: selectedApps, status
      }, { withCredentials: true, headers: { Authorization: `Bearer ${token}` } });
      alert(res.data.message);
      setSelectedApps([]);
      fetchAllData();
    } catch (error) {
      alert('Bulk action failed');
    } finally {
      setBulkLoading(false);
    }
  };

  const filteredApplications = () => {
    return filterStatus === 'all' ? applications : applications.filter(a => a.status === filterStatus);
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
          <div className="stat-card stat-pending" onClick={() => setActiveTab('inquiries')}>
            <div className="stat-number">{stats.interests}</div>
            <div className="stat-label">New Inquiries</div>
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
          <button className={`admin-tab ${activeTab === 'inquiries' ? 'active' : ''}`} onClick={() => setActiveTab('inquiries')}>
            Inquiries {stats.interests > 0 && <span style={{ background: '#ef4444', color: 'white', borderRadius: '10px', padding: '2px 8px', fontSize: '12px', marginLeft: '6px' }}>{stats.interests}</span>}
          </button>
          <button className={`admin-tab ${activeTab === 'group-apps' ? 'active' : ''}`} onClick={() => setActiveTab('group-apps')} data-testid="group-apps-tab">
            Group Applications {groupApplications.filter(a => a.status === 'pending').length > 0 && <span style={{ background: '#ef4444', color: 'white', borderRadius: '10px', padding: '2px 8px', fontSize: '12px', marginLeft: '6px' }}>{groupApplications.filter(a => a.status === 'pending').length}</span>}
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
              {/* Bulk Actions */}
              {selectedApps.length > 0 && (
                <div style={{ padding: '8px 12px', background: '#eff6ff', borderBottom: '1px solid #dbeafe', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e40af' }}>{selectedApps.length} selected</span>
                  <button className="btn btn-sm btn-success" onClick={() => bulkAction('approved')} disabled={bulkLoading} data-testid="bulk-approve-btn">
                    {bulkLoading ? '...' : 'Approve All'}
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => bulkAction('rejected')} disabled={bulkLoading} data-testid="bulk-reject-btn">
                    {bulkLoading ? '...' : 'Reject All'}
                  </button>
                  <button className="btn btn-sm" onClick={() => setSelectedApps([])} style={{ fontSize: '12px' }}>Clear</button>
                </div>
              )}
              {loading ? (
                <div className="loading">Loading...</div>
              ) : applications.length === 0 ? (
                <p className="no-applications">No applications found</p>
              ) : (
                <div className="applications-list">
                  <div style={{ padding: '6px 12px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" checked={selectedApps.length === filteredApplications().length && filteredApplications().length > 0} onChange={toggleSelectAll} data-testid="select-all-apps" />
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>Select all</span>
                  </div>
                  {filteredApplications().map((app) => (
                    <div key={app.application_id} className={`application-item ${selectedApp?.application_id === app.application_id ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <input
                        type="checkbox"
                        checked={selectedApps.includes(app.application_id)}
                        onChange={() => toggleSelectApp(app.application_id)}
                        onClick={(e) => e.stopPropagation()}
                        style={{ marginTop: '4px', flexShrink: 0 }}
                        data-testid={`select-app-${app.application_id}`}
                      />
                      <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => viewApplication(app)}>
                        <div className="app-item-header">
                          <h3>{app.given_name || app.first_name} {app.family_name || app.last_name}</h3>
                          <span className={`status-badge status-${app.status}`}>{app.status}</span>
                        </div>
                        <p className="app-item-email">{app.email}</p>
                        <p className="app-item-date">{new Date(app.created_at).toLocaleDateString()}</p>
                      </div>
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

        {/* Inquiries Tab */}
        {activeTab === 'inquiries' && (
          <div className="admin-table-section">
            <div className="section-header">
              <h2>Property Inquiries ({interests.length})</h2>
            </div>
            {interests.length === 0 ? (
              <div className="empty-state"><p>No property inquiries yet.</p></div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Property</th>
                    <th>Message</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {interests.map((interest) => (
                    <tr key={interest.interest_id}>
                      <td>{new Date(interest.created_at).toLocaleDateString()}</td>
                      <td>{interest.user_name}</td>
                      <td>{interest.user_email}</td>
                      <td>{interest.property_location}</td>
                      <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{interest.message || '-'}</td>
                      <td><span className={`status-badge status-${interest.status === 'new' ? 'pending' : 'approved'}`}>{interest.status}</span></td>
                      <td>
                        {interest.status === 'new' && (
                          <button className="btn btn-sm btn-success" onClick={() => updateInterestStatus(interest.interest_id, 'reviewed')} data-testid={`review-interest-${interest.interest_id}`}>
                            Mark Reviewed
                          </button>
                        )}
                        <button className="btn btn-sm" onClick={() => navigate(`/properties/${interest.property_id}`)} data-testid={`view-property-${interest.interest_id}`}>
                          View Property
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Group Applications Tab */}
        {activeTab === 'group-apps' && (
          <div className="dashboard-content" data-testid="group-apps-section">
            <div className="section-header">
              <h2>Group Applications ({groupApplications.length})</h2>
              <p>Review group applications for properties</p>
            </div>
            {groupApplications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>No group applications yet.</div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Group</th>
                    <th>Property</th>
                    <th>Members</th>
                    <th>Submitted By</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {groupApplications.map(app => (
                    <tr key={app.application_id} data-testid={`group-app-row-${app.application_id}`}>
                      <td><strong>{app.group_name}</strong></td>
                      <td>{app.property_city}, {app.property_state}</td>
                      <td>{app.members?.length || 0} members</td>
                      <td>{app.submitted_by_name}</td>
                      <td>{new Date(app.created_at).toLocaleDateString()}</td>
                      <td>
                        <span style={{
                          padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600',
                          background: app.status === 'approved' ? '#d1fae5' : app.status === 'rejected' ? '#fef2f2' : '#fef3c7',
                          color: app.status === 'approved' ? '#059669' : app.status === 'rejected' ? '#ef4444' : '#d97706'
                        }}>
                          {app.status}
                        </span>
                      </td>
                      <td>
                        {app.status === 'pending' && (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              className="btn btn-primary"
                              style={{ padding: '4px 12px', fontSize: '12px' }}
                              onClick={async () => {
                                const token = localStorage.getItem('auth_token');
                                try {
                                  await axios.patch(`${API}/group-applications/${app.application_id}/status`, { status: 'approved' }, { withCredentials: true, headers: { Authorization: `Bearer ${token}` } });
                                  fetchAllData();
                                } catch (e) { alert('Failed to approve'); }
                              }}
                              data-testid={`approve-group-app-${app.application_id}`}
                            >
                              Approve
                            </button>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '4px 12px', fontSize: '12px', color: '#ef4444' }}
                              onClick={async () => {
                                const token = localStorage.getItem('auth_token');
                                try {
                                  await axios.patch(`${API}/group-applications/${app.application_id}/status`, { status: 'rejected' }, { withCredentials: true, headers: { Authorization: `Bearer ${token}` } });
                                  fetchAllData();
                                } catch (e) { alert('Failed to reject'); }
                              }}
                              data-testid={`reject-group-app-${app.application_id}`}
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
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
