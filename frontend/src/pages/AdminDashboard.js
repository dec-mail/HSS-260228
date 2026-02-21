import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [adminNotes, setAdminNotes] = useState([]);
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    fetchApplications();
  }, [filterStatus]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const url = filterStatus === 'all' 
        ? `${API}/applications` 
        : `${API}/applications?status=${filterStatus}`;
      const response = await axios.get(url, { withCredentials: true });
      setApplications(response.data);
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewApplication = async (app) => {
    setSelectedApp(app);
    // Fetch notes for this application
    try {
      const response = await axios.get(`${API}/admin-notes/${app.application_id}`, {
        withCredentials: true
      });
      setAdminNotes(response.data);
    } catch (error) {
      console.error('Failed to fetch notes:', error);
    }
  };

  const updateApplicationStatus = async (applicationId, status) => {
    try {
      await axios.patch(
        `${API}/applications/${applicationId}/status?status=${status}`,
        {},
        { withCredentials: true }
      );
      alert(`Application ${status} successfully!`);
      setSelectedApp(null);
      fetchApplications();
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update application status');
    }
  };

  const addNote = async () => {
    if (!newNote.trim()) return;
    
    try {
      await axios.post(
        `${API}/admin-notes?application_id=${selectedApp.application_id}&note=${encodeURIComponent(newNote)}`,
        {},
        { withCredentials: true }
      );
      setNewNote('');
      // Refresh notes
      const response = await axios.get(`${API}/admin-notes/${selectedApp.application_id}`, {
        withCredentials: true
      });
      setAdminNotes(response.data);
    } catch (error) {
      console.error('Failed to add note:', error);
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

  return (
    <div className="admin-dashboard" data-testid="admin-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="container">
          <div className="header-content">
            <h1>Admin Dashboard</h1>
            <button className="btn btn-secondary" onClick={handleLogout} data-testid="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="container">
        <div className="dashboard-content">
          {/* Sidebar - Application List */}
          <div className="applications-sidebar">
            <div className="filter-bar">
              <h2>Applications</h2>
              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                className="filter-select"
                data-testid="status-filter"
              >
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
                  <div
                    key={app.application_id}
                    className={`application-item ${selectedApp?.application_id === app.application_id ? 'active' : ''}`}
                    onClick={() => viewApplication(app)}
                    data-testid={`app-item-${app.application_id}`}
                  >
                    <div className="app-item-header">
                      <h3>{app.first_name} {app.last_name}</h3>
                      <span className={`status-badge status-${app.status}`}>
                        {app.status}
                      </span>
                    </div>
                    <p className="app-item-email">{app.email}</p>
                    <p className="app-item-date">{new Date(app.created_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Main Content - Application Details */}
          <div className="application-details">
            {!selectedApp ? (
              <div className="no-selection">
                <p>Select an application to view details</p>
              </div>
            ) : (
              <div data-testid="app-details">
                <div className="details-header">
                  <h2>{selectedApp.first_name} {selectedApp.last_name}</h2>
                  <div className="action-buttons">
                    {selectedApp.status === 'pending' && (
                      <>
                        <button 
                          className="btn btn-success"
                          onClick={() => updateApplicationStatus(selectedApp.application_id, 'approved')}
                          data-testid="approve-btn"
                        >
                          Approve
                        </button>
                        <button 
                          className="btn btn-danger"
                          onClick={() => updateApplicationStatus(selectedApp.application_id, 'rejected')}
                          data-testid="reject-btn"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="details-sections">
                  <div className="details-section">
                    <h3>Personal Details</h3>
                    <div className="detail-row">
                      <span className="detail-label">Email:</span>
                      <span>{selectedApp.email}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Phone:</span>
                      <span>{selectedApp.phone}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Date of Birth:</span>
                      <span>{selectedApp.date_of_birth}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Address:</span>
                      <span>{selectedApp.address}, {selectedApp.city}, {selectedApp.state} {selectedApp.postcode}</span>
                    </div>
                  </div>

                  <div className="details-section">
                    <h3>Financial Information</h3>
                    <div className="detail-row">
                      <span className="detail-label">Pension Status:</span>
                      <span>{selectedApp.pension_status}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Weekly Budget:</span>
                      <span>${selectedApp.weekly_budget}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Has Assets:</span>
                      <span>{selectedApp.has_assets ? 'Yes' : 'No'}</span>
                    </div>
                    {selectedApp.assets_description && (
                      <div className="detail-row">
                        <span className="detail-label">Assets:</span>
                        <span>{selectedApp.assets_description}</span>
                      </div>
                    )}
                  </div>

                  <div className="details-section">
                    <h3>Health & Accessibility</h3>
                    <div className="detail-row">
                      <span className="detail-label">Mobility:</span>
                      <span>{selectedApp.mobility_level}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Requires Care:</span>
                      <span>{selectedApp.requires_care ? 'Yes' : 'No'}</span>
                    </div>
                    {selectedApp.medical_conditions && (
                      <div className="detail-row">
                        <span className="detail-label">Medical Conditions:</span>
                        <span>{selectedApp.medical_conditions}</span>
                      </div>
                    )}
                  </div>

                  <div className="details-section">
                    <h3>Lifestyle</h3>
                    <div className="detail-row">
                      <span className="detail-label">Smoker:</span>
                      <span>{selectedApp.is_smoker ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Pets:</span>
                      <span>{selectedApp.has_pets ? `Yes - ${selectedApp.pet_details}` : 'No'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Dietary Preferences:</span>
                      <span>{selectedApp.dietary_preferences}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Interests:</span>
                      <span>{selectedApp.interests}</span>
                    </div>
                  </div>

                  <div className="details-section">
                    <h3>Housemate Preferences</h3>
                    <div className="detail-row">
                      <span className="detail-label">Age Range:</span>
                      <span>{selectedApp.preferred_age_range}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Gender:</span>
                      <span>{selectedApp.preferred_gender}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Location:</span>
                      <span>{selectedApp.preferred_location}</span>
                    </div>
                  </div>

                  {/* Admin Notes Section */}
                  <div className="details-section notes-section">
                    <h3>Admin Notes</h3>
                    <div className="notes-list">
                      {adminNotes.length === 0 ? (
                        <p className="no-notes">No notes yet</p>
                      ) : (
                        adminNotes.map((note) => (
                          <div key={note.note_id} className="note-item">
                            <p>{note.note}</p>
                            <small>{new Date(note.created_at).toLocaleString()}</small>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="add-note">
                      <textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Add a note..."
                        className="input-field"
                        rows="3"
                        data-testid="note-textarea"
                      />
                      <button 
                        className="btn btn-primary" 
                        onClick={addNote}
                        data-testid="add-note-btn"
                      >
                        Add Note
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
