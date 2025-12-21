# Build Guide for Arc Streak

This guide will help you build APK (Android) and iOS apps for Arc Streak.

## Prerequisites

1. **Expo Account**: Sign up at https://expo.dev (free)
2. **EAS CLI**: Install the Expo Application Services CLI
3. **Android**: For APK builds (no additional setup needed)
4. **iOS**: For iOS builds, you need an Apple Developer account ($99/year)

## Step 1: Install EAS CLI

```bash
npm install -g eas-cli
```

## Step 2: Login to Expo

```bash
eas login
```

## Step 3: Configure EAS Build

Run this command to initialize EAS Build configuration:

```bash
eas build:configure
```

This will create an `eas.json` file in your project.

## Step 4: Update app.json

Make sure your `app.json` has the following configuration:

```json
{
  "expo": {
    "name": "Arc Streak",
    "slug": "arcstreak",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "dark",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#000000"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.arcstreak.app"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#000000"
      },
      "package": "com.arcstreak.app"
    },
    "scheme": "arcstreak"
  }
}
```

## Step 5: Build APK (Android)

### Option A: Build APK for Testing (No Google Play)

```bash
eas build --platform android --profile preview
```

This creates an APK file you can install directly on Android devices.

### Option B: Build AAB for Google Play Store

```bash
eas build --platform android --profile production
```

This creates an AAB (Android App Bundle) file for Google Play Store submission.

### Download the Build

After the build completes, you'll get a download link. You can also download it with:

```bash
eas build:list
```

## Step 6: Build iOS

### For TestFlight/App Store

```bash
eas build --platform ios --profile production
```

### For Development/Testing

```bash
eas build --platform ios --profile preview
```

**Note**: iOS builds require:
- Apple Developer account ($99/year)
- Configure credentials (EAS will guide you)

## Step 7: Submit to Stores (Optional)

### Google Play Store

```bash
eas submit --platform android
```

### Apple App Store

```bash
eas submit --platform ios
```

## Build Profiles

The `eas.json` file will have different profiles:

- **development**: For development builds
- **preview**: For testing (APK/IPA files)
- **production**: For store submission (AAB/IPA files)

## Quick Commands

```bash
# Build Android APK
eas build --platform android --profile preview

# Build Android AAB for Play Store
eas build --platform android --profile production

# Build iOS for TestFlight
eas build --platform ios --profile production

# Check build status
eas build:list

# Download latest build
eas build:download
```

## Local Builds (Advanced)

If you want to build locally instead of using EAS cloud:

### Android (Local)

```bash
eas build --platform android --local
```

**Requirements**:
- Android Studio installed
- Android SDK configured
- Java JDK

### iOS (Local)

```bash
eas build --platform ios --local
```

**Requirements**:
- macOS
- Xcode installed
- Apple Developer account
- CocoaPods

## Troubleshooting

1. **Build fails**: Check the build logs in Expo dashboard
2. **Missing assets**: Ensure all images in `assets/` folder exist
3. **Version conflicts**: Run `npm install` to ensure dependencies are correct
4. **iOS credentials**: Run `eas credentials` to manage certificates

## Important Notes

- **Free tier**: EAS Build has a free tier with limited builds per month
- **Build time**: First build takes ~15-20 minutes, subsequent builds are faster
- **APK size**: Usually 20-50MB depending on assets
- **iOS size**: Usually 30-60MB

## Need Help?

- Expo Docs: https://docs.expo.dev/build/introduction/
- EAS Build Docs: https://docs.expo.dev/build/introduction/
- Expo Discord: https://chat.expo.dev/

