# Quick Start: Deploy to Firebase

## Prerequisites Checklist

- [ ] Firebase CLI installed: `npm install -g firebase-tools`
- [ ] Logged in: `firebase login`
- [ ] Project initialized: `firebase init` (if not done)
- [ ] OpenAI API key ready

## Step 1: Set Up Functions

### 1.1 Copy Backend Services to Functions

Copy these directories from `backend/` to `functions/`:
```bash
# Windows (PowerShell)
Copy-Item -Recurse backend\services functions\
Copy-Item -Recurse backend\utils functions\
Copy-Item backend\config.js functions\config.js

# Mac/Linux
cp -r backend/services functions/
cp -r backend/utils functions/
cp backend/config.js functions/config.js
```

### 1.2 Update Functions index.js

Replace `functions/index.js` with the content from `functions/index-complete.js`:

```bash
# Windows
copy functions\index-complete.js functions\index.js

# Mac/Linux
cp functions/index-complete.js functions/index.js
```

### 1.3 Install Function Dependencies

```bash
cd functions
npm install
cd ..
```

## Step 2: Configure Environment Variables

### 2.1 Set OpenAI API Key

```bash
firebase functions:config:set openai.api_key="your-openai-api-key-here"
```

### 2.2 (Optional) Set CORS Origin

```bash
firebase functions:config:set cors.origin="https://your-project.web.app"
```

## Step 3: Build Frontend

```bash
npm run build
```

This creates the `build/` directory.

## Step 4: Deploy

### Option A: Deploy Everything

```bash
firebase deploy
```

### Option B: Deploy Separately

```bash
# Deploy only hosting
firebase deploy --only hosting

# Deploy only functions
firebase deploy --only functions
```

### Option C: Use Deployment Script

**Windows:**
```bash
deploy-firebase.bat
```

**Mac/Linux:**
```bash
chmod +x deploy-firebase.sh
./deploy-firebase.sh
```

## Step 5: Verify

1. Visit your site: `https://your-project.web.app`
2. Test API: `https://your-project.web.app/api/health`
3. Check logs: `firebase functions:log`

## Troubleshooting

### Functions timeout
Increase timeout in `functions/index.js`:
```javascript
exports.api = functions
  .runWith({
    timeoutSeconds: 540,
    memory: '1GB'
  })
  .https.onRequest(app);
```

### Missing dependencies
```bash
cd functions
npm install express cors pdf-parse
cd ..
```

### Build errors
```bash
# Clear cache and rebuild
rm -rf node_modules build
npm install
npm run build
```

## Your URLs

After deployment:
- **Frontend**: `https://your-project.web.app`
- **API**: `https://us-central1-your-project.cloudfunctions.net/api`
- **API via hosting**: `https://your-project.web.app/api/*`

## Next Steps

1. Set up custom domain (optional)
2. Enable Firebase Analytics
3. Set up error monitoring
4. Configure CDN caching

For detailed instructions, see `FIREBASE_HOSTING_GUIDE.md`

