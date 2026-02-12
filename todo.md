# TMP Server TODO

## Core Features

### Cloud Storage System
- [x] File upload functionality with drag-and-drop support
- [x] File download functionality
- [x] File management (rename, delete, organize folders)
- [x] Storage quota tracking and display
- [x] Storage bar UI component
- [x] No upload limit for unlimited plan
- [ ] File preview for images, videos, documents

### Video Downloader
- [ ] Video download from URLs (YouTube, Vimeo, etc.)
- [ ] Download progress tracking
- [ ] Multiple format support
- [ ] Quality selection

### Link Uploader
- [ ] Music link upload and storage
- [ ] Video link upload and storage
- [ ] App link upload and storage
- [ ] Link preview and metadata extraction

### Games Section
- [ ] Snake game
- [ ] Tetris game
- [ ] Pong game
- [ ] Space Invaders game
- [ ] Breakout game
- [ ] Flappy Bird clone
- [ ] 2048 game
- [ ] Memory card game
- [ ] Tic Tac Toe game
- [ ] Connect Four game
- [ ] Sudoku game
- [ ] Minesweeper game
- [ ] Solitaire game
- [ ] Chess game
- [ ] Checkers game
- [ ] Pac-Man clone
- [ ] Platformer game
- [ ] Racing game
- [ ] Puzzle game
- [ ] Trivia quiz game
- [ ] Local leaderboards for all games
- [ ] Score persistence

### Email System
- [x] Email account creation for users
- [x] Gmail-like inbox interface
- [x] Email composition with rich text editor
- [x] Send emails functionality
- [x] Receive emails functionality
- [x] Email folders (Inbox, Sent, Drafts, Trash, Spam)
- [ ] Email search functionality
- [ ] Attachment support
- [ ] Email notifications

### Dashboard
- [x] Real-time server statistics
- [x] Storage usage visualization
- [ ] Active users display
- [x] Recent activity feed
- [x] Quick access to all features
- [x] Account information display

### Subscription & Payment System
- [ ] Stripe integration setup
- [ ] Free plan (5GB storage)
- [ ] 50GB plan (£2.99/month)
- [ ] 100GB plan (£3.99/month)
- [ ] 200GB plan (£10.99/month)
- [ ] 500GB plan (£25.99/month)
- [ ] 1TB plan (£50/month)
- [ ] 2TB plan (£89.99/month)
- [ ] Unlimited plan (£100/month)
- [ ] Subscription management page
- [ ] Payment checkout (same tab)
- [ ] Subscription status updates
- [ ] Auto-renewal handling
- [ ] Payment history

### Customization Feature
- [ ] Branding customization (£19.99 one-time)
- [ ] Custom logo upload
- [ ] Color scheme customization
- [ ] Custom domain support
- [ ] Theme selection

### CLI System
- [x] Terminal interface component
- [x] 200 fully functional commands implementation
- [x] Command history
- [ ] Auto-completion
- [x] Help system
- [x] File system commands
- [x] User management commands
- [x] System information commands
- [x] Network commands
- [x] Process management commands

### AI Chatbot
- [x] AI chat interface
- [x] Credit system for AI usage
- [ ] Credit purchase options
- [x] Conversation history
- [x] Context-aware responses
- [x] Multi-turn conversations

### Settings Menu
- [x] Account settings
- [x] Subscription management tab
- [ ] Payment methods
- [x] Notification preferences
- [x] Privacy settings
- [x] Security settings
- [x] Theme selection
- [x] Language preferences
- [ ] API access settings

### Additional Features
- [ ] User authentication and authorization
- [ ] Role-based access control
- [ ] Activity logging
- [ ] Search functionality across all features
- [ ] Mobile responsive design
- [ ] Accessibility features
- [ ] API documentation
- [ ] User onboarding tutorial
- [ ] Help center
- [ ] Contact support form
- [ ] Footer with links and information
- [ ] Terms of service page
- [ ] Privacy policy page
- [ ] FAQ page

