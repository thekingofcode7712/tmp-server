# Quick Start: Build Android App in 5 Minutes

## Prerequisites
- ✅ Android Studio installed
- ✅ Project downloaded to your computer

## Option 1: Automated Script (Recommended)

```bash
cd tmp-server
./build-android.sh
```

Follow the prompts. The script will:
1. Install dependencies
2. Build web assets
3. Sync with Android
4. Open Android Studio (or guide you to build)

## Option 2: Manual Steps

```bash
# 1. Install and build
cd tmp-server
pnpm install
pnpm run build
pnpm exec cap sync android

# 2. Open in Android Studio
# Open the 'android' folder in Android Studio

# 3. Generate signed bundle
# Build → Generate Signed Bundle / APK
# Select: Android App Bundle
# Create keystore (first time) or select existing
# Build variant: release
# Click Finish

# 4. Find your .aab file
# Location: android/app/release/app-release.aab
```

## Important: First-Time Keystore Creation

When creating your keystore for the first time:

- **Key store path**: `~/tmp-server-keystore.jks` (save somewhere safe!)
- **Passwords**: Use strong passwords and **SAVE THEM**
- **Validity**: 25 years minimum
- **Certificate info**: Your name/company details

⚠️ **CRITICAL**: Back up your keystore file and passwords! You'll need them for every future update.

## Upload to Google Play

1. Go to [Google Play Console](https://play.google.com/console)
2. Create new app or select existing
3. Production → Create new release
4. Upload `app-release.aab`
5. Add release notes
6. Submit for review

## File Locations

- **Build guide**: `BUILD_ANDROID_APP.md` (detailed instructions)
- **Build script**: `build-android.sh` (automated)
- **Android project**: `android/` folder
- **Output .aab**: `android/app/release/app-release.aab`

## Troubleshooting

**"SDK not found"**
→ Install Android SDK in Android Studio → Tools → SDK Manager

**"Gradle sync failed"**
→ File → Invalidate Caches → Restart

**Can't find .aab file**
→ Check `android/app/build/outputs/bundle/release/`

## Need More Help?

See `BUILD_ANDROID_APP.md` for:
- Detailed step-by-step instructions with screenshots
- Keystore security best practices
- Troubleshooting guide
- Update procedures

---

**Ready to build?** Run `./build-android.sh` to get started! 🚀
