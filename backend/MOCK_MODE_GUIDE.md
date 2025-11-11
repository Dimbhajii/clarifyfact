# Mock Mode Guide for OpenAI Testing

## 🎭 What is Mock Mode?

Mock Mode allows you to test your application **without making actual OpenAI API calls**. This means:
- ✅ No API costs
- ✅ No quota issues
- ✅ Fast testing
- ✅ Works even without API credits

## 🚀 How to Enable Mock Mode

### Option 1: Via Environment Variable (Recommended)

Edit `backend/.env` and set:
```env
OPENAI_USE_MOCK=true
```

Or add it if it doesn't exist:
```env
# Mock Mode
OPENAI_USE_MOCK=true
```

### Option 2: Set it to '1'
```env
OPENAI_USE_MOCK=1
```

## 🔄 How to Switch Back to Real API

Edit `backend/.env` and set:
```env
OPENAI_USE_MOCK=false
```

Or simply remove the line.

## 📋 What Gets Mocked?

All OpenAI functions are mocked:

1. **explainTopic()** - Returns a simulated explanation
2. **generateAssignment()** - Returns a sample assignment
3. **checkGrammar()** - Returns mock grammar check results
4. **formatCitations()** - Simulates citation formatting
5. **checkRubricCompliance()** - Returns mock compliance report
6. **humanizeText()** - Simulates text humanization

## 🧪 Testing Mock Mode

1. **Enable mock mode** in `.env`:
   ```env
   OPENAI_USE_MOCK=true
   ```

2. **Start the backend**:
   ```bash
   cd backend
   npm start
   ```

3. **Look for this message**:
   ```
   ⚠️  MOCK MODE ENABLED: Using simulated OpenAI responses
      Set OPENAI_USE_MOCK=false in .env to use real API
   ```

4. **Test the endpoint**:
   ```
   http://localhost:5000/api/test-openai
   ```

5. **Expected response**:
   ```json
   {
     "success": true,
     "message": "OpenAI API is connected and working! (MOCK MODE)",
     "response": "OpenAI API is working!",
     "mode": "mock"
   }
   ```

## 📝 Mock Response Examples

### Topic Explanation
When you call `explainTopic("Climate Change", "Course materials...")`:
- Returns a simulated explanation
- Includes the topic name
- Mimics real response structure
- Takes ~500ms-1.5s (simulated delay)

### Assignment Generation
When you call `generateAssignment(...)`:
- Returns a complete assignment sample
- Includes introduction, discussion, conclusion
- Incorporates student's opinion
- Includes placeholder citations

### Grammar Check
Returns:
```json
{
  "score": 95,
  "errors": [],
  "correctedText": "...",
  "suggestions": [...]
}
```

## 🎯 When to Use Mock Mode

✅ **Use Mock Mode When:**
- Testing frontend UI/UX
- Developing without API credits
- Learning the system flow
- Avoiding API costs during development
- API quota is exhausted

❌ **Don't Use Mock Mode When:**
- Testing actual AI responses
- Production deployment
- Need real assignment generation
- Validating AI quality

## 🔧 Implementation Details

Mock responses are in: `backend/services/openaiServiceMock.js`

The system automatically switches between real and mock based on the `OPENAI_USE_MOCK` environment variable.

## 🚨 Important Notes

1. **Mock responses are simplified** - They won't have the same quality as real AI
2. **Delays are simulated** - Takes ~500ms-1.5s like real API
3. **No actual processing** - Just returns pre-written responses
4. **Test thoroughly** - Switch to real API before production

## 📞 Switching Between Modes

**To switch modes:**
1. Stop the backend server
2. Edit `backend/.env`
3. Change `OPENAI_USE_MOCK=true` to `OPENAI_USE_MOCK=false` (or vice versa)
4. Restart the server

The change takes effect immediately on restart.

---

**Current Status:** Mock mode is **ENABLED** in your `.env` file. You can now test without API costs! 🎉

