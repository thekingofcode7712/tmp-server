# TMP Server TODO

## Current Sprint - Major Feature Additions

### Bugs to Fix
- [x] Fix infinite loading spinner in Email Settings tab

### Email Storage Plans Upgrade UI
- [x] Create email storage plan selection UI in Email Settings
- [x] Display current plan and usage
- [x] Add upgrade buttons for each plan tier
- [x] Implement Stripe checkout for email storage plans
- [ ] Update webhook to handle email storage plan purchases
- [ ] Apply storage limit increases on purchase

### Email Attachments
- [ ] Add file upload button to email composer
- [ ] Implement drag-and-drop file upload
- [ ] Validate attachment sizes against email storage quota
- [ ] Upload attachments to S3 using storagePut
- [ ] Store attachment metadata in database
- [ ] Display attachments in email viewer with download buttons
- [ ] Track attachment sizes in emailStorageUsed

### Custom Email Folders
- [ ] Create emailFolders table in schema
- [ ] Add folder creation UI in Email page
- [ ] Implement folder CRUD endpoints
- [ ] Add folder list to Email sidebar
- [ ] Implement drag-and-drop email to folder
- [ ] Add folder-based email filtering
- [ ] Add default folders (Inbox, Sent, Archive, Trash)

### File Sharing with Temporary Links
- [ ] Create fileShares table in schema
- [ ] Add "Share" button to Cloud Storage files
- [ ] Create share link generation UI with expiration options (24h/7d/30d)
- [ ] Implement share link generation endpoint
- [ ] Create public file access route
- [ ] Add share link management (view/revoke)
- [ ] Track share link usage

### Game Achievements System
- [ ] Create achievements table in schema
- [ ] Create userAchievements table
- [ ] Define achievement types (first win, high score, 10 games, etc.)
- [ ] Seed achievement definitions
- [ ] Track game completion and scores
- [ ] Award achievements on milestones
- [ ] Display achievement badges in user profile
- [ ] Show achievement progress

### Two-Factor Authentication
- [ ] Add twoFactorEnabled and twoFactorSecret to users table
- [ ] Install speakeasy library for TOTP
- [ ] Create 2FA setup UI in Settings Security tab
- [ ] Generate QR code for authenticator apps
- [ ] Implement 2FA verification on login
- [ ] Add backup codes generation
- [ ] Add 2FA disable option

### Activity Logs / Audit Trail
- [ ] Create activityLogs table in schema
- [ ] Log user actions (login, file upload, email send, etc.)
- [ ] Create activity log viewer in Settings
- [ ] Add filtering by action type and date
- [ ] Display IP address and user agent
- [ ] Add export activity logs feature

### API Access for Developers
- [ ] Create apiKeys table in schema
- [ ] Add API key generation UI in Settings Developer tab
- [ ] Implement API key authentication middleware
- [ ] Create REST API endpoints for files, emails, storage
- [ ] Generate API documentation
- [ ] Add rate limiting per API key
- [ ] Display API usage statistics

### Custom Branded Login Screen
- [x] Create custom login page component with TMP Server branding
- [x] Add logo and custom styling
- [x] Keep all OAuth login options (Google, GitHub, etc.)
- [x] Add branded colors and design elements
- [x] Ensure responsive design for mobile

## Completed Features
- [x] 23-theme marketplace with £3 individual / £34.99 bundle pricing
- [x] Email storage tracking (15GB free)
- [x] Email starring with star icons
- [x] File sorting (Name/Date/Size)
- [x] File preview (images/videos/PDFs)
- [x] Optimized uploads (10MB chunks, parallel processing)
- [x] External email connection form (IMAP/SMTP)
- [x] Premium email storage plans created (25GB/50GB/100GB/Unlimited)
- [x] Email storage display in Dashboard
- [x] Removed Premium Themes from add-ons marketplace
