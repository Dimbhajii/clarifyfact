# Testing Guide for Humanization System

This guide explains how to test the humanization system to ensure it effectively bypasses AI detectors.

## Prerequisites

1. **OpenAI API Key**: Make sure you have a valid OpenAI API key set in your `.env` file:
   ```
   OPENAI_API_KEY=your-api-key-here
   OPENAI_USE_MOCK=false
   ```

2. **Node.js**: Ensure Node.js is installed (v14 or higher)

3. **Dependencies**: Install dependencies if not already done:
   ```bash
   cd backend
   npm install
   ```

## Testing Methods

### Method 1: Direct Function Testing

Test the humanization function directly with sample text:

```bash
npm run test:humanization
```

Or test the full assignment generation workflow:

```bash
npm run test:humanization-full
```

**What it does:**
- Tests the humanization function with sample text
- Shows before/after comparison
- Saves output files to `./test-outputs/` directory
- Displays processing time and statistics

**Output:**
- Original text and humanized text
- Word count, sentence count, character count
- Files saved for easy copy-paste to AI detectors

### Method 2: API Endpoint Testing

Test the full API workflow (requires server to be running):

**Step 1:** Start the backend server:
```bash
npm start
# or for development with auto-reload:
npm run dev
```

**Step 2:** In another terminal, run the API test:
```bash
npm run test:api
```

**What it does:**
- Tests the `/api/generate-assignment` endpoint
- Generates a full assignment with humanization
- Saves the result to `./test-outputs/` directory
- Shows processing time and statistics

### Method 3: Manual API Testing with cURL

Test the API manually using cURL:

```bash
curl -X POST http://localhost:5000/api/generate-assignment \
  -H "Content-Type: application/json" \
  -d '{
    "assignmentTopic": "The impact of AI on education",
    "selectedOpinion": "AI can enhance learning but needs careful implementation",
    "courseMaterials": "AI technology has transformed various industries...",
    "verifiedSources": []
  }'
```

### Method 4: Frontend Testing

1. Start the backend server:
   ```bash
   cd backend
   npm start
   ```

2. Start the frontend (in another terminal):
   ```bash
   npm start
   ```

3. Use the web interface to generate an assignment
4. Copy the generated text and test it on AI detectors

## Testing with AI Detection Tools

After generating humanized text, test it on these AI detection tools:

### Free Tools:
1. **GPTZero**: https://www.gptzero.me/
   - Paste your text and check the AI probability score
   - Target: <20% AI probability

2. **ZeroGPT**: https://www.zerogpt.com/
   - Check the AI detection percentage
   - Target: <20% AI detected

3. **Copyleaks AI Detector**: https://copyleaks.com/ai-content-detector
   - Free tier available
   - Target: <20% AI probability

### Premium Tools (if available):
4. **Turnitin**: https://www.turnitin.com/
   - Industry standard for academic institutions
   - Target: <20% similarity/AI score

5. **Originality.ai**: https://originality.ai/
   - Comprehensive AI detection
   - Target: <20% AI score

6. **NaturalWrite**: https://www.naturalwrite.com/
   - AI content detection
   - Target: <20% AI probability

## Expected Results

### Target Scores:
- **Initial Generation**: <20% AI detection
- **After Pass 1 (Structural)**: <15% AI detection
- **After Pass 2 (Imperfections)**: <12% AI detection
- **After Pass 3 (Polish)**: <10% AI detection

### What to Look For:
✅ **Good Signs:**
- AI detection score below 20%
- Text sounds natural and human-like
- Contains natural imperfections (typos, inconsistencies)
- Varied sentence structure and length
- Personal voice and conversational elements

❌ **Warning Signs:**
- AI detection score above 30%
- Text sounds too perfect or formal
- Uniform sentence structure
- No natural imperfections
- Sounds like an AI assistant

## Troubleshooting

### Issue: "OPENAI_API_KEY is not set"
**Solution:** Create a `.env` file in the `backend` directory:
```
OPENAI_API_KEY=your-key-here
OPENAI_USE_MOCK=false
```

### Issue: "Server is not running"
**Solution:** Start the backend server:
```bash
cd backend
npm start
```

### Issue: "Mock mode is enabled"
**Solution:** Set `OPENAI_USE_MOCK=false` in your `.env` file

### Issue: High AI detection scores (>30%)
**Possible causes:**
1. The text might be too short (humanization works better with longer texts)
2. The content might be too generic
3. Try running the humanization multiple times (results vary)

**Solutions:**
- Use longer sample texts (800+ words)
- Add more examples to `assignmentExamples.js`
- Adjust temperature and penalty parameters in `openaiService.js`

### Issue: Processing takes too long
**Note:** The multi-pass humanization takes longer because it makes 3 API calls:
- Pass 1: Structural changes (~10-20 seconds)
- Pass 2: Imperfections (~10-20 seconds)
- Pass 3: Polish (~10-20 seconds)
- Total: ~30-60 seconds for full humanization

This is expected and necessary for maximum effectiveness.

## Performance Benchmarks

Typical processing times:
- **Single pass humanization**: ~10-15 seconds
- **Multi-pass humanization (3 passes)**: ~30-60 seconds
- **Full assignment generation + humanization**: ~60-90 seconds

## Tips for Best Results

1. **Use longer texts**: Humanization works better with 500+ words
2. **Test multiple times**: Results can vary, test 2-3 times and pick the best
3. **Check multiple detectors**: Different tools may give different scores
4. **Review the output**: Make sure the content still makes sense
5. **Adjust if needed**: Fine-tune parameters based on your specific needs

## File Locations

- Test outputs: `backend/test-outputs/`
- Test scripts: `backend/test-humanization.js`, `backend/test-api.js`
- Main service: `backend/services/openaiService.js`
- Server: `backend/server.js`

## Next Steps

1. Run the tests to verify everything works
2. Test with your own sample texts
3. Check AI detection scores on multiple tools
4. Adjust parameters if needed based on results
5. Monitor the console logs for any errors

Happy testing! 🚀