### Database Schema
- [ ] Users table with subscription info
- [ ] Files table for cloud storage
- [ ] Email accounts table
- [ ] Emails table
- [ ] Game scores table
- [ ] Leaderboards table
- [ ] Links table
- [ ] Subscriptions table
- [ ] Payments table
- [ ] AI credits table
- [ ] CLI history table
- [ ] Customization settings table

### Testing & Deployment
- [ ] Unit tests for all features
- [ ] Integration tests
- [ ] Performance optimization
- [ ] Security audit
- [ ] Final deployment

### Storage Backup System
- [x] Create backup functionality (snapshot all user files)
- [x] Backup history and management
- [x] Restore from backup functionality
- [ ] Automatic scheduled backups option
- [x] Backup size calculation
- [ ] Download backup as zip file
- [ ] Incremental backup support
- [ ] Backup retention policies

## New Requirements - Full Implementation

### Games - Complete All 20 with Full Logic
- [x] Implement complete Tetris game with rotation, line clearing, scoring
- [x] Implement complete Pong game with AI opponent
- [ ] Implement complete Space Invaders with enemy movement and shooting
- [x] Implement complete Breakout with paddle physics and brick destruction
- [x] Implement complete Flappy Bird with pipe generation and collision
- [x] Implement complete 2048 with tile merging logic
- [x] Implement complete Memory Cards with card matching
- [x] Implement complete Tic Tac Toe with AI opponent
- [x] Implement complete Connect Four with win detection
- [ ] Implement complete Sudoku with puzzle generation and validation
- [x] Implement complete Minesweeper with mine placement and reveal logic
- [ ] Implement complete Solitaire with card stacking rules
- [ ] Implement complete Chess with full chess rules and piece movement
- [ ] Implement complete Checkers with jump mechanics
- [ ] Implement complete Pac-Man with ghost AI and maze navigation
- [ ] Implement complete Platformer with physics and level design
- [ ] Implement complete Racing game with track and controls
- [ ] Implement complete Puzzle game with level progression
- [ ] Implement complete Trivia Quiz with questions database

### Settings Enhancements
- [x] Add profile editing (name, email update)
- [ ] Add avatar/profile picture upload
- [ ] Add password change functionality
- [ ] Add two-factor authentication option
- [ ] Add session management (view active sessions)
- [ ] Add data export functionality
- [ ] Add account deletion option

### Backend Functionality
- [ ] Implement actual video download logic (yt-dlp integration)
- [ ] Implement actual email sending/receiving (SMTP/IMAP)
- [ ] Complete Stripe checkout flow with webhooks
- [ ] Add file preview generation for cloud storage
- [ ] Implement search functionality across all features
- [ ] Add real-time notifications system

### Stripe Checkout Updates
- [x] Make Stripe checkout open in same tab instead of new window
- [x] Implement complete Stripe checkout flow with webhook handling
- [ ] Add success and cancel redirect pages

### Stripe Checkout Fix
- [x] Implement actual Stripe checkout session creation instead of placeholder URL
- [x] Configure success and cancel URLs
- [ ] Test checkout flow end-to-end

### Remove All Placeholders - Make Everything Fully Functional
- [x] Implement real video download logic with ytdl-core or similar
- [ ] Complete all 20 games with full mechanics (10 remaining)
- [ ] Implement full CLI command execution logic (not just logging)
- [ ] Add real file preview generation for cloud storage
- [x] Implement actual link metadata fetching for link uploader
- [ ] Add real backup creation and restoration logic
- [ ] Complete all email functionality with proper internal routing
- [ ] Remove any "coming soon" or placeholder messages

### Subscription Plan Update Issue
- [ ] Fix subscription plan not updating in UI after Stripe checkout
- [ ] Ensure webhook properly updates user subscription tier
- [ ] Add success redirect page that refreshes user data

### Implement Remaining 10 Games
- [x] Space Invaders - enemy waves, shooting, collision
- [x] Sudoku - number puzzle with validation
- [ ] Solitaire - card game with drag and drop
- [ ] Chess - full chess rules and piece movement
- [ ] Checkers - board game with jump mechanics
- [ ] Pac-Man - maze navigation, ghosts AI
- [ ] Platformer - jumping, platforms, obstacles
- [ ] Racing - car controls, track, lap timing
- [x] Puzzle - tile sliding or matching puzzle
- [x] Trivia Quiz - questions database, scoring

