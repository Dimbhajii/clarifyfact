/**
 * Complete Firebase Functions implementation for ClarifyFact
 * 
 * This file contains all API endpoints as Firebase Cloud Functions
 * Replace functions/index.js with this file when deploying
 */

const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');

// Import services (copy these from backend/services/)
const { analyzeAssignment } = require('./services/assignmentAnalyzer');
const { factCheckOpinion } = require('./services/factChecker');
const { generateAssignment, humanizeText } = require('./services/openaiService');

const app = express();

// Enable CORS for all origins (restrict in production if needed)
app.use(cors({ origin: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Backend is running',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'ClarifyFact Backend API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      testOpenAI: '/api/test-openai',
      analyzeAssignment: '/api/analyze-assignment (POST)',
      factCheck: '/api/fact-check (POST)',
      generateAssignment: '/api/generate-assignment (POST)'
    }
  });
});

// Test OpenAI connection endpoint
app.get('/api/test-openai', async (req, res) => {
  try {
    const { OpenAI } = require('openai');
    const config = require('./config');
    
    const openai = new OpenAI({
      apiKey: config.openai.apiKey,
    });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: 'Say "OpenAI API is working!" in one sentence.',
        },
      ],
      max_tokens: 50,
    });

    res.json({
      success: true,
      message: 'OpenAI API is connected and working!',
      response: response.choices[0].message.content,
      mode: 'real',
    });
  } catch (error) {
    console.error('OpenAI test error:', error);
    res.status(500).json({
      success: false,
      error: 'OpenAI API connection failed',
      details: error.message,
    });
  }
});

// Analyze assignment and generate opinion options
app.post('/api/analyze-assignment', async (req, res) => {
  try {
    const { assignmentTopic, courseMaterials } = req.body;

    if (!assignmentTopic || !courseMaterials) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: assignmentTopic and courseMaterials'
      });
    }

    const result = await analyzeAssignment(assignmentTopic, courseMaterials);

    res.json({
      success: true,
      ...result,
      mode: 'real'
    });
  } catch (error) {
    console.error('Error analyzing assignment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze assignment',
      details: error.message
    });
  }
});

// Fact-check selected opinion
app.post('/api/fact-check', async (req, res) => {
  try {
    const { assignmentTopic, selectedOpinion, courseMaterials } = req.body;

    if (!assignmentTopic || !selectedOpinion || !courseMaterials) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: assignmentTopic, selectedOpinion, and courseMaterials'
      });
    }

    const result = await factCheckOpinion(assignmentTopic, selectedOpinion, courseMaterials);

    res.json({
      success: true,
      ...result,
      mode: 'real'
    });
  } catch (error) {
    console.error('Error fact-checking opinion:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fact-check opinion',
      details: error.message
    });
  }
});

// Generate final assignment
app.post('/api/generate-assignment', async (req, res) => {
  try {
    const { assignmentTopic, selectedOpinion, courseMaterials, verifiedSources } = req.body;

    if (!assignmentTopic || !selectedOpinion || !courseMaterials) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: assignmentTopic, selectedOpinion, and courseMaterials'
      });
    }

    console.log('Generating assignment...');
    // Generate assignment
    const assignment = await generateAssignment(
      assignmentTopic,
      selectedOpinion,
      courseMaterials,
      verifiedSources || []
    );

    console.log('Humanizing assignment...');
    // Humanize the assignment (3-pass system)
    const humanizedAssignment = await humanizeText(assignment);

    res.json({
      success: true,
      assignment: humanizedAssignment,
      humanized: true,
      mode: 'real'
    });
  } catch (error) {
    console.error('Error generating assignment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate assignment',
      details: error.message
    });
  }
});

// Export as Firebase Cloud Function
// This creates an HTTP endpoint at: https://REGION-PROJECT.cloudfunctions.net/api
exports.api = functions
  .region('us-central1') // Change to your preferred region (us-east1, europe-west1, etc.)
  .runWith({
    timeoutSeconds: 540, // 9 minutes (max for HTTP functions)
    memory: '1GB' // Increase memory for better performance with OpenAI API
  })
  .https.onRequest(app);

