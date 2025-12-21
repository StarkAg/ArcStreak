# Firebase Setup Guide for GymStreak

## Step 1: Create Firebase Project

1. Go to https://console.firebase.google.com
2. Click "Add Project"
3. Name it "GymStreak" (or any name)
4. Disable Google Analytics (optional)
5. Click "Create Project"

## Step 2: Enable Firestore Database

1. In Firebase Console, click "Firestore Database"
2. Click "Create Database"
3. Select "Start in test mode" (for development)
4. Choose a location (closest to you)
5. Click "Enable"

## Step 3: Get Firebase Config

1. Click the gear icon ⚙️ → Project Settings
2. Scroll down to "Your apps"
3. Click the web icon `</>`
4. Register app name: "GymStreak"
5. **Copy the config object** (looks like this):

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

## Step 4: Install Firebase

Run this command:
```bash
npm install firebase
```

## Step 5: Add Config to App

I'll create a `config/firebase.ts` file with your config.

## Step 6: Set Up Security Rules (Important!)

In Firestore Console → Rules, use this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write for all users (for MVP)
    // TODO: Add authentication later for production
    match /users/{userId}/gymDays/{document=**} {
      allow read, write: if true;
    }
    match /users/{userId}/stats/{document=**} {
      allow read, write: if true;
    }
  }
}
```

## That's it! 🎉

After setup, your data will sync automatically across all devices!

