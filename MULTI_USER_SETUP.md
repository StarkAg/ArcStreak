# Multi-User Support with Firebase Authentication

## How It Works

Each user gets their own data stored in Firestore using their unique user ID:

```
Firestore Structure:
├── users/
│   ├── {userId1}/
│   │   ├── gymDays: [...]
│   │   └── stats: { highestStreak: 5 }
│   ├── {userId2}/
│   │   ├── gymDays: [...]
│   │   └── stats: { highestStreak: 10 }
```

## Authentication Options

### 1. **Email/Password** (Recommended for MVP)
- Simple sign up/sign in
- Users create account with email
- Works on all platforms

### 2. **Google Sign-In**
- One-click authentication
- Users sign in with Google account
- Very user-friendly

### 3. **Anonymous Auth** (Quick Start)
- No sign up required
- Temporary account
- Good for testing

### 4. **Apple Sign-In** (iOS)
- Native iOS experience
- Privacy-focused

## Setup Steps

### Step 1: Enable Authentication in Firebase

1. Go to Firebase Console → Authentication
2. Click "Get Started"
3. Enable these sign-in methods:
   - **Email/Password** (for MVP)
   - **Google** (optional, better UX)
   - **Anonymous** (for testing)

### Step 2: Install Auth Package

```bash
npm install firebase
```

(Already installed! ✅)

### Step 3: Update Firestore Security Rules

In Firebase Console → Firestore Database → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      match /gymDays/{document=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      match /stats/{document=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

This ensures:
- ✅ Users can only access their own data
- ✅ Must be authenticated to read/write
- ✅ User ID must match the document ID

### Step 4: Data Structure

Each user's data is stored separately:

```javascript
// User 1's data
/users/user1/gymDays = { days: [...] }
/users/user1/stats = { highestStreak: 5 }

// User 2's data  
/users/user2/gymDays = { days: [...] }
/users/user2/stats = { highestStreak: 10 }
```

## Implementation

I'll create:
1. **Auth Context** - Manages login/logout state
2. **Auth Screen** - Login/signup UI
3. **Updated Cloud Storage** - Uses authenticated user ID
4. **Protected Routes** - Only show app when logged in

Would you like me to implement this now?

