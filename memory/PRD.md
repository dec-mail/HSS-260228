# House Sharing Seniors - PRD

## Original Problem Statement
Build `housesharingeniors.com.au`, a platform for seniors to find shared housing, reducing rent via CRA and finding compatible community.

## Tech Stack
- **Frontend**: React + Tailwind CSS | **Backend**: FastAPI | **DB**: MongoDB
- **Auth**: JWT email/password | **Email**: Resend API | **Images**: Cloudinary

## Implemented Features
- Auth: Register (approved applicants only), Login, Forgot/Reset/Change Password
- 8-step application form with save/resume, email notifications
- Admin Dashboard: Stats, Applications (with bulk approve/reject), Properties, Members, Inquiries
- Property Management: CRUD, multi-image upload (Cloudinary), CSV bulk upload
- Property listings with CRA formula (75% rebate over threshold, capped)
- Homepage property carousel with real images
- Express Interest on properties (modal + admin email + Inquiries tab)
- User Favorites (properties + members)
- **Property-Centric Groups** (create, join, leave, waitlist, delete) — tied to specific properties
- Unique `property_code` per property in `STATE-SUB-STR-NUM` format
- Groups UI on Property Detail Page (create group modal, join/leave/delete)
- Groups tab in Member Dashboard
- **Community Chat** — site-wide chat on Home Page + Member Dashboard
- **Group Chat** — per-group chat on Property Detail Page (each group has its own chat)
- In-app Messaging (1-to-1 conversations)
- Member Profile Pages (from application data)
- Static pages: About, Contact, FAQ, Privacy, Terms, etc.

## Chat Architecture
- `chat_messages` collection with `channel_type` ("community" / "group") + `channel_id`
- Community: public read, auth-required write
- Group: auth + membership required for read/write
- Reusable `ChatBox` component with 5-second polling

## CRA Formula
- Singles: min($71.80, 0.75 × max(0, rent - $76.00))
- Couples: min($101.50, 0.75 × max(0, rent - $123.10))

## Credentials
- Admin: admin@housesharingseniors.com.au / HSSadmin2024!
- Test: jane.doe.test@example.com / testpass123

## Remaining Backlog
- P1: User Profile enhancements (usernames, avatars, display_name)
- P1: Property-group application flow (group applies collectively)
- P2: Email/in-app notifications for group events
- P2: Security hardening (rate limiting, input sanitization)
- P3: Custom domain, DB backups, production deployment