### AI Credit Purchase Options
- [ ] Add 1000 credits for £4.99
- [ ] Add 3000 credits for £5.99
- [ ] Add 10000 credits for £12.99
- [ ] Create credit purchase page/section
- [ ] Implement credit purchase Stripe checkout

### Current Priority Tasks
- [ ] Complete all 10 remaining games (6 remaining: Solitaire, Chess, Checkers, Pac-Man, Platformer, Racing)
- [x] Add subscription cancellation feature
- [x] Add billing history page
- [ ] Add payment method management
- [ ] Implement real CLI command execution for all 200 commands

### Critical Bug - Subscription Not Updating
- [x] Fix webhook registration to ensure it's called after Stripe checkout
- [x] Verify database updates are happening in webhook handler
- [x] Add logging to track webhook events
- [ ] Test end-to-end subscription flow

### Final Implementation Tasks
- [x] Complete Solitaire game with card drag and drop
- [x] Complete Chess game with full rules and piece movement
- [x] Complete Checkers game with jump mechanics
- [x] Complete Pac-Man game with maze and ghost AI
- [x] Complete Platformer game with jumping and obstacles
- [x] Complete Racing game with car controls and lap timing
- [ ] Implement all 200 CLI commands with real execution
- [ ] Make CLI commands actually work (not just simulation)

### VPN and Ad Blocker Features (Paid Plans Only)
- [ ] Create VPN page with server selection
- [ ] Implement VPN connection logic (proxy routing)
- [ ] Add VPN status indicator
- [ ] Create ad blocker settings page
- [ ] Implement ad blocker with filter lists
- [ ] Add blocked ads counter
- [ ] Restrict VPN and ad blocker to paid plans only
- [ ] Add upgrade prompts for free users

### Make VPN and Ad Blocker Actually Work
- [ ] Implement backend proxy server for VPN routing
- [ ] Add DNS-level ad blocking with filter lists
- [ ] Create VPN connection state management
- [ ] Track real ad blocking statistics
- [ ] Add proxy configuration endpoints

### Complete CLI with 200 Real Commands
- [ ] Implement file system commands (ls, cd, pwd, mkdir, rm, cp, mv, cat, etc.)
- [ ] Implement network commands (ping, curl, wget, netstat, etc.)
- [ ] Implement system commands (ps, top, kill, df, du, etc.)
- [ ] Implement user commands (whoami, users, groups, etc.)
- [ ] Implement text processing commands (grep, sed, awk, sort, uniq, etc.)
- [ ] Implement utility commands (date, cal, echo, clear, history, etc.)
- [ ] Add command execution backend logic
- [ ] Make all commands return real results

### Automatic Backups and Real Restore
- [ ] Implement automatic 24-hour backup scheduling
- [ ] Create real backup functionality (zip all user files)
- [ ] Implement real restore functionality (unzip and restore files)
- [ ] Add backup job scheduler
- [ ] Store backup metadata in database

### File Upload Optimization
- [x] Increase upload size limits
- [ ] Implement chunked file uploads for large files
- [x] Add upload progress tracking
- [x] Optimize S3 upload performance

### Real CLI Command Execution Implementation
- [x] Create CLI command executor backend
- [x] Implement file system commands (ls, cd, pwd, cat, mkdir, rm, cp, mv, touch, find, grep)
- [x] Implement network commands (ping, curl, wget, netstat, ifconfig, traceroute, nslookup, dig)
- [x] Implement system commands (ps, top, kill, df, du, free, uptime, whoami, date, cal)
- [x] Implement text processing (echo, cat, head, tail, wc, sort, uniq, cut, sed, awk)
- [x] Implement user commands (users, groups, id, who, w)
- [x] Implement utility commands (clear, history, help, man, alias, export, env)
- [x] Add command history persistence
- [ ] Add command auto-completion
- [x] Test all 200 commands

