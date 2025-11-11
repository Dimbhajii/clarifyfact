// Simple Express server for local testing
// Run: node server.js

const express = require('express');
const cors = require('cors');
const config = require('./config');
const uploadToDrive = require('./upload-to-drive');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS for frontend
// Allow multiple origins for development
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5000',
  'http://localhost:5001',
  config.cors.origin
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow if origin is in allowed list or is localhost on any port
    if (allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Upload endpoint
app.post('/api/upload-to-drive', uploadToDrive);

// Import new services
const { analyzeAssignment } = require('./services/assignmentAnalyzer');
const { factCheckOpinion } = require('./services/factChecker');
const { generateAssignment, humanizeText } = require('./services/openaiService');
const getOpenAIService = require('./utils/getOpenAIService');

// Test OpenAI connection endpoint
app.get('/api/test-openai', async (req, res) => {
  try {
    if (config.openai.useMock) {
      // Mock mode - simulate API response
      await new Promise(resolve => setTimeout(resolve, 500));
      res.json({
        success: true,
        message: 'OpenAI API is connected and working! (MOCK MODE)',
        response: 'OpenAI API is working!',
        mode: 'mock',
      });
    } else {
      // Real API mode
      const { OpenAI } = require('openai');
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
    }
  } catch (error) {
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
    if (config.openai.useMock) {
      // Mock mode
      await new Promise(resolve => setTimeout(resolve, 1000));
      res.json({
        success: true,
        summary: 'This is a mock summary of the assignment. It covers the main topic and key concepts from the course materials.',
        opinionOptions: [
          {
            id: 1,
            title: 'Supportive Viewpoint',
            description: 'This option supports the main arguments presented in the course materials.'
          },
          {
            id: 2,
            title: 'Critical Analysis',
            description: 'This option provides a critical analysis of the topic with balanced perspectives.'
          },
          {
            id: 3,
            title: 'Alternative Approach',
            description: 'This option explores alternative approaches to the topic.'
          }
        ],
        mode: 'mock'
      });
      return;
    }

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
    if (config.openai.useMock) {
      // Mock mode
      await new Promise(resolve => setTimeout(resolve, 1000));
      res.json({
        success: true,
        isVerified: true,
        keyFacts: [
          'Fact 1 that supports the opinion',
          'Fact 2 that supports the opinion'
        ],
        verifiedSources: [
          {
            title: 'Academic Source Example',
            author: 'Author Name',
            type: 'Academic Journal',
            description: 'This source provides evidence supporting the selected opinion.'
          }
        ],
        notes: 'This is a mock fact-check response.',
        mode: 'mock'
      });
      return;
    }

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
    if (config.openai.useMock) {
      // Mock mode
      await new Promise(resolve => setTimeout(resolve, 2000));
      res.json({
        success: true,
        assignment: 'This is a mock generated assignment. In production, this would be a fully personalized assignment based on the selected opinion, fact-checked sources, and course materials.',
        humanized: true,
        mode: 'mock'
      });
      return;
    }

    const { assignmentTopic, selectedOpinion, courseMaterials, verifiedSources } = req.body;

    if (!assignmentTopic || !selectedOpinion || !courseMaterials) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: assignmentTopic, selectedOpinion, and courseMaterials'
      });
    }

    // Generate assignment
    const assignment = await generateAssignment(
      assignmentTopic,
      selectedOpinion,
      courseMaterials,
      verifiedSources || []
    );

    // Humanize the assignment
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

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'ClarifyFact Backend API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      testOpenAI: '/api/test-openai',
      uploadToDrive: '/api/upload-to-drive (POST)',
      analyzeAssignment: '/api/analyze-assignment (POST)',
      factCheck: '/api/fact-check (POST)',
      generateAssignment: '/api/generate-assignment (POST)'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

const PORT = config.server.port;

app.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════════╗
  ║   ClarifyFact Backend Server Running   ║
  ╠════════════════════════════════════════╣
  ║   Port: ${PORT}                          ║
  ║   Upload API: /api/upload-to-drive     ║
  ║   Analyze API: /api/analyze-assignment ║
  ║   Fact-Check API: /api/fact-check      ║
  ║   Generate API: /api/generate-assignment║
  ║   Health Check: /health                ║
  ╚════════════════════════════════════════╝
  
  Frontend should be running on http://localhost:3000
  `);
});

