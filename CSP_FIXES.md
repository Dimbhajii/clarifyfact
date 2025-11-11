# CSP Fixes Applied

## Issue
Resources were being blocked because their origins were not listed in the Content Security Policy.

## Changes Made

### 1. Enhanced Script Sources (`script-src`)
Added missing domains for Firebase and Google services:
- `https://www.google-analytics.com` - Google Analytics scripts
- `https://*.gstatic.com` - Google static resources (broader coverage)
- Kept existing: `https://www.gstatic.com`, `https://www.googletagmanager.com`, `https://*.googleapis.com`

### 2. Enhanced Connect Sources (`connect-src`)
Added missing domains for Firebase Auth and Analytics:
- `https://*.google-analytics.com` - Analytics data collection (wildcard for subdomains)
- `https://*.googletagmanager.com` - Tag Manager connections (wildcard for subdomains)
- `https://oauth2.googleapis.com` - OAuth2 authentication
- `https://securetoken.googleapis.com` - Firebase Auth token refresh
- Kept existing: Firebase domains, Google APIs, etc.

### 3. Enhanced Image Sources (`img-src`)
Added Google domains for images:
- `https://*.googleapis.com` - Google API images
- `https://*.gstatic.com` - Google static images

### 4. Enhanced Frame Sources (`frame-src`)
Added Google domain for embedded content:
- `https://www.google.com` - Google sign-in iframes

### 5. Style Sources (`style-src`)
**Temporarily re-added `'unsafe-inline'`** for compatibility:
- Google Tag Manager and Analytics may inject inline styles
- This is a common requirement for these services
- Consider using nonces in the future for better security

## Domains Now Allowed

### Script Sources
- `'self'` - Your own domain
- `https://www.gstatic.com` - Google static resources
- `https://*.gstatic.com` - All Google static subdomains
- `https://www.googletagmanager.com` - Google Tag Manager
- `https://www.google-analytics.com` - Google Analytics
- `https://*.googleapis.com` - All Google APIs (Firebase, etc.)

### Connect Sources
- `'self'` - Your own domain
- `https://*.firebaseapp.com` - Firebase Hosting
- `https://*.googleapis.com` - Google APIs
- `https://*.cloudfunctions.net` - Firebase Functions
- `https://www.google-analytics.com` - Google Analytics
- `https://*.google-analytics.com` - Analytics subdomains
- `https://www.googletagmanager.com` - Google Tag Manager
- `https://*.googletagmanager.com` - Tag Manager subdomains
- `https://accounts.google.com` - Google Sign-In
- `https://oauth2.googleapis.com` - OAuth2
- `https://securetoken.googleapis.com` - Firebase Auth tokens
- `wss://*.firebaseio.com` - Firestore WebSocket
- `https://*.firebasestorage.app` - Firebase Storage

### Image Sources
- `'self'` - Your own domain
- `data:` - Data URIs
- `https:` - All HTTPS images
- `blob:` - Blob URLs
- `https://*.googleapis.com` - Google API images
- `https://*.gstatic.com` - Google static images

### Frame Sources
- `'self'` - Your own domain
- `https://*.firebaseapp.com` - Firebase Hosting
- `https://accounts.google.com` - Google Sign-In popup
- `https://www.google.com` - Google embedded content

## Testing

After deploying, test the following:

1. **Firebase Authentication**
   - Sign in with Google
   - Sign in with email/password
   - Verify no CSP violations in console

2. **Firebase Analytics**
   - Check browser console for Analytics errors
   - Verify events are being tracked
   - Check Firebase Console for events

3. **Google Tag Manager**
   - Verify GTM loads without errors
   - Check for inline script violations
   - Monitor CSP violation reports

4. **Firestore**
   - Verify database reads/writes work
   - Check WebSocket connection (wss://)
   - Monitor for connection errors

5. **Firebase Storage**
   - Verify file uploads work
   - Check for storage access errors

## Monitoring

Monitor CSP violations using:

```bash
# View CSP violations in Firebase Functions logs
firebase functions:log | Select-String -Pattern "CSP Violation"

# Or check browser console for CSP warnings
```

## Future Improvements

1. **Implement Strict CSP with Nonces**
   - Generate nonces server-side for each request
   - Inject nonces into script/style tags
   - Remove `'unsafe-inline'` from style-src

2. **Use Hashes for Static Inline Scripts**
   - Calculate SHA-256 hashes for any inline scripts
   - Add hashes to CSP instead of `'unsafe-inline'`

3. **Narrow Down Wildcards**
   - Replace `*.googleapis.com` with specific domains
   - Only allow necessary Firebase/Google services

4. **Enable Firestore Logging**
   - Uncomment Firestore logging in `functions/csp-report.js`
   - Store violations for long-term analysis

## Notes

- `'unsafe-inline'` in `style-src` is currently needed for Google Tag Manager/Analytics
- This is a common requirement and acceptable for these services
- Consider implementing nonces if you want to remove it in the future
- All external domains are from trusted Google/Firebase services

