# Building TMP Server Android App (.aab) for Google Play Store

This guide will walk you through building a signed Android App Bundle (.aab) file for publishing to the Google Play Store.

## Prerequisites

Before you begin, ensure you have:

- **Android Studio** installed ([Download here](https://developer.android.com/studio))
- **Java Development Kit (JDK)** 17 or higher
- **Git** (to clone/download the project)
- **Node.js** and **pnpm** (if building from source)

## Step 1: Download the Project

If you haven't already, download or clone the TMP Server project to your local machine.

```bash
# If using git
git clone <your-repo-url>
cd tmp-server

# Or download and extract the ZIP file
```

## Step 2: Install Dependencies (Optional)

If you want to rebuild the web assets:

```bash
pnpm install
pnpm run build
pnpm exec cap sync android
```

**Note**: The project already has the built web assets synced, so you can skip this step if you just want to build the .aab file.

## Step 3: Open Project in Android Studio

1. Launch **Android Studio**
2. Click **Open** (or File → Open)
3. Navigate to the `tmp-server/android` folder
4. Click **OK** to open the project

Android Studio will:
- Index the project
- Download necessary Gradle dependencies (this may take a few minutes on first run)
- Sync the project

**Wait for all background tasks to complete** before proceeding (check the bottom status bar).

## Step 4: Configure Build Version

Before building, update the version information:

1. In Android Studio, open `app/build.gradle`
2. Find the `defaultConfig` section:

```gradle
defaultConfig {
    applicationId "com.tmpserver.app"
    minSdkVersion rootProject.ext.minSdkVersion
    targetSdkVersion rootProject.ext.targetSdkVersion
    versionCode 1          // ← Increment this for each release (1, 2, 3, ...)
    versionName "1.0"      // ← Update this (e.g., "1.0", "1.1", "2.0")
    ...
}
```

- **versionCode**: Must be an integer that increases with each release (1, 2, 3, ...)
- **versionName**: Human-readable version string (e.g., "1.0.0")

**Important**: Google Play requires each new upload to have a higher `versionCode` than the previous one.

## Step 5: Generate Signed Bundle

### 5.1 Start the Build Process

1. In Android Studio, go to **Build → Generate Signed Bundle / APK**
2. Select **Android App Bundle**
3. Click **Next**

### 5.2 Create or Select Keystore

**If this is your first build** (you don't have a keystore):

1. Click **Create new...**
2. Fill in the keystore information:
   - **Key store path**: Choose a secure location (e.g., `~/keystores/tmp-server-keystore.jks`)
   - **Password**: Create a strong password (write it down!)
   - **Alias**: `tmp-server` (or any name you prefer)
   - **Alias password**: Create a password (can be same as keystore password)
   - **Validity (years)**: 25 (minimum required by Google Play)
   - **Certificate**:
     - First and Last Name: Your name or company name
     - Organizational Unit: Your team/department (optional)
     - Organization: Your company name
     - City or Locality: Your city
     - State or Province: Your state
     - Country Code (XX): Your 2-letter country code (e.g., US, UK, IN)
3. Click **OK**

**If you already have a keystore**:

1. Click **Choose existing...**
2. Navigate to your keystore file
3. Enter the keystore password
4. Select the key alias
5. Enter the key password

### 5.3 Complete the Build

1. Select build variant: **release**
2. Check both signature versions: **V1 (Jar Signature)** and **V2 (Full APK Signature)**
3. Click **Finish**

Android Studio will now build the signed .aab file. This may take 1-5 minutes.

## Step 6: Locate the .aab File

Once the build completes, Android Studio will show a notification with a link to the file location.

The .aab file will be located at:

```
tmp-server/android/app/release/app-release.aab
```

You can also click **locate** in the build success notification to open the folder.

## Step 7: Verify the Build

Before uploading to Google Play, verify the .aab file:

```bash
# Check file size (should be 5-50 MB typically)
ls -lh android/app/release/app-release.aab

# Optional: Use bundletool to verify (if installed)
bundletool validate --bundle=android/app/release/app-release.aab
```

## Step 8: Upload to Google Play Console

1. Go to [Google Play Console](https://play.google.com/console)
2. Select your app (or create a new one)
3. Navigate to **Production** (or **Internal testing** for testing first)
4. Click **Create new release**
5. Upload the `app-release.aab` file
6. Add release notes
7. Click **Review release** → **Start rollout to Production**

## Important: Keystore Security

🔐 **CRITICAL**: Your keystore file and passwords are essential for updating your app.

**You must**:
- ✅ Back up the keystore file in multiple secure locations
- ✅ Store the passwords in a password manager
- ✅ Never commit the keystore to version control
- ✅ Never share the keystore or passwords

**If you lose your keystore**, you will:
- ❌ Never be able to update your app on Google Play
- ❌ Have to publish a completely new app with a different package name
- ❌ Lose all your users, reviews, and ratings

## Troubleshooting

### Build fails with "SDK not found"
- Open Android Studio → Tools → SDK Manager
- Install Android SDK Platform 34 (or the version specified in build.gradle)
- Install Android SDK Build-Tools

### "Gradle sync failed"
- File → Invalidate Caches → Invalidate and Restart
- Try again after Android Studio restarts

### "Minimum SDK version" errors
- The app requires minimum Android 5.0 (API 21)
- This is already configured in the project

### Build succeeds but .aab file is missing
- Check `android/app/build/outputs/bundle/release/` folder
- The file might be named differently (e.g., `app-release.aab`)

## Next Steps After Building

1. **Test the .aab**: Upload to Internal Testing track first
2. **Install on device**: Use Google Play Console's internal testing to install on your device
3. **Verify all features**: Test cloud storage, games, AI chat, email, etc.
4. **Submit for review**: Once tested, promote to Production

## Updating the App

When you need to release an update:

1. Make changes to your web app
2. Run `pnpm run build && pnpm exec cap sync android`
3. Increment `versionCode` in `app/build.gradle`
4. Update `versionName` if needed
5. Build signed bundle again (using the **same keystore**)
6. Upload to Google Play Console

## Additional Resources

- [Android App Bundle Documentation](https://developer.android.com/guide/app-bundle)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
- [Capacitor Android Documentation](https://capacitorjs.com/docs/android)

---

**Need Help?** If you encounter issues:
1. Check the error message carefully
2. Search for the error on Stack Overflow
3. Consult the Android Studio documentation
4. Check Capacitor's troubleshooting guide

Good luck with your app launch! 🚀
