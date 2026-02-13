#!/bin/bash

# TMP Server Android Build Script
# This script automates the Android app bundle (.aab) build process
# Run this script from the tmp-server project root directory

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored message
print_message() {
    echo -e "${2}${1}${NC}"
}

print_message "╔════════════════════════════════════════════════════════════╗" "$BLUE"
print_message "║        TMP Server Android Build Script                    ║" "$BLUE"
print_message "╚════════════════════════════════════════════════════════════╝" "$BLUE"
echo ""

# Check if we're in the right directory
if [ ! -f "capacitor.config.ts" ]; then
    print_message "❌ Error: capacitor.config.ts not found!" "$RED"
    print_message "Please run this script from the tmp-server project root directory." "$YELLOW"
    exit 1
fi

print_message "✓ Found Capacitor configuration" "$GREEN"

# Check for required tools
print_message "\n📋 Checking prerequisites..." "$BLUE"

# Check for Node.js
if ! command -v node &> /dev/null; then
    print_message "❌ Node.js is not installed!" "$RED"
    print_message "Please install Node.js from https://nodejs.org/" "$YELLOW"
    exit 1
fi
print_message "✓ Node.js $(node --version)" "$GREEN"

# Check for pnpm
if ! command -v pnpm &> /dev/null; then
    print_message "❌ pnpm is not installed!" "$RED"
    print_message "Install it with: npm install -g pnpm" "$YELLOW"
    exit 1
fi
print_message "✓ pnpm $(pnpm --version)" "$GREEN"

# Check for Java
if ! command -v java &> /dev/null; then
    print_message "⚠️  Java is not installed or not in PATH" "$YELLOW"
    print_message "You'll need Java 17+ to build the Android app" "$YELLOW"
    print_message "Download from: https://adoptium.net/" "$YELLOW"
else
    print_message "✓ Java $(java -version 2>&1 | head -n 1 | cut -d'"' -f2)" "$GREEN"
fi

# Check for Android SDK
if [ -z "$ANDROID_HOME" ] && [ -z "$ANDROID_SDK_ROOT" ]; then
    print_message "⚠️  ANDROID_HOME not set" "$YELLOW"
    print_message "You'll need Android Studio and SDK to build the .aab file" "$YELLOW"
    print_message "Download from: https://developer.android.com/studio" "$YELLOW"
else
    print_message "✓ Android SDK found" "$GREEN"
fi

# Ask user if they want to continue
echo ""
read -p "Do you want to continue with the build? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_message "Build cancelled." "$YELLOW"
    exit 0
fi

# Step 1: Install dependencies
print_message "\n📦 Step 1: Installing dependencies..." "$BLUE"
if pnpm install; then
    print_message "✓ Dependencies installed" "$GREEN"
else
    print_message "❌ Failed to install dependencies" "$RED"
    exit 1
fi

# Step 2: Build web assets
print_message "\n🔨 Step 2: Building web assets..." "$BLUE"
if pnpm run build; then
    print_message "✓ Web assets built successfully" "$GREEN"
else
    print_message "❌ Failed to build web assets" "$RED"
    exit 1
fi

# Step 3: Sync with Capacitor
print_message "\n🔄 Step 3: Syncing with Android project..." "$BLUE"
if pnpm exec cap sync android; then
    print_message "✓ Synced with Android project" "$GREEN"
else
    print_message "❌ Failed to sync with Android" "$RED"
    exit 1
fi

# Step 4: Check if Android Studio is available
print_message "\n🏗️  Step 4: Preparing for Android build..." "$BLUE"

if [ -d "android" ]; then
    print_message "✓ Android project directory found" "$GREEN"
else
    print_message "❌ Android directory not found!" "$RED"
    exit 1
fi

# Check for gradlew
if [ -f "android/gradlew" ]; then
    print_message "✓ Gradle wrapper found" "$GREEN"
    
    # Make gradlew executable
    chmod +x android/gradlew
    
    # Ask if user wants to build with Gradle (command line)
    echo ""
    print_message "You have two options to build the .aab file:" "$BLUE"
    echo "  1. Use Android Studio (Recommended - easier to manage keystore)"
    echo "  2. Use command line Gradle (Advanced - requires existing keystore)"
    echo ""
    read -p "Choose option (1 or 2): " -n 1 -r
    echo ""
    
    if [[ $REPLY == "2" ]]; then
        # Command line build
        print_message "\n🔐 Building with Gradle..." "$BLUE"
        print_message "⚠️  This requires a keystore file to be configured" "$YELLOW"
        
        # Check if keystore properties exist
        if [ ! -f "android/keystore.properties" ]; then
            print_message "\n❌ keystore.properties not found!" "$RED"
            print_message "You need to create android/keystore.properties with:" "$YELLOW"
            echo ""
            echo "storeFile=/path/to/your/keystore.jks"
            echo "storePassword=your-keystore-password"
            echo "keyAlias=your-key-alias"
            echo "keyPassword=your-key-password"
            echo ""
            print_message "After creating the file, run this script again." "$YELLOW"
            exit 1
        fi
        
        # Build the bundle
        print_message "\n🚀 Building release bundle..." "$BLUE"
        cd android
        if ./gradlew bundleRelease; then
            cd ..
            print_message "\n✅ BUILD SUCCESSFUL!" "$GREEN"
            print_message "\n📦 Your .aab file is located at:" "$BLUE"
            print_message "   android/app/build/outputs/bundle/release/app-release.aab" "$GREEN"
            
            # Show file size
            if [ -f "android/app/build/outputs/bundle/release/app-release.aab" ]; then
                SIZE=$(du -h "android/app/build/outputs/bundle/release/app-release.aab" | cut -f1)
                print_message "\n📊 File size: $SIZE" "$BLUE"
            fi
        else
            cd ..
            print_message "\n❌ Build failed!" "$RED"
            print_message "Check the error messages above for details." "$YELLOW"
            exit 1
        fi
    else
        # Android Studio build
        print_message "\n📱 Opening project in Android Studio..." "$BLUE"
        echo ""
        print_message "Next steps:" "$YELLOW"
        echo "  1. Wait for Android Studio to finish indexing"
        echo "  2. Go to Build → Generate Signed Bundle / APK"
        echo "  3. Select 'Android App Bundle'"
        echo "  4. Create or select your keystore"
        echo "  5. Build the release bundle"
        echo ""
        print_message "The .aab file will be at: android/app/release/app-release.aab" "$GREEN"
        echo ""
        
        # Try to open Android Studio
        if command -v studio &> /dev/null; then
            studio android
        elif command -v studio.sh &> /dev/null; then
            studio.sh android
        elif [ -d "/Applications/Android Studio.app" ]; then
            open -a "Android Studio" android
        else
            print_message "⚠️  Could not automatically open Android Studio" "$YELLOW"
            print_message "Please open the 'android' folder manually in Android Studio" "$YELLOW"
        fi
    fi
else
    print_message "⚠️  Gradle wrapper not found" "$YELLOW"
    print_message "Please open the android folder in Android Studio to build" "$YELLOW"
fi

print_message "\n✨ Build preparation complete!" "$GREEN"
print_message "\nFor detailed instructions, see BUILD_ANDROID_APP.md" "$BLUE"
