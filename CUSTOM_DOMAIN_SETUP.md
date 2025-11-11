# Custom Domain Setup: clarifyfact.com → Firebase Hosting

Complete guide to connect your Namecheap domain `clarifyfact.com` to Firebase Hosting.

## Quick Start

**Your Domain:** `clarifyfact.com`  
**Firebase Project:** `clarifyfact-afa06`  
**Current Firebase URL:** `https://clarifyfact-afa06.web.app`

## Step 1: Add Domain in Firebase Console (5 minutes)

1. **Open Firebase Console:**
   - Direct link: https://console.firebase.google.com/project/clarifyfact-afa06/hosting/domains
   - Or navigate: Firebase Console → Hosting → Custom domains

2. **Add Custom Domain:**
   - Click **"Add custom domain"** button
   - Enter: `clarifyfact.com`
   - Click **"Continue"**

3. **Get DNS Records:**
   Firebase will show you DNS records. You'll see one of these:

   **Option A: A Records (for root domain)**
   ```
   Type: A
   Host: @
   Value: [IP address 1]
   
   Type: A
   Host: @
   Value: [IP address 2]
   ```
   (Usually 2-4 A records with different IP addresses)

   **Option B: CNAME Record**
   ```
   Type: CNAME
   Host: @
   Value: clarifyfact-afa06.web.app
   ```

4. **Copy the DNS records** - you'll need them in Step 2

5. **Add WWW Subdomain (Recommended):**
   - Click **"Add another domain"**
   - Enter: `www.clarifyfact.com`
   - Firebase will provide a CNAME record:
     ```
     Type: CNAME
     Host: www
     Value: clarifyfact-afa06.web.app
     ```

## Step 2: Configure DNS in Namecheap (10 minutes)

1. **Log in to Namecheap:**
   - Go to: https://www.namecheap.com/
   - Sign in to your account

2. **Access Domain Settings:**
   - Click **"Domain List"** from the left menu
   - Find `clarifyfact.com` and click **"Manage"**

3. **Go to Advanced DNS:**
   - Click on the **"Advanced DNS"** tab
   - Scroll down to **"Host Records"** section

4. **Remove Existing Records (if any):**
   - Delete any existing A records for `@`
   - Delete any existing CNAME records for `@` or `www`
   - Delete any "Parking" or default page records

5. **Add Root Domain Records:**

   **If Firebase gave you A records:**
   - Click **"Add New Record"**
   - Select **Type: A Record**
   - **Host:** `@` (or leave blank)
   - **Value:** (paste first IP address from Firebase)
   - **TTL:** Automatic (or 30 min)
   - Click **✓** to save
   - **Repeat** for each A record Firebase provided (usually 2-4 records)

   **If Firebase gave you CNAME for root:**
   - Click **"Add New Record"**
   - Select **Type: CNAME Record**
   - **Host:** `@`
   - **Value:** `clarifyfact-afa06.web.app`
   - **TTL:** Automatic
   - Click **✓** to save

6. **Add WWW Subdomain:**
   - Click **"Add New Record"**
   - Select **Type: CNAME Record**
   - **Host:** `www`
   - **Value:** `clarifyfact-afa06.web.app`
   - **TTL:** Automatic
   - Click **✓** to save

7. **Verify Your Records:**
   Your Host Records should look like this:

   ```
   Type    Host    Value                          TTL
   A       @       [IP from Firebase]            Automatic
   A       @       [IP from Firebase]            Automatic
   CNAME   www     clarifyfact-afa06.web.app    Automatic
   ```

   (The exact records depend on what Firebase provides)

8. **Save Changes:**
   - Changes save automatically in Namecheap
   - Wait 5-10 minutes for DNS to start propagating

## Step 3: Verify Domain in Firebase (Wait 15 min - 2 hours)

1. **Check Status in Firebase:**
   - Go back to: https://console.firebase.google.com/project/clarifyfact-afa06/hosting/domains
   - You should see:
     - `clarifyfact.com` - Status: **"Pending"** or **"Verifying"**
     - `www.clarifyfact.com` - Status: **"Pending"** or **"Verifying"**

2. **Wait for DNS Propagation:**
   - DNS changes can take **15 minutes to 48 hours**
   - Usually takes **1-2 hours** for most users
   - Firebase will automatically verify once DNS propagates

3. **Check DNS Propagation:**
   - Use: https://www.whatsmydns.net/
   - Enter: `clarifyfact.com`
   - Check A or CNAME records
   - Wait until you see Firebase IP addresses or CNAME values

