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
    console.log('[factCheckOpinion] Starting fact-check with course-materials-first approach...');
    
    const prompt = `Fact-check the following opinion about an assignment topic. Use a TWO-PHASE approach:

PHASE 1: INTERNAL FACT CHECK (Course Materials Priority)
- FIRST, verify the opinion against the course materials provided
- Find exact supporting quotes, theories, or references from the course materials
- Identify if the opinion aligns with concepts covered in the course materials
- Note any contradictions or weak areas based on course materials

PHASE 2: EXTERNAL FACT CHECK (Reputable Sources Only)
- AFTER internal validation, check against credible educational sources:
  * Academic journals (peer-reviewed)
  * Textbook summaries
  * Educational institutions (.edu, .ac.uk)
  * Government sources (.gov)
  * Reputable organizations (NCSC, ICO, PMI, etc.)
- External sources MUST NOT override class requirements — they only strengthen arguments

Assignment Topic: ${assignmentTopic}

Selected Opinion/Viewpoint: ${selectedOpinion}

Course Materials Context:
${courseMaterials.substring(0, 3000)} // Increased limit for better course material analysis

Your task:
1. INTERNAL VERIFICATION: Verify the opinion against course materials first
   - Extract exact quotes or concepts from course materials that support this opinion
   - Identify page numbers or section references if available
   - Note any contradictions with course materials
   - Rate alignment with course materials (Strong/Moderate/Weak)
2. EXTERNAL VERIFICATION: Identify reputable external sources
   - Find academic journals, books, or credible websites that support this opinion
   - Note how external sources complement (but don't override) course materials
3. Identify key facts and claims that support this viewpoint
4. Provide information about reputable sources that support or relate to this opinion
5. Note any areas where the opinion might need clarification or additional support

Respond in the following JSON format:
{
  "isVerified": true/false,
  "internalVerification": {
    "alignedWithCourseMaterials": true/false,
    "supportingQuotes": [
      "Quote or concept from course materials that supports the opinion"
    ],
    "courseMaterialReferences": [
      "Section or concept reference from course materials"
    ],
    "contradictions": [],
    "alignmentLevel": "Strong/Moderate/Weak"
  },
  "keyFacts": [
    "Fact 1 that supports the opinion (from course materials or external sources)",
    "Fact 2 that supports the opinion"
  ],
  "verifiedSources": [
    {
      "title": "Source Title",
      "author": "Author Name",
      "type": "Academic Journal/Book/Website/etc",
      "url": "Source URL if available",
      "sourceType": "courseMaterial/external",
      "description": "Brief description of how this source relates to the opinion"
    }
  ],
  "notes": "Any additional notes or clarifications needed"
}

Only return valid JSON, no additional text.`;

    // Try GPT-5-mini, fallback to gpt-4o-mini
    let response;
    try {
      response = await openai.chat.completions.create({
        model: 'gpt-5-mini', // Using GPT-5-mini for better quality
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
    } catch (error) {
      // Fallback to gpt-4o-mini if GPT-5 is not available
      console.log('[factCheckOpinion] GPT-5-mini not available, using gpt-4o-mini as fallback');
      response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
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
        temperature: 0.3,
        max_tokens: 2000
      });
    }

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

