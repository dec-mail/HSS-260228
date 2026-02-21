import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AddProperty.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AddProperty = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('individual');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [csvData, setCsvData] = useState([]);
  const [csvPreview, setCsvPreview] = useState([]);
  
  const [formData, setFormData] = useState({
    property_type: 'house',
    address: '',
    city: '',
    state: 'NSW',
    postcode: '',
    total_bedrooms: '',
    available_bedrooms: '',
    total_bathrooms: '',
    weekly_rent_per_person: '',
    bond_required: '',
    amenities: [],
    available_from: '',
    images: [],
    description: ''
  });

  const amenitiesOptions = [
    'Parking', 'Garden', 'Internet/WiFi', 'Furnished', 'Air conditioning',
    'Heating', 'Laundry', 'Dishwasher', 'Pet friendly', 'Wheelchair accessible',
    'Close to public transport', 'Close to shops', 'Quiet neighborhood'
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'amenities[]') {
      const currentAmenities = formData.amenities || [];
      setFormData(prev => ({
        ...prev,
        amenities: checked 
          ? [...currentAmenities, value]
          : currentAmenities.filter(a => a !== value)
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    // In real implementation, upload to cloud storage and get URLs
    // For MVP, we'll use placeholder URLs
    const imageUrls = files.map((file, idx) => 
      `https://placehold.co/800x600/e0f2fe/1a2332?text=Property+Image+${idx + 1}`
    );
    setFormData(prev => ({ ...prev, images: [...prev.images, ...imageUrls] }));
  };

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const rows = text.split('\n').map(row => row.split(','));
      const headers = rows[0];
      const data = rows.slice(1).filter(row => row.length > 1).map(row => {
        const obj = {};
        headers.forEach((header, idx) => {
          obj[header.trim()] = row[idx]?.trim();
        });
        return obj;
      });
      
      setCsvData(data);
      setCsvPreview(data.slice(0, 5)); // Show first 5 rows
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await axios.post(`${API}/properties`, {
        ...formData,
        total_bedrooms: parseInt(formData.total_bedrooms),
        available_bedrooms: parseInt(formData.available_bedrooms),
        total_bathrooms: parseInt(formData.total_bathrooms),
        weekly_rent_per_person: parseFloat(formData.weekly_rent_per_person),
        bond_required: formData.bond_required ? parseFloat(formData.bond_required) : null
      }, { withCredentials: true });

      alert('Property added successfully!');
      navigate('/properties');
    } catch (error) {
      console.error('Failed to add property:', error);
      alert('Failed to add property. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkSubmit = async () => {
    if (csvData.length === 0) {
      alert('Please upload a CSV file first');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axios.post(`${API}/properties/bulk`, {
        properties: csvData.map(prop => ({
          ...prop,
          total_bedrooms: parseInt(prop.total_bedrooms),
          available_bedrooms: parseInt(prop.available_bedrooms),
          total_bathrooms: parseInt(prop.total_bathrooms),
          weekly_rent_per_person: parseFloat(prop.weekly_rent_per_person),
          bond_required: prop.bond_required ? parseFloat(prop.bond_required) : null,
          amenities: prop.amenities ? prop.amenities.split(';') : [],
          images: []
        }))
      }, { withCredentials: true });

      alert(`Successfully added ${response.data.created} properties!`);
      if (response.data.errors.length > 0) {
        console.error('Errors:', response.data.errors);
      }
      navigate('/properties');
    } catch (error) {
      console.error('Failed to bulk upload:', error);
      alert('Failed to upload properties. Please check your CSV format.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="add-property">
      <div className="container">
        <div className="page-header">
          <h1>Add Property</h1>
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>← Back</button>
        </div>

        <div className="tabs">
          <button 
            className={`tab-btn ${activeTab === 'individual' ? 'active' : ''}`}
            onClick={() => setActiveTab('individual')}
          >
            Individual Entry
          </button>
          <button 
            className={`tab-btn ${activeTab === 'bulk' ? 'active' : ''}`}
            onClick={() => setActiveTab('bulk')}
          >
            CSV Bulk Upload
          </button>
        </div>

        {activeTab === 'individual' ? (
          <form onSubmit={handleSubmit} className="property-form">
            <div className="form-section">
              <h2>Property Details</h2>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="input-label">Property Type *</label>
                  <select name="property_type" value={formData.property_type} onChange={handleInputChange} className="input-field" required>
                    <option value="house">House</option>
                    <option value="apartment">Apartment</option>
                    <option value="townhouse">Townhouse</option>
                    <option value="unit">Unit</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="input-label">Street Address *</label>
                <input type="text" name="address" value={formData.address} onChange={handleInputChange} className="input-field" required />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="input-label">City *</label>
                  <input type="text" name="city" value={formData.city} onChange={handleInputChange} className="input-field" required />
                </div>
                <div className="form-group">
                  <label className="input-label">State *</label>
                  <select name="state" value={formData.state} onChange={handleInputChange} className="input-field" required>
                    <option value="NSW">NSW</option>
                    <option value="VIC">VIC</option>
                    <option value="QLD">QLD</option>
                    <option value="SA">SA</option>
                    <option value="WA">WA</option>
                    <option value="TAS">TAS</option>
                    <option value="NT">NT</option>
                    <option value="ACT">ACT</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="input-label">Postcode *</label>
                  <input type="text" name="postcode" value={formData.postcode} onChange={handleInputChange} className="input-field" required />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h2>Accommodation Details</h2>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="input-label">Total Bedrooms *</label>
                  <input type="number" name="total_bedrooms" value={formData.total_bedrooms} onChange={handleInputChange} className="input-field" min="1" required />
                </div>
                <div className="form-group">
                  <label className="input-label">Available Bedrooms *</label>
                  <input type="number" name="available_bedrooms" value={formData.available_bedrooms} onChange={handleInputChange} className="input-field" min="1" required />
                </div>
                <div className="form-group">
                  <label className="input-label">Total Bathrooms *</label>
                  <input type="number" name="total_bathrooms" value={formData.total_bathrooms} onChange={handleInputChange} className="input-field" min="1" required />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="input-label">Weekly Rent (per person) *</label>
                  <input type="number" name="weekly_rent_per_person" value={formData.weekly_rent_per_person} onChange={handleInputChange} className="input-field" step="0.01" required />
                </div>
                <div className="form-group">
                  <label className="input-label">Bond Required</label>
                  <input type="number" name="bond_required" value={formData.bond_required} onChange={handleInputChange} className="input-field" step="0.01" />
                </div>
                <div className="form-group">
                  <label className="input-label">Available From *</label>
                  <input type="date" name="available_from" value={formData.available_from} onChange={handleInputChange} className="input-field" required />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h2>Amenities</h2>
              <div className="checkbox-grid two-col">
                {amenitiesOptions.map(amenity => (
                  <label key={amenity} className="checkbox-label">
                    <input
                      type="checkbox"
                      name="amenities[]"
                      value={amenity}
                      checked={formData.amenities.includes(amenity)}
                      onChange={handleInputChange}
                    />
                    <span>{amenity}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-section">
              <h2>Images</h2>
              <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="input-field" />
              {formData.images.length > 0 && (
                <div className="image-preview">
                  {formData.images.map((url, idx) => (
                    <img key={idx} src={url} alt={`Property ${idx + 1}`} className="preview-image" />
                  ))}
                </div>
              )}
            </div>

            <div className="form-section">
              <h2>Description</h2>
              <textarea name="description" value={formData.description} onChange={handleInputChange} className="input-field" rows="5" placeholder="Describe the property, neighborhood, and what makes it special..." required />
            </div>

            <button type="submit" className="btn btn-primary btn-large" disabled={isSubmitting}>
              {isSubmitting ? 'Adding Property...' : 'Add Property'}
            </button>
          </form>
        ) : (
          <div className="csv-upload-section">
            <div className="csv-instructions">
              <h2>CSV Format Instructions</h2>
              <p>Your CSV file should include the following columns:</p>
              <code>
                property_type,address,city,state,postcode,total_bedrooms,available_bedrooms,total_bathrooms,<br/>
                weekly_rent_per_person,bond_required,amenities,available_from,description
              </code>
              <p className="note">Amenities should be semicolon-separated (e.g., "Parking;Internet/WiFi;Garden")</p>
            </div>

            <div className="form-group">
              <label className="input-label">Upload CSV File</label>
              <input type="file" accept=".csv" onChange={handleCSVUpload} className="input-field" />
            </div>

            {csvPreview.length > 0 && (
              <div className="csv-preview">
                <h3>Preview (first 5 rows)</h3>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Address</th>
                        <th>City</th>
                        <th>Bedrooms</th>
                        <th>Rent/week</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvPreview.map((row, idx) => (
                        <tr key={idx}>
                          <td>{row.property_type}</td>
                          <td>{row.address}</td>
                          <td>{row.city}</td>
                          <td>{row.available_bedrooms}/{row.total_bedrooms}</td>
                          <td>${row.weekly_rent_per_person}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="preview-note">Total rows to import: {csvData.length}</p>
              </div>
            )}

            {csvData.length > 0 && (
              <button className="btn btn-success btn-large" onClick={handleBulkSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Uploading...' : `Upload ${csvData.length} Properties`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AddProperty;