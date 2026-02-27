# House Sharing Seniors - PRD

## Original Problem Statement
Build `housesharingeniors.com.au`, a platform for seniors to find shared housing, reducing rent via CRA and finding compatible community.

## Tech Stack
- **Frontend**: React + Tailwind CSS | **Backend**: FastAPI | **DB**: MongoDB
- **Auth**: JWT email/password | **Email**: Resend API | **Images**: Cloudinary
- **SMS**: Twilio (stubbed, ready to activate)

## Implemented Features
- Auth: Register (approved applicants only), Login, Forgot/Reset/Change Password
- 8-step application form with save/resume, email notifications
- Admin Dashboard: Stats, Applications (bulk approve/reject), Properties, Members, Inquiries, **Group Applications**
- Property Management: CRUD, multi-image upload (Cloudinary), CSV bulk upload
- Property listings with CRA formula
- Homepage property carousel
- Express Interest on properties
- User Favorites (properties + members)
- **Property-Centric Groups** (create, join, leave, waitlist, delete)
- Unique `property_code` per property in `STATE-SUB-STR-NUM` format
- **Group Chat** — per-group private chat on Property Detail Page
- **Community Chat** — site-wide chat on Home Page + Member Dashboard
- **User Profiles** — username (`GivenNameN`), display_name, avatar upload, profile images
- **In-App Notifications** — bell icon with unread count, dropdown, mark read
- **Email Notifications** — triggered on messages, group joins, application status changes
- **SMS Framework** — Twilio stub, ready to activate (needs env vars)
- **Notification Preferences** — toggle email/SMS/push in Settings
- **Property-Group Applications** — group applies collectively, admin approves/rejects
- In-app 1:1 Messaging
- Member Profile Pages
- Static pages: About, Contact, FAQ, Privacy, Terms

## Credentials
- Admin: admin@housesharingseniors.com.au / HSSadmin2024!

## Remaining Backlog
- P2: Email/in-app notifications for more group events (leave, kick)
- P2: Security hardening (rate limiting, input sanitization)
- P3: Custom domain, DB backups, production deployment
- Nice: Admin bulk property actions, advanced member search
