# Quick Fix: Enable Google Sign-in

## 🚀 3-Step Solution

### Step 1: Enable Google Sign-in in Firebase Console (2 minutes)

**Direct Link:** https://console.firebase.google.com/project/clarifyfact-afa06/authentication/providers

1. Click the link above (or go to Firebase Console → Authentication → Sign-in method)
2. Find **Google** in the list
3. Click on **Google**
4. Toggle **Enable** to **ON** ✅
5. Enter any email as **Support email**
6. Click **Save**

### Step 2: Configure OAuth Consent Screen (3 minutes)

**Direct Link:** https://console.cloud.google.com/apis/credentials/consent?project=clarifyfact-afa06

1. Click the link above (or go to Google Cloud Console → APIs & Services → OAuth consent screen)
2. Select **External** as User Type
3. Click **Create**
4. Fill in:
   - **App name:** ClarifyFact
   - **User support email:** (your email)
   - **Developer contact information:** (your email)
5. Click **Save and Continue** (3 times to skip optional steps)
6. Click **Back to Dashboard**

### Step 3: Wait and Test (2 minutes)

1. Wait 2-3 minutes for changes to propagate
2. Go to: https://clarifyfact-afa06.web.app
3. Click **Sign In** or **Try for free**
4. Click **Sign in with Google**
5. You should see the Google sign-in popup! 🎉

## ✅ Verification Checklist

- [ ] Google shows as **Enabled** in Firebase Console
- [ ] OAuth consent screen is configured in Google Cloud Console
- [ ] Waited 2-3 minutes after enabling
- [ ] Tested Google Sign-in on the website

## 🔍 Still Not Working?

### Check Browser Console
1. Press **F12** to open developer tools
2. Click **Console** tab
3. Look for error messages
4. Check if you see any Firebase authentication errors

### Common Issues

**Issue:** "Popup blocked"
- **Solution:** Allow pop-ups for your website in browser settings

**Issue:** "OAuth client not found"
- **Solution:** Wait a few more minutes, then refresh the page

**Issue:** "Unauthorized domain"
- **Solution:** Firebase automatically adds your domain. If error persists, check Firebase Console → Authentication → Settings → Authorized domains

**Issue:** Still shows "Google Sign-in is not enabled"
- **Solution:** 
  1. Double-check that Google is enabled in Firebase Console
  2. Clear browser cache (Ctrl+Shift+Delete)
  3. Try in an incognito/private window
  4. Wait 5 minutes and try again

## 📞 Need More Help?

1. Check the detailed guide: `ENABLE_GOOGLE_SIGNIN.md`
2. Check browser console for specific error codes
3. Verify both Firebase Console and Google Cloud Console settings

## 🎯 Quick Links

- **Firebase Console (Authentication):** https://console.firebase.google.com/project/clarifyfact-afa06/authentication/providers
- **Google Cloud Console (OAuth):** https://console.cloud.google.com/apis/credentials/consent?project=clarifyfact-afa06
- **Your Website:** https://clarifyfact-afa06.web.app

