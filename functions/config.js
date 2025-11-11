/**
 * Configuration for Firebase Functions
 * Uses Firebase Functions config for production, environment variables for local
 */

const functions = require('firebase-functions');

// Try to load dotenv only if not in Firebase environment
// Firebase Functions don't use .env files, they use functions:config
let dotenvLoaded = false;
try {
  // Only load dotenv in local development (when not in Firebase environment)
  if (!process.env.FUNCTION_TARGET && !process.env.K_SERVICE) {
    require('dotenv').config();
    dotenvLoaded = true;
  }
} catch (e) {
  // dotenv not available, that's okay
}

// Get Firebase Functions config safely
let functionsConfig = {};
try {
  functionsConfig = functions.config() || {};
} catch (error) {
  console.warn('Warning: Could not access functions.config():', error.message);
}

const config = {
  openai: {
    // Priority: Firebase Functions config > Environment variable
    apiKey: functionsConfig.openai?.api_key || process.env.OPENAI_API_KEY,
    useMock: false, // Always false in production
  },
  cors: {
    // Get from Firebase Functions config or use default
    origin: functionsConfig.cors?.origin || process.env.CORS_ORIGIN || '*',
  },
  server: {
    port: process.env.PORT || 5000,
  },
};

// Log API key status (without exposing the key)
if (config.openai.apiKey) {
  const keyPreview = config.openai.apiKey.substring(0, 10) + '...' + config.openai.apiKey.substring(config.openai.apiKey.length - 4);
  console.log(`✅ OpenAI API key loaded: ${keyPreview} (source: ${functionsConfig.openai?.api_key ? 'functions.config' : 'environment variable'})`);
} else {
  console.error('❌ ERROR: OpenAI API key is not set!');
  console.error('   Available config keys:', Object.keys(functionsConfig));
  console.error('   Environment variables:', Object.keys(process.env).filter(k => k.includes('OPENAI')));
}

// Only validate and exit in local development
// In Firebase Functions, config might be set via functions:config:set
if (dotenvLoaded && !config.openai.apiKey) {
  console.warn('⚠️  WARNING: OPENAI_API_KEY is not set');
  console.warn('   For local development: Create .env file with OPENAI_API_KEY');
  console.warn('   For Firebase Functions: Run: firebase functions:config:set openai.api_key="your-key"');
  // Don't exit - allow Firebase Functions to work if config is set via functions:config:set
}

// Log current mode (only in local development)
if (dotenvLoaded) {
  if (config.openai.useMock) {
    console.log('⚠️  MOCK MODE ENABLED: Using simulated OpenAI responses');
  } else if (config.openai.apiKey) {
    console.log('✅ Using real OpenAI API');
  }
}

module.exports = config;
