# House Sharing Seniors - Product Requirements Document

## Overview
**Project**: House Sharing Seniors (housesharingseniors.com.au)
**Purpose**: A platform for Australian Age Pensioners to find shared housing, helping them reduce rent and living costs while finding compatible communities.

## Tech Stack
- **Frontend**: React, Tailwind CSS
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Authentication**: Emergent-managed Google OAuth with JWT session management

## Core Features

### 1. Application Form (8-Step Modular Form)
- Step 1: Personal Details (includes Housing Type dropdown)
- Step 2: Financial Information
- Step 3: Lifestyle
- Step 4: Household & Community
- Step 5: Safety & References
- Step 6: Preferences
- Step 7: Useful Items
- Step 8: Review & Submit
- **Save & Resume**: Users can save progress with access code

### 2. User Dashboards
- **Admin Dashboard**: Review, approve, reject applications
- **Member Dashboard**: Browse other members, shortlist, search/filter

### 3. Property Management
- **Add Property**: Individual form and CSV bulk upload
- **Properties Page**: Search/filter by city, state, type, bedrooms, rent, amenities
- **Property Detail Page**: View full property details with image gallery

### 4. Authentication
- Google OAuth login via Emergent Auth
- JWT session management
- Role-based access (admin/member)

## What's Been Implemented (Feb 24, 2026)

### Completed
- [x] Full-stack application setup (React + FastAPI + MongoDB)
- [x] 8-step modular application form with save/resume
- [x] Admin Dashboard for application management
- [x] Member Dashboard with browse and shortlist functionality
- [x] Google OAuth integration
- [x] User's logo and favicon integrated
- [x] Website copy focused on cost savings (not "matching")
- [x] "Given Name" / "Family Name" labels (culturally appropriate)
- [x] Property Management MVP (add individual/bulk via CSV)
- [x] **Properties Page with Search/Filter** (city, state, type, bedrooms, rent, amenities)
- [x] **Property Detail Page** (image gallery, property info, amenities)
- [x] **Housing Type Dropdown Fix** (descriptive labels showing community type + bedroom count)
- [x] **Light Theme Enforced** (color-scheme: light only)
- [x] **Browse Properties Button** added to homepage navigation
- [x] **Member Search/Filter** functionality in Member Dashboard

### Mocked/Placeholder
- Email notifications (logged to console)
- Property image uploads (using placeholder URLs)

## API Endpoints

### Authentication
- `GET /api/auth/google` - Initiate OAuth flow
- `GET /api/auth/callback` - OAuth callback
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Applications
- `POST /api/applications/start` - Start new application
- `POST /api/applications/save` - Save application progress
- `POST /api/applications/resume` - Resume with access code
- `POST /api/applications/submit` - Submit application
- `GET /api/applications` - List all (admin only)
- `GET /api/applications/{id}` - Get single application
- `PATCH /api/applications/{id}/status` - Update status

### Properties
- `GET /api/properties` - List all properties
- `GET /api/properties/{id}` - Get single property
- `POST /api/properties` - Create property (auth required)
- `POST /api/properties/bulk` - Bulk create from CSV
- `PATCH /api/properties/{id}` - Update property
- `DELETE /api/properties/{id}` - Delete property

### Members
- `GET /api/members` - List approved members
- `GET /api/shortlists` - Get user's shortlist
- `POST /api/shortlists` - Add to shortlist
- `DELETE /api/shortlists/{id}` - Remove from shortlist

## Database Schema

### users
```json
{
  "user_id": "string",
  "email": "string",
  "name": "string",
  "given_name": "string",
  "family_name": "string",
  "role": "admin|member",
  "google_id": "string",
  "picture": "string",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### applications
```json
{
  "application_id": "string",
  "email": "string",
  "access_code": "string",
  "status": "draft|pending|approved|rejected",
  "form_data": { /* all 8 steps */ },
  "current_step": "number",
  "created_at": "datetime",
  "updated_at": "datetime",
  "submitted_at": "datetime"
}
```

### properties
```json
{
  "property_id": "string",
  "address": "string",
  "city": "string",
  "state": "string",
  "postcode": "string",
  "property_type": "house|apartment|townhouse|unit",
  "total_bedrooms": "number",
  "available_bedrooms": "number",
  "total_bathrooms": "number",
  "weekly_rent_per_person": "number",
  "amenities": ["array"],
  "images": ["array"],
  "description": "string",
  "house_rules": "string",
  "pet_policy": "string",
  "smoking_policy": "string",
  "status": "active|inactive",
  "added_by_user_id": "string",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

## Prioritized Backlog

### P0 (Must Have - Complete)
- [x] Dark mode fix
- [x] Housing Type dropdown descriptive labels
- [x] Property search/filter functionality

### P1 (Should Have - Next)
- [ ] Real image uploads for properties (cloud storage)
- [ ] Real email notifications (Resend/SES)

### P2 (Nice to Have)
- [ ] Static content pages (Terms, Privacy)
- [ ] In-app messaging between members
- [ ] Advanced member-matching algorithm

### P3 (Future)
- [ ] Vacancy/occupancy management
- [ ] Admin user guide
- [ ] Production deployment prep

## Routes

```
/                       - Landing Page
/apply                  - Start Application
/apply/resume           - Resume Application
/apply/form             - Application Form (8 steps)
/properties             - Browse Properties (public)
/properties/add         - Add Property (auth required)
/properties/:id         - Property Detail Page
/admin                  - Admin Dashboard (admin only)
/dashboard              - Member Dashboard (auth required)
```

## Notes
- Default admin user is seeded during setup
- All emails currently logged to backend console (MOCKED)
- Property images use placeholder URLs (MOCKED)
- User trust was low due to previous agent issues - maintain transparency
