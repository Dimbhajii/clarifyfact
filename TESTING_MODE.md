# Testing Mode - Mock Backend

## ✅ Fixed: "Failed to get next question" Error

The error occurred because the Firebase Cloud Function `nextQuestion` doesn't exist yet.

### Solution: Mock Mode

I've added a **mock mode** for testing without a backend!

## How It Works

### Mock Mode (Current - FOR TESTING)

```javascript
const USE_MOCK = true; // In QuestionBox.js line 124
```

**What happens:**
- Question 1 → Question 2 (Google Drive Upload)
- Question 2 → Question 3 (Topics/Concepts)
- Question 3 → Question 4 (Deadline)
- Question 4 → "Thank you!" message

**No backend required!** Perfect for testing the UI and flow.

### Real Mode (When Backend is Ready)

```javascript
const USE_MOCK = false; // Change to false in QuestionBox.js line 124
```

**What happens:**
- Calls the actual Firebase Cloud Function
- Gets real AI-generated questions
- Requires backend deployment

## Testing Flow Now

```bash
npm start
```

### Test Sequence:

1. **Question 1:** "What is your main goal with this assignment?"
   - Type your answer (up to 500 words)
   - Click "Submit"
   - ⏳ Brief loading (simulated)
   - ✅ Moves to Question 2

2. **Question 2:** "Upload Your Educational Slides / Class Files (PDF)"
   - Click to upload PDF files
   - Files upload to Google Drive (simulated)
   - Click "Submit"
   - ⏳ Brief loading
   - ✅ Moves to Question 3

3. **Question 3:** "What topics or concepts are you finding most challenging?"
   - Type your answer
   - Click "Submit"
   - ✅ Moves to Question 4

4. **Question 4:** "What is your deadline for this assignment?"
   - Type your answer
   - Click "Submit"
   - 🎉 "Thank you!" alert

## When to Switch Modes

### Use Mock Mode (`USE_MOCK = true`) When:
- ✅ Testing the UI
- ✅ Developing frontend features
- ✅ Demonstrating the flow
- ✅ Before backend is deployed
- ✅ **RIGHT NOW** - for testing!

### Use Real Mode (`USE_MOCK = false`) When:
- ⏳ Backend Firebase function is deployed
- ⏳ You want AI-generated questions
- ⏳ Ready for production
- ⏳ Google Drive upload backend is ready

## Where to Change It

File: `src/unAuth/components/QuestionBox.js`

```javascript
// Line 124
const USE_MOCK = true; // Change to false when backend is ready
```

## Current Mock Questions

1. "What is your main goal with this assignment?" (default)
2. "Upload Your Educational Slides / Class Files (PDF)"
3. "What topics or concepts are you finding most challenging?"
4. "What is your deadline for this assignment?"

You can customize these in `QuestionBox.js` lines 133-137:

```javascript
const mockQuestions = {
  1: "Upload Your Educational Slides / Class Files (PDF)",
  2: "What topics or concepts are you finding most challenging?",
  3: "What is your deadline for this assignment?",
  // Add more questions here!
};
```

## Troubleshooting

### Still seeing "Failed to get next question"?
- Make sure you saved the file
- Restart the dev server: `npm start`
- Clear browser cache
- Check console for errors

### Want more questions?
Add them to the `mockQuestions` object:
```javascript
const mockQuestions = {
  1: "Upload Your Educational Slides / Class Files (PDF)",
  2: "Question 2 text here",
  3: "Question 3 text here",
  4: "Question 4 text here",
  5: "Question 5 text here", // Add more!
};
```

And update the completion check:
```javascript
isComplete: questionNumber >= 5 // Change from 3 to 5
```

## Production Checklist

When you're ready to deploy with real backend:

- [ ] Deploy Firebase Cloud Function
- [ ] Deploy Google Drive upload backend
- [ ] Change `USE_MOCK = false` in QuestionBox.js
- [ ] Test all questions work
- [ ] Test Google Drive uploads work
- [ ] Deploy frontend

---

**For now, mock mode is enabled and everything should work! 🎉**

Test it: `npm start` → Answer questions → See the flow!

