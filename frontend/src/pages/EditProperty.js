import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './AddProperty.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const EditProperty = () => {
  const navigate = useNavigate();
  const { propertyId } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
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
    lease_term: '',
    status: 'active'
  });

  const amenitiesOptions = [
    'Parking', 'Garden', 'Internet/WiFi', 'Furnished', 'Air conditioning',
    'Heating', 'Laundry', 'Dishwasher', 'Pet friendly', 'Wheelchair accessible',
    'Close to public transport', 'Close to shops', 'Quiet neighborhood',
    'Swimming pool', 'Security system', 'Solar panels'
  ];

  useEffect(() => {
    fetchProperty();
  }, [propertyId]);

  const fetchProperty = async () => {
    try {
      const response = await axios.get(`${API}/properties/${propertyId}`);
      const prop = response.data;
      
      setFormData({
        property_type: prop.property_type || 'house',
        address: prop.address || '',
        city: prop.city || '',
        state: prop.state || 'NSW',
        postcode: prop.postcode || '',
        total_bedrooms: prop.total_bedrooms || '',
        available_bedrooms: prop.available_bedrooms || '',
        total_bathrooms: prop.total_bathrooms || '',
        weekly_rent_per_person: prop.weekly_rent_per_person || '',
        bond_required: prop.bond_required || '',
        amenities: prop.amenities || [],
        available_from: prop.available_from || '',
        description: prop.description || '',
        house_rules: prop.house_rules || '',
        pet_policy: prop.pet_policy || '',
        smoking_policy: prop.smoking_policy || '',
        lease_term: prop.lease_term || '',
        status: prop.status || 'active'
      });
      
      setUploadedImages(prop.images || []);
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to fetch property:', err);
      setError('Property not found or you do not have permission to edit it.');
      setIsLoading(false);
    }
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        city: formData.city,
        state: formData.state,
        weekly_rent_per_person: parseFloat(formData.weekly_rent_per_person),
        property_type: formData.property_type || 'house',
        images: uploadedImages,
        status: formData.status
      };
      
      // Add optional fields
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

      await axios.patch(`${API}/properties/${propertyId}`, payload, { withCredentials: true });

      alert('Property updated successfully!');
      navigate(`/properties/${propertyId}`);
    } catch (error) {
      console.error('Failed to update property:', error);
      alert('Failed to update property. Please check required fields.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getImageUrl = (url) => {
    if (url.startsWith('http')) return url;
    return `${BACKEND_URL}${url}`;
  };

  if (isLoading) {
    return (
      <div className="add-property">
        <div className="container">
          <div className="loading">Loading property...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="add-property">
        <div className="container">
          <div className="error-message">
            <h2>Error</h2>
            <p>{error}</p>
            <button className="btn btn-primary" onClick={() => navigate('/properties')}>
              Back to Properties
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="add-property" data-testid="edit-property-page">
      <div className="container">
        <div className="page-header">
          <h1>Edit Property</h1>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-secondary" onClick={() => navigate(`/properties/${propertyId}`)}>
              ← Back to Property
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="property-form">
          <div className="form-section">
            <h2>Required Information</h2>
            
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
                  data-testid="edit-city"
                />
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
                <label className="input-label">Weekly Rent (per bedroom) *</label>
                <input 
                  type="number" 
                  name="weekly_rent_per_person" 
                  value={formData.weekly_rent_per_person} 
                  onChange={handleInputChange} 
                  className="input-field" 
                  step="0.01" 
                  required 
                  data-testid="edit-rent"
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
                <input type="text" name="postcode" value={formData.postcode} onChange={handleInputChange} className="input-field" />
              </div>
              <div className="form-group">
                <label className="input-label">Status</label>
                <select name="status" value={formData.status} onChange={handleInputChange} className="input-field">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                </select>
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
                <input type="number" name="total_bedrooms" value={formData.total_bedrooms} onChange={handleInputChange} className="input-field" min="1" />
              </div>
              <div className="form-group">
                <label className="input-label">Available Bedrooms</label>
                <input type="number" name="available_bedrooms" value={formData.available_bedrooms} onChange={handleInputChange} className="input-field" min="1" />
              </div>
              <div className="form-group">
                <label className="input-label">Total Bathrooms</label>
                <input type="number" name="total_bathrooms" value={formData.total_bathrooms} onChange={handleInputChange} className="input-field" min="1" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="input-label">Bond Required ($)</label>
                <input type="number" name="bond_required" value={formData.bond_required} onChange={handleInputChange} className="input-field" step="0.01" />
              </div>
              <div className="form-group">
                <label className="input-label">Available From</label>
                <input type="date" name="available_from" value={formData.available_from} onChange={handleInputChange} className="input-field" />
              </div>
              <div className="form-group">
                <label className="input-label">Lease Term</label>
                <input type="text" name="lease_term" value={formData.lease_term} onChange={handleInputChange} className="input-field" />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2>House Policies <span className="optional-badge">Optional</span></h2>
            
            <div className="form-row">
              <div className="form-group">
                <label className="input-label">Pet Policy</label>
                <input type="text" name="pet_policy" value={formData.pet_policy} onChange={handleInputChange} className="input-field" />
              </div>
              <div className="form-group">
                <label className="input-label">Smoking Policy</label>
                <input type="text" name="smoking_policy" value={formData.smoking_policy} onChange={handleInputChange} className="input-field" />
              </div>
            </div>
            
            <div className="form-group">
              <label className="input-label">House Rules</label>
              <textarea name="house_rules" value={formData.house_rules} onChange={handleInputChange} className="input-field" rows="3" />
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
            <h2>Images <span className="optional-badge">{uploadedImages.length} of 20</span></h2>
            <p className="section-note">Upload property photos (PNG, JPG, WebP). Maximum 20 images, 10MB each.</p>
            
            <input 
              type="file" 
              multiple 
              accept="image/png,image/jpeg,image/jpg,image/webp" 
              onChange={handleImageUpload} 
              className="input-field"
              disabled={isUploading || uploadedImages.length >= 20}
              data-testid="edit-image-upload"
            />
            
            {isUploading && <p className="upload-status">Uploading images...</p>}
            
            {uploadedImages.length > 0 && (
              <div className="image-preview">
                <div className="image-grid">
                  {uploadedImages.map((url, idx) => (
                    <div key={idx} className="preview-image-container">
                      <img src={getImageUrl(url)} alt={`Property ${idx + 1}`} className="preview-image" />
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
            />
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <button type="submit" className="btn btn-primary btn-large" disabled={isSubmitting} data-testid="save-property">
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
            <button type="button" className="btn btn-secondary btn-large" onClick={() => navigate(`/properties/${propertyId}`)}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProperty;
