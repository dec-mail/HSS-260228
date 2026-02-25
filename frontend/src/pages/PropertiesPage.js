import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './PropertiesPage.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PropertiesPage = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  
  const [filters, setFilters] = useState({
    city: '',
    state: '',
    property_type: '',
    min_bedrooms: '',
    max_rent: '',
    amenities: []
  });

  const amenitiesOptions = [
    'Parking', 'Garden', 'Internet/WiFi', 'Furnished', 'Pet friendly',
    'Wheelchair accessible', 'Close to public transport', 'Close to shops'
  ];

  useEffect(() => {
    fetchCurrentUser();
    fetchProperties();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, properties]);

  const fetchCurrentUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`, { withCredentials: true });
      setCurrentUser(response.data);
    } catch (error) {
      console.log('Not authenticated');
    }
  };

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/properties`);
      setProperties(response.data);
      setFilteredProperties(response.data);
    } catch (error) {
      console.error('Failed to fetch properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...properties];

    if (filters.city) {
      filtered = filtered.filter(p => 
        p.city.toLowerCase().includes(filters.city.toLowerCase())
      );
    }

    if (filters.state) {
      filtered = filtered.filter(p => p.state === filters.state);
    }

    if (filters.property_type) {
      filtered = filtered.filter(p => p.property_type === filters.property_type);
    }

    if (filters.min_bedrooms) {
      filtered = filtered.filter(p => 
        p.available_bedrooms >= parseInt(filters.min_bedrooms)
      );
    }

    if (filters.max_rent) {
      filtered = filtered.filter(p => 
        p.weekly_rent_per_person <= parseFloat(filters.max_rent)
      );
    }

    if (filters.amenities.length > 0) {
      filtered = filtered.filter(p =>
        filters.amenities.every(amenity => p.amenities?.includes(amenity))
      );
    }

    setFilteredProperties(filtered);
  };

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      const currentAmenities = filters.amenities;
      setFilters(prev => ({
        ...prev,
        amenities: checked
          ? [...currentAmenities, value]
          : currentAmenities.filter(a => a !== value)
      }));
    } else {
      setFilters(prev => ({ ...prev, [name]: value }));
    }
  };

  const clearFilters = () => {
    setFilters({
      city: '',
      state: '',
      property_type: '',
      min_bedrooms: '',
      max_rent: '',
      amenities: []
    });
  };

  return (
    <div className="properties-page">
      <div className="properties-header">
        <div className="container">
          <div className="header-content">
            <div>
              <h1>Available Properties</h1>
              <p>Find your ideal shared housing</p>
            </div>
            <div className="header-actions">
              {currentUser && (
                <button className="btn btn-primary" onClick={() => navigate('/properties/add')}>
                  + Add Property
                </button>
              )}
              <button className="btn btn-secondary" onClick={() => navigate(-1)}>
                Back
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="properties-layout">
          {/* Filters Sidebar */}
          <div className="filters-sidebar">
            <div className="filters-header">
              <h2>Filter Properties</h2>
              <button className="clear-filters-btn" onClick={clearFilters}>Clear All</button>
            </div>

            <div className="filter-group">
              <label className="filter-label">City</label>
              <input
                type="text"
                name="city"
                value={filters.city}
                onChange={handleFilterChange}
                placeholder="e.g., Sydney"
                className="filter-input"
              />
            </div>

            <div className="filter-group">
              <label className="filter-label">State</label>
              <select name="state" value={filters.state} onChange={handleFilterChange} className="filter-input">
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
            </div>

            <div className="filter-group">
              <label className="filter-label">Property Type</label>
              <select name="property_type" value={filters.property_type} onChange={handleFilterChange} className="filter-input">
                <option value="">All Types</option>
                <option value="house">House</option>
                <option value="apartment">Apartment</option>
                <option value="townhouse">Townhouse</option>
                <option value="unit">Unit</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Min Bedrooms Available</label>
              <input
                type="number"
                name="min_bedrooms"
                value={filters.min_bedrooms}
                onChange={handleFilterChange}
                min="1"
                className="filter-input"
              />
            </div>

            <div className="filter-group">
              <label className="filter-label">Max Rent (per week)</label>
              <input
                type="number"
                name="max_rent"
                value={filters.max_rent}
                onChange={handleFilterChange}
                placeholder="$"
                className="filter-input"
              />
            </div>

            <div className="filter-group">
              <label className="filter-label">Amenities</label>
              <div className="amenities-filters">
                {amenitiesOptions.map(amenity => (
                  <label key={amenity} className="checkbox-label-small">
                    <input
                      type="checkbox"
                      value={amenity}
                      checked={filters.amenities.includes(amenity)}
                      onChange={handleFilterChange}
                    />
                    <span>{amenity}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Properties Grid */}
          <div className="properties-content">
            <div className="results-header">
              <p>{filteredProperties.length} properties found</p>
            </div>

            {loading ? (
              <div className="loading">Loading properties...</div>
            ) : filteredProperties.length === 0 ? (
              <div className="no-results">
                <p>No properties found matching your criteria.</p>
                <button className="btn btn-secondary" onClick={clearFilters}>Clear Filters</button>
              </div>
            ) : (
              <div className="properties-grid">
                {filteredProperties.map(property => (
                  <div key={property.property_id} className="property-card">
                    <div className="property-image">
                      {property.images && property.images.length > 0 ? (
                        <img src={property.images[0]} alt={property.address} />
                      ) : (
                        <div className="placeholder-image">No Image</div>
                      )}
                    </div>
                    <div className="property-details">
                      <h3 className="property-type">{property.property_type || 'Property'}</h3>
                      <p className="property-address">{property.address || property.city}, {property.city}</p>
                      <div className="property-info">
                        <span>🛏 {property.available_bedrooms || '?'} available{property.total_bedrooms ? ` / ${property.total_bedrooms} total` : ''}</span>
                        {property.total_bathrooms && <span>🚿 {property.total_bathrooms} bath</span>}
                      </div>
                      <div className="property-amenities">
                        {property.amenities?.slice(0, 3).map(amenity => (
                          <span key={amenity} className="amenity-tag">{amenity}</span>
                        ))}
                        {property.amenities?.length > 3 && (
                          <span className="amenity-tag">+{property.amenities.length - 3} more</span>
                        )}
                      </div>
                      <div className="property-footer">
                        <div className="property-price">
                          <span className="price">${property.weekly_rent_per_person}</span>
                          <span className="period">/ week per bedroom</span>
                        </div>
                        <div className="property-actions">
                          <button 
                            className="btn btn-primary btn-sm"
                            onClick={() => navigate(`/properties/${property.property_id}`)}
                            data-testid={`view-property-${property.property_id}`}
                          >
                            View
                          </button>
                          {currentUser && (currentUser.user_id === property.added_by_user_id || currentUser.role === 'admin') && (
                            <button 
                              className="btn btn-secondary btn-sm"
                              onClick={() => navigate(`/properties/${property.property_id}/edit`)}
                              data-testid={`edit-property-${property.property_id}`}
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertiesPage;