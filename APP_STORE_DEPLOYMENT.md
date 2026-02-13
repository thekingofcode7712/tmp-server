# TMP Server - App Store Deployment Guide

This guide explains how to build and deploy TMP Server to the Apple App Store and Google Play Store.

## Prerequisites

### Required Accounts
- **Apple Developer Account** ($99/year) - https://developer.apple.com
- **Google Play Developer Account** ($25 one-time) - https://play.google.com/console

### Required Software
- **macOS** (for iOS builds) with Xcode 15+
- **Android Studio** (for Android builds)
- **Node.js** 18+ and pnpm
- **CocoaPods** (for iOS): `sudo gem install cocoapods`

---

## Step 1: Build the Web App

```bash
cd /home/ubuntu/tmp-server
pnpm install
pnpm run build
```

This creates the production build in `client/dist/`.

---

## Step 2: Sync Capacitor

```bash
pnpm exec cap sync
```

This copies the web build to iOS and Android projects.

---

## Step 3: iOS App Store Deployment

### 3.1 Open iOS Project

```bash
pnpm exec cap open ios
```

This opens Xcode with your iOS project.

### 3.2 Configure in Xcode

1. **Select your Team**
   - Click on the project in the navigator
   - Go to "Signing & Capabilities"
   - Select your Apple Developer Team

2. **Update Bundle Identifier**
   - Change `com.tmpserver.app` to your unique identifier
   - Example: `com.yourcompany.tmpserver`

3. **Configure App Icons**
   - Icons are already set from the PWA configuration
   - Verify in Assets.xcassets > AppIcon

4. **Add Push Notifications Capability**
   - Click "+ Capability"
   - Add "Push Notifications"

### 3.3 Build for App Store

1. Select "Any iOS Device" as the build target
2. Product → Archive
3. Wait for the archive to complete
4. Click "Distribute App"
5. Choose "App Store Connect"
6. Follow the wizard to upload

### 3.4 App Store Connect

1. Go to https://appstoreconnect.apple.com
2. Create a new app
3. Fill in app information:
   - **Name**: TMP Server
   - **Category**: Productivity
   - **Description**: Complete cloud storage platform with games, AI chat, file management
4. Add screenshots (1290x2796 for iPhone, 2048x2732 for iPad)
5. Submit for review

---

## Step 4: Google Play Store Deployment

### 4.1 Open Android Project

```bash
pnpm exec cap open android
```

This opens Android Studio with your Android project.

### 4.2 Configure in Android Studio

1. **Update Package Name**
   - Open `android/app/build.gradle`
   - Change `applicationId "com.tmpserver.app"` to your package name

2. **Configure App Icons**
   - Icons are in `android/app/src/main/res/`
   - Already set from PWA configuration

3. **Add Push Notifications**
   - Firebase Cloud Messaging is already configured via Capacitor
   - You'll need to add `google-services.json` from Firebase Console

### 4.3 Generate Signed APK/AAB

1. Build → Generate Signed Bundle / APK
2. Choose "Android App Bundle" (AAB)
3. Create a new keystore:
   - Key store path: Choose a secure location
   - Password: Create a strong password (SAVE THIS!)
   - Alias: tmpserver-release
   - Validity: 25 years
4. Click "Next" → "release" → "Finish"

### 4.4 Google Play Console

1. Go to https://play.google.com/console
2. Create a new app
3. Fill in app details:
   - **App name**: TMP Server
   - **Category**: Productivity
   - **Description**: Complete cloud storage platform with games, AI chat, file management
4. Upload the AAB file
5. Add screenshots (1080x1920 minimum)
6. Complete the content rating questionnaire
7. Set pricing (Free with in-app purchases)
8. Submit for review

---

## Step 5: Push Notifications Setup

### iOS (APNs)

1. Go to Apple Developer Portal
2. Certificates, Identifiers & Profiles
3. Keys → Create a new key
4. Enable "Apple Push Notifications service (APNs)"
5. Download the .p8 file
6. Save the Key ID and Team ID

### Android (FCM)

1. Go to Firebase Console (https://console.firebase.google.com)
2. Create a new project or use existing
3. Add Android app with your package name
4. Download `google-services.json`
5. Place it in `android/app/`
6. Get the Server Key from Project Settings → Cloud Messaging

---

## Step 6: Backend Push Notification Integration

Add these environment variables to your server:

```env
# iOS APNs
APNS_KEY_ID=your_key_id
APNS_TEAM_ID=your_team_id
APNS_KEY_PATH=/path/to/AuthKey_XXXXX.p8

# Android FCM
FCM_SERVER_KEY=your_fcm_server_key
```

---

## Testing Before Submission

### iOS Testing

```bash
# Run on simulator
pnpm exec cap run ios

# Run on physical device (requires Apple Developer account)
# Connect iPhone via USB, then:
pnpm exec cap run ios --target="Your iPhone Name"
```

### Android Testing

```bash
# Run on emulator
pnpm exec cap run android

# Run on physical device
# Enable USB debugging on Android device, connect via USB, then:
pnpm exec cap run android
```

---

## App Store Review Tips

### Apple App Store
- **Review time**: 1-3 days
- **Common rejections**:
  - Missing privacy policy
  - Incomplete app information
  - Crashes on launch
- **Tips**:
  - Test thoroughly on real devices
  - Provide clear screenshots
  - Write detailed release notes

### Google Play Store
- **Review time**: Few hours to 1 day
- **Common rejections**:
  - Missing content rating
  - Incomplete store listing
  - Privacy policy issues
- **Tips**:
  - Complete all required fields
  - Add high-quality screenshots
  - Set up proper age ratings

---

## Updating the App

When you make changes to your web app:

```bash
# 1. Build web app
pnpm run build

# 2. Sync to native projects
pnpm exec cap sync

# 3. Increment version numbers
# iOS: Xcode → General → Version & Build
# Android: android/app/build.gradle → versionCode & versionName

# 4. Build and upload new version
# Follow Steps 3 & 4 above
```

---

## Troubleshooting

### iOS Build Fails
- Run `pod install` in the `ios/App` directory
- Clean build folder: Xcode → Product → Clean Build Folder
- Check Xcode version compatibility

### Android Build Fails
- Sync Gradle files in Android Studio
- Invalidate caches: File → Invalidate Caches / Restart
- Check Java/Kotlin version compatibility

### Push Notifications Not Working
- Verify certificates/keys are correctly configured
- Check device permissions
- Test on physical devices (not simulators)

---

## Support

For Capacitor-specific issues:
- Documentation: https://capacitorjs.com/docs
- Community: https://forum.ionicframework.com

For app store submission help:
- Apple: https://developer.apple.com/support
- Google: https://support.google.com/googleplay/android-developer

---

## Quick Reference

| Task | iOS Command | Android Command |
|------|------------|----------------|
| Open Project | `pnpm exec cap open ios` | `pnpm exec cap open android` |
| Run on Device | `pnpm exec cap run ios` | `pnpm exec cap run android` |
| Sync Changes | `pnpm exec cap sync` | `pnpm exec cap sync` |
| Build for Store | Use Xcode Archive | Use Android Studio AAB |

---

**Note**: This is a one-time setup. After initial deployment, updates are much faster—just build, sync, and upload new versions.
