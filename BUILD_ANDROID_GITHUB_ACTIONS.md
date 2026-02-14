# Build Android App with GitHub Actions (Cloud Build)

This guide explains how to build your Android .aab file using GitHub Actions, which avoids local environment configuration issues.

## Why Use GitHub Actions?

- **No local setup required**: No need to install Android Studio, configure JAVA_HOME, or deal with Gradle cache issues
- **Clean environment**: Every build starts fresh in a clean Ubuntu environment
- **Automated**: Builds automatically on code push or manually on demand
- **Artifact storage**: Built .aab files are stored for 30 days and can be downloaded anytime

## Prerequisites

1. A GitHub account
2. Your TMP Server code pushed to a GitHub repository

## Step 1: Push Code to GitHub

If you haven't already pushed your code to GitHub:

```bash
cd /path/to/tmp-server

# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit with Android app setup"

# Add your GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/tmp-server.git

# Push to GitHub
git push -u origin main
```

## Step 2: Trigger the Build

### Option A: Automatic Build (on push)

The workflow is configured to run automatically when you push code to the `main` branch:

```bash
git push origin main
```

### Option B: Manual Build

1. Go to your GitHub repository
2. Click on the **Actions** tab
3. Click on **Build Android App** workflow
4. Click **Run workflow** button
5. Select the branch (usually `main`)
6. Click **Run workflow**

## Step 3: Monitor the Build

1. In the **Actions** tab, you'll see your workflow running
2. Click on the workflow run to see detailed logs
3. The build typically takes 5-10 minutes
4. You'll see these steps:
   - Checkout code ✓
   - Setup Node.js ✓
   - Setup Java ✓
   - Install dependencies ✓
   - Build web app ✓
   - Sync Capacitor ✓
   - Build Android App Bundle ✓
   - Upload AAB artifact ✓

## Step 4: Download the .aab File

Once the build completes successfully:

1. Scroll down to the **Artifacts** section at the bottom of the workflow run page
2. Click on **app-release** to download the .aab file
3. Extract the downloaded ZIP file
4. You'll find `app-release.aab` inside

## Step 5: Upload to Google Play Store

Now you can upload the .aab file to Google Play Console:

1. Go to [Google Play Console](https://play.google.com/console)
2. Select your app (or create a new app)
3. Go to **Release** → **Production** → **Create new release**
4. Upload the `app-release.aab` file
5. Fill in release details and submit for review

## Troubleshooting

### Build Fails

- Check the build logs in GitHub Actions for specific errors
- Ensure all dependencies are correctly listed in `package.json`
- Verify that `capacitor.config.ts` is properly configured

### Missing Artifacts

- Make sure the build completed successfully (green checkmark)
- Artifacts are only available for 30 days after the build
- Re-run the workflow if needed

### Need a Signed Release

The current workflow builds an unsigned .aab file. To create a signed release:

1. Create a keystore file (see `BUILD_ANDROID_APP.md` for instructions)
2. Add keystore as GitHub Secret:
   - Go to repository **Settings** → **Secrets and variables** → **Actions**
   - Add these secrets:
     - `KEYSTORE_FILE` (base64 encoded keystore)
     - `KEYSTORE_PASSWORD`
     - `KEY_ALIAS`
     - `KEY_PASSWORD`
3. Update the workflow to use signing configuration

## Alternative: Local Build

If you prefer to build locally, see `BUILD_ANDROID_APP.md` for detailed instructions on setting up Android Studio and building with Gradle.

## Support

For issues with:
- **GitHub Actions**: Check the [GitHub Actions documentation](https://docs.github.com/en/actions)
- **Capacitor**: See [Capacitor Android documentation](https://capacitorjs.com/docs/android)
- **Google Play**: Visit [Google Play Console Help](https://support.google.com/googleplay/android-developer)
