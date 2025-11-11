# Firebase Authentication & Firestore Database Setup

## ✅ What Has Been Implemented

### 1. Firebase Authentication
- ✅ Email/Password authentication
- ✅ Google Sign-in
- ✅ User profile creation in Firestore
- ✅ Authentication context for app-wide auth state

### 2. Firestore Database
- ✅ User profiles collection
- ✅ Assignments collection
- ✅ Save assignments to database
- ✅ Retrieve user's assignment history
- ✅ Delete assignments
- ✅ Update assignments

### 3. Frontend Components
- ✅ Assignment History page (`/my-assignments`)
- ✅ Save status indicators
- ✅ Authentication prompts
- ✅ NavBar link to assignment history

## 🔧 Firebase Console Setup Required

### Step 1: Enable Firestore Database

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **clarifyfact-afa06**
3. Navigate to **Firestore Database** in the left menu
4. Click **Create database**
5. Choose **Start in test mode** (for development)
6. Select a location (choose closest to your users)
7. Click **Enable**

### Step 2: Deploy Firestore Security Rules

1. Install Firebase CLI (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Deploy security rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

   Or manually copy the rules from `firestore.rules` to Firebase Console:
   - Go to **Firestore Database** → **Rules** tab
   - Paste the rules from `firestore.rules`
   - Click **Publish**

### Step 3: Create Firestore Indexes (Optional but Recommended)

For better performance, create a composite index:

1. Go to **Firestore Database** → **Indexes** tab
2. Click **Create Index**
3. Collection ID: `assignments`
4. Fields to index:
   - Field: `userId` (Ascending)
   - Field: `createdAt` (Descending)
5. Click **Create**

**Note:** The app will work without this index, but it will fetch all assignments and sort client-side (slightly slower).

## 📁 Database Structure

### Users Collection (`users`)
```
users/
  {userId}/
    - userId: string
    - email: string
    - displayName: string
    - photoURL: string (optional)
    - provider: string ('email' | 'google')
    - createdAt: timestamp
    - updatedAt: timestamp
```

### Assignments Collection (`assignments`)
```
assignments/
  {assignmentId}/
    - userId: string
    - assignmentTopic: string
    - courseMaterials: string (truncated to 5000 chars)
    - selectedOpinion: string
    - summary: string
    - finalAssignment: string
    - verifiedSources: array
    - uploadedFiles: array
    - createdAt: timestamp
    - updatedAt: timestamp
    - status: string ('completed')
```

## 🔐 Security Rules

The security rules ensure:
- Users can only read/write their own data
- Users can only create assignments with their own userId
- All other access is denied

Rules are in `firestore.rules` file.

## 🎯 Features

### Authentication
- Sign up with email/password
- Sign in with email/password
- Sign in with Google
- Sign out
- Automatic profile creation

### Assignment Management
- Automatically save assignments when generated
- View all assignments in history
- View assignment details
- Delete assignments
- Save status indicators

### User Experience
- Assignments are automatically saved if user is logged in
- Prompt to sign in if not authenticated
- "My Assignments" link in NavBar (visible when logged in)
- Assignment history page with full details

## 📝 Usage

### Saving Assignments
Assignments are automatically saved to Firestore when:
1. User is logged in
2. Assignment generation is complete
3. User has valid authentication token

### Viewing Assignment History
1. Click **"My Assignments"** in the NavBar (when logged in)
2. Or navigate to `/my-assignments`
3. View all your assignments
4. Click on any assignment to see full details

### Authentication Flow
1. Click **"Try for free"** or **"Log in"** in NavBar
2. Sign up with email/password or Google
3. User profile is automatically created in Firestore
4. All future assignments will be saved automatically

## 🚨 Important Notes

1. **Security Rules**: Make sure to deploy the security rules before going to production
2. **Indexes**: Create the composite index for better performance
3. **Test Mode**: Firestore starts in test mode - update rules for production
4. **Authentication**: Enable Email/Password and Google auth in Firebase Console
5. **Data Size**: Course materials are truncated to 5000 characters to prevent large documents

## 🔧 Troubleshooting

### "Permission denied" errors
- Check that Firestore security rules are deployed
- Verify user is authenticated
- Check that userId matches the assignment's userId

### "Index required" errors
- Create the composite index in Firestore Console
- Or wait for automatic index creation prompt
- The app will work without index (slower)

### Assignments not saving
- Check that user is logged in
- Check browser console for errors
- Verify Firestore is enabled in Firebase Console
- Check network tab for API errors

## 📚 Next Steps

1. **Deploy Security Rules**: Deploy `firestore.rules` to Firebase
2. **Create Indexes**: Create the composite index for assignments
3. **Test Authentication**: Sign up and test assignment saving
4. **Monitor Usage**: Check Firestore usage in Firebase Console
5. **Update Rules for Production**: Change from test mode to production rules

## 🎉 Summary

Firebase Authentication and Firestore are now fully integrated:
- ✅ User authentication (Email/Password + Google)
- ✅ User profiles in Firestore
- ✅ Assignment storage in Firestore
- ✅ Assignment history page
- ✅ Automatic saving
- ✅ Security rules
- ✅ NavBar integration

Users can now sign in and have their assignments automatically saved and accessible through the "My Assignments" page!

