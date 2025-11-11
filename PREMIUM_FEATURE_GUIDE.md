# Premium Feature Guide

## Overview

The Premium Feature has been added to the navbar, allowing users to access premium content processing based on their subscription tier.

## Subscription Tiers

### Free Users
- **No access** to premium feature
- Clicking the Premium button shows upgrade options with Starter and Pro plans

### Starter Plan ($2.45/month)
- **Word Limit:** 5,000 words/month
- Access to premium feature
- Personalized Results
- Basic AI humanization
- Standard support

### Pro Plan ($9.99/month)
- **Word Limit:** 10,000 words/month
- Access to premium feature
- Advanced AI humanization
- All AI detectors bypass
- Priority support
- Unlimited file uploads

## Testing Different Subscription Tiers

To test the premium feature with different subscription levels, open the browser console and run:

### Set as Starter user:
```javascript
localStorage.setItem('userSubscription', 'starter');
window.location.reload();
```

### Set as Pro user:
```javascript
localStorage.setItem('userSubscription', 'pro');
window.location.reload();
```

### Set as Free user:
```javascript
localStorage.setItem('userSubscription', 'free');
window.location.reload();
```

## Features

1. **Word Limit Tracking**: The feature tracks word usage throughout the month
2. **Progress Bar**: Visual representation of word usage vs. limit
3. **Real-time Counting**: Word count updates as you type
4. **Auto-limit**: Text is automatically limited when reaching the word limit
5. **Upgrade Prompts**: Starter users see upgrade prompts to Pro plan

## Usage

1. Click the "⭐ Premium" button in the navbar
2. If you have a subscription, the feature opens
3. Type your content in the text area
4. Word count updates in real-time
5. When you reach your limit, additional text is automatically prevented

## Integration

Replace `localStorage.getItem('userSubscription')` with your actual authentication/subscription system:

```javascript
// In NavBar.js, replace:
const subscription = localStorage.getItem('userSubscription') || 'free';

// With your actual user subscription check:
const subscription = user?.subscription || 'free';
```

