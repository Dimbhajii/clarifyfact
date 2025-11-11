# Firebase Hosting Guide

Complete guide to host your ClarifyFact website on Firebase.

## Overview

Your project has two main components:
1. **Frontend**: React app (hosted on Firebase Hosting)
2. **Backend API**: Express server (hosted on Firebase Functions)

## Prerequisites

1. **Firebase CLI**: Install if you haven't already
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Initialize Firebase** (if not already done):
   ```bash
   firebase init
   ```
   Select:
   - ✅ Hosting
   - ✅ Functions
   - ✅ Firestore

## Step 1: Move Backend API to Firebase Functions

The backend API needs to be converted to Firebase Functions. We'll create a new Express app that runs as a Cloud Function.

### 1.1 Update Firebase Functions

Update `functions/index.js` to include all your API endpoints:

```javascript
const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const { analyzeAssignment } = require('./services/assignmentAnalyzer');
const { factCheckOpinion } = require('./services/factChecker');
const { generateAssignment, humanizeText } = require('./services/openaiService');

const app = express();

// Enable CORS
app.use(cors({ origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

// Test OpenAI connection
app.get('/api/test-openai', async (req, res) => {
  try {
    const { OpenAI } = require('openai');
    const openai = new OpenAI({
      apiKey: functions.config().openai?.api_key || process.env.OPENAI_API_KEY,
    });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: 'Say "OpenAI API is working!" in one sentence.',
        },
      ],
      max_tokens: 50,
    });

    res.json({
      success: true,
      message: 'OpenAI API is connected and working!',
      response: response.choices[0].message.content,
      mode: 'real',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'OpenAI API connection failed',
      details: error.message,
    });
  }
});

// Analyze assignment
app.post('/api/analyze-assignment', async (req, res) => {
  try {
    const { assignmentTopic, courseMaterials } = req.body;

    if (!assignmentTopic || !courseMaterials) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: assignmentTopic and courseMaterials'
      });
    }

    const result = await analyzeAssignment(assignmentTopic, courseMaterials);
    res.json({
      success: true,
      ...result,
      mode: 'real'
    });
  } catch (error) {
    console.error('Error analyzing assignment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze assignment',
      details: error.message
    });
  }
});

// Fact-check opinion
app.post('/api/fact-check', async (req, res) => {
  try {
    const { assignmentTopic, selectedOpinion, courseMaterials } = req.body;

    if (!assignmentTopic || !selectedOpinion || !courseMaterials) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: assignmentTopic, selectedOpinion, and courseMaterials'
      });
    }

    const result = await factCheckOpinion(assignmentTopic, selectedOpinion, courseMaterials);
    res.json({
      success: true,
      ...result,
      mode: 'real'
    });
  } catch (error) {
    console.error('Error fact-checking opinion:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fact-check opinion',
      details: error.message
    });
  }
});

// Generate assignment
app.post('/api/generate-assignment', async (req, res) => {
  try {
    const { assignmentTopic, selectedOpinion, courseMaterials, verifiedSources } = req.body;

    if (!assignmentTopic || !selectedOpinion || !courseMaterials) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: assignmentTopic, selectedOpinion, and courseMaterials'
      });
    }

    // Generate assignment
    const assignment = await generateAssignment(
      assignmentTopic,
      selectedOpinion,
      courseMaterials,
      verifiedSources || []
    );

    // Humanize the assignment
    const humanizedAssignment = await humanizeText(assignment);

    res.json({
      success: true,
      assignment: humanizedAssignment,
      humanized: true,
      mode: 'real'
    });
  } catch (error) {
    console.error('Error generating assignment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate assignment',
      details: error.message
    });
  }
});

// Export as Firebase Function
exports.api = functions
  .region('us-central1') // Change to your preferred region
  .runWith({
    timeoutSeconds: 540, // 9 minutes (max for HTTP functions)
    memory: '1GB' // Increase memory for better performance
  })
  .https.onRequest(app);
```

### 1.2 Copy Backend Services to Functions

Copy these directories/files from `backend/` to `functions/`:
- `backend/services/` → `functions/services/`
- `backend/utils/` → `functions/utils/`
- `backend/config.js` → `functions/config.js` (update for Firebase)

### 1.3 Update Functions package.json

Add all required dependencies:

```json
{
  "dependencies": {
    "firebase-admin": "^11.8.0",
    "firebase-functions": "^4.3.1",
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "openai": "^4.28.0",
    "pdf-parse": "^2.4.5"
  }
}
```

## Step 2: Configure Environment Variables

### 2.1 Set Firebase Functions Config

```bash
# Set OpenAI API key
firebase functions:config:set openai.api_key="your-openai-api-key-here"

# Set any other config variables
firebase functions:config:set cors.origin="https://your-project.web.app"
```

### 2.2 Update Functions Config Helper

Create `functions/config.js`:

```javascript
const functions = require('firebase-functions');

const config = {
  openai: {
    apiKey: functions.config().openai?.api_key || process.env.OPENAI_API_KEY,
    useMock: false, // Always false in production
  },
  cors: {
    origin: functions.config().cors?.origin || 'https://clarifyfact-afa06.web.app',
  },
};

module.exports = config;
```

