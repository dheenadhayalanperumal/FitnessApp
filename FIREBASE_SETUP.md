# Firebase Setup Guide for Fitness App

This guide will help you set up Firebase for the Fitness App to enable backend functionality, authentication, and cloud data storage.

## Prerequisites

- Firebase account (free)
- Google account
- Basic understanding of Firebase console

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project"
3. Enter project name: `fitness-app` (or your preferred name)
4. Choose whether to enable Google Analytics (optional)
5. Click "Create project"

## Step 2: Enable Authentication

1. In the Firebase console, go to **Authentication** → **Sign-in method**
2. Enable the following sign-in providers:
   - **Email/Password**: Click the toggle to enable
   - **Google** (optional): For social login
   - **Apple** (optional): For iOS social login

3. Configure authorized domains if needed (for production)

## Step 3: Create Firestore Database

1. Go to **Firestore Database** → **Create database**
2. Choose **Start in test mode** (for development)
3. Select a location closest to your users
4. Click "Done"

### Set up Security Rules

Replace the default rules with these production-ready rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // User's fitness data subcollections
      match /{document=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

## Step 4: Get Configuration Keys

1. Go to **Project Settings** (gear icon) → **General**
2. Scroll down to "Your apps" section
3. Click "Add app" → **Web** (</>) icon
4. Register your app with nickname: `fitness-app-web`
5. Copy the Firebase configuration object

## Step 5: Update App Configuration

1. Open `src/services/firebase.ts`
2. Replace the placeholder configuration with your actual Firebase config:

```typescript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-actual-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

## Step 6: Test the Setup

1. Run the app: `npm start`
2. Try registering a new user
3. Check Firebase console:
   - **Authentication** → **Users** (should show new user)
   - **Firestore Database** → **Data** (should show user document)

## Step 7: Enable Offline Support (Optional)

Firestore already includes offline support, but you can configure additional settings:

1. In `firebase.ts`, uncomment offline persistence settings
2. Test the app without internet connection
3. Verify data syncs when connection is restored

## Database Structure

The app creates the following Firestore structure:

```
/users/{userId}
  ├── (user profile data)
  ├── /settings/
  │   └── goals (daily goals and targets)
  ├── /steps/
  │   └── {date} (daily steps data)
  ├── /water/
  │   └── {date} (daily water intake)
  ├── /diet/
  │   └── {date} (daily diet entries)
  ├── /weight/
  │   └── {entryId} (weight measurements)
  └── /workouts/
      └── {workoutId} (workout entries)
```

## Security Considerations

### For Development:
- Test mode rules allow read/write access
- Use Firebase Auth UI for quick testing

### For Production:
1. Update Firestore security rules (see Step 3)
2. Enable App Check for additional security
3. Set up proper CORS policies
4. Configure authorized domains
5. Enable audit logs

## Environment Configuration

For different environments (dev/staging/prod), create separate Firebase projects:

### Development
```typescript
const firebaseConfig = {
  // Dev project config
};
```

### Production
```typescript
const firebaseConfig = {
  // Production project config
};
```

## Monitoring and Analytics

1. Enable **Performance Monitoring**:
   - Go to Performance → Get started
   - Follow setup instructions

2. Enable **Analytics** (if not enabled during project creation):
   - Go to Analytics → Dashboard
   - Enable Google Analytics

3. Set up **Crashlytics** for error reporting:
   - Go to Crashlytics → Get started
   - Follow React Native setup guide

## Data Migration

The app includes automatic migration from AsyncStorage to Firebase:

1. First-time users: Data saves directly to Firebase
2. Existing users: Migration screen guides through data transfer
3. Manual migration: Available in Settings screen

## Backup Strategy

1. **Automatic**: Firestore provides automatic backups
2. **Manual Export**: Use Firebase CLI for data export
3. **User Export**: Users can export their data via Settings

## Troubleshooting

### Common Issues:

1. **"Firebase not configured"**
   - Check if firebase.ts has correct configuration
   - Verify project ID matches Firebase console

2. **"Permission denied"**
   - Check Firestore security rules
   - Verify user is authenticated

3. **"Network error"**
   - Check internet connection
   - Verify Firebase project is active

4. **"User not found"**
   - Check if user document exists in Firestore
   - Verify authentication flow

### Debug Mode:

Enable Firebase debug logging in development:

```typescript
// In firebase.ts
if (__DEV__) {
  // Enable Firestore debug logging
  firebase.firestore.setLogLevel('debug');
}
```

## Support

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Authentication](https://firebase.google.com/docs/auth)

## Next Steps

After setup is complete:

1. Test all app features with Firebase backend
2. Set up production environment
3. Configure monitoring and analytics
4. Plan data backup strategy
5. Consider additional Firebase features (Cloud Functions, etc.)


npm install firebase

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBYDZUrfHCP704741Bdg7s5fZxDfVaVIpI",
  authDomain: "fitnessapp-85a64.firebaseapp.com",
  projectId: "fitnessapp-85a64",
  storageBucket: "fitnessapp-85a64.firebasestorage.app",
  messagingSenderId: "33708474197",
  appId: "1:33708474197:web:2c1207f7e050ec6a2739dc",
  measurementId: "G-1M7YL5LFW7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);