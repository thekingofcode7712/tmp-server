# TMP Server TODO

## Current Sprint - Major Feature Additions

### Bugs to Fix
- [x] Fix infinite loading spinner in Email Settings tab (added retry limits and error handling)
- [x] Fix email settings "Unable to load email settings" error - backend endpoint issue
- [x] Fix instant uploads not actually uploading files to backend

### Performance Improvements
- [x] Implement optimistic file uploads with instant UI feedback
- [x] Show files immediately in UI while uploading in background
- [x] Add upload retry logic for failed uploads (rollback on error)

### Cloud Storage Enhancements
- [x] Add bulk file operations with multi-select checkboxes
- [x] Implement batch delete for selected files
- [x] Create file preview modal for images, PDFs, and videos
- [x] Add shareable links with expiration options (24h/7d/30d)
- [x] Implement password protection for shared links
- [x] Track access/downloads for shared links

### Advanced Cloud Storage Features
- [x] Add file versioning system with version history tracking
- [x] Allow restoring previous file versions
- [x] Display version numbers and modified timestamps
- [x] Implement file search with filename filtering
- [x] Add advanced filters (file type, date range, size)
- [x] Create custom folder organization beyond root
- [x] Implement drag-and-drop file moving between folders
- [x] Add folder creation and deletion UI

### File Management Enhancements
- [x] Add file version history viewer dialog with timestamps and sizes
- [x] Implement one-click restore from version history
- [x] Add batch "Move to folder" dropdown in bulk operations toolbar
- [x] Create file activity timeline dashboard widget
- [x] Track and display recent uploads, moves, deletes, and shares
- [x] Add quick access links from activity timeline

### Performance Optimizations
- [x] Implement direct-to-S3 uploads using presigned URLs
- [x] Generate presigned PUT URLs on backend
- [x] Upload files directly from browser to S3
- [x] Register file metadata after successful upload
- [x] Add upload progress tracking for direct uploads

### UX Improvements
- [x] Change all Stripe checkout links to open in same tab (already using window.location.href)
- [x] Email storage plan upgrade buttons use same tab
- [x] Marketplace checkout buttons use same tab
- [x] Subscription upgrade buttons use same tab

### Activity Page
- [x] Create dedicated /activity page with full history
- [x] Add filtering by activity type (upload/delete/share/move)
- [x] Implement pagination for activity history
- [x] Remove Recent Activity widget from dashboard (user prefers no preview)

### Checkout Flow Improvements
- [x] Fix theme purchase Stripe checkout not opening (working correctly)
- [x] Debug checkout URL generation in theme endpoints (working correctly)
- [x] Ensure window.location.href properly redirects to Stripe (working correctly)

### Theme Application Issues
- [x] Fix purchased themes not applying their actual colors
- [x] Ensure theme CSS variables are properly injected
- [x] Fix Forest Green theme showing washed out/light gray instead of green colors
- [x] Update all 23 themes with complete CSS variable sets
- [x] Add "Reset to Default Theme" button to revert to default theme

### Cloud Storage Upload Issues
- [x] Fix presigned URL endpoint returning 404 error (server restarted)
- [x] Verify getPresignedUploadUrl endpoint is properly registered
- [x] Test direct S3 upload flow end-to-end
- [x] Fix all remaining themes showing white colors instead of actual theme colors
- [x] Updated all 23 themes with complete color sets including foreground variants
- [x] Fixed theme application hook to wrap HSL values with hsl() function for Tailwind CSS 4
- [x] Fix storage upload 404 error - presigned URL endpoint not responding
- [x] Removed non-existent getPresignedUploadUrl endpoint
- [x] Replaced with direct tRPC upload using uploadFile mutation
- [x] Updated CloudStorage.tsx to use base64 upload flow
- [x] URGENT: 404 presigned URL error still persists after fix - investigate remaining references
- [x] Confirmed upload working after server restart

### Theme Bundles
- [x] Create theme bundle database table
- [x] Add "Warm Tones Bundle" (3 themes for £7) - Copper Rust, Crimson Red, Sunset Orange
- [x] Add "Cool Tones Bundle" (3 themes for £7) - Lavender Dream, Mint Fresh, Ocean Teal
- [x] Add "All Themes Bundle" (23 themes for £25)
- [x] Implement bundle purchase flow with Stripe
- [x] Show bundle savings percentage on cards
- [x] Added getAllBundles and purchaseBundle tRPC procedures
- [x] Updated Stripe webhook to handle bundle purchases
- [x] Created seed script for theme bundles

### Theme Preview & Auto-Switching
- [ ] Add hover preview showing live colors on theme cards
- [ ] Implement theme auto-switching by time (light/dark schedule)
- [ ] Add system preference sync (follow OS dark mode)
- [ ] Create theme schedule settings UI
- [ ] Add automatic data refresh after Stripe checkout return
- [ ] Invalidate queries when user returns from successful purchase
- [ ] Show success message and updated data without manual refresh

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
