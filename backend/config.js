// Load environment variables
require('dotenv').config();

const config = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    useMock: process.env.OPENAI_USE_MOCK === 'true' || process.env.OPENAI_USE_MOCK === '1',
  },
  server: {
    port: process.env.PORT || 5000,
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
  supabase: {
    url: process.env.SUPABASE_URL,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
};

// Validate required environment variables (skip if using mock mode)
if (!config.openai.useMock && !config.openai.apiKey) {
  console.error('❌ ERROR: OPENAI_API_KEY is not set in environment variables');
  console.error('   Please create a .env file in the backend directory with your OpenAI API key');
  console.error('   OR set OPENAI_USE_MOCK=true to use mock responses');
  process.exit(1);
}

// Log current mode
if (config.openai.useMock) {
  console.log('⚠️  MOCK MODE ENABLED: Using simulated OpenAI responses');
  console.log('   Set OPENAI_USE_MOCK=false in .env to use real API');
} else {
  console.log('✅ Using real OpenAI API');
}

module.exports = config;

