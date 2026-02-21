import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './ApplicationForm.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ApplicationForm = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  
  const [formData, setFormData] = useState({
    // Step 1: Personal Details
    shared_housing_type: 'single_female',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    address: '',
    city: '',
    state: 'NSW',
    postcode: '',
    
    // Step 2: Financial
    pension_status: 'full',
    weekly_budget: '',
    has_assets: false,
    assets_description: '',
    
    // Step 3: Health & Accessibility
    mobility_level: 'independent',
    medical_conditions: '',
    requires_care: false,
    care_details: '',
    
    // Step 4: Lifestyle
    is_smoker: false,
    has_pets: false,
    pet_details: '',
    dietary_preferences: 'none',
    interests: '',
    daily_routine: '',
    
    // Step 5: Safety & Risk
    criminal_history: false,
    criminal_details: '',
    references: '',
    
    // Step 6: Housemate Preferences
    preferred_age_range: '65-75',
    preferred_gender: 'any',
    preferred_location: '',
    preferred_interests: ''
  });

  const totalSteps = 7; // 6 form steps + 1 review step

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    if (step === 1) {
      if (!formData.first_name.trim()) newErrors.first_name = 'Given name is required';
      if (!formData.last_name.trim()) newErrors.last_name = 'Family name is required';
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
      if (!formData.date_of_birth) newErrors.date_of_birth = 'Date of birth is required';
      if (!formData.address.trim()) newErrors.address = 'Address is required';
      if (!formData.city.trim()) newErrors.city = 'City is required';
      if (!formData.postcode.trim()) newErrors.postcode = 'Postcode is required';
    } else if (step === 2) {
      if (!formData.weekly_budget) newErrors.weekly_budget = 'Weekly budget is required';
    } else if (step === 4) {
      if (!formData.interests.trim()) newErrors.interests = 'Please share your interests';
      if (!formData.daily_routine.trim()) newErrors.daily_routine = 'Please describe your daily routine';
    } else if (step === 5) {
      if (!formData.references.trim()) newErrors.references = 'References are required';
    } else if (step === 6) {
      if (!formData.preferred_location.trim()) newErrors.preferred_location = 'Preferred location is required';
      if (!formData.preferred_interests.trim()) newErrors.preferred_interests = 'Please share preferred housemate interests';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
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
      await axios.post(`${API}/applications`, {
        ...formData,
        weekly_budget: parseFloat(formData.weekly_budget)
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
      <div className="application-form">
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
    <div className="application-form">
      <div className="container">
        <div className="form-header">
          <h1 data-testid="form-title">House Sharing Seniors Application</h1>
          <p>Step {currentStep} of {totalSteps}</p>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              data-testid="progress-bar"
            />
          </div>
        </div>

        <div className="form-content">
          {/* Step 1: Personal Details */}
          {currentStep === 1 && (
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
                <p className="field-hint" style={{marginTop: '8px', fontStyle: 'italic'}}>
                  Note: HSS policy ensures comfort and security - all properties are single-gender households, except for couples.
                </p>
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
                  <label className="input-label">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="input-field"
                    data-testid="email-input"
                  />
                  {errors.email && <span className="error-message">{errors.email}</span>}
                </div>
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
          )}

          {/* Step 2: Financial Information */}
          {currentStep === 2 && (
            <div className="form-step" data-testid="step-2">
              <h2>Financial Information</h2>
              <p className="step-description">Help us understand your financial situation.</p>
              
              <div className="form-group">
                <label className="input-label">Pension Status *</label>
                <select
                  name="pension_status"
                  value={formData.pension_status}
                  onChange={handleInputChange}
                  className="input-field"
                  data-testid="pension-status-select"
                >
                  <option value="full">Full Age Pension</option>
                  <option value="part">Part Age Pension</option>
                  <option value="other">Other Pension</option>
                </select>
              </div>

              <div className="form-group">
                <label className="input-label">Weekly Budget for Accommodation ($) *</label>
                <input
                  type="number"
                  name="weekly_budget"
                  value={formData.weekly_budget}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="e.g., 200"
                  data-testid="budget-input"
                />
                {errors.weekly_budget && <span className="error-message">{errors.weekly_budget}</span>}
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="has_assets"
                    checked={formData.has_assets}
                    onChange={handleInputChange}
                    data-testid="has-assets-checkbox"
                  />
                  <span>I have additional assets or property</span>
                </label>
              </div>

              {formData.has_assets && (
                <div className="form-group">
                  <label className="input-label">Please describe your assets</label>
                  <textarea
                    name="assets_description"
                    value={formData.assets_description}
                    onChange={handleInputChange}
                    className="input-field"
                    rows="3"
                    data-testid="assets-description-textarea"
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 3: Health & Accessibility */}
          {currentStep === 3 && (
            <div className="form-step" data-testid="step-3">
              <h2>Health & Accessibility</h2>
              <p className="step-description">This helps us find compatible housemates.</p>
              
              <div className="form-group">
                <label className="input-label">Mobility Level *</label>
                <select
                  name="mobility_level"
                  value={formData.mobility_level}
                  onChange={handleInputChange}
                  className="input-field"
                  data-testid="mobility-select"
                >
                  <option value="independent">Fully Independent</option>
                  <option value="assisted">Requires Some Assistance</option>
                  <option value="limited">Limited Mobility</option>
                </select>
              </div>

              <div className="form-group">
                <label className="input-label">Medical Conditions (Optional)</label>
                <textarea
                  name="medical_conditions"
                  value={formData.medical_conditions}
                  onChange={handleInputChange}
                  className="input-field"
                  rows="3"
                  placeholder="Please list any relevant medical conditions"
                  data-testid="medical-conditions-textarea"
                />
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="requires_care"
                    checked={formData.requires_care}
                    onChange={handleInputChange}
                    data-testid="requires-care-checkbox"
                  />
                  <span>I require daily care or assistance</span>
                </label>
              </div>

              {formData.requires_care && (
                <div className="form-group">
                  <label className="input-label">Care Details</label>
                  <textarea
                    name="care_details"
                    value={formData.care_details}
                    onChange={handleInputChange}
                    className="input-field"
                    rows="3"
                    data-testid="care-details-textarea"
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 4: Lifestyle */}
          {currentStep === 4 && (
            <div className="form-step" data-testid="step-4">
              <h2>Lifestyle</h2>
              <p className="step-description">Tell us about your daily life and habits.</p>
              
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="is_smoker"
                    checked={formData.is_smoker}
                    onChange={handleInputChange}
                    data-testid="is-smoker-checkbox"
                  />
                  <span>I am a smoker</span>
                </label>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="has_pets"
                    checked={formData.has_pets}
                    onChange={handleInputChange}
                    data-testid="has-pets-checkbox"
                  />
                  <span>I have pets</span>
                </label>
              </div>

              {formData.has_pets && (
                <div className="form-group">
                  <label className="input-label">Pet Details</label>
                  <input
                    type="text"
                    name="pet_details"
                    value={formData.pet_details}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="e.g., Small dog, indoor cat"
                    data-testid="pet-details-input"
                  />
                </div>
              )}

              <div className="form-group">
                <label className="input-label">Dietary Preferences *</label>
                <select
                  name="dietary_preferences"
                  value={formData.dietary_preferences}
                  onChange={handleInputChange}
                  className="input-field"
                  data-testid="dietary-select"
                >
                  <option value="none">No restrictions</option>
                  <option value="vegetarian">Vegetarian</option>
                  <option value="vegan">Vegan</option>
                  <option value="halal">Halal</option>
                  <option value="kosher">Kosher</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label className="input-label">Your Interests & Hobbies *</label>
                <textarea
                  name="interests"
                  value={formData.interests}
                  onChange={handleInputChange}
                  className="input-field"
                  rows="3"
                  placeholder="e.g., Reading, gardening, walking, card games"
                  data-testid="interests-textarea"
                />
                {errors.interests && <span className="error-message">{errors.interests}</span>}
              </div>

              <div className="form-group">
                <label className="input-label">Daily Routine *</label>
                <textarea
                  name="daily_routine"
                  value={formData.daily_routine}
                  onChange={handleInputChange}
                  className="input-field"
                  rows="3"
                  placeholder="Describe your typical day"
                  data-testid="routine-textarea"
                />
                {errors.daily_routine && <span className="error-message">{errors.daily_routine}</span>}
              </div>
            </div>
          )}

          {/* Step 5: Safety & Risk */}
          {currentStep === 5 && (
            <div className="form-step" data-testid="step-5">
              <h2>Safety & References</h2>
              <p className="step-description">We prioritize the safety of our community.</p>
              
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="criminal_history"
                    checked={formData.criminal_history}
                    onChange={handleInputChange}
                    data-testid="criminal-history-checkbox"
                  />
                  <span>I have a criminal history to disclose</span>
                </label>
              </div>

              {formData.criminal_history && (
                <div className="form-group">
                  <label className="input-label">Criminal History Details</label>
                  <textarea
                    name="criminal_details"
                    value={formData.criminal_details}
                    onChange={handleInputChange}
                    className="input-field"
                    rows="3"
                    data-testid="criminal-details-textarea"
                  />
                </div>
              )}

              <div className="form-group">
                <label className="input-label">References *</label>
                <p className="field-hint">Please provide at least 2 references (name, relationship, contact)</p>
                <textarea
                  name="references"
                  value={formData.references}
                  onChange={handleInputChange}
                  className="input-field"
                  rows="5"
                  placeholder="e.g., John Smith, Friend, 0412345678"
                  data-testid="references-textarea"
                />
                {errors.references && <span className="error-message">{errors.references}</span>}
              </div>
            </div>
          )}

          {/* Step 6: Housemate Preferences */}
          {currentStep === 6 && (
            <div className="form-step" data-testid="step-6">
              <h2>Sharing Preferences</h2>
              <p className="step-description">Help us find compatible housemates to share costs with.</p>
              
              <div className="form-group">
                <label className="input-label">Preferred Age Range *</label>
                <select
                  name="preferred_age_range"
                  value={formData.preferred_age_range}
                  onChange={handleInputChange}
                  className="input-field"
                  data-testid="age-range-select"
                >
                  <option value="60-70">60-70</option>
                  <option value="65-75">65-75</option>
                  <option value="70-80">70-80</option>
                  <option value="75+">75+</option>
                  <option value="any">Any age</option>
                </select>
              </div>

              <div className="form-group">
                <label className="input-label">Preferred Location *</label>
                <input
                  type="text"
                  name="preferred_location"
                  value={formData.preferred_location}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="e.g., Sydney, Melbourne suburbs"
                  data-testid="location-input"
                />
                {errors.preferred_location && <span className="error-message">{errors.preferred_location}</span>}
              </div>

              <div className="form-group">
                <label className="input-label">Preferred Shared Interests *</label>
                <textarea
                  name="preferred_interests"
                  value={formData.preferred_interests}
                  onChange={handleInputChange}
                  className="input-field"
                  rows="3"
                  placeholder="What interests would help create a compatible household?"
                  data-testid="preferred-interests-textarea"
                />
                {errors.preferred_interests && <span className="error-message">{errors.preferred_interests}</span>}
              </div>
            </div>
          )}

          {/* Step 7: Review */}
          {currentStep === 7 && (
            <div className="form-step" data-testid="step-7">
              <h2>Review Your Application</h2>
              <p className="step-description">Please review your information before submitting.</p>
              
              <div className="review-section">
                <h3>Personal Details</h3>
                <p><strong>Shared Housing Type:</strong> {formData.shared_housing_type === 'single_female' ? 'Single Female' : formData.shared_housing_type === 'single_male' ? 'Single Male' : 'Couples'}</p>
                <p><strong>Name:</strong> {formData.first_name} {formData.last_name}</p>
                <p><strong>Email:</strong> {formData.email}</p>
                <p><strong>Phone:</strong> {formData.phone}</p>
                <p><strong>Date of Birth:</strong> {formData.date_of_birth}</p>
                <p><strong>Address:</strong> {formData.address}, {formData.city}, {formData.state} {formData.postcode}</p>
              </div>

              <div className="review-section">
                <h3>Financial Information</h3>
                <p><strong>Pension Status:</strong> {formData.pension_status}</p>
                <p><strong>Weekly Budget:</strong> ${formData.weekly_budget}</p>
                <p><strong>Has Assets:</strong> {formData.has_assets ? 'Yes' : 'No'}</p>
              </div>

              <div className="review-section">
                <h3>Health & Accessibility</h3>
                <p><strong>Mobility Level:</strong> {formData.mobility_level}</p>
                <p><strong>Requires Care:</strong> {formData.requires_care ? 'Yes' : 'No'}</p>
              </div>

              <div className="review-section">
                <h3>Lifestyle</h3>
                <p><strong>Smoker:</strong> {formData.is_smoker ? 'Yes' : 'No'}</p>
                <p><strong>Has Pets:</strong> {formData.has_pets ? 'Yes' : 'No'}</p>
                <p><strong>Dietary Preferences:</strong> {formData.dietary_preferences}</p>
              </div>

              <div className="review-section">
                <h3>Sharing Preferences</h3>
                <p><strong>Age Range:</strong> {formData.preferred_age_range}</p>
                <p><strong>Location:</strong> {formData.preferred_location}</p>
              </div>

              <div className="declaration">
                <p><strong>Declaration:</strong> I declare that the information provided is true and accurate to the best of my knowledge.</p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="form-navigation">
            {currentStep > 1 && (
              <button 
                className="btn btn-secondary" 
                onClick={handleBack}
                disabled={isSubmitting}
                data-testid="back-btn"
              >
                Back
              </button>
            )}
            
            {currentStep < totalSteps ? (
              <button 
                className="btn btn-primary" 
                onClick={handleNext}
                data-testid="next-btn"
              >
                Next
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
  );
};

export default ApplicationForm;