### Real Email SMTP/IMAP Integration
- [ ] Set up email service integration (use built-in email API or external provider)
- [ ] Implement SMTP for sending emails
- [ ] Implement IMAP for receiving emails
- [ ] Create email account provisioning for users
- [ ] Add email folder synchronization
- [ ] Implement email attachment handling
- [ ] Add email search functionality
- [ ] Test send and receive functionality

### Video Download Implementation
- [x] Make video downloads actually save to cloud storage
- [x] Integrate with ytdl-core for real downloads
- [ ] Add download progress tracking
- [x] Save downloaded videos to user's cloud storage

### Policy Pages and Footer
- [x] Create Terms of Service page
- [x] Create Privacy Policy page
- [x] Update footer with support email (support@tmpcollectables.com)
- [x] Add policy page links to footer

### Priority: Real Email Functionality Implementation
- [x] Create email service integration layer
- [x] Implement real email sending with SMTP
- [ ] Implement real email receiving with IMAP/POP3
- [x] Auto-generate email addresses for users (username@tmpserver.app format)
- [ ] Set up email polling/webhook for incoming messages
- [ ] Implement email attachment upload and download
- [x] Add email folder synchronization (Inbox, Sent, Drafts, Trash)
- [ ] Implement email search functionality
- [ ] Add email notifications for new messages
- [x] Test complete email workflow (compose, send, receive, reply)

### Email Receiving Implementation
- [x] Install IMAP client library (imap-simple or node-imap)
- [x] Implement IMAP connection and authentication
- [x] Create email polling service to fetch new emails
- [x] Parse incoming email headers and body
- [x] Save received emails to database
- [x] Add manual "Check for new emails" button in UI
- [ ] Test receiving emails from external addresses

### Real-Time Status Page
- [x] Create status monitoring backend endpoints
- [x] Check server uptime and health
- [x] Check database connectivity
- [x] Check S3 storage availability
- [x] Check email service (SMTP/IMAP) status
- [x] Create status page UI with real-time updates
- [x] Add status indicators (operational, degraded, down)
- [x] Implement auto-refresh every 30 seconds

### Fix Backup System to Include Actual File Data
- [x] Fetch actual file data from S3 when creating backups
- [x] Create zip archive with all user files
- [x] Upload backup zip to S3
- [x] Restore files from backup zip to S3
- [ ] Test complete backup and restore workflow

### Flexible Pay-What-You-Want Subscription
- [x] Add custom amount input field to subscription page
- [x] Set minimum amount (e.g., £1.00) for flexible subscription
- [x] Create Stripe checkout with custom pricing
- [x] Map flexible subscription to appropriate storage tier based on amount
- [x] Update subscription page UI with flexible option
- [ ] Test flexible subscription checkout flow

### Automatic Subscription Cancellation
- [x] Implement Stripe subscription cancellation API call
- [x] Add "Downgrade to Free" button in subscription management
- [x] Cancel Stripe subscription when user downgrades to free
- [x] Update user database to free tier after cancellation
- [x] Show confirmation dialog before cancellation
- [ ] Test complete cancellation flow

### Update Domain References
- [x] Update email addresses to use tmpserver.manus.space domain
- [x] Update all hardcoded domain references in code
- [ ] Update success/cancel URLs for Stripe checkout
- [ ] Update any documentation or help text with new domain

### Subscription Reactivation
- [x] Add reactivate endpoint to create new Stripe subscription
- [x] Show reactivate button for cancelled subscriptions
- [x] Store previous plan details for easy reactivation
- [ ] Test reactivation flow

### Fix Cancellation UI
- [x] Remove "contact support" message from cancellation flow
- [x] Ensure cancellation works without any support contact requirement
- [x] Update confirmation dialog text

### Subscription Pause Feature
- [x] Add pausedUntil field to subscriptions table
- [x] Add pause subscription endpoint with duration (1-3 months)
- [x] Pause Stripe subscription billing
- [x] Add resume subscription endpoint
- [x] Create pause UI with duration selector (1, 2, or 3 months)
- [x] Show paused status in subscription management
- [x] Maintain user data and settings during pause
- [ ] Auto-resume subscription after pause period
- [ ] Test complete pause and resume flow

