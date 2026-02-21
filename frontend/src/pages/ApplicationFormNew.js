import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ApplicationFormNew.css';
import {
  renderFinancial,
  renderLifestyle,
  renderHousehold,
  renderSafety,
  renderPreferences,
  renderUsefulItems,
  renderReview
} from './ApplicationFormSteps';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ApplicationFormNew = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { email, access_code, savedData, isNew } = location.state || {};

  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [lastSaved, setLastSaved] = useState(null);

  const totalSteps = 8;

  const [formData, setFormData] = useState({
    email: email || '',
    access_code: access_code || '',
    
    // Step 1: Personal Details
    shared_housing_type: 'single_female',
    first_name: '',
    last_name: '',
    phone: '',
    date_of_birth: '',
    address: '',
    city: '',
    state: 'NSW',
    postcode: '',
    
    // Step 2: Financial
    income_sources: [],
    weekly_budget: '',
    monthly_budget: '',
    
    // Step 3: Lifestyle
    smoking_status: 'non_smoker',
    has_pets: false,
    pet_details: '',
    daily_routine: 'morning_person',
    hobbies: [],
    other_hobbies: '',
    
    // Step 4: Household & Community
    household_responsibilities: [],
    cooking_preference: 'own_cooking',
    help_with_tasks: false,
    share_transport: false,
    visitors_frequency: 'few_months',
    overnight_guests: 'rarely',
    religious_cultural_requirements: '',
    
    // Step 5: Safety & References
    police_check_status: '',
    can_provide_references: true,
    dealbreakers: [],
    other_dealbreakers: '',
    things_i_hate: '',
    things_id_enjoy: '',
    
    // Step 6: Your Preferences
    age_range_preference: '',
    housemate_mix_preference: '',
    household_size_preference: '',
    accommodation_duration: '',
    deal_makers: '',
    enjoyable_activity: '',
    non_negotiable_conditions: '',
    preferred_location: '',
    
    // Step 7: Useful Items
    useful_items: [],
    other_items: '',
    
    // Metadata
    current_step: 1,
    last_updated: new Date().toISOString()
  });

  useEffect(() => {
    if (!email || !access_code) {
      navigate('/apply');
      return;
    }
    
    if (savedData) {
      setFormData(prev => ({ ...prev, ...savedData }));
      setCurrentStep(savedData.current_step || 1);
    }
  }, [email, access_code, savedData, navigate]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      if (name.includes('[]')) {
        const fieldName = name.replace('[]', '');
        const currentValues = formData[fieldName] || [];
        setFormData(prev => ({
          ...prev,
          [fieldName]: checked 
            ? [...currentValues, value]
            : currentValues.filter(v => v !== value)
        }));
      } else {
        setFormData(prev => ({ ...prev, [name]: checked }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const saveProgress = async () => {
    setIsSaving(true);
    try {
      await axios.post(`${API}/applications/save`, {
        ...formData,
        current_step: currentStep,
        last_updated: new Date().toISOString()
      });
      setLastSaved(new Date());
    } catch (error) {
      console.error('Failed to save progress:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    if (step === 1) {
      if (!formData.first_name.trim()) newErrors.first_name = 'Given name is required';
      if (!formData.last_name.trim()) newErrors.last_name = 'Family name is required';
      if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
      if (!formData.date_of_birth) newErrors.date_of_birth = 'Date of birth is required';
      if (!formData.address.trim()) newErrors.address = 'Address is required';
      if (!formData.city.trim()) newErrors.city = 'City is required';
      if (!formData.postcode.trim()) newErrors.postcode = 'Postcode is required';
    } else if (step === 2) {
      if (formData.income_sources.length === 0) newErrors.income_sources = 'Please select at least one income source';
      if (!formData.weekly_budget && !formData.monthly_budget) newErrors.budget = 'Please enter either weekly or monthly budget';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (validateStep(currentStep)) {
      await saveProgress();
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo(0, 0);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await axios.post(`${API}/applications/submit`, {
        ...formData,
        status: 'pending',
        submitted_at: new Date().toISOString()
      });
      setSubmitSuccess(true);
      window.scrollTo(0, 0);
    } catch (error) {
      console.error('Failed to submit application:', error);
      alert('Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="application-form-new">
        <div className="container">
          <div className="success-container" data-testid="success-message">
            <div className="success-icon">✓</div>
            <h1>Application Submitted Successfully!</h1>
            <p>
              Thank you for your application, {formData.first_name}. We have received your submission 
              and will review it shortly. You will receive an email at <strong>{formData.email}</strong> 
              with updates on your application status.
            </p>
            <button className="btn btn-primary" onClick={() => navigate('/')} data-testid="back-home-btn">
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="application-form-new">
      <div className="container">
        <div className="form-header">
          <a href="/" className="back-home-link">
            <span className="home-icon">🏠</span> Back to Home
          </a>
          <h1 data-testid="form-title">House Sharing Seniors Application</h1>
          <p className="step-indicator">Step {currentStep} of {totalSteps}</p>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              data-testid="progress-bar"
            />
          </div>
          {lastSaved && (
            <p className="last-saved">Last saved: {lastSaved.toLocaleTimeString()}</p>
          )}
        </div>

        <div className="form-content">
          {renderStep(currentStep, formData, handleInputChange, errors)}

          {/* Navigation */}
          <div className="form-navigation">
            <div className="nav-left">
              {currentStep > 1 && (
                <button 
                  className="btn btn-secondary" 
                  onClick={handleBack}
                  data-testid="back-btn"
                >
                  ← Back
                </button>
              )}
            </div>
            
            <div className="nav-right">
              <button 
                className="btn btn-secondary save-btn" 
                onClick={saveProgress}
                disabled={isSaving}
                data-testid="save-btn"
              >
                {isSaving ? '💾 Saving...' : '💾 Save Progress'}
              </button>
              
              {currentStep < totalSteps ? (
                <button 
                  className="btn btn-primary" 
                  onClick={handleNext}
                  data-testid="next-btn"
                >
                  Next →
                </button>
              ) : (
                <button 
                  className="btn btn-success" 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  data-testid="submit-btn"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Application'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Render individual steps
function renderStep(step, formData, handleInputChange, errors) {
  switch (step) {
    case 1:
      return renderPersonalDetails(formData, handleInputChange, errors);
    case 2:
      return renderFinancial(formData, handleInputChange, errors);
    case 3:
      return renderLifestyle(formData, handleInputChange, errors);
    case 4:
      return renderHousehold(formData, handleInputChange, errors);
    case 5:
      return renderSafety(formData, handleInputChange, errors);
    case 6:
      return renderPreferences(formData, handleInputChange, errors);
    case 7:
      return renderUsefulItems(formData, handleInputChange, errors);
    case 8:
      return renderReview(formData);
    default:
      return null;
  }
}
export { renderStep };

// Step 1: Personal Details
function renderPersonalDetails(formData, handleInputChange, errors) {
  return (
    <div className="form-step" data-testid="step-1">
      <h2>Personal Details</h2>
      <p className="step-description">Please provide your basic information.</p>
      
      <div className="form-group">
        <label className="input-label">Shared Housing Type Wanted *</label>
        <select
          name="shared_housing_type"
          value={formData.shared_housing_type}
          onChange={handleInputChange}
          className="input-field"
          data-testid="housing-type-select"
        >
          <option value="single_female">Single Female</option>
          <option value="single_male">Single Male</option>
          <option value="couples">Couples</option>
        </select>
        <p className="field-hint">HSS policy ensures comfort and security - all properties are single-gender households, except for couples.</p>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="input-label">Given Name *</label>
          <input
            type="text"
            name="first_name"
            value={formData.first_name}
            onChange={handleInputChange}
            className="input-field"
            data-testid="first-name-input"
          />
          {errors.first_name && <span className="error-message">{errors.first_name}</span>}
        </div>
        <div className="form-group">
          <label className="input-label">Family Name *</label>
          <input
            type="text"
            name="last_name"
            value={formData.last_name}
            onChange={handleInputChange}
            className="input-field"
            data-testid="last-name-input"
          />
          {errors.last_name && <span className="error-message">{errors.last_name}</span>}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="input-label">Phone *</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            className="input-field"
            data-testid="phone-input"
          />
          {errors.phone && <span className="error-message">{errors.phone}</span>}
        </div>
        <div className="form-group">
          <label className="input-label">Date of Birth *</label>
          <input
            type="date"
            name="date_of_birth"
            value={formData.date_of_birth}
            onChange={handleInputChange}
            className="input-field"
            data-testid="dob-input"
          />
          {errors.date_of_birth && <span className="error-message">{errors.date_of_birth}</span>}
        </div>
      </div>

      <div className="form-group">
        <label className="input-label">Street Address *</label>
        <input
          type="text"
          name="address"
          value={formData.address}
          onChange={handleInputChange}
          className="input-field"
          data-testid="address-input"
        />
        {errors.address && <span className="error-message">{errors.address}</span>}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="input-label">City *</label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleInputChange}
            className="input-field"
            data-testid="city-input"
          />
          {errors.city && <span className="error-message">{errors.city}</span>}
        </div>
        <div className="form-group">
          <label className="input-label">State *</label>
          <select
            name="state"
            value={formData.state}
            onChange={handleInputChange}
            className="input-field"
            data-testid="state-select"
          >
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
          <input
            type="text"
            name="postcode"
            value={formData.postcode}
            onChange={handleInputChange}
            className="input-field"
            data-testid="postcode-input"
          />
          {errors.postcode && <span className="error-message">{errors.postcode}</span>}
        </div>
      </div>
    </div>
  );
}

// Continue with remaining steps in next file due to size...
export default ApplicationFormNew;
