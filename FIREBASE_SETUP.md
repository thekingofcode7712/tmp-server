# Firebase Setup Guide for Push Notifications

This guide explains how to set up Firebase Cloud Messaging (FCM) for push notifications in your TMP Server app.

## Prerequisites

- Google account
- Firebase project (free tier is sufficient)
- Android and iOS apps configured in Capacitor

---

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project" or "Create a project"
3. Enter project name: **TMP Server**
4. (Optional) Enable Google Analytics
5. Click "Create project"

---

## Step 2: Add Android App to Firebase

### 2.1 Register Android App

1. In Firebase Console, click the Android icon
2. Enter Android package name: `com.tmpserver.app`
   - Must match the `applicationId` in `android/app/build.gradle`
3. (Optional) Enter app nickname: "TMP Server Android"
4. (Optional) Enter SHA-1 certificate fingerprint
   - Get it with: `keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android`
5. Click "Register app"

### 2.2 Download google-services.json

1. Download the `google-services.json` file
2. Place it in: `/home/ubuntu/tmp-server/android/app/google-services.json`

### 2.3 Add Firebase SDK

The Capacitor Push Notifications plugin already handles Firebase integration. Just ensure `google-services.json` is in place.

---

## Step 3: Add iOS App to Firebase

### 3.1 Register iOS App

1. In Firebase Console, click the iOS icon
2. Enter iOS bundle ID: `com.tmpserver.app`
   - Must match the Bundle Identifier in Xcode
3. (Optional) Enter app nickname: "TMP Server iOS"
4. (Optional) Enter App Store ID (after app is published)
5. Click "Register app"

### 3.2 Download GoogleService-Info.plist

1. Download the `GoogleService-Info.plist` file
2. Place it in: `/home/ubuntu/tmp-server/ios/App/App/GoogleService-Info.plist`
3. In Xcode:
   - Right-click on the "App" folder
   - Select "Add Files to App"
   - Select `GoogleService-Info.plist`
   - Ensure "Copy items if needed" is checked
   - Click "Add"

### 3.3 Enable Push Notifications in Xcode

1. Open the iOS project: `pnpm exec cap open ios`
2. Select the "App" target
3. Go to "Signing & Capabilities"
4. Click "+ Capability"
5. Add "Push Notifications"
6. Add "Background Modes"
   - Check "Remote notifications"

---

## Step 4: Configure APNs (Apple Push Notification service)

### 4.1 Create APNs Authentication Key

1. Go to [Apple Developer Portal](https://developer.apple.com/account)
2. Certificates, Identifiers & Profiles → Keys
3. Click the "+" button to create a new key
4. Enter key name: "TMP Server Push Notifications"
5. Check "Apple Push Notifications service (APNs)"
6. Click "Continue" → "Register"
7. Download the `.p8` file (save it securely!)
8. Note the **Key ID** and **Team ID**

### 4.2 Upload APNs Key to Firebase

1. In Firebase Console, go to Project Settings
2. Select the "Cloud Messaging" tab
3. Scroll to "Apple app configuration"
4. Click "Upload" under "APNs Authentication Key"
5. Upload the `.p8` file
6. Enter the Key ID and Team ID
7. Click "Upload"

---

## Step 5: Get Server Key for Backend

### 5.1 Get FCM Server Key

1. In Firebase Console, go to Project Settings
2. Select the "Cloud Messaging" tab
3. Under "Cloud Messaging API (Legacy)", click "Manage API in Google Cloud Console"
4. Enable "Cloud Messaging API" if not already enabled
5. Go back to Firebase Console → Project Settings → Cloud Messaging
6. Copy the "Server key"

### 5.2 Add to Environment Variables

Add to your server's environment variables:

```env
FCM_SERVER_KEY=your_fcm_server_key_here
APNS_KEY_ID=your_apns_key_id
APNS_TEAM_ID=your_apns_team_id
APNS_KEY_PATH=/path/to/AuthKey_XXXXX.p8
```

---

## Step 6: Test Push Notifications

### 6.1 Test from Firebase Console

1. In Firebase Console, go to "Cloud Messaging"
2. Click "Send your first message"
3. Enter notification title and text
4. Click "Send test message"
5. Enter your device's FCM token (logged in app console)
6. Click "Test"

### 6.2 Test from Your Backend

Use the backend endpoint to send push notifications:

```typescript
// Example backend code (already implemented in your app)
import { sendPushNotification } from './lib/pushNotifications';

await sendPushNotification(
  userId: 1,
  title: "Welcome!",
  body: "Your TMP Server app is ready"
);
```

---

## Step 7: Production Checklist

Before going live:

- [ ] Replace debug `google-services.json` with production version
- [ ] Replace debug `GoogleService-Info.plist` with production version
- [ ] Upload production APNs certificate to Firebase
- [ ] Test notifications on physical devices (not simulators)
- [ ] Verify notification permissions are requested properly
- [ ] Test notification delivery in foreground and background
- [ ] Test notification tap actions

---

## Troubleshooting

### Android Notifications Not Working

1. **Check google-services.json**
   - Ensure it's in `android/app/` directory
   - Verify package name matches

2. **Rebuild the app**
   ```bash
   pnpm exec cap sync android
   pnpm exec cap open android
   # Clean and rebuild in Android Studio
   ```

3. **Check FCM token**
   - Look for "Push registration success" in console logs
   - Token should be sent to your backend

### iOS Notifications Not Working

1. **Check GoogleService-Info.plist**
   - Ensure it's added to Xcode project
   - Verify bundle ID matches

2. **Check APNs certificate**
   - Ensure it's uploaded to Firebase
   - Verify Key ID and Team ID are correct

3. **Check capabilities**
   - Push Notifications capability must be enabled
   - Background Modes → Remote notifications must be checked

4. **Test on physical device**
   - iOS Simulator doesn't support push notifications
   - Use a real iPhone/iPad

### Common Errors

**"MismatchSenderId"**
- `google-services.json` or `GoogleService-Info.plist` doesn't match your Firebase project

**"InvalidRegistration"**
- FCM token is invalid or expired
- Re-register for push notifications

**"NotRegistered"**
- Device token was deleted from FCM
- App was uninstalled and reinstalled

---

## Additional Resources

- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)
- [Capacitor Push Notifications Plugin](https://capacitorjs.com/docs/apis/push-notifications)
- [APNs Overview](https://developer.apple.com/documentation/usernotifications)

---

## Quick Reference

| Platform | Config File | Location |
|----------|------------|----------|
| Android | `google-services.json` | `android/app/` |
| iOS | `GoogleService-Info.plist` | `ios/App/App/` |
| APNs | `.p8` key file | Upload to Firebase |
| Backend | Server Key | Environment variable |

---

**Note**: Push notifications require physical devices for testing. iOS Simulator and Android Emulator do not support push notifications.
