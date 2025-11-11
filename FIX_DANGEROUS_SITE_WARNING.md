# Fix "Dangerous Site" Warning

If your Firebase-hosted site shows a "dangerous site" warning, follow these steps:

## Step 1: Check Google Safe Browsing Status

1. Visit: https://transparencyreport.google.com/safe-browsing/search
2. Enter your site URL: `https://clarifyfact-afa06.web.app`
3. Check if it's flagged

## Step 2: Request Review (if flagged)

If your site is flagged:

1. Go to: https://search.google.com/search-console
2. Add your property: `https://clarifyfact-afa06.web.app`
3. Verify ownership (Firebase automatically verifies)
4. Request a security review

## Step 3: Verify Security Headers

I've already added security headers to your `firebase.json`. Verify they're working:

```bash
# Check headers
curl -I https://clarifyfact-afa06.web.app
```

You should see:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- `Content-Security-Policy: ...`

## Step 4: Common Causes

### 1. New Site (Most Common)
- **Issue**: New sites often get flagged until they build reputation
- **Solution**: Wait 24-48 hours, the warning usually clears automatically

### 2. Mixed Content
- **Issue**: Loading HTTP resources on HTTPS page
- **Solution**: Ensure all resources use HTTPS
- **Check**: Browser console for mixed content warnings

### 3. Malware/Phishing Flag
- **Issue**: Site was incorrectly flagged
- **Solution**: Request review via Google Search Console

### 4. Suspicious Activity
- **Issue**: Site behavior triggers security checks
- **Solution**: Review your code for suspicious patterns

## Step 5: Temporary Workaround

If you need immediate access:

1. **Chrome**: Click "Advanced" → "Proceed to site (unsafe)"
2. **Firefox**: Click "Advanced" → "Accept the Risk and Continue"
3. **Safari**: Click "Show Details" → "visit this website"

**Note**: This is only for testing. The warning should be properly resolved.

## Step 6: Verify SSL Certificate

Firebase provides SSL automatically, but verify:

```bash
# Check SSL
openssl s_client -connect clarifyfact-afa06.web.app:443 -servername clarifyfact-afa06.web.app
```

## Step 7: Check Browser Console

1. Open your site
2. Press F12 (Developer Tools)
3. Check Console tab for errors
4. Check Network tab for blocked resources

## Step 8: Submit to Google Search Console

1. Go to: https://search.google.com/search-console
2. Add property: `https://clarifyfact-afa06.web.app`
3. Verify ownership (Firebase auto-verifies)
4. Submit sitemap (optional)
5. Request indexing

## Step 9: Wait for Propagation

- Security headers: 5-15 minutes
- Google Safe Browsing: 24-48 hours
- Search Console: 1-7 days

## Step 10: Test Your Site

After waiting, test with:

1. **Google Safe Browsing**: https://transparencyreport.google.com/safe-browsing/search
2. **SSL Labs**: https://www.ssllabs.com/ssltest/
3. **Security Headers**: https://securityheaders.com/

## Current Security Headers (Already Deployed)

Your site now has:
- ✅ X-Content-Type-Options: nosniff
- ✅ X-Frame-Options: DENY
- ✅ X-XSS-Protection: 1; mode=block
- ✅ Referrer-Policy: strict-origin-when-cross-origin
- ✅ Strict-Transport-Security (HSTS)
- ✅ Content-Security-Policy
- ✅ Permissions-Policy

## If Warning Persists

1. **Check Firebase Console**: Look for any security alerts
2. **Review Code**: Ensure no malicious code
3. **Contact Support**: 
   - Firebase Support: https://firebase.google.com/support
   - Google Safe Browsing: https://safebrowsing.google.com/safebrowsing/report_error/

## Quick Checklist

- [ ] Site is accessible via HTTPS
- [ ] No mixed content warnings
- [ ] Security headers are deployed
- [ ] Site submitted to Google Search Console
- [ ] Waited 24-48 hours for propagation
- [ ] Checked Google Safe Browsing status
- [ ] No suspicious code or redirects

## Most Likely Cause

For a new Firebase site, the warning is usually because:
1. **New site** - Needs time to build reputation (24-48 hours)
2. **No Search Console verification** - Submit your site
3. **Browser cache** - Clear cache and try again

The security headers I added should help, but the warning may take time to clear.

