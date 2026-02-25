# House Sharing Seniors - PRD

## Original Problem Statement
Build `housesharingeniors.com.au`, a platform for seniors to find shared housing. The primary goal is to help them reduce rent and other living costs while finding a compatible community.

## Core Architecture
- **Frontend**: React + Tailwind CSS
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Authentication**: Custom JWT email/password (no Google OAuth)
- **Email**: Resend API
- **File Storage**: Local file system (`/app/backend/uploads`) - temporary

## User Personas
1. **Senior Applicant** - Fills out application form, waits for approval, registers account
2. **Approved Member** - Browses members, shortlists housemates, views properties, favorites
3. **Admin** - Reviews applications, manages properties/members, approves/rejects, manages inquiries

## What's Been Implemented

### Authentication System
- JWT-based email/password auth (login, register)
- Registration restricted to approved applicants only
- Forgot Password flow (email with reset link via Resend)
- Reset Password page (token-based)
- Change Password in Member Dashboard Settings tab
- Admin seeded on startup: admin@housesharingseniors.com.au / HSSadmin2024!

### Application System
- 8-step multi-part application form with save/resume (access codes)
- Real email notifications via Resend (access codes, confirmations, approvals, rejections)
- Admin can review, approve, reject applications

### Property Management
- CRUD for properties (add, edit, delete)
- Multi-image upload (local storage)
- CSV bulk upload
- Public property listings with search/filter
- Property detail pages

### Express Interest (NEW - Feb 25, 2026)
- Functional "Express Interest" button on property detail pages
- Modal form with phone and message fields
- Backend stores interests and emails admin via Resend
- Admin Dashboard "Inquiries" tab to view and manage interests
- Admin can mark interests as "reviewed"
- Duplicate interest prevention

### User Favorites (NEW - Feb 25, 2026)
- Save/unsave favorite properties (heart button on property detail page)
- Save/unsave favorite members (heart icon on member cards)
- Dedicated "Favorites" tab on Member Dashboard
- Favorites show enriched data (property details, member info)
- Remove favorites functionality

### Member Dashboard
- Browse members tab with search/filter
- Shortlist members
- Favorites tab (properties + members)
- Settings tab with Change Password

### Admin Dashboard
- Stats cards (Applications, Pending, Properties, Members, New Inquiries)
- Applications management (approve/reject)
- Properties management (CRUD)
- Members management
- Inquiries tab (Express Interest records)

### Static Pages
- About, Contact, FAQ, Privacy, Terms, Cookie, Support, Resources, Sitemap, 404

## Key API Endpoints
- `/api/auth/register` - Register (requires approved application)
- `/api/auth/login` - Login
- `/api/auth/logout` - Logout
- `/api/auth/me` - Get current user
- `/api/auth/forgot-password` - Request password reset
- `/api/auth/reset-password` - Reset password with token
- `/api/auth/change-password` - Change password (authenticated)
- `/api/applications/*` - Application CRUD
- `/api/properties/*` - Property CRUD
- `/api/members` - List members
- `/api/shortlists/*` - Shortlist CRUD
- `/api/interests` - Express Interest (POST create, GET admin list)
- `/api/interests/my` - User's own interests
- `/api/interests/{id}/status` - Admin update interest status
- `/api/favorites` - Favorites (POST add, GET list, DELETE remove)
- `/api/contact` - Contact form

## DB Collections
- `users` - {user_id, email, name, password_hash, role, application_id, ...}
- `applications` - {application_id, email, status, first_name, last_name, ...}
- `draft_applications` - {email, access_code, status, data, current_step}
- `properties` - {property_id, city, state, weekly_rent_per_person, images, ...}
- `shortlists` - {shortlist_id, user_id, shortlisted_user_id}
- `password_reset_tokens` - {token, email, user_id, expires_at, used}
- `property_interests` - {interest_id, user_id, property_id, message, phone, status}
- `favorites` - {favorite_id, user_id, item_id, item_type}
- `admin_notes`, `audit_logs`, `contact_submissions`

## Credentials
- Admin: admin@housesharingseniors.com.au / HSSadmin2024!
- Test User: jane.doe.test@example.com / testpass123

---

## Prioritized Backlog

### P0 (Critical) - ALL DONE
- ~~Approved applicant registration~~ DONE
- ~~Forgot Password~~ DONE
- ~~Change Password~~ DONE

### P1 (High) - ALL DONE
- ~~Express Interest button on properties~~ DONE
- ~~User Favorites (properties and members)~~ DONE

### P2 (Medium)
- Test existing Shortlist feature thoroughly
- Move admin password from seed.py to environment variable
- Approval email with direct registration link

### P3 (Lower)
- Cloud image storage (replace local /uploads with S3/Cloudinary)
- User Groups feature
- In-app messaging between members
- Production deployment preparation
