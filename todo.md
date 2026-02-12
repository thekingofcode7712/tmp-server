# TMP Server TODO

## Project Overview
Cloud storage platform with email, games, AI features, and premium themes.

### Current Priority - Theme Marketplace & Email Storage
- [x] Seed 15 additional premium themes (total 23)
- [x] Create theme marketplace page UI
- [x] Add theme database functions (getThemes, getUserThemes, purchaseTheme)
- [x] Create theme tRPC endpoints
- [x] Add £3 individual theme purchase
- [x] Add £34.99 all themes bundle purchase
- [x] Update Stripe webhook for theme purchases
- [x] Show locked/unlocked themes in marketplace
- [ ] Apply purchased theme colors to CSS
- [ ] Add emailStorageLimit to users table (15GB default)
- [ ] Add emailStorageUsed to users table
- [ ] Track email storage on send/receive
- [ ] Show email storage in Dashboard
- [ ] Add external email connection UI in Settings
- [ ] Implement IMAP email sync
- [ ] Implement SMTP email sending

### Current Priority - Theme Activation & Email Features
- [x] Add selectedThemeId field to users table (using customTheme)
- [x] Create endpoint to set active theme
- [x] Update Themes page with activate buttons
- [x] Apply active theme colors dynamically to CSS variables
- [ ] Add emailStorageLimit field to users table (default 15GB)
- [ ] Add emailStorageUsed field to users table
- [ ] Track email size on send/receive
- [ ] Show email storage usage in Dashboard
- [ ] Add IMAP/SMTP connection form in Email settings
- [ ] Store encrypted email credentials
- [ ] Implement IMAP inbox sync
- [ ] Implement SMTP sending through external account

### Current Priority - Email Storage Display & Tracking
- [x] Add email storage to dashboard stats query
- [x] Display email storage meter in Dashboard
- [x] Calculate email size on send (content + attachments)
- [x] Update emailStorageUsed when sending emails
- [x] Calculate email size on receive
- [x] Update emailStorageUsed when receiving emails
- [ ] Add external email account form in Email settings
- [ ] Store encrypted IMAP/SMTP credentials
- [ ] Implement IMAP inbox sync
- [ ] Implement SMTP sending via external account

### Quick Fix - Remove Premium Themes from Addons
- [ ] Remove Premium Themes add-on from addons table (has its own marketplace now)

### Current Priority - External Email, Attachments, Folders
- [x] Create external email connection form in Email settings
- [x] Add fields for IMAP server, port, username, password
- [x] Add fields for SMTP server, port, username, password
- [x] Store encrypted email credentials in database (schema + encryption utility)
- [x] Add tRPC endpoints for external email credentials
- [ ] Implement IMAP inbox sync endpoint
- [ ] Implement SMTP sending via external account
- [ ] Add file attachment support to email composer
- [ ] Validate attachment sizes against storage quota
- [ ] Store attachments in S3 and track in database
- [ ] Display attachments in email viewer
- [ ] Add custom folder creation UI
- [ ] Implement folder CRUD endpoints
- [ ] Add drag-and-drop email to folder functionality
- [ ] Add folder-based email filtering
- [x] Add premium email storage plans (25GB, 50GB, 100GB, Unlimited)
- [x] Create email plan products in Stripe
- [ ] Add email plan upgrade UI in Email settings
