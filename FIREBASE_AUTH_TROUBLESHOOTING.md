# Firebase Authentication Troubleshooting Guide

## Error: "Firebase: Error (auth/internal-error)"

This error typically occurs when Firebase Authentication is not properly configured in the Firebase Console.

### Most Common Cause: Email/Password Authentication Not Enabled

**Solution:**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **clarifyfact-afa06**
3. Navigate to **Authentication** → **Sign-in method**
4. Click on **Email/Password**
5. Toggle **Enable** to **ON**
6. Click **Save**

### Other Common Causes

#### 1. Google Sign-in Not Enabled

If you're trying to use Google Sign-in:

1. Go to **Authentication** → **Sign-in method**
2. Click on **Google**
3. Toggle **Enable** to **ON**
4. Enter your **Support email**
5. Click **Save**

#### 2. API Key Restrictions

If your Firebase API key has domain restrictions:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: **clarifyfact-afa06**
3. Navigate to **APIs & Services** → **Credentials**
4. Find your API key: **AIzaSyBO1mVOpVJ_YyA4fcNYPsK9Cv2E5wugAe8**
5. Check **Application restrictions**:
   - If set to **HTTP referrers**, ensure your domain is listed:
     - `clarifyfact-afa06.web.app`
     - `clarifyfact-afa06.firebaseapp.com`
     - `localhost` (for development)
   - Or temporarily set to **None** for testing

#### 3. OAuth Consent Screen Not Configured (for Google Sign-in)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: **clarifyfact-afa06**
3. Navigate to **APIs & Services** → **OAuth consent screen**
4. Fill in:
   - **App name**: ClarifyFact
   - **User support email**: Your email
   - **Developer contact information**: Your email
5. Click **Save and Continue**
6. Add scopes (if needed) → **Save and Continue**
7. Add test users (optional) → **Save and Continue**
8. Review and **Back to Dashboard**

#### 4. Network/CORS Issues

- Check your internet connection
- Clear browser cache and cookies
- Try in an incognito/private window
- Check browser console for CORS errors

#### 5. Firestore Rules Blocking Authentication

Firestore rules should NOT block authentication. However, if you're getting errors when saving user profiles:

1. Check `firestore.rules` file
2. Ensure rules allow users to create their own profile:
   ```javascript
   match /users/{userId} {
     allow read, write: if request.auth != null && request.auth.uid == userId;
   }
   ```
3. Deploy rules: `firebase deploy --only firestore:rules`

### Improved Error Messages

The app now shows more helpful error messages:

- **auth/internal-error**: "Authentication service error. Please check that Email/Password authentication is enabled in Firebase Console, or try again later."
- **auth/user-not-found**: "No account found with this email address."
- **auth/wrong-password**: "Incorrect password. Please try again."
- **auth/email-already-in-use**: "An account with this email already exists. Please log in instead."
- **auth/weak-password**: "Password is too weak. Please use a stronger password."
- **auth/invalid-email**: "Invalid email address. Please check your email and try again."
- **auth/network-request-failed**: "Network error. Please check your internet connection and try again."
- **auth/too-many-requests**: "Too many failed attempts. Please try again later."

### Verification Steps

1. **Check Firebase Console**:
   - Authentication → Sign-in method
   - Ensure Email/Password is enabled
   - Ensure Google is enabled (if using)

2. **Check Browser Console**:
   - Open browser DevTools (F12)
   - Check Console tab for detailed error messages
   - Check Network tab for failed requests

3. **Test Authentication**:
   - Try creating a new account
   - Try logging in with existing account
   - Try Google Sign-in

### Still Having Issues?

1. Check Firebase status: https://status.firebase.google.com/
2. Check Firebase project quota and billing
3. Verify Firebase project is active and not suspended
4. Check browser console for detailed error messages
5. Try a different browser or incognito mode

### Quick Fix Checklist

- [ ] Email/Password authentication enabled in Firebase Console
- [ ] Google Sign-in enabled in Firebase Console (if using)
- [ ] OAuth consent screen configured (if using Google Sign-in)
- [ ] API key restrictions allow your domain
- [ ] Firestore rules allow user profile creation
- [ ] Internet connection is stable
- [ ] Browser cache cleared
- [ ] Firebase project is active and not suspended

