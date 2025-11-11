# Content Security Policy (CSP) Security Guide

## Overview

This document explains the Content Security Policy (CSP) implementation for ClarifyFact and how to monitor and maintain it.

## Current CSP Policy

The current CSP policy has been hardened by removing `unsafe-inline` and `unsafe-eval` from `script-src` and `style-src` directives. This significantly improves security by preventing XSS attacks.

### Policy Breakdown

```
default-src 'self';
script-src 'self' https://www.gstatic.com https://www.googletagmanager.com https://*.googleapis.com;
style-src 'self' https://fonts.googleapis.com;
font-src 'self' data: https://fonts.gstatic.com;
img-src 'self' data: https: blob:;
connect-src 'self' https://*.firebaseapp.com https://*.googleapis.com https://*.cloudfunctions.net https://www.google-analytics.com https://www.googletagmanager.com https://accounts.google.com wss://*.firebaseio.com https://*.firebasestorage.app;
frame-src 'self' https://*.firebaseapp.com https://accounts.google.com;
object-src 'none';
base-uri 'self';
form-action 'self';
report-uri /api/csp-report;
```

### Security Improvements

1. **Removed `unsafe-inline` from `script-src`**
   - ✅ React builds all scripts to external files (`/static/js/main.*.js`)
   - ✅ No inline scripts in production builds
   - ⚠️ Google Tag Manager may inject scripts - monitor for violations

2. **Removed `unsafe-eval` from `script-src`**
   - ✅ React production builds don't use `eval()`
   - ✅ Firebase SDK v9+ uses modular imports (no eval needed)
   - ✅ No `Function()` constructors or similar

3. **Removed `unsafe-inline` from `style-src`**
   - ✅ All styles are external CSS files (`/static/css/main.*.css`)
   - ✅ React doesn't inject inline styles in production

4. **Minimal External Domains**
   - Only necessary domains are whitelisted
   - Firebase services: `*.firebaseapp.com`, `*.googleapis.com`, `*.firebasestorage.app`
   - Google Auth: `accounts.google.com`
   - Analytics: `www.google-analytics.com`, `www.googletagmanager.com`
   - Fonts: `fonts.googleapis.com`, `fonts.gstatic.com`

## CSP Violation Reporting

### Endpoint

CSP violations are automatically reported to: `/api/csp-report`

### Monitoring

1. **Console Logs**: All violations are logged to Firebase Functions console
2. **Firestore** (Optional): Uncomment code in `functions/csp-report.js` to store violations in Firestore

### Viewing Violations

```bash
# View recent CSP violations in Firebase Functions logs
firebase functions:log | Select-String -Pattern "CSP Violation"

# Or view in Firebase Console
# https://console.firebase.google.com/project/clarifyfact-afa06/functions/logs
```

### Violation Format

```json
{
  "documentURI": "https://clarifyfact-afa06.web.app/",
  "violatedDirective": "script-src",
  "blockedURI": "inline",
  "sourceFile": "https://clarifyfact-afa06.web.app/static/js/main.js",
  "lineNumber": 123,
  "columnNumber": 45,
  "originalPolicy": "...",
  "timestamp": "2024-11-11T10:00:00.000Z"
}
```

## Troubleshooting CSP Violations

### Common Issues

1. **Google Tag Manager Scripts Blocked**
   - **Symptom**: Analytics not working
   - **Solution**: Google Tag Manager may need `unsafe-inline` if it injects scripts
   - **Action**: Monitor violations and consider using nonces if needed

2. **Firebase SDK Issues**
   - **Symptom**: Firebase features not working
   - **Solution**: Verify all Firebase domains are in `connect-src`
   - **Action**: Check Firebase documentation for required domains

3. **External Resources Blocked**
   - **Symptom**: Images or fonts not loading
   - **Solution**: Add domain to appropriate directive (`img-src`, `font-src`, etc.)
   - **Action**: Review violation reports and update CSP

### Adding Nonces (If Needed)

If you need to allow specific inline scripts (e.g., for Google Tag Manager):

1. Generate a nonce on the server for each request
2. Add nonce to CSP: `script-src 'self' 'nonce-{nonce}' ...`
3. Add nonce to script tag: `<script nonce="{nonce}">...</script>`

Example implementation:
```javascript
// In server-side rendering or middleware
const nonce = crypto.randomBytes(16).toString('base64');
res.setHeader('Content-Security-Policy', `script-src 'self' 'nonce-${nonce}' ...`);
```

### Using Hashes (Alternative to Nonces)

For static inline scripts, you can use hashes:

1. Calculate SHA-256 hash of the script content
2. Add hash to CSP: `script-src 'self' 'sha256-{hash}' ...`

Example:
```bash
# Calculate hash of inline script
echo -n "console.log('Hello World');" | openssl dgst -sha256 -binary | openssl base64
# Add to CSP: script-src 'self' 'sha256-{result}' ...
```

## Testing CSP

### Browser DevTools

1. Open Chrome DevTools (F12)
2. Go to Console tab
3. Look for CSP violation warnings
4. Check Network tab for blocked requests

### CSP Evaluator

Use Google's CSP Evaluator to test your policy:
https://csp-evaluator.withgoogle.com/

### Testing Checklist

- [ ] No CSP violations in console
- [ ] All scripts load successfully
- [ ] All styles load successfully
- [ ] Firebase features work (Auth, Firestore, Analytics)
- [ ] External resources load (fonts, images)
- [ ] No inline script/style violations

## Maintaining CSP

### Regular Monitoring

1. **Weekly**: Check Firebase Functions logs for CSP violations
2. **Monthly**: Review and update CSP policy based on violations
3. **After Updates**: Test CSP after adding new features or dependencies

### Updating CSP

1. Identify violations from reports
2. Determine if domain/resource is necessary
3. Add to appropriate directive if needed
4. Test thoroughly before deploying
5. Monitor for new violations

### Best Practices

1. **Principle of Least Privilege**: Only allow what's necessary
2. **Regular Reviews**: Review CSP policy regularly
3. **Monitor Violations**: Set up alerts for violations
4. **Document Changes**: Document why domains are added
5. **Test Thoroughly**: Test after every CSP change

## External Domains Reference

### Required Domains

| Domain | Purpose | Directive |
|--------|---------|-----------|
| `*.firebaseapp.com` | Firebase Hosting | `connect-src`, `frame-src` |
| `*.googleapis.com` | Firebase/Google APIs | `script-src`, `connect-src` |
| `*.cloudfunctions.net` | Firebase Functions | `connect-src` |
| `*.firebasestorage.app` | Firebase Storage | `connect-src` |
| `*.firebaseio.com` | Firestore WebSocket | `connect-src` (wss://) |
| `accounts.google.com` | Google Sign-In | `connect-src`, `frame-src` |
| `www.google-analytics.com` | Google Analytics | `connect-src` |
| `www.googletagmanager.com` | Google Tag Manager | `script-src`, `connect-src` |
| `www.gstatic.com` | Google Static Resources | `script-src` |
| `fonts.googleapis.com` | Google Fonts API | `style-src`, `connect-src` |
| `fonts.gstatic.com` | Google Fonts CDN | `font-src` |

### Domains to Monitor

- `www.googletagmanager.com` - May inject inline scripts
- `www.google-analytics.com` - May require additional permissions

## Resources

- [MDN CSP Documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Google CSP Evaluator](https://csp-evaluator.withgoogle.com/)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [CSP Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)

## Support

If you encounter CSP violations:

1. Check violation reports in Firebase Functions logs
2. Review this guide for common issues
3. Test with CSP Evaluator
4. Update CSP policy if necessary
5. Monitor for new violations

