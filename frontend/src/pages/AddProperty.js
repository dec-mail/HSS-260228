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
  const [isUploading, setIsUploading] = useState(false);
  const [csvData, setCsvData] = useState([]);
  const [csvPreview, setCsvPreview] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  
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
    description: '',
    house_rules: '',
    pet_policy: '',
    smoking_policy: '',
    lease_term: ''
  });

  const amenitiesOptions = [
    'Parking', 'Garden', 'Internet/WiFi', 'Furnished', 'Air conditioning',
    'Heating', 'Laundry', 'Dishwasher', 'Pet friendly', 'Wheelchair accessible',
    'Close to public transport', 'Close to shops', 'Quiet neighborhood',
    'Swimming pool', 'Security system', 'Solar panels'
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

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;
    
    // Check total count (existing + new)
    if (uploadedImages.length + files.length > 20) {
      alert(`Maximum 20 images allowed. You have ${uploadedImages.length} already.`);
      return;
    }
    
    setIsUploading(true);
    
    const formDataUpload = new FormData();
    files.forEach(file => {
      formDataUpload.append('files', file);
    });
    
    try {
      const response = await axios.post(`${API}/upload/images`, formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
      });
      
      if (response.data.uploaded && response.data.uploaded.length > 0) {
        setUploadedImages(prev => [...prev, ...response.data.uploaded]);
      }
      
      if (response.data.errors && response.data.errors.length > 0) {
        alert(`Some files failed to upload:\n${response.data.errors.join('\n')}`);
      }
    } catch (error) {
      console.error('Image upload failed:', error);
      alert('Failed to upload images. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const rows = text.split('\n').map(row => {
        // Handle quoted values with commas inside
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < row.length; i++) {
          const char = row[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      });
      
      const headers = rows[0].map(h => h.toLowerCase().trim());
      const data = rows.slice(1).filter(row => row.length > 1 && row.some(cell => cell)).map(row => {
        const obj = {};
        headers.forEach((header, idx) => {
          const value = row[idx]?.trim();
          // Handle empty, TBA, NA, N/A values
          if (!value || value.toLowerCase() === 'tba' || value.toLowerCase() === 'na' || value.toLowerCase() === 'n/a') {
            obj[header] = null;
          } else {
            obj[header] = value;
          }
        });
        return obj;
      });
      
      setCsvData(data);
      setCsvPreview(data.slice(0, 5));
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        city: formData.city,
        state: formData.state,
        weekly_rent_per_person: parseFloat(formData.weekly_rent_per_person),
        property_type: formData.property_type || 'house',
        images: uploadedImages
      };
      
      // Add optional fields only if they have values
      if (formData.address) payload.address = formData.address;
      if (formData.postcode) payload.postcode = formData.postcode;
      if (formData.total_bedrooms) payload.total_bedrooms = parseInt(formData.total_bedrooms);
      if (formData.available_bedrooms) payload.available_bedrooms = parseInt(formData.available_bedrooms);
      if (formData.total_bathrooms) payload.total_bathrooms = parseInt(formData.total_bathrooms);
      if (formData.bond_required) payload.bond_required = parseFloat(formData.bond_required);
      if (formData.amenities.length > 0) payload.amenities = formData.amenities;
      if (formData.available_from) payload.available_from = formData.available_from;
      if (formData.description) payload.description = formData.description;
      if (formData.house_rules) payload.house_rules = formData.house_rules;
      if (formData.pet_policy) payload.pet_policy = formData.pet_policy;
      if (formData.smoking_policy) payload.smoking_policy = formData.smoking_policy;
      if (formData.lease_term) payload.lease_term = formData.lease_term;

      await axios.post(`${API}/properties`, payload, { withCredentials: true });

      alert('Property added successfully!');
      navigate('/properties');
    } catch (error) {
      console.error('Failed to add property:', error);
      alert('Failed to add property. Please check required fields (City, State, Weekly Rent).');
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
        properties: csvData.map(prop => {
          const payload = {
            city: prop.city || prop.suburb || prop.town,
            state: prop.state,
            weekly_rent_per_person: parseFloat(prop.weekly_rent_per_person || prop.rent || prop.weekly_rent || 0),
            property_type: prop.property_type || prop.type || 'house',
            images: []
          };
          
          // Add optional fields
          if (prop.address) payload.address = prop.address;
          if (prop.postcode) payload.postcode = prop.postcode;
          if (prop.total_bedrooms || prop.bedrooms) payload.total_bedrooms = parseInt(prop.total_bedrooms || prop.bedrooms);
          if (prop.available_bedrooms || prop.available) payload.available_bedrooms = parseInt(prop.available_bedrooms || prop.available);
          if (prop.total_bathrooms || prop.bathrooms) payload.total_bathrooms = parseInt(prop.total_bathrooms || prop.bathrooms);
          if (prop.bond_required || prop.bond) payload.bond_required = parseFloat(prop.bond_required || prop.bond);
          if (prop.amenities) payload.amenities = prop.amenities.split(';').map(a => a.trim()).filter(a => a);
          if (prop.available_from) payload.available_from = prop.available_from;
          if (prop.description) payload.description = prop.description;
          if (prop.house_rules) payload.house_rules = prop.house_rules;
          if (prop.pet_policy) payload.pet_policy = prop.pet_policy;
          if (prop.smoking_policy) payload.smoking_policy = prop.smoking_policy;
          if (prop.lease_term) payload.lease_term = prop.lease_term;
          
          return payload;
        })
      }, { withCredentials: true });

      alert(`Successfully added ${response.data.created} properties!`);
      if (response.data.errors && response.data.errors.length > 0) {
        console.error('Errors:', response.data.errors);
        alert(`Note: ${response.data.errors.length} properties had errors.`);
      }
      navigate('/properties');
    } catch (error) {
      console.error('Failed to bulk upload:', error);
      alert('Failed to upload properties. Please check your CSV format has at least: city, state, weekly_rent_per_person');
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadCSVTemplate = () => {
    const headers = 'city,state,weekly_rent_per_person,property_type,address,postcode,total_bedrooms,available_bedrooms,total_bathrooms,bond_required,amenities,available_from,description,pet_policy,smoking_policy';
    const example1 = 'Marrickville,NSW,250,house,123 Main St,2204,4,2,2,1000,Parking;Internet/WiFi;Garden,2024-03-01,Lovely 4 bedroom house,Cats OK,No smoking inside';
    const example2 = 'Bondi,NSW,280,apartment,TBA,2026,3,1,1,TBA,Internet/WiFi;Close to shops,TBA,Modern apartment near beach,No pets,No smoking';
    const example3 = 'Parramatta,NSW,220,townhouse,,2150,5,3,2,,Parking;Laundry,,Spacious townhouse,Negotiable,Outside only';
    
    const csvContent = `${headers}\n${example1}\n${example2}\n${example3}`;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hss_property_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
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
            data-testid="tab-individual"
          >
            Individual Entry
          </button>
          <button 
            className={`tab-btn ${activeTab === 'bulk' ? 'active' : ''}`}
            onClick={() => setActiveTab('bulk')}
            data-testid="tab-bulk"
          >
            CSV Bulk Upload
          </button>
        </div>

        {activeTab === 'individual' ? (
          <form onSubmit={handleSubmit} className="property-form">
            <div className="form-section">
              <h2>Required Information</h2>
              <p className="section-note">Only these 3 fields are required. All others are optional.</p>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="input-label">Suburb/Town *</label>
                  <input 
                    type="text" 
                    name="city" 
                    value={formData.city} 
                    onChange={handleInputChange} 
                    className="input-field" 
                    required 
                    placeholder="e.g. Marrickville"
                    data-testid="input-city"
                  />
                </div>
                <div className="form-group">
                  <label className="input-label">State *</label>
                  <select name="state" value={formData.state} onChange={handleInputChange} className="input-field" required data-testid="input-state">
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
                  <label className="input-label">Weekly Rent (per person) *</label>
                  <input 
                    type="number" 
                    name="weekly_rent_per_person" 
                    value={formData.weekly_rent_per_person} 
                    onChange={handleInputChange} 
                    className="input-field" 
                    step="0.01" 
                    required 
                    placeholder="e.g. 250"
                    data-testid="input-rent"
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h2>Property Details <span className="optional-badge">Optional</span></h2>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="input-label">Property Type</label>
                  <select name="property_type" value={formData.property_type} onChange={handleInputChange} className="input-field">
                    <option value="house">House</option>
                    <option value="apartment">Apartment</option>
                    <option value="townhouse">Townhouse</option>
                    <option value="unit">Unit</option>
                    <option value="villa">Villa</option>
                    <option value="granny_flat">Granny Flat</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="input-label">Postcode</label>
                  <input type="text" name="postcode" value={formData.postcode} onChange={handleInputChange} className="input-field" placeholder="e.g. 2204" />
                </div>
              </div>

              <div className="form-group">
                <label className="input-label">Street Address</label>
                <input type="text" name="address" value={formData.address} onChange={handleInputChange} className="input-field" placeholder="Leave blank if TBA" />
              </div>
            </div>

            <div className="form-section">
              <h2>Accommodation Details <span className="optional-badge">Optional</span></h2>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="input-label">Total Bedrooms</label>
                  <input type="number" name="total_bedrooms" value={formData.total_bedrooms} onChange={handleInputChange} className="input-field" min="1" placeholder="e.g. 4" />
                </div>
                <div className="form-group">
                  <label className="input-label">Available Bedrooms</label>
                  <input type="number" name="available_bedrooms" value={formData.available_bedrooms} onChange={handleInputChange} className="input-field" min="1" placeholder="e.g. 2" />
                </div>
                <div className="form-group">
                  <label className="input-label">Total Bathrooms</label>
                  <input type="number" name="total_bathrooms" value={formData.total_bathrooms} onChange={handleInputChange} className="input-field" min="1" placeholder="e.g. 2" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="input-label">Bond Required ($)</label>
                  <input type="number" name="bond_required" value={formData.bond_required} onChange={handleInputChange} className="input-field" step="0.01" placeholder="Leave blank if TBA" />
                </div>
                <div className="form-group">
                  <label className="input-label">Available From</label>
                  <input type="date" name="available_from" value={formData.available_from} onChange={handleInputChange} className="input-field" />
                </div>
                <div className="form-group">
                  <label className="input-label">Lease Term</label>
                  <input type="text" name="lease_term" value={formData.lease_term} onChange={handleInputChange} className="input-field" placeholder="e.g. 6 months minimum" />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h2>House Policies <span className="optional-badge">Optional</span></h2>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="input-label">Pet Policy</label>
                  <input type="text" name="pet_policy" value={formData.pet_policy} onChange={handleInputChange} className="input-field" placeholder="e.g. Cats OK, No dogs" />
                </div>
                <div className="form-group">
                  <label className="input-label">Smoking Policy</label>
                  <input type="text" name="smoking_policy" value={formData.smoking_policy} onChange={handleInputChange} className="input-field" placeholder="e.g. Outside only" />
                </div>
              </div>
              
              <div className="form-group">
                <label className="input-label">House Rules</label>
                <textarea name="house_rules" value={formData.house_rules} onChange={handleInputChange} className="input-field" rows="3" placeholder="Any specific house rules..." />
              </div>
            </div>

            <div className="form-section">
              <h2>Amenities <span className="optional-badge">Optional</span></h2>
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
              <h2>Images <span className="optional-badge">Optional - Max 20</span></h2>
              <p className="section-note">Upload property photos (PNG, JPG, WebP). Maximum 20 images, 10MB each.</p>
              
              <input 
                type="file" 
                multiple 
                accept="image/png,image/jpeg,image/jpg,image/webp" 
                onChange={handleImageUpload} 
                className="input-field"
                disabled={isUploading || uploadedImages.length >= 20}
                data-testid="image-upload"
              />
              
              {isUploading && <p className="upload-status">Uploading images...</p>}
              
              {uploadedImages.length > 0 && (
                <div className="image-preview">
                  <p className="image-count">{uploadedImages.length} of 20 images</p>
                  <div className="image-grid">
                    {uploadedImages.map((url, idx) => (
                      <div key={idx} className="preview-image-container">
                        <img src={`${BACKEND_URL}${url}`} alt={`Property ${idx + 1}`} className="preview-image" />
                        <button type="button" className="remove-image-btn" onClick={() => removeImage(idx)}>×</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="form-section">
              <h2>Description <span className="optional-badge">Optional</span></h2>
              <textarea 
                name="description" 
                value={formData.description} 
                onChange={handleInputChange} 
                className="input-field" 
                rows="5" 
                placeholder="Describe the property, neighborhood, and what makes it special..."
              />
            </div>

            <button type="submit" className="btn btn-primary btn-large" disabled={isSubmitting} data-testid="submit-property">
              {isSubmitting ? 'Adding Property...' : 'Add Property'}
            </button>
          </form>
        ) : (
          <div className="csv-upload-section">
            <div className="csv-instructions">
              <h2>CSV Format Instructions</h2>
              <p><strong>Required columns:</strong> city (or suburb/town), state, weekly_rent_per_person (or rent)</p>
              <p><strong>Optional columns:</strong> property_type, address, postcode, total_bedrooms, available_bedrooms, total_bathrooms, bond_required, amenities, available_from, description, pet_policy, smoking_policy, house_rules, lease_term</p>
              
              <div className="csv-tips">
                <h4>Tips:</h4>
                <ul>
                  <li>Use <code>TBA</code>, <code>NA</code>, or leave empty for unknown values</li>
                  <li>Amenities should be semicolon-separated: <code>Parking;Internet/WiFi;Garden</code></li>
                  <li>Dates can be in any format: <code>2024-03-01</code> or <code>March 2024</code></li>
                  <li>You can add images to each property after bulk import</li>
                </ul>
              </div>
              
              <button className="btn btn-secondary" onClick={downloadCSVTemplate} data-testid="download-template">
                Download CSV Template
              </button>
            </div>

            <div className="form-group">
              <label className="input-label">Upload CSV File</label>
              <input type="file" accept=".csv" onChange={handleCSVUpload} className="input-field" data-testid="csv-upload" />
            </div>

            {csvPreview.length > 0 && (
              <div className="csv-preview">
                <h3>Preview (first 5 rows)</h3>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Suburb</th>
                        <th>State</th>
                        <th>Rent/week</th>
                        <th>Type</th>
                        <th>Bedrooms</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvPreview.map((row, idx) => (
                        <tr key={idx}>
                          <td>{row.city || row.suburb || row.town || '-'}</td>
                          <td>{row.state || '-'}</td>
                          <td>${row.weekly_rent_per_person || row.rent || row.weekly_rent || '-'}</td>
                          <td>{row.property_type || row.type || 'house'}</td>
                          <td>{row.available_bedrooms || row.available || row.total_bedrooms || row.bedrooms || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="preview-note">Total rows to import: {csvData.length}</p>
              </div>
            )}

            {csvData.length > 0 && (
              <button className="btn btn-success btn-large" onClick={handleBulkSubmit} disabled={isSubmitting} data-testid="bulk-submit">
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
