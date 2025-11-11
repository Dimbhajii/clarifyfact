# Enable Google Sign-in in Firebase Console

## Quick Fix Steps

### Step 1: Enable Google Sign-in in Firebase Console

1. **Go to Firebase Console:**
   - Visit: https://console.firebase.google.com/
   - Sign in with your Google account

2. **Select Your Project:**
   - Click on **clarifyfact-afa06** from the project list

3. **Navigate to Authentication:**
   - Click on **Authentication** in the left sidebar
   - Click on **Sign-in method** tab

4. **Enable Google Provider:**
   - Find **Google** in the list of sign-in providers
   - Click on **Google**
   - Toggle **Enable** to **ON** (it should turn blue/green)
   - Enter your **Support email** (any email address you want to use for support)
   - Click **Save**

### Step 2: Configure OAuth Consent Screen (Required for Google Sign-in)

1. **Go to Google Cloud Console:**
   - Visit: https://console.cloud.google.com/
   - Sign in with the same Google account
   - Select project: **clarifyfact-afa06**

2. **Navigate to OAuth Consent Screen:**
   - Click on **APIs & Services** in the left sidebar
   - Click on **OAuth consent screen**

3. **Configure OAuth Consent Screen:**
   - **User Type:** Select **External** (unless you have a Google Workspace account)
   - Click **Create**

4. **Fill in App Information:**
   - **App name:** ClarifyFact (or any name you prefer)
   - **User support email:** Your email address
   - **Developer contact information:** Your email address
   - Click **Save and Continue**

5. **Add Scopes (Optional):**
   - You can skip this step for basic authentication
   - Click **Save and Continue**

6. **Add Test Users (Optional for Testing):**
   - If your app is in "Testing" mode, add test users' email addresses
   - Click **Save and Continue**

7. **Review:**
   - Review your settings
   - Click **Back to Dashboard**

### Step 3: Verify Configuration

1. **Check Firebase Console:**
   - Go back to Firebase Console
   - Navigate to **Authentication** → **Sign-in method**
   - Verify that **Google** shows as **Enabled** (green checkmark)

2. **Test Google Sign-in:**
   - Go to your website: https://clarifyfact-afa06.web.app
   - Click on "Sign In" or "Try for free"
   - Click on "Sign in with Google"
   - You should see the Google sign-in popup

## Common Issues

### Issue 1: "OAuth client not found"

**Solution:**
- Make sure you've enabled Google Sign-in in Firebase Console
- Wait a few minutes for changes to propagate
- Try refreshing the page

### Issue 2: "Popup blocked"

**Solution:**
- Allow pop-ups in your browser for your website
- Try in an incognito/private window
- Check browser settings for pop-up blockers

### Issue 3: "Redirect URI mismatch"

**Solution:**
- This usually resolves automatically when you enable Google Sign-in in Firebase
- Make sure you're using the correct domain (clarifyfact-afa06.web.app)
- Firebase automatically adds the necessary redirect URIs

### Issue 4: "App not verified" (for production)

**Solution:**
- If your app is in production, you may need to verify your app with Google
- Go to OAuth consent screen and submit for verification
- For testing, you can add test users without verification

## Testing Checklist

- [ ] Google Sign-in enabled in Firebase Console
- [ ] Support email entered in Firebase Console
- [ ] OAuth consent screen configured in Google Cloud Console
- [ ] App name and emails filled in OAuth consent screen
- [ ] Test users added (if app is in testing mode)
- [ ] Firebase Console shows Google as "Enabled"
- [ ] Tested Google Sign-in on the website

## Quick Links

- **Firebase Console:** https://console.firebase.google.com/project/clarifyfact-afa06/authentication/providers
- **Google Cloud Console:** https://console.cloud.google.com/apis/credentials/consent?project=clarifyfact-afa06
- **Your Website:** https://clarifyfact-afa06.web.app

## Need Help?

If you're still having issues:

1. **Check Browser Console:**
   - Press F12 to open developer tools
   - Check the Console tab for error messages
   - Look for any Firebase authentication errors

2. **Check Firebase Console Logs:**
   - Go to Firebase Console → Authentication → Users
   - Check if any users are being created
   - Look for error messages

3. **Verify API Key:**
   - Make sure your API key is not restricted
   - Check Google Cloud Console → APIs & Services → Credentials
   - Verify your API key allows your domain

4. **Wait for Propagation:**
   - Changes in Firebase Console can take a few minutes to propagate
   - Wait 2-5 minutes after enabling Google Sign-in
   - Try clearing browser cache and cookies

## Important Notes

- **Email/Password Authentication:** Make sure Email/Password is also enabled if you want users to sign in with email
- **OAuth Consent Screen:** Required for Google Sign-in to work
- **Test Mode:** If your app is in test mode, you can only use test users
- **Production:** For production, you may need to verify your app with Google