## Step 3: Update Frontend Configuration

### 3.1 Create Environment File

Create `.env.production` in the root directory:

```env
REACT_APP_API_URL=https://us-central1-clarifyfact-afa06.cloudfunctions.net/api
REACT_APP_FIREBASE_API_KEY=AIzaSyBO1mVOpVJ_YyA4fcNYPsK9Cv2E5wugAe8
REACT_APP_FIREBASE_AUTH_DOMAIN=clarifyfact-afa06.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=clarifyfact-afa06
REACT_APP_FIREBASE_STORAGE_BUCKET=clarifyfact-afa06.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=72447431817
REACT_APP_FIREBASE_APP_ID=1:72447431817:web:e18e53e439781705c2e258
```

**Important**: Replace `clarifyfact-afa06` with your actual Firebase project ID.

### 3.2 Update firebase.json

Update `firebase.json` to include functions:

```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "functions": {
    "source": "functions",
    "runtime": "nodejs20"
  },
  "hosting": {
    "public": "build",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "/api/**",
        "function": "api"
      },
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

## Step 4: Build and Deploy

### 4.1 Build React App

```bash
# Install dependencies (if not already done)
npm install

# Build the React app
npm run build
```

This creates the `build/` directory with production-ready files.

### 4.2 Install Functions Dependencies

```bash
cd functions
npm install
cd ..
```

### 4.3 Deploy to Firebase

**Deploy everything:**
```bash
firebase deploy
```

**Or deploy separately:**
```bash
# Deploy only hosting
firebase deploy --only hosting

# Deploy only functions
firebase deploy --only functions

# Deploy both
firebase deploy --only hosting,functions
```

### 4.4 Verify Deployment

After deployment, you'll see URLs like:
- **Hosting URL**: `https://clarifyfact-afa06.web.app`
- **Functions URL**: `https://us-central1-clarifyfact-afa06.cloudfunctions.net/api`

## Step 5: Update Frontend API URL

The frontend should automatically use the Firebase Functions URL in production if you set `REACT_APP_API_URL` correctly.

Alternatively, update `src/unAuth/components/QuestionBox.js`:

```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://us-central1-clarifyfact-afa06.cloudfunctions.net/api'
    : 'http://localhost:5000');
```

## Step 6: Testing

### 6.1 Test Locally with Emulators

```bash
# Start Firebase emulators
firebase emulators:start

# In another terminal, build and serve
npm run build
firebase serve
```

### 6.2 Test Production URLs

1. Visit your hosting URL: `https://your-project.web.app`
2. Test API endpoints:
   - `https://your-project.web.app/api/health`
   - `https://your-project.web.app/api/test-openai`

## Troubleshooting

### Issue: Functions timeout
**Solution**: Increase timeout in `functions/index.js`:
```javascript
exports.api = functions
  .runWith({
    timeoutSeconds: 540, // Max 9 minutes
    memory: '1GB'
  })
  .https.onRequest(app);
```

### Issue: CORS errors
**Solution**: Make sure CORS is enabled in your Express app:
```javascript
app.use(cors({ origin: true }));
```

### Issue: Environment variables not working
**Solution**: 
1. Set config: `firebase functions:config:set openai.api_key="your-key"`
2. Redeploy: `firebase deploy --only functions`

### Issue: Build fails
**Solution**: 
1. Check Node version: `node --version` (should be 20+)
2. Clear cache: `rm -rf node_modules package-lock.json && npm install`
3. Check for TypeScript errors if using TS

### Issue: Functions not found
**Solution**: 
1. Check function name matches in `firebase.json` rewrites
2. Verify function is deployed: `firebase functions:list`
3. Check function logs: `firebase functions:log`

## Cost Considerations

Firebase Functions pricing:
- **Free tier**: 2 million invocations/month
- **After free tier**: $0.40 per million invocations
- **Compute time**: $0.0000025 per GB-second
- **Memory**: Based on allocated memory

For your use case (assignment generation with 3-pass humanization):
- Each assignment = ~3-4 function calls
- Estimated cost: Very low for small to medium usage

## Security Best Practices

1. **Never commit API keys** to Git
2. **Use Firebase Functions config** for secrets
3. **Enable CORS** properly (restrict origins in production)
4. **Add rate limiting** to prevent abuse
5. **Validate input** on all endpoints
6. **Set up Firebase Security Rules** for Firestore

## Next Steps

1. Set up custom domain (optional)
2. Enable Firebase Analytics
3. Set up error monitoring (Firebase Crashlytics)
4. Configure CDN caching
5. Set up CI/CD pipeline

## Quick Reference

```bash
# Login
firebase login

# Initialize (if needed)
firebase init

# Set config
firebase functions:config:set openai.api_key="your-key"

# Build frontend
npm run build

# Deploy
firebase deploy

# View logs
firebase functions:log

# Test locally
firebase emulators:start
```

Your site should now be live at: `https://your-project.web.app` 🚀

