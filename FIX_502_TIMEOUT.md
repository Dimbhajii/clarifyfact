# Fixing 502 Timeout Error for Assignment Generation

## Problem

The assignment generation is failing with a 502 error because:
1. **Firebase Hosting rewrites have a 60-second timeout limit** (cannot be increased)
2. **The function can take 90+ seconds** (generation ~30s + 3-pass humanization ~60s)
3. When the hosting timeout is reached, it returns a 502 error even though the function is still running

## Solutions Implemented

### 1. Fast 2-Pass Humanization ✅
- Changed from 3-pass to 2-pass humanization
- Reduces processing time from ~90 seconds to ~50-60 seconds
- Still provides good humanization (structural changes + final polish)
- Should complete within the 60-second timeout

### 2. Enhanced Error Handling ✅
- Added detailed logging at each step
- Better error messages with processing time
- Graceful fallback if humanization fails

### 3. Optimized Function Configuration ✅
- Function timeout set to 540 seconds (9 minutes)
- Memory increased to 2GB
- Keep-alive headers to prevent premature termination

## Testing

After deployment, test the assignment generation:
1. Visit: https://clarifyfact-afa06.web.app
2. Go through the assignment flow
3. Check if it completes within 60 seconds
4. Monitor Firebase Functions logs for timing information

## If Still Timing Out

If you still get 502 errors, consider these alternatives:

### Option 1: Call Function Directly (Bypass Hosting Rewrite)
Instead of using the hosting rewrite, call the function directly:

```javascript
// In QuestionBox.js, change API_BASE_URL to:
const API_BASE_URL = 'https://us-central1-clarifyfact-afa06.cloudfunctions.net';

// This bypasses the 60-second hosting timeout
// The function itself has a 540-second timeout
```

### Option 2: Background Job Pattern
1. Start generation (returns immediately with job ID)
2. Poll for results every few seconds
3. Return result when ready

This requires:
- Storing job status in Firestore
- Creating a polling endpoint
- Updating frontend to poll for results

### Option 3: Reduce Humanization Further
- Use 1-pass humanization (fastest, less effective)
- Skip humanization entirely (fastest, but higher AI detection)
- Use a faster model (e.g., GPT-3.5-turbo instead of GPT-4o-mini)

### Option 4: Stream Responses
- Use Server-Sent Events (SSE) to stream progress
- Send chunks of the assignment as they're generated
- Keep connection alive with progress updates

## Current Status

✅ **Deployed**: Fast 2-pass humanization
✅ **Optimized**: Function configuration and error handling
⏳ **Testing**: Verify if 2-pass completes within 60 seconds

## Monitoring

Check function logs to see actual processing times:

```bash
firebase functions:log | Select-String -Pattern "generate-assignment|Total time"
```

Look for:
- `[generate-assignment] Total time: XXXms`
- Should be under 60000ms (60 seconds) to avoid timeout
- If over 60 seconds, consider Option 1 (direct function call)

## Next Steps

1. **Test the current implementation** - See if 2-pass completes in time
2. **If still timing out** - Implement Option 1 (direct function call)
3. **Monitor logs** - Check actual processing times
4. **Optimize further** - If needed, reduce humanization or use faster models

