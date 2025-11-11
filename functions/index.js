/**
 * Complete Firebase Functions implementation for ClarifyFact
 * 
 * This file contains all API endpoints as Firebase Cloud Functions
 * Replace functions/index.js with this file when deploying
 * 
 * Updated: Added visual requirements formatting and enhanced slide requirements compliance (2025-11-11)
 * Updated: Added academic text cleaning and formatting for professional submission (2025-11-11)
 * Version: 2.1.0 - Academic text cleaning enabled
 */

const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');

// Import services (copy these from backend/services/)
const { analyzeAssignment } = require('./services/assignmentAnalyzer');
const { factCheckOpinion } = require('./services/factChecker');
const { generateAssignment, humanizeText, humanizeTextFast } = require('./services/openaiService');

// Check if upload-to-drive exists, otherwise create a stub
let uploadToDrive;
try {
  uploadToDrive = require('./upload-to-drive');
} catch (error) {
  console.warn('upload-to-drive.js not found, creating stub endpoint');
  uploadToDrive = (req, res) => {
    res.status(501).json({
      success: false,
      error: 'Upload to Drive not implemented in Firebase Functions',
      message: 'File upload functionality is not yet available in the cloud deployment'
    });
  };
}

// CSP Violation Report endpoint
const handleCSPReport = require('./csp-report');

const app = express();

// Enable CORS for all origins (restrict in production if needed)
app.use(cors({ origin: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware to normalize paths - handle Firebase Hosting rewrites
app.use((req, res, next) => {
  // Firebase Hosting rewrites /api/** to the function
  // When using rewrites, Firebase passes the path in different ways
  // We need to check multiple sources to get the real path
  
  // Decode URL-encoded paths (e.g., %2A becomes *)
  let path = decodeURIComponent(req.path);
  let originalUrl = decodeURIComponent(req.originalUrl || req.url || '');
  
  // Get the original URL from headers (Firebase Hosting may set this)
  const xOriginalUrl = req.get('x-original-url') || req.get('x-forwarded-url');
  if (xOriginalUrl) {
    originalUrl = decodeURIComponent(xOriginalUrl);
  }
  
  let urlPath = originalUrl.split('?')[0];
  
  // If path is /* or %2A (wildcard from rewrite), we need to extract the actual path
  if (path === '/*' || path === '/%2A' || path.startsWith('/*') || urlPath === '/*' || urlPath === '/%2A') {
    // Try to get the actual path from various sources
    if (xOriginalUrl) {
      // Firebase Hosting may set x-original-url header
      urlPath = xOriginalUrl.split('?')[0];
    }
    
    // Check if we can extract from the request headers or URL
    // Firebase Hosting rewrites pass the matched path segment
    // The actual URL should be in the request somewhere
    const host = req.get('host');
    const protocol = req.protocol || 'https';
    const fullUrl = `${protocol}://${host}${req.originalUrl || req.url}`;
    
    // Extract path after /api from the full URL
    if (fullUrl.includes('/api/')) {
      const apiIndex = fullUrl.indexOf('/api/');
      const afterApi = fullUrl.substring(apiIndex + 4);
      urlPath = afterApi.split('?')[0].split('#')[0];
    } else if (originalUrl.includes('/api/')) {
      const apiIndex = originalUrl.indexOf('/api/');
      const afterApi = originalUrl.substring(apiIndex + 4);
      urlPath = afterApi.split('?')[0];
    }
  }
  
  // Now normalize the path - remove /api prefix if present
  if (urlPath.startsWith('/api/')) {
    path = urlPath.substring(4); // Remove '/api'
  } else if (urlPath.startsWith('/api')) {
    path = '/';
  } else if (urlPath !== '/*' && urlPath !== '/') {
    path = urlPath;
  } else if (path.startsWith('/api/')) {
    path = path.substring(4);
  } else if (path === '/api') {
    path = '/';
  }
  
  // If we still have /* or %2A, try to get from referer or other headers
  if (path === '/*' || path === '/%2A' || path === '/') {
    const referer = req.get('referer');
    if (referer) {
      try {
        const refererUrl = new URL(referer);
        const refererPath = refererUrl.pathname;
        if (refererPath.startsWith('/api/')) {
          path = refererPath.substring(4);
        }
      } catch (e) {
        // Invalid referer URL, ignore
      }
    }
    
    // Last resort: try to extract from the request URL directly
    // Firebase Hosting should pass the actual path in the request
    if ((path === '/*' || path === '/%2A') && req.url) {
      const decodedUrl = decodeURIComponent(req.url);
      if (decodedUrl.includes('/api/')) {
        const apiIndex = decodedUrl.indexOf('/api/');
        const afterApi = decodedUrl.substring(apiIndex + 4);
        path = afterApi.split('?')[0].split('#')[0];
      }
    }
  }
  
  // Update request path and URL - use Express's internal methods
  // This ensures Express recognizes the path change
  if (path !== req.path) {
    req.url = path + (originalUrl.includes('?') ? originalUrl.substring(originalUrl.indexOf('?')) : '');
    // Force Express to re-parse the URL
    const url = require('url');
    const parsed = url.parse(req.url, true);
    req.path = parsed.pathname;
    req.query = parsed.query;
  }
  
  console.log(`Path normalized: originalUrl=${originalUrl}, x-original-url=${xOriginalUrl}, final path=${req.path}`);
  next();
});

// CSP Violation Report endpoint (works with /api/csp-report or /csp-report)
app.post('/csp-report', handleCSPReport);

// Upload to Google Drive endpoint (works with /api/upload-to-drive or /upload-to-drive)
app.post('/upload-to-drive', uploadToDrive);

// Health check endpoint (handle both /health and /api/health)
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
      health: '/health or /api/health',
      testOpenAI: '/test-openai or /api/test-openai',
      cspReport: '/csp-report or /api/csp-report (POST)',
      uploadToDrive: '/upload-to-drive or /api/upload-to-drive (POST)',
      analyzeAssignment: '/analyze-assignment or /api/analyze-assignment (POST)',
      factCheck: '/fact-check or /api/fact-check (POST)',
      generateAssignment: '/generate-assignment or /api/generate-assignment (POST)'
    }
  });
});

