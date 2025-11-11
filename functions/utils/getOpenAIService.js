const config = require('../config');

/**
 * Get the appropriate OpenAI service based on configuration
 * Returns either the real service or mock service
 */
function getOpenAIService() {
  if (config.openai.useMock) {
    return require('../services/openaiServiceMock');
  } else {
    return require('../services/openaiService');
  }
}

module.exports = getOpenAIService;

