# TMP Server TODO

## Project Overview
Cloud storage platform with email, games, AI features, and premium themes.

### Current Priority - £3 Theme Marketplace
- [ ] Create themes table (id, name, description, colors JSON, price, preview image)
- [ ] Create userThemes table (userId, themeId, purchasedAt)
- [ ] Seed 8-10 premium themes in database
- [ ] Create theme marketplace page showing all themes
- [ ] Add £3 Stripe checkout for theme purchases
- [ ] Update webhook to handle theme purchases
- [ ] Add theme switching in Settings
- [ ] Apply purchased theme colors to CSS variables
- [ ] Show locked/unlocked state in theme marketplace

### Email Storage System
- [ ] Add emailStorageLimit field to users table (default 15GB)
- [ ] Add emailStorageUsed field to users table
- [ ] Scale email storage with subscription plans
- [ ] Track email storage usage on send/receive
- [ ] Show email storage usage in Dashboard
- [ ] Add external email account connection (IMAP/SMTP)
- [ ] Create email account settings UI
- [ ] Sync external emails to database