// Test OpenAI connection endpoint (works with /api/test-openai or /test-openai)
app.get('/test-openai', async (req, res) => {
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

// Analyze assignment and generate opinion options (works with /api/analyze-assignment or /analyze-assignment)
app.post('/analyze-assignment', async (req, res) => {
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

// Fact-check selected opinion (works with /api/fact-check or /fact-check)
app.post('/fact-check', async (req, res) => {
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

// Generate final assignment (works with /api/generate-assignment or /generate-assignment)
// NOTE: Firebase Hosting rewrites have a 60-second timeout, but this function can take 90+ seconds
// We need to keep the connection alive and send progress updates or optimize processing time
app.post('/generate-assignment', async (req, res) => {
  const startTime = Date.now();
  console.log('[generate-assignment] Request received at', new Date().toISOString());
  
  // Set longer timeouts to prevent premature termination
  req.setTimeout(480000); // 8 minutes
  res.setTimeout(480000); // 8 minutes
  
  // Send a keep-alive header to prevent timeout
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Cache-Control', 'no-cache');
  
  try {
    const { assignmentTopic, selectedOpinion, courseMaterials, verifiedSources } = req.body;
    console.log('[generate-assignment] Request body:', {
      assignmentTopic: assignmentTopic?.substring(0, 100),
      selectedOpinion: selectedOpinion?.substring(0, 100),
      courseMaterialsLength: courseMaterials?.length,
      verifiedSourcesCount: verifiedSources?.length || 0
    });

    if (!assignmentTopic || !selectedOpinion || !courseMaterials) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: assignmentTopic, selectedOpinion, and courseMaterials'
      });
    }

    // Send initial response to keep connection alive (for Firebase Hosting timeout issue)
    // This doesn't work with standard HTTP, but we'll optimize processing instead
    
    console.log('[generate-assignment] Step 1: Generating assignment...');
    let assignment;
    try {
      assignment = await generateAssignment(
        assignmentTopic,
        selectedOpinion,
        courseMaterials,
        verifiedSources || []
      );
      console.log('[generate-assignment] Step 1 complete: Assignment generated, length:', assignment?.length);
    } catch (genError) {
      console.error('[generate-assignment] Error in generateAssignment:', genError);
      console.error('[generate-assignment] Error details:', {
        name: genError.name,
        message: genError.message,
        stack: genError.stack?.substring(0, 500)
      });
      throw new Error(`Failed to generate assignment: ${genError.message}`);
    }

    console.log('[generate-assignment] Step 2: Humanizing assignment (2-pass system for speed)...');
    let humanizedAssignment;
    try {
      // Use a faster 2-pass humanization instead of 3-pass to reduce time
      // This should complete in ~50-60 seconds instead of 90+ seconds
      humanizedAssignment = await humanizeTextFast(assignment);
      console.log('[generate-assignment] Step 2 complete: Assignment humanized, length:', humanizedAssignment?.length);
    } catch (humanizeError) {
      console.error('[generate-assignment] Error in humanizeText:', humanizeError);
      console.error('[generate-assignment] Humanization error details:', {
        name: humanizeError.name,
        message: humanizeError.message,
        stack: humanizeError.stack?.substring(0, 500)
      });
      // If humanization fails, return the non-humanized assignment
      console.warn('[generate-assignment] Returning non-humanized assignment due to humanization error');
      humanizedAssignment = assignment;
    }

    console.log('[generate-assignment] Step 3: Cleaning and formatting academic text...');
    const { cleanAcademicText } = require('./services/openaiService');
    let finalAssignment;
    try {
      finalAssignment = cleanAcademicText(humanizedAssignment);
      console.log('[generate-assignment] Step 3 complete: Academic text cleaned and formatted');
    } catch (cleanError) {
      console.error('[generate-assignment] Error in cleanAcademicText:', cleanError);
      console.warn('[generate-assignment] Returning assignment without cleaning due to error');
      finalAssignment = humanizedAssignment;
    }

    const duration = Date.now() - startTime;
    console.log(`[generate-assignment] Total time: ${duration}ms (${(duration/1000).toFixed(2)}s)`);

    // Ensure response is sent before function completes
    res.json({
      success: true,
      assignment: finalAssignment,
      humanized: true,
      mode: 'real',
      processingTime: duration
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[generate-assignment] Error after ${duration}ms:`, error);
    console.error('[generate-assignment] Error stack:', error.stack?.substring(0, 1000));
    console.error('[generate-assignment] Error name:', error.name);
    console.error('[generate-assignment] Error message:', error.message);
    
    // Send error response
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Failed to generate assignment',
        details: error.message || 'Unknown error',
        errorType: error.name || 'Error',
        processingTime: duration
      });
    }
  }
});

// Debug middleware - log all requests
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.path}`, req.query);
  next();
});

// Catch-all for unmatched routes
app.use((req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({
    error: 'Route not found',
    method: req.method,
    path: req.path,
    availableRoutes: [
      'GET /',
      'GET /health',
      'GET /test-openai',
      'POST /analyze-assignment',
      'POST /fact-check',
      'POST /generate-assignment',
      'Note: All routes also work with /api prefix (e.g., /api/health)'
    ]
  });
});

// Export as Firebase Cloud Function
// This creates an HTTP endpoint at: https://REGION-PROJECT.cloudfunctions.net/api
exports.api = functions
  .region('us-central1') // Change to your preferred region (us-east1, europe-west1, etc.)
  .runWith({
    timeoutSeconds: 540, // 9 minutes (max for HTTP functions)
    memory: '2GB' // Increase memory for better performance with OpenAI API (3-pass humanization is memory intensive)
  })
  .https.onRequest(app);

