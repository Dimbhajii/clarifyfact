const { OpenAI } = require('openai');
const config = require('../config');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

/**
 * Analyze assignment topic and course materials to generate summary and opinion options
 * @param {string} assignmentTopic - The assignment topic from user
 * @param {string} courseMaterials - Extracted text from course PDFs
 * @returns {Promise<Object>} Summary and opinion options
 */
async function analyzeAssignment(assignmentTopic, courseMaterials) {
  try {
    const prompt = `Analyze the following assignment topic and course materials to create a summary and generate personalized opinion-based response options.

Assignment Topic: ${assignmentTopic}

Course Materials:
${courseMaterials}

Your task:
1. Create a concise summary (200-300 words) explaining what this assignment is about based on the topic and course materials.
2. Generate 4-5 different opinion-based response options that students could take for this assignment. Each option should represent a distinct viewpoint or approach.
3. Make sure the options are relevant to the assignment topic and course materials.

Respond in the following JSON format:
{
  "summary": "Brief summary of what the assignment is about...",
  "opinionOptions": [
    {
      "id": 1,
      "title": "Option 1 Title",
      "description": "Brief description of this opinion/approach (2-3 sentences)"
    },
    {
      "id": 2,
      "title": "Option 2 Title",
      "description": "Brief description of this opinion/approach (2-3 sentences)"
    }
  ]
}

Only return valid JSON, no additional text.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Using GPT-4o-mini for better quality and cost efficiency
      messages: [
        {
          role: 'system',
          content: 'You are an expert academic assistant that analyzes assignments and generates thoughtful opinion-based options. Always respond with valid JSON only. Do not include any text outside the JSON object. Start your response with { and end with }.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
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
    console.error('Error analyzing assignment:', error);
    throw new Error(`Failed to analyze assignment: ${error.message}`);
  }
}

module.exports = {
  analyzeAssignment,
};