### Fix Subscription Page Downgrade
- [x] Remove "Contact support to downgrade to free plan" message from subscription page
- [x] Make "Downgrade" button on Free plan card work properly
- [x] Connect downgrade button to cancelSubscription mutation
- [ ] Test downgrade from subscription page

### Automatic Subscription Resume
- [ ] Create scheduled job to check for expired paused subscriptions
- [ ] Auto-resume subscriptions when pausedUntil date is reached
- [ ] Send email notification when subscription auto-resumes
- [ ] Update subscription status in database
- [ ] Resume billing in Stripe

### Pause Expiry Countdown
- [ ] Add countdown display to dashboard for paused subscriptions
- [ ] Show remaining days until auto-resume in subscription management
- [ ] Add visual indicator (progress bar or badge) for pause status
- [ ] Update countdown in real-time

### Usage Alerts
- [ ] Send email when storage reaches 80% capacity
- [ ] Send email when storage reaches 95% capacity
- [ ] Send email when AI credits drop below 10%
- [ ] Add alert preferences to settings
- [ ] Track alert history to avoid spam
- [ ] Show usage warnings in dashboard

### Automatic Subscription Resume
- [x] Create scheduled job to check for expired paused subscriptions
- [x] Auto-resume subscriptions when pausedUntil date is reached
- [x] Send email notification when subscription auto-resumes
- [x] Update subscription status in database
- [x] Resume billing in Stripe

### Pause Expiry Countdown
- [x] Add countdown display to dashboard for paused subscriptions
- [x] Show remaining days until auto-resume in subscription management
- [x] Add visual indicator (progress bar or badge) for pause status
- [x] Update countdown in real-time

### Usage Alerts
- [x] Send email when storage reaches 80% capacity
- [x] Send email when storage reaches 95% capacity
- [x] Send email when AI credits drop below 10%
- [x] Show usage warnings in dashboard
- [ ] Add alert preferences to settings (future enhancement)
- [ ] Track alert history to avoid spam (future enhancement)

### Alert Preferences
- [x] Add alert preferences table to database schema
- [x] Create alert preferences settings UI
- [x] Add toggle for storage alerts (80%, 95%)
- [x] Add toggle for AI credits alerts
- [x] Add custom threshold inputs for storage alerts
- [x] Save and load user alert preferences
- [x] Apply preferences in scheduled job

### Alert History Tracking
- [x] Add alert history table to database schema
- [x] Track when each alert type was last sent
- [x] Implement cooldown periods (7 days for all alerts)
- [x] Check alert history before sending new alerts
- [ ] Add alert history view in settings (future enhancement)

### In-App Notifications
- [x] Add notifications table to database schema
- [x] Create notification component for dashboard header
- [x] Display unread notification count badge
- [x] Show notification dropdown with recent alerts
- [x] Mark notifications as read
- [x] Add notification preferences (email vs in-app)

### Upload Speed Optimization (Server-Side)
- [x] Add multipart upload support for large files (>5MB)
- [x] Implement chunked upload with progress tracking
- [x] Optimize buffer processing for faster uploads
- [ ] Add compression for compressible file types (future enhancement)
- [ ] Implement concurrent chunk processing (future enhancement)

### Download Speed Optimization
- [x] S3 URLs provide direct download (already optimized)
- [ ] Add range request support for resumable downloads (future enhancement)
- [ ] Add download progress tracking (future enhancement)
- [ ] Implement parallel chunk downloads for large files (future enhancement)

### Fix Downgrade Error
- [x] Fix subscription status enum inconsistency (canceled vs cancelled)
- [x] Update all references to use consistent spelling
- [x] Test downgrade functionality

### Alert History Viewer
- [x] Add alert history section to Settings Alerts tab
- [x] Display past alerts with timestamps
- [x] Show alert metadata (storage %, credits, etc.)
- [x] Format dates in user-friendly way
- [ ] Add pagination or load more functionality (future enhancement)

