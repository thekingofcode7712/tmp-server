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
