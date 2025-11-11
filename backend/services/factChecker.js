const { OpenAI } = require('openai');
const config = require('../config');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

/**
 * Fact-check a selected opinion against reputable sources using OpenAI
 * @param {string} assignmentTopic - The assignment topic
 * @param {string} selectedOpinion - The opinion option selected by user
 * @param {string} courseMaterials - Course materials for context
 * @returns {Promise<Object>} Fact-checked results with verified sources
 */
async function factCheckOpinion(assignmentTopic, selectedOpinion, courseMaterials) {
  try {
    const prompt = `Fact-check the following opinion about an assignment topic. Provide verified information and reputable sources.

Assignment Topic: ${assignmentTopic}

Selected Opinion/Viewpoint: ${selectedOpinion}

Course Materials Context:
${courseMaterials.substring(0, 2000)} // Limit to prevent token overflow

Your task:
1. Verify the factual accuracy of the selected opinion
2. Identify key facts and claims that support this viewpoint
3. Provide information about reputable sources (academic journals, educational institutions, recognized experts) that support or relate to this opinion
4. Note any areas where the opinion might need clarification or additional support

Respond in the following JSON format:
{
  "isVerified": true/false,
  "keyFacts": [
    "Fact 1 that supports the opinion",
    "Fact 2 that supports the opinion"
  ],
  "verifiedSources": [
    {
      "title": "Source Title",
      "author": "Author Name",
      "type": "Academic Journal/Book/Website/etc",
      "description": "Brief description of how this source relates to the opinion"
    }
  ],
  "notes": "Any additional notes or clarifications needed"
}

Only return valid JSON, no additional text.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Using GPT-4o-mini for better quality and cost efficiency
      messages: [
        {
          role: 'system',
          content: 'You are a fact-checking expert that verifies information and identifies reputable academic sources. Always respond with valid JSON only. Do not include any text outside the JSON object. Start your response with { and end with }.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3, // Lower temperature for more accurate fact-checking
      max_tokens: 2000
    });

    let content = response.choices[0].message.content.trim();
    
    // Remove markdown code blocks if present
    if (content.startsWith('```json')) {
      content = content.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    } else if (content.startsWith('```')) {
      content = content.replace(/```\n?/g, '');
    }
    
    // Extract JSON from text if it's embedded
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      content = jsonMatch[0];
    }
    
    try {
      const result = JSON.parse(content);
      return result;
    } catch (parseError) {
      console.error('JSON parse error. Content:', content.substring(0, 200));
      throw new Error(`Failed to parse JSON response: ${parseError.message}`);
    }
  } catch (error) {
    console.error('Error fact-checking opinion:', error);
    throw new Error(`Failed to fact-check opinion: ${error.message}`);
  }
}

module.exports = {
  factCheckOpinion,
};

