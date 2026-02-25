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
- User Groups (create, join, leave, delete)
- In-app Messaging (conversations, real-time chat UI)
- Member Profile Pages (from application data)
- Static pages: About, Contact, FAQ, Privacy, Terms, etc.

## CRA Formula
- Singles: min($71.80, 0.75 × max(0, rent - $76.00))
- Couples: min($101.50, 0.75 × max(0, rent - $123.10))

## Credentials
- Admin: admin@housesharingseniors.com.au / HSSadmin2024!
- Test: jane.doe.test@example.com / testpass123

## Remaining Backlog
- P2: Security hardening (rate limiting)
- P3: Custom domain, DB backups, production deployment
- Nice: Admin bulk property actions, advanced member search
