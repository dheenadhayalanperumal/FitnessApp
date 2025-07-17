# Firestore Setup Guide

## The Problem

You're seeing these errors:
```
FirebaseError: [code=permission-denied]: Missing or insufficient permissions.
```

This happens because Firestore security rules haven't been deployed to your Firebase project.

## Quick Fix

### Option 1: Automatic Deployment (Recommended)

Run the deployment script:
```bash
node deploy-firestore-rules.js
```

This script will:
1. Check if Firebase CLI is installed (installs if needed)
2. Verify you're logged in to Firebase
3. Initialize the project if needed
4. Deploy the security rules

### Option 2: Manual Deployment

1. **Install Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Initialize the project** (if not already done):
   ```bash
   firebase init firestore
   ```
   - Select your existing project: `fitnessapp-85a64`
   - Use existing `firestore.rules` file
   - Don't overwrite existing files

4. **Deploy the rules**:
   ```bash
   firebase deploy --only firestore:rules
   ```

## Verify Deployment

1. Go to [Firebase Console](https://console.firebase.google.com/project/fitnessapp-85a64/firestore/rules)
2. Check that the rules are active and match your `firestore.rules` file
3. The rules should look like this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read and write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Allow users to read and write their own fitness data subcollections
      match /{document=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
    
    // Allow authenticated users to write test documents (for testing only)
    match /test/{document} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Why This Happens

1. **Default Firestore Rules**: By default, Firestore denies all access for security
2. **Rules Not Deployed**: The `firestore.rules` file exists locally but hasn't been deployed to Firebase
3. **Authentication Timing**: The app tries to access Firestore before authentication is fully established

## Enhanced Error Handling

The app now includes improved error handling:

### 1. **Authentication Checks**
- Waits for user to be fully authenticated before setting up listeners
- Includes a 1-second delay to ensure auth state is stable

### 2. **Rules Validation**
- Automatically checks if Firestore rules are properly configured
- Skips real-time sync if rules aren't deployed

### 3. **Better Error Messages**
- Shows user-friendly messages instead of technical Firebase errors
- Includes context about what went wrong

### 4. **Comprehensive Logging**
- Tracks all permission errors with context
- Monitors authentication state changes
- Provides debugging information

## What The App Does Now

1. **Before Setting Up Listeners**:
   - Waits for user authentication
   - Checks if Firestore rules are properly configured
   - Only proceeds if everything is ready

2. **During Errors**:
   - Catches permission-denied errors
   - Logs detailed error information
   - Provides helpful context about the issue

3. **Error Recovery**:
   - Automatically retries transient errors
   - Handles offline scenarios gracefully
   - Shows deployment instructions when rules are missing

## Testing The Fix

After deploying the rules:

1. **Clear app storage** (or restart the app)
2. **Log in** with your Firebase account
3. **Check the console** - you should see:
   ```
   Firestore rules check: SUCCESS
   Real-time sync enabled successfully
   ```
4. **No more permission errors** should appear

## Troubleshooting

### Still Getting Permission Errors?

1. **Check Authentication**:
   - Make sure you're logged in to the app
   - Verify the user ID matches what's in the rules

2. **Verify Rules Deployment**:
   - Check Firebase Console
   - Confirm rules are active
   - Make sure they match your local file

3. **Check Network**:
   - Ensure you have internet connection
   - Try refreshing the app

### Authentication Issues?

1. **Clear Browser Cache** (if using web)
2. **Restart the app**
3. **Check Firebase Console** for authentication logs

## Next Steps

Once rules are deployed:
1. Test user registration and login
2. Verify data synchronization works
3. Test offline functionality
4. Monitor error logs for any remaining issues

The app now has comprehensive error handling and should provide a smooth user experience even when configuration issues occur.