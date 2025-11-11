# Google Drive Upload Setup Guide - SIMPLIFIED

## Overview
Students can now upload PDF slides directly to YOUR Google Drive after answering the first question. No sign-in required!

## What's Changed
✅ **Same size box** as other question inputs  
✅ **No student sign-in** required  
✅ **Files upload to YOUR Google Drive** (not the student's)  
✅ **Simple upload interface** - just click and select files

## Quick Setup (3 Steps)

### Step 1: Create a Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select a project
3. Enable **Google Drive API**:
   - Go to "APIs & Services" > "Library"
   - Search "Google Drive API"
   - Click "Enable"
4. Create Service Account:
   - Go to "IAM & Admin" > "Service Accounts"
   - Click "Create Service Account"
   - Name: `clarifyfact-uploader`
   - Click "Create and Continue" > "Done"
5. Create Key:
   - Click on the service account
   - Go to "Keys" tab
   - "Add Key" > "Create new key" > "JSON"
   - Save as `service-account-key.json`

### Step 2: Share Google Drive Folder

1. Create a folder in your Google Drive: "ClarifyFact Student Uploads"
2. Open the `service-account-key.json` file
3. Copy the `client_email` (looks like: `xxx@xxx.iam.gserviceaccount.com`)
4. Share the Drive folder with this email (Editor permissions)
5. Uncheck "Notify people"

### Step 3: Deploy Backend (Choose One)

#### Option A: Firebase Functions (Recommended - You already have Firebase!)

```bash
# Install dependencies
cd functions
npm install

# Copy your service-account-key.json to functions folder
# (Make sure it's in .gitignore!)

# Deploy
firebase deploy --only functions
```

After deployment, update `src/unAuth/components/GoogleDriveUpload.js` line 37:
```javascript
const response = await fetch('https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/uploadToDrive', {
```

#### Option B: Local Testing

```bash
cd backend
npm install express cors googleapis formidable
node server.js
```

Frontend stays at `http://localhost:5000/api/upload-to-drive` (already configured)

## How It Works

1. **Question 1**: Student answers "What is your main goal with this assignment?"
2. **After submission**: The Google Drive upload screen appears
3. **Sign in**: Student signs in with their Google account
4. **Upload**: Student selects and uploads PDF files to their Google Drive
5. **Continue**: After uploading, student proceeds to the next questions

## Features

- ✅ OAuth 2.0 authentication with Google
- ✅ Secure file upload to user's Google Drive
- ✅ Only PDF files allowed
- ✅ Multiple file upload support
- ✅ File preview before upload
- ✅ Skip option (if upload is not mandatory)
- ✅ Beautiful, responsive UI

## Testing

1. Answer the first question
2. Click Submit
3. You'll see the Google Drive upload screen
4. Click "Sign in with Google"
5. Grant permissions
6. Select PDF files
7. Upload to Drive
8. Continue to next questions

## Troubleshooting

### "Failed to initialize Google Drive"
- Check that your API key and Client ID are correct in `.env`
- Ensure the Google Drive API is enabled in your project
- Verify your domain is in the authorized JavaScript origins

### "Upload failed"
- Check that you've granted the necessary permissions
- Ensure you're uploading only PDF files
- Check your internet connection

### OAuth Consent Screen Issues
- Make sure your app is not in "Testing" mode, or add yourself as a test user
- Verify the scopes include `https://www.googleapis.com/auth/drive.file`

## Files Modified/Created

1. **New Files**:
   - `src/unAuth/components/GoogleDriveUpload.js` - Main upload component
   - `src/unAuth/components/GoogleDriveUpload.css` - Styling for upload component
   - `.env` - Environment variables (API key & Client ID)
   - `GOOGLE_DRIVE_SETUP.md` - This setup guide

2. **Modified Files**:
   - `src/unAuth/components/QuestionBox.js` - Integrated Google Drive upload flow
   - `.gitignore` - Added `.env` to prevent committing secrets
   - `package.json` - Added `gapi-script` dependency

## Security Best Practices

1. ✅ `.env` file is in `.gitignore` - secrets won't be committed
2. ✅ OAuth 2.0 for secure authentication
3. ✅ Files uploaded to user's own Google Drive
4. ⚠️ **Remember**: Never commit API keys or Client IDs to version control
5. ⚠️ For production, use environment-specific `.env` files

## Next Steps

1. Complete the OAuth 2.0 setup as described above
2. Update the `.env` file with your Client ID
3. Test the upload flow
4. (Optional) Customize the upload behavior in `GoogleDriveUpload.js`

## Need Help?

If you encounter any issues:
1. Check the browser console for error messages
2. Verify all setup steps were completed
3. Ensure you're using the correct API credentials
4. Check that the Google Drive API is enabled in your project

---

**Happy coding! 🚀**

