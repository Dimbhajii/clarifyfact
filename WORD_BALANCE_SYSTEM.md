# Word Balance System Implementation

## Overview
Implemented a comprehensive word balance system that requires user authentication and tracks word usage for assignment generation.

## Features

### 1. User Authentication Requirement
- ✅ Users must sign up or sign in to use the service
- ✅ Authentication required at every step (Question 1, Question 2, Assignment Generation)
- ✅ Auth modal prompts users to sign in when needed
- ✅ Clear messaging about authentication requirements

### 2. Word Balance Management
- ✅ New users receive 1,500 words upon signup
- ✅ Balance stored in Firestore user profile
- ✅ Balance displayed in NavBar near user email
- ✅ Balance updates in real-time after word deduction
- ✅ Balance persists across sessions

### 3. Word Usage Tracking
- ✅ Balance checked before assignment generation
- ✅ Estimated word count: 1,200 words per assignment
- ✅ Actual word count calculated from generated assignment
- ✅ Words deducted from balance after successful generation
- ✅ Insufficient balance prevents assignment generation

### 4. Balance Purchase System
- ✅ Starter Plan: 10,000 words
- ✅ Pro Plan: 50,000 words
- ✅ Purchase functionality in Pricing page
- ✅ Balance automatically added after purchase
- ✅ Success/error messaging for purchases

### 5. User Interface
- ✅ Word balance displayed in NavBar (near email)
- ✅ Balance warning when below 1,200 words
- ✅ Link to purchase more words when balance is low
- ✅ Clear error messages for insufficient balance
- ✅ Authentication prompts throughout the workflow

## Implementation Details

### Database Structure

#### Users Collection (`users`)
```
users/
  {userId}/
    - userId: string
    - email: string
    - displayName: string
    - wordBalance: number (default: 1500)
    - createdAt: timestamp
    - updatedAt: timestamp
```

### Database Functions

1. **`saveUserProfile(userId, profileData)`**
   - Creates new user profile with 1,500 words
   - Updates existing profile (preserves wordBalance if not provided)
   - Called on signup/signin

2. **`getUserProfile(userId)`**
   - Retrieves user profile
   - Creates profile with 1,500 words if doesn't exist
   - Returns wordBalance (defaults to 1,500)

3. **`checkWordBalance(userId, requiredWords)`**
   - Checks if user has sufficient balance
   - Returns: `hasSufficientBalance`, `currentBalance`, `requiredWords`, `remainingBalance`

4. **`deductWordBalance(userId, wordCount)`**
   - Deducts words from user balance
   - Prevents negative balance (uses Math.max(0, balance - words))
   - Returns updated balance

5. **`addWordBalance(userId, wordCount)`**
   - Adds words to user balance (for purchases)
   - Creates profile if doesn't exist
   - Returns updated balance

### Frontend Components

#### AuthContext (`src/contexts/AuthContext.js`)
- Loads user profile on authentication
- Provides `userProfile` and `refreshUserProfile` to components
- Automatically refreshes profile after balance updates

#### NavBar (`src/unAuth/components/NavBar.js`)
- Displays word balance near user email
- Shows balance in green with formatting (e.g., "1,500 words")
- Responsive design for mobile devices

#### QuestionBox (`src/unAuth/components/QuestionBox.js`)
- Requires authentication at every step
- Checks balance before assignment generation
- Shows balance information to user
- Deducts words after successful generation
- Shows error messages for insufficient balance
- Links to pricing page when balance is low

#### Pricing (`src/unAuth/components/Pricing.js`)
- Handles plan purchases
- Adds words to user balance
- Shows success/error messages
- Redirects to home after successful purchase

### Security

#### Firestore Rules
- Users can only read/write their own profile
- Users can only update their own wordBalance
- All other access is denied
- Rules already in place in `firestore.rules`

## User Flow

### New User Signup
1. User signs up with email/password or Google
2. User profile created with 1,500 words
3. User can immediately start using the service

### Assignment Generation
1. User enters assignment topic (requires auth)
2. User uploads PDF files (requires auth)
3. User selects opinion/approach
4. System checks balance (requires 1,200 words)
5. If sufficient balance:
   - Assignment is generated
   - Words are counted from generated assignment
   - Words are deducted from balance
   - Balance is updated in real-time
6. If insufficient balance:
   - Error message shown
   - Link to purchase more words provided

### Balance Purchase
1. User navigates to Pricing page
2. User selects Starter (10,000 words) or Pro (50,000 words)
3. Purchase is processed (currently simulated)
4. Words are added to user balance
5. Balance is updated in real-time
6. User is redirected to home page

## Word Counting

### Estimation
- Before generation: 1,200 words estimated
- Used for balance check to prevent insufficient balance errors

### Actual Count
- After generation: Actual word count from generated assignment
- Calculated using: `text.split(/\s+/).filter(Boolean).length`
- Deducted from balance after successful generation

## Error Handling

### Insufficient Balance
- Error message: "You have X words, but need Y words"
- Link to pricing page: "Purchase more words →"
- Prevents assignment generation

### Authentication Errors
- Prompts user to sign in
- Shows auth modal
- Clear messaging about authentication requirements

### Balance Check Errors
- Logs error to console
- Shows error message to user
- Allows user to try again

## Testing

### Test Cases
1. ✅ New user signup gets 1,500 words
2. ✅ Balance displayed in NavBar
3. ✅ Balance check before generation
4. ✅ Words deducted after generation
5. ✅ Insufficient balance prevents generation
6. ✅ Purchase adds words to balance
7. ✅ Authentication required at all steps
8. ✅ Balance updates in real-time

## Deployment

### Firestore Rules
- Rules already allow users to update their own profile
- No changes needed to `firestore.rules`

### Database Indexes
- No additional indexes needed
- User profile queries are by userId (document ID)

## Future Enhancements

### Payment Integration
- Integrate Stripe/PayPal for actual payments
- Process payments before adding words
- Handle payment failures gracefully

### Word History
- Track word usage history
- Show usage statistics
- Display word consumption over time

### Subscription Management
- Monthly word limits for plans
- Auto-renewal for subscriptions
- Usage alerts when approaching limits

## Status

✅ **Implemented and Ready for Deployment**

All features are implemented and tested. The system is ready for deployment to Firebase.

## Next Steps

1. Deploy to Firebase
2. Test with real user accounts
3. Integrate payment processing (Stripe/PayPal)
4. Add word usage history
5. Implement subscription management

