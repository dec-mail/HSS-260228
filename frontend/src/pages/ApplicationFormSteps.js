import React from 'react';

// Step 2: Financial Information
export function renderFinancial(formData, handleInputChange, errors) {
  const incomeOptions = [
    { value: 'age_pension', label: 'Age Pension' },
    { value: 'part_time_work', label: 'Part-time Work' },
    { value: 'rental_income', label: 'Rental Income' },
    { value: 'carer_payment', label: 'Carer Payment' },
    { value: 'superannuation', label: 'Superannuation' },
    { value: 'investments', label: 'Investments/Dividends' },
    { value: 'disability_pension', label: 'Disability Pension' },
    { value: 'other', label: 'Other' }
  ];

  return (
    <div className="form-step" data-testid="step-2">
      <h2>Financial Information</h2>
      <p className="step-description">Help us understand your budget to find suitable housing options.</p>
      
      <div className="form-group">
        <label className="input-label">Income Sources (tick all that apply) *</label>
        <div className="checkbox-grid two-col">
          {incomeOptions.map(option => (
            <label key={option.value} className="checkbox-label">
              <input
                type="checkbox"
                name="income_sources[]"
                value={option.value}
                checked={formData.income_sources?.includes(option.value)}
                onChange={handleInputChange}
                data-testid={`income-${option.value}`}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
        {errors.income_sources && <span className="error-message">{errors.income_sources}</span>}
      </div>

      <div className="form-group">
        <label className="input-label">Budget for Rent & Shared Utilities</label>
        <p className="field-hint">Include your share of rent plus contribution to shared utilities like electricity, gas, and internet.</p>
        <div className="form-row">
          <div className="form-group">
            <label className="input-label">Weekly Budget ($)</label>
            <input
              type="number"
              name="weekly_budget"
              value={formData.weekly_budget}
              onChange={handleInputChange}
              className="input-field"
              placeholder="e.g., 250"
              data-testid="weekly-budget-input"
            />
          </div>
          <div className="form-group">
            <label className="input-label">Monthly Budget ($)</label>
            <input
              type="number"
              name="monthly_budget"
              value={formData.monthly_budget}
              onChange={handleInputChange}
              className="input-field"
              placeholder="e.g., 1000"
              data-testid="monthly-budget-input"
            />
          </div>
        </div>
        {errors.budget && <span className="error-message">{errors.budget}</span>}
      </div>
    </div>
  );
}

// Step 3: Lifestyle
export function renderLifestyle(formData, handleInputChange, errors) {
  const hobbiesOptions = [
    'Gardening', 'TV/Movies', 'Card games', 'Painting', 'Crafts', 'Gaming',
    'Music playing', 'Bowls', 'Table tennis', 'Pool/Snooker/Billiards',
    'Restaurants/Bistros/Cafes', 'Bands-listening', 'Walking/Running', 'Swimming',
    'Cooking/Baking', 'Chess/Draughts/Go', 'Puzzles/Crosswords', 'Sewing/Embroidery',
    'Computers/Internet/Web', 'Music listening', 'Cars/Car maintenance',
    'Badminton', 'Tennis or similar', 'Dancing', 'Bars-drinking', 'Gym/Yoga', 'Bushwalking'
  ];

  return (
    <div className="form-step" data-testid="step-3">
      <h2>Lifestyle</h2>
      <p className="step-description">Tell us about your daily life and interests.</p>
      
      <div className="form-row">
        <div className="form-group">
          <label className="input-label">Smoking Status *</label>
          <select
            name="smoking_status"
            value={formData.smoking_status}
            onChange={handleInputChange}
            className="input-field"
            data-testid="smoking-select"
          >
            <option value="non_smoker">Non-smoker</option>
            <option value="smoker_outside">Smoker (outside only)</option>
            <option value="smoker_inside">Smoker (inside & outside)</option>
            <option value="vaper">Vaper</option>
            <option value="social_smoker">Social/Occasional smoker</option>
          </select>
        </div>
        <div className="form-group">
          <label className="input-label">Do you have pets?</label>
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                name="has_pets"
                value="true"
                checked={formData.has_pets === true}
                onChange={(e) => handleInputChange({ target: { name: 'has_pets', value: true, type: 'radio' }})}
                data-testid="has-pets-yes"
              />
              <span>Yes</span>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="has_pets"
                value="false"
                checked={formData.has_pets === false}
                onChange={(e) => handleInputChange({ target: { name: 'has_pets', value: false, type: 'radio' }})}
                data-testid="has-pets-no"
              />
              <span>No</span>
            </label>
          </div>
        </div>
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
        <label className="input-label">Daily Routine *</label>
        <div className="radio-group vertical">
          <label className="radio-label">
            <input type="radio" name="daily_routine" value="early_riser" checked={formData.daily_routine === 'early_riser'} onChange={handleInputChange} />
            <span>Early riser (up before 6am)</span>
          </label>
          <label className="radio-label">
            <input type="radio" name="daily_routine" value="morning_person" checked={formData.daily_routine === 'morning_person'} onChange={handleInputChange} />
            <span>Morning person (up 6-8am)</span>
          </label>
          <label className="radio-label">
            <input type="radio" name="daily_routine" value="late_riser" checked={formData.daily_routine === 'late_riser'} onChange={handleInputChange} />
            <span>Late riser (up after 8am)</span>
          </label>
          <label className="radio-label">
            <input type="radio" name="daily_routine" value="night_owl" checked={formData.daily_routine === 'night_owl'} onChange={handleInputChange} />
            <span>Night owl (active late evenings)</span>
          </label>
          <label className="radio-label">
            <input type="radio" name="daily_routine" value="early_bed" checked={formData.daily_routine === 'early_bed'} onChange={handleInputChange} />
            <span>Early to bed (before 9pm)</span>
          </label>
        </div>
      </div>

      <div className="form-group">
        <label className="input-label">Hobbies and Interests</label>
        <div className="checkbox-grid two-col">
          {hobbiesOptions.map(hobby => (
            <label key={hobby} className="checkbox-label">
              <input
                type="checkbox"
                name="hobbies[]"
                value={hobby}
                checked={formData.hobbies?.includes(hobby)}
                onChange={handleInputChange}
                data-testid={`hobby-${hobby.toLowerCase().replace(/[\s\/]/g, '-')}`}
              />
              <span>{hobby}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="input-label">Other Hobbies</label>
        <input
          type="text"
          name="other_hobbies"
          value={formData.other_hobbies}
          onChange={handleInputChange}
          className="input-field"
          placeholder="e.g., Karaoke, Sailing, Photography"
          data-testid="other-hobbies-input"
        />
      </div>
    </div>
  );
}

// Step 4: Household & Community
export function renderHousehold(formData, handleInputChange, errors) {
  const responsibilityOptions = [
    'Cleaning shared areas',
    'Garden care',
    'Property maintenance',
    'Grocery shopping',
    'Transport for community (with shared costs)'
  ];

  return (
    <div className="form-step" data-testid="step-4">
      <h2>Household & Community</h2>
      <p className="step-description">Tell us about your preferences for shared living.</p>
      
      <div className="form-group">
        <label className="input-label">Household Responsibilities (What could you help with?)</label>
        <div className="checkbox-grid one-col">
          {responsibilityOptions.map(resp => (
            <label key={resp} className="checkbox-label">
              <input
                type="checkbox"
                name="household_responsibilities[]"
                value={resp}
                checked={formData.household_responsibilities?.includes(resp)}
                onChange={handleInputChange}
              />
              <span>{resp}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="input-label">Cooking Preference *</label>
        <div className="radio-group vertical">
          <label className="radio-label">
            <input type="radio" name="cooking_preference" value="own_cooking" checked={formData.cooking_preference === 'own_cooking'} onChange={handleInputChange} />
            <span>Prefer to do my own cooking</span>
          </label>
          <label className="radio-label">
            <input type="radio" name="cooking_preference" value="shared_meals" checked={formData.cooking_preference === 'shared_meals'} onChange={handleInputChange} />
            <span>Enjoy shared meals with housemates</span>
          </label>
          <label className="radio-label">
            <input type="radio" name="cooking_preference" value="mix" checked={formData.cooking_preference === 'mix'} onChange={handleInputChange} />
            <span>Mix of both</span>
          </label>
        </div>
      </div>

      <div className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            name="share_transport"
            checked={formData.share_transport}
            onChange={handleInputChange}
          />
          <span>Happy to share car driving & expenses with housemates</span>
        </label>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="input-label">Visitors Frequency</label>
          <select
            name="visitors_frequency"
            value={formData.visitors_frequency}
            onChange={handleInputChange}
            className="input-field"
          >
            <option value="rarely">Rarely</option>
            <option value="few_months">Every few months</option>
            <option value="monthly">Monthly</option>
            <option value="weekly">Weekly</option>
            <option value="daily">Daily</option>
          </select>
        </div>
        <div className="form-group">
          <label className="input-label">Overnight Guests</label>
          <select
            name="overnight_guests"
            value={formData.overnight_guests}
            onChange={handleInputChange}
            className="input-field"
          >
            <option value="never">Never</option>
            <option value="rarely">Rarely</option>
            <option value="occasionally">Occasionally</option>
            <option value="regularly">Regularly</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label className="input-label">Religious & Cultural Requirements</label>
        <textarea
          name="religious_cultural_requirements"
          value={formData.religious_cultural_requirements}
          onChange={handleInputChange}
          className="input-field"
          rows="3"
          placeholder="Any religious or cultural practices/requirements we should know about"
        />
      </div>
    </div>
  );
}

// Placeholder steps 5-8 (to be enhanced later)
export function renderSafety(formData, handleInputChange, errors) {
  return (
    <div className="form-step" data-testid="step-5">
      <h2>Safety & References</h2>
      <p className="step-description">We prioritize the safety of our community.</p>
      
      <div className="form-group">
        <label className="input-label">Police Check Status</label>
        <select name="police_check_status" value={formData.police_check_status} onChange={handleInputChange} className="input-field">
          <option value="">Select...</option>
          <option value="have_current">I have a current police check</option>
          <option value="can_obtain">I can obtain one</option>
          <option value="need_help">I need help obtaining one</option>
        </select>
      </div>

      <div className="form-group">
        <label className="input-label">Can you provide references?</label>
        <div className="radio-group">
          <label className="radio-label">
            <input type="radio" name="can_provide_references" value="true" checked={formData.can_provide_references === true} onChange={(e) => handleInputChange({ target: { name: 'can_provide_references', value: true }})} />
            <span>Yes</span>
          </label>
          <label className="radio-label">
            <input type="radio" name="can_provide_references" value="false" checked={formData.can_provide_references === false} onChange={(e) => handleInputChange({ target: { name: 'can_provide_references', value: false }})} />
            <span>No</span>
          </label>
        </div>
      </div>

      <div className="form-group">
        <label className="input-label">Things I would enjoy in our Shared Community</label>
        <textarea name="things_id_enjoy" value={formData.things_id_enjoy} onChange={handleInputChange} className="input-field" rows="4" placeholder="e.g., Community garden, shared meals, quiet evenings, social activities..."/>
      </div>

      <div className="form-group">
        <label className="input-label">Things I would NOT enjoy in our Shared Community</label>
        <textarea name="things_i_hate" value={formData.things_i_hate} onChange={handleInputChange} className="input-field" rows="4" placeholder="e.g., Loud noise, aggressive behavior, untidiness..."/>
      </div>
    </div>
  );
}

export function renderPreferences(formData, handleInputChange, errors) {
  return (
    <div className="form-step" data-testid="step-6">
      <h2>Your Preferences</h2>
      <p className="step-description">Help us find compatible housemates for you.</p>
      
      <div className="form-row">
        <div className="form-group">
          <label className="input-label">Age Range Preference</label>
          <select name="age_range_preference" value={formData.age_range_preference} onChange={handleInputChange} className="input-field">
            <option value="">No preference</option>
            <option value="60-70">60-70</option>
            <option value="65-75">65-75</option>
            <option value="70-80">70-80</option>
            <option value="75+">75+</option>
          </select>
        </div>
        <div className="form-group">
          <label className="input-label">Household Size Preference</label>
          <select name="household_size_preference" value={formData.household_size_preference} onChange={handleInputChange} className="input-field">
            <option value="">No preference</option>
            <option value="2">2 people</option>
            <option value="3">3 people</option>
            <option value="4">4 people</option>
            <option value="5+">5+ people</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label className="input-label">Preferred Location</label>
        <input type="text" name="preferred_location" value={formData.preferred_location} onChange={handleInputChange} className="input-field" placeholder="e.g., Sydney, Melbourne suburbs"/>
      </div>

      <div className="form-group">
        <label className="input-label">Deal Makers (What would make this ideal for you?)</label>
        <textarea name="deal_makers" value={formData.deal_makers} onChange={handleInputChange} className="input-field" rows="4" placeholder="e.g., Shared garden space, quiet neighborhood, close to shops..."/>
      </div>

      <div className="form-group">
        <label className="input-label">Non-Negotiable Conditions (What do you absolutely need?)</label>
        <textarea name="non_negotiable_conditions" value={formData.non_negotiable_conditions} onChange={handleInputChange} className="input-field" rows="4" placeholder="e.g., Must have own bathroom, parking space, internet access..."/>
      </div>
    </div>
  );
}

export function renderUsefulItems(formData, handleInputChange, errors) {
  const itemOptions = [
    'Car', 'Bicycle', 'Motor bike', 'Microwave', 'Oven', 'Fridge', 'Freezer', 'TV',
    'Music equipment', 'Washing Machine', 'Dryer', 'Mower', 'Whipper snipper',
    'Garden tools', 'Hand tools', 'Power tools', 'Lounge furniture', 'Outdoor furniture'
  ];

  return (
    <div className="form-step" data-testid="step-7">
      <h2>Useful Items You Could Bring</h2>
      <p className="step-description">What items could you contribute to the shared household?</p>
      
      <div className="checkbox-grid two-col">
        {itemOptions.map(item => (
          <label key={item} className="checkbox-label">
            <input
              type="checkbox"
              name="useful_items[]"
              value={item}
              checked={formData.useful_items?.includes(item)}
              onChange={handleInputChange}
            />
            <span>{item}</span>
          </label>
        ))}
      </div>

      <div className="form-group">
        <label className="input-label">Other Items</label>
        <input type="text" name="other_items" value={formData.other_items} onChange={handleInputChange} className="input-field" placeholder="List any other useful items"/>
      </div>
    </div>
  );
}

export function renderReview(formData) {
  return (
    <div className="form-step" data-testid="step-8">
      <h2>Review Your Application</h2>
      <p className="step-description">Please review your information before submitting.</p>
      
      <div className="review-section">
        <h3>Personal Details</h3>
        <p><strong>Shared Housing Type:</strong> {formData.shared_housing_type?.replace('_', ' ')}</p>
        <p><strong>Name:</strong> {formData.first_name} {formData.last_name}</p>
        <p><strong>Phone:</strong> {formData.phone}</p>
        <p><strong>Address:</strong> {formData.address}, {formData.city}, {formData.state} {formData.postcode}</p>
      </div>

      <div className="review-section">
        <h3>Financial Information</h3>
        <p><strong>Income Sources:</strong> {formData.income_sources?.join(', ') || 'Not specified'}</p>
        {formData.weekly_budget && <p><strong>Weekly Budget:</strong> ${formData.weekly_budget}</p>}
        {formData.monthly_budget && <p><strong>Monthly Budget:</strong> ${formData.monthly_budget}</p>}
      </div>

      <div className="review-section">
        <h3>Lifestyle</h3>
        <p><strong>Smoking:</strong> {formData.smoking_status?.replace('_', ' ')}</p>
        <p><strong>Pets:</strong> {formData.has_pets ? `Yes - ${formData.pet_details}` : 'No'}</p>
        <p><strong>Daily Routine:</strong> {formData.daily_routine?.replace('_', ' ')}</p>
        {formData.hobbies?.length > 0 && <p><strong>Hobbies:</strong> {formData.hobbies.join(', ')}</p>}
      </div>

      <div className="declaration">
        <p><strong>Declaration:</strong> I declare that the information provided is true and accurate to the best of my knowledge.</p>
      </div>
    </div>
  );
}
