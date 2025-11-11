# How to Copy DNS Records from Firebase Console

Step-by-step guide on how to find and copy DNS records when adding your custom domain to Firebase.

## Step-by-Step: Getting DNS Records from Firebase

### Step 1: Navigate to Firebase Hosting

1. **Open Firebase Console:**
   - Go to: https://console.firebase.google.com/project/clarifyfact-afa06/hosting/domains
   - Or: Firebase Console → Your Project → Hosting → Custom domains tab

2. **Click "Add custom domain"**
   - You'll see a button at the top right

### Step 2: Enter Your Domain

1. **Enter domain name:**
   - Type: `clarifyfact.com`
   - Click **"Continue"**

### Step 3: Firebase Shows DNS Records

After clicking Continue, Firebase will display a page with DNS records. You'll see one of these scenarios:

---

## Scenario A: A Records (Most Common for Root Domain)

Firebase will show something like this:

```
Add these DNS records to your domain registrar:

Type: A
Host: @
Value: 151.101.1.195

Type: A
Host: @
Value: 151.101.65.195

Type: A
Host: @
Value: 151.101.129.195

Type: A
Host: @
Value: 151.101.193.195
```

**How to Copy:**

1. **Option 1: Copy All at Once**
   - Look for a **"Copy"** button or icon next to the records
   - Click it to copy all records to clipboard
   - Paste into a text editor to save them

2. **Option 2: Copy Individually**
   - Click on each **IP address** (the Value field)
   - It will highlight/select the text
   - Press `Ctrl+C` (Windows) or `Cmd+C` (Mac) to copy
   - Paste into a text file

3. **Option 3: Screenshot**
   - Take a screenshot of the entire DNS records section
   - Reference it when configuring Namecheap

4. **Option 4: Write Down**
   - Manually write down each record:
     - Type: A
     - Host: @
     - Value: [each IP address]

---

## Scenario B: CNAME Record (For Subdomains)

For `www.clarifyfact.com`, Firebase will show:

```
Add this DNS record to your domain registrar:

Type: CNAME
Host: www
Value: clarifyfact-afa06.web.app
```

**How to Copy:**

1. **Copy the entire record:**
   - Click and drag to select all three lines (Type, Host, Value)
   - Press `Ctrl+C` to copy
   - Or click any **"Copy"** button if available

2. **Copy just the Value:**
   - Click on `clarifyfact-afa06.web.app`
   - Press `Ctrl+C` to copy
   - You'll need this for the "Value" field in Namecheap

---

## What You'll See in Firebase Console

The Firebase interface will look something like this:

```
┌─────────────────────────────────────────┐
│  Add custom domain: clarifyfact.com    │
├─────────────────────────────────────────┤
│                                         │
│  Add these DNS records:                 │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ Type: A                            │ │
│  │ Host: @                            │ │
│  │ Value: 151.101.1.195        [📋]  │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ Type: A                            │ │
│  │ Host: @                            │ │
│  │ Value: 151.101.65.195        [📋]  │ │
│  └───────────────────────────────────┘ │
│                                         │
│  [Copy all]  [Continue]                 │
└─────────────────────────────────────────┘
```

---

## Recommended Method: Copy All Records

1. **Look for a "Copy" button:**
   - Usually at the top or bottom of the DNS records section
   - May say "Copy all records" or have a clipboard icon 📋

2. **Click the Copy button:**
   - All records will be copied to your clipboard

3. **Paste into a text editor:**
   - Open Notepad, TextEdit, or any text editor
   - Press `Ctrl+V` to paste
   - Save the file for reference

4. **Example of what you'll paste:**
   ```
   Type: A
   Host: @
   Value: 151.101.1.195
   
   Type: A
   Host: @
   Value: 151.101.65.195
   ```

---

## After Copying: What to Do Next

1. **Keep the records handy:**
   - Keep the text file open
   - Or have the Firebase Console open in another tab
   - You'll need these exact values when configuring Namecheap

2. **Verify the records:**
   - Make sure you have:
     - The correct **Type** (A or CNAME)
     - The correct **Host** (@ for root, www for subdomain)
     - The exact **Value** (IP addresses or CNAME value)

3. **Don't close Firebase Console yet:**
   - Keep it open to reference the records
   - Firebase will show the status of domain verification

---

## Quick Tips

✅ **Copy the exact values** - Don't modify anything  
✅ **Copy all records** - You need to add ALL records Firebase provides  
✅ **Keep Firebase Console open** - You'll need to check verification status  
✅ **Double-check the values** - One typo can prevent verification  

---

## Example: What You'll Copy

### For Root Domain (clarifyfact.com):

```
Type: A
Host: @
Value: 151.101.1.195

Type: A
Host: @
Value: 151.101.65.195
```

### For WWW Subdomain (www.clarifyfact.com):

```
Type: CNAME
Host: www
Value: clarifyfact-afa06.web.app
```

---

## Troubleshooting

### "I don't see a Copy button"

**Solution:**
- Manually select the text and copy with `Ctrl+C`
- Or take a screenshot
- Or write down the values

### "The values look different"

**Solution:**
- Firebase may show different IP addresses - that's normal
- Always use the exact values Firebase shows for YOUR project
- Don't use values from examples or other projects

### "I closed the page, how do I see the records again?"

**Solution:**
- Go back to: Firebase Console → Hosting → Custom domains
- Click on your domain name
- You'll see the DNS records again
- Or check the status page which may show the records

---

## Next Step

After copying the DNS records, proceed to:
- **Step 2 in CUSTOM_DOMAIN_SETUP.md**: Configure DNS in Namecheap
- Use the exact values you copied from Firebase

---

**Remember:** The exact IP addresses and values will be unique to your Firebase project. Always use what Firebase shows you, not examples from guides!

