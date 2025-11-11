# Backend Setup for Google Drive Uploads

This backend handles uploading student files to YOUR Google Drive using a Service Account.

## Why We Need a Backend

To upload files to your Google Drive without requiring students to sign in:
- We use a **Service Account** (a special Google account for applications)
- The service account credentials are stored securely on the backend
- Students upload files through your backend, which then uploads to your Drive

## Setup Steps

### 1. Create a Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Go to **IAM & Admin** > **Service Accounts**
4. Click **Create Service Account**
   - Name: `clarifyfact-uploader`
   - Description: `Service account for uploading student files to Drive`
   - Click **Create and Continue**
5. Grant role: **Not needed** (we'll share the Drive folder directly)
6. Click **Done**

### 2. Create and Download Service Account Key

1. Click on the service account you just created
2. Go to **Keys** tab
3. Click **Add Key** > **Create new key**
4. Choose **JSON** format
5. Click **Create**
6. Save the downloaded JSON file as `service-account-key.json` in the `backend` folder

### 3. Share Your Google Drive Folder with the Service Account

1. Open your Google Drive
2. Create a folder called "ClarifyFact Student Uploads" (or any name you prefer)
3. Right-click the folder > **Share**
4. In the service account JSON file, find the `client_email` (looks like: `clarifyfact-uploader@your-project.iam.gserviceaccount.com`)
5. Share the folder with that email address
6. Give it **Editor** permissions
7. Uncheck "Notify people" and click **Share**

### 4. Install Dependencies

```bash
cd backend
npm init -y
npm install googleapis formidable
```

### 5. Deploy the Backend

#### Option A: Deploy to Firebase Functions (Recommended)

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Functions
firebase init functions

# Copy upload-to-drive.js to functions/index.js
# Deploy
firebase deploy --only functions
```

Update `src/unAuth/components/GoogleDriveUpload.js`:
```javascript
const response = await fetch('https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/uploadToDrive', {
```

#### Option B: Deploy to Vercel

1. Install Vercel CLI: `npm install -g vercel`
2. Create `vercel.json`:
```json
{
  "functions": {
    "api/upload-to-drive.js": {
      "memory": 1024,
      "maxDuration": 30
    }
  }
}
```
3. Deploy: `vercel`

#### Option C: Run Locally (for testing)

```bash
cd backend
node server.js
```

Create `backend/server.js`:
```javascript
const express = require('express');
const cors = require('cors');
const uploadToDrive = require('./upload-to-drive');

const app = express();
app.use(cors());

app.post('/api/upload-to-drive', uploadToDrive);

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
```

Then update the frontend to use `http://localhost:5000/api/upload-to-drive`

### 6. Update Frontend

In `src/unAuth/components/GoogleDriveUpload.js`, update line 37:
```javascript
const response = await fetch('YOUR_BACKEND_URL/api/upload-to-drive', {
```

Replace `YOUR_BACKEND_URL` with:
- Firebase: `https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net`
- Vercel: `https://your-project.vercel.app`
- Local: `http://localhost:5000`

## Security Notes

⚠️ **IMPORTANT**:
1. **Never commit** `service-account-key.json` to Git
2. Add to `.gitignore`:
   ```
   backend/service-account-key.json
   ```
3. The service account only has access to the specific folder you shared
4. Students cannot access your other Drive files
5. For production, add rate limiting and file size limits

## Testing

1. Start your React app: `npm start`
2. Start your backend (if running locally)
3. Answer the first question
4. Try uploading a PDF file
5. Check your Google Drive folder for the uploaded file

## Troubleshooting

### "Upload failed" error
- Check that service account key file exists
- Verify the folder is shared with the service account email
- Check backend logs for detailed errors

### CORS errors
- Make sure backend has CORS enabled
- Check that the frontend URL is in allowed origins

### Files not appearing in Drive
- Verify folder permissions
- Check the service account has Editor access
- Look in the "Shared with me" section if folder sharing is incorrect

## Alternative: Firebase Storage

If Google Drive setup is too complex, consider using Firebase Storage instead:

```javascript
import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const storageRef = ref(storage, `uploads/${file.name}`);
await uploadBytes(storageRef, file);
```

Firebase Storage is simpler and works well for this use case!