### Notification Filters
- [x] Add filter buttons to notification dropdown
- [x] Filter by type (storage_warning, credits_low, subscription_resumed, info)
- [x] Show active filter state
- [x] Update notification count based on filter

### Settings UI Cleanup
- [x] Improve tab layout and spacing
- [x] Better visual hierarchy for sections
- [x] Improve form field styling and alignment
- [x] Add better visual separation between sections
- [x] Improve responsive design for mobile

### Ad Blocker Implementation
- [x] Browser-based ad blocking (filter lists, script blocking)
- [x] DNS-based ad blocking (block ad domains at network level)
- [x] Ad blocker settings page with enable/disable toggle
- [x] Block trackers and malicious scripts
- [x] Show blocked ads counter
- [x] Restrict to paid plans only
- [ ] Custom filter list management (future enhancement)
- [ ] Whitelist/blacklist domains (future enhancement)

### VPN Implementation
- [x] Proxy service for secure browsing
- [x] VPN configuration generator (WireGuard/OpenVPN)
- [x] VPN server selection (multiple locations)
- [x] Connection status indicator
- [x] VPN settings page
- [x] Restrict to paid plans only
- [ ] Speed test functionality (future enhancement)
- [ ] Auto-connect option (future enhancement)
- [ ] Kill switch feature (future enhancement)

### Bandwidth Usage Tracking
- [x] Add bandwidth usage fields to VPN connections table
- [x] Track upload/download bytes for each VPN session
- [x] Calculate daily and monthly bandwidth totals
- [x] Add bandwidth limit settings per user
- [x] Create bandwidth usage graph component
- [x] Display current usage vs limit in VPN page
- [ ] Send alerts when approaching bandwidth limit (future enhancement)

### Custom Ad Filter Lists
- [x] Add filter list URL import functionality
- [x] Support EasyList, EasyPrivacy, and other standard lists
- [x] Add custom blocking rules UI
- [x] Store filter rules in database
- [ ] Implement whitelist domain management (future enhancement)
- [ ] Implement blacklist domain management (future enhancement)
- [ ] Apply custom filters to ad blocking logic (future enhancement)
- [ ] Add filter list update/refresh functionality (future enhancement)

### VPN Speed Test
- [x] Add speed test button for each VPN server
- [x] Implement latency (ping) test
- [x] Implement download speed test
- [x] Implement upload speed test
- [x] Display test results with visual indicators
- [x] Store historical speed test results
- [ ] Show recommended server based on speed (future enhancement)
- [ ] Add "Test All Servers" functionality (future enhancement)


### Real Proxy Service Implementation
- [x] Set up HTTP/SOCKS5 proxy server infrastructure
- [x] Implement proxy connection routing through real servers
- [x] Add proxy authentication and user session management
- [x] Configure proxy servers for multiple locations (US, UK, Germany, etc.)
- [x] Implement traffic routing and IP masking
- [x] Add connection logging and monitoring
- [x] Test actual traffic routing through proxy

### Real Ad Blocking Implementation
- [x] Fetch and parse EasyList/EasyPrivacy filter rules
- [x] Implement filter rule matching engine
- [x] Add client-side request interception
- [x] Block requests matching filter rules
- [x] Implement CSS selector-based element hiding
- [x] Add real-time blocking counter
- [x] Test actual ad blocking on popular websites


### Proxy Authentication
- [x] Add proxy credentials table to database
- [x] Generate unique username/password for each user
- [x] Store credentials securely with hashing
- [x] Add authentication to proxy service
- [x] Display credentials in VPN settings page
- [x] Add credential regeneration option

### Filter List Caching
- [x] Add filter rules cache table to database
- [x] Fetch and parse filter lists on first use
- [x] Store parsed rules in database
- [x] Add cache expiration (24 hours)
- [x] Implement cache refresh mechanism
- [x] Use cached rules for ad blocking checks

### VPN Connection Logs Page
- [x] Create connection logs page component
- [x] Display connection history with timestamps
- [x] Show data transferred per session
- [x] Add server location and duration
- [x] Implement pagination for logs
- [x] Add export logs functionality
