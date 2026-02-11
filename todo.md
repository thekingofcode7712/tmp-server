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