4. **SSL Certificate:**
   - Firebase automatically provisions SSL certificates
   - Happens automatically after domain verification
   - Usually takes **15-30 minutes** after DNS verification
   - You'll see a green checkmark when SSL is ready

## Step 4: Test Your Domain

1. **Test Root Domain:**
   - Visit: `https://clarifyfact.com`
   - You should see your ClarifyFact website
   - Check for green lock icon (HTTPS working)

2. **Test WWW Subdomain:**
   - Visit: `https://www.clarifyfact.com`
   - Should also show your website
   - Both should work!

3. **Verify Features:**
   - Test Google Sign-in
   - Test all pages load correctly
   - Check that API endpoints work

## Step 5: Update Firebase Auth (Important!)

After your domain is verified, update authorized domains:

1. **Go to Firebase Authentication:**
   - Direct link: https://console.firebase.google.com/project/clarifyfact-afa06/authentication/settings/authorized-domains

2. **Verify Domains:**
   - `clarifyfact.com` should be automatically added
   - `www.clarifyfact.com` should be automatically added
   - If not, click **"Add domain"** and add both

3. **This is critical for Google Sign-in to work on your custom domain!**

## Troubleshooting

### Issue: "Domain verification failed"

**Solution:**
- Double-check DNS records in Namecheap match exactly what Firebase provided
- Make sure you removed conflicting records
- Wait longer (can take up to 48 hours)
- Use whatsmydns.net to verify DNS has propagated

### Issue: "SSL certificate provisioning failed"

**Solution:**
- Wait for DNS to fully propagate first
- Make sure domain verification is complete
- Try removing and re-adding the domain in Firebase
- Contact Firebase support if it persists after 48 hours

### Issue: "Site shows Namecheap parking page"

**Solution:**
- Remove any "Parking" settings in Namecheap
- Make sure DNS records point to Firebase, not Namecheap
- Clear browser cache and try again

### Issue: "Only www works, root doesn't" (or vice versa)

**Solution:**
- Make sure you added both:
  - A records or CNAME for `@` (root domain)
  - CNAME for `www` (subdomain)
- Verify both are in Namecheap DNS settings

### Issue: "Google Sign-in doesn't work on custom domain"

**Solution:**
- Go to Firebase Console → Authentication → Settings → Authorized domains
- Make sure `clarifyfact.com` and `www.clarifyfact.com` are listed
- If not, add them manually
- Wait a few minutes and try again

## Quick Reference

### Firebase Console Links:
- **Hosting Dashboard:** https://console.firebase.google.com/project/clarifyfact-afa06/hosting
- **Custom Domains:** https://console.firebase.google.com/project/clarifyfact-afa06/hosting/domains
- **Auth Authorized Domains:** https://console.firebase.google.com/project/clarifyfact-afa06/authentication/settings/authorized-domains

### Namecheap Links:
- **Domain List:** https://www.namecheap.com/myaccount/login.aspx?ReturnUrl=%2fdomains%2flist%2f
- **Namecheap Support:** https://www.namecheap.com/support/

### DNS Check Tools:
- **whatsmydns.net:** https://www.whatsmydns.net/
- **dnschecker.org:** https://dnschecker.org/

## Expected Timeline

- **DNS Configuration:** 10 minutes
- **DNS Propagation:** 15 minutes to 2 hours (usually 1 hour)
- **Domain Verification:** Automatic after DNS propagation
- **SSL Certificate:** 15-30 minutes after verification
- **Total Time:** 1-3 hours (mostly waiting)

## After Setup Checklist

- [ ] `https://clarifyfact.com` loads your website
- [ ] `https://www.clarifyfact.com` loads your website
- [ ] SSL certificate is active (green lock icon)
- [ ] Google Sign-in works on custom domain
- [ ] All pages and features work correctly
- [ ] Firebase URL (`clarifyfact-afa06.web.app`) still works (redirects)

## Important Notes

1. **Both domains work:** After setup, both `clarifyfact.com` and `www.clarifyfact.com` will work
2. **Firebase URL still works:** Your original Firebase URL will redirect to your custom domain
3. **SSL is automatic:** Firebase provides free SSL certificates automatically
4. **No downtime:** Your site remains accessible on the Firebase URL during setup
5. **Update authorized domains:** Don't forget to add your custom domain to Firebase Auth authorized domains!

## Need Help?

If you encounter issues:

1. Check Firebase Console for error messages
2. Verify DNS using whatsmydns.net
3. Compare Namecheap DNS records with Firebase requirements
4. Wait for DNS propagation (up to 48 hours)
5. Contact Firebase Support if verification fails after 48 hours

---

**Your site will be live at:** `https://clarifyfact.com` 🚀

