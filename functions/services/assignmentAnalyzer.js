const { OpenAI } = require('openai');
const config = require('../config');

// Validate API key before initializing
if (!config.openai || !config.openai.apiKey) {
  console.error('❌ ERROR: OpenAI API key is not configured in assignmentAnalyzer!');
  throw new Error('OpenAI API key is not set. Please configure it using firebase functions:config:set openai.api_key="your-key"');
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

console.log('✅ OpenAI client initialized successfully in assignmentAnalyzer');

const { parseRequirements } = require('./requirementParser');

/**
 * Analyze assignment topic and course materials to generate summary, opinion options, and Assignment Blueprint
 * @param {string} assignmentTopic - The assignment topic from user
 * @param {string} courseMaterials - Extracted text from course PDFs
 * @returns {Promise<Object>} Summary, opinion options, and Assignment Blueprint
 */
async function analyzeAssignment(assignmentTopic, courseMaterials) {
  try {
    // Validate inputs
    if (!assignmentTopic || typeof assignmentTopic !== 'string') {
      throw new Error('assignmentTopic must be a non-empty string');
    }
    if (!courseMaterials || typeof courseMaterials !== 'string') {
      throw new Error('courseMaterials must be a non-empty string');
    }
    
    console.log('[analyzeAssignment] Input validation passed');
    console.log('[analyzeAssignment] Assignment topic length:', assignmentTopic.length);
    console.log('[analyzeAssignment] Course materials length:', courseMaterials.length);
    
    // Step 1: Parse requirements and build Assignment Blueprint (CLASS-MATERIAL FIRST MODE)
    console.log('[analyzeAssignment] Step 1: Parsing requirements and building Assignment Blueprint...');
    let assignmentBlueprint = null;
    try {
      assignmentBlueprint = await parseRequirements(assignmentTopic, courseMaterials);
      console.log('[analyzeAssignment] Assignment Blueprint created successfully');
    } catch (blueprintError) {
      console.warn('[analyzeAssignment] Failed to create blueprint, continuing with basic analysis:', blueprintError.message);
      // Continue without blueprint - will use basic requirements extraction
    }
    
    // Step 2: Generate summary and opinion options based on course materials and blueprint
    console.log('[analyzeAssignment] Step 2: Generating summary and opinion options...');
    const blueprintContext = assignmentBlueprint 
      ? `\n\nAssignment Blueprint (EXTRACTED REQUIREMENTS):
Tasks: ${assignmentBlueprint.tasks?.map(t => `${t.taskNumber}: ${t.exactHeading}`).join('; ') || 'None specified'}
Overall Word Limit: ${assignmentBlueprint.overallWordLimit || 'Not specified'}
Required Sections: ${assignmentBlueprint.structure?.requiredSections?.join(', ') || 'Not specified'}
Required Referencing Style: ${assignmentBlueprint.referencing?.style || 'Not specified'}`
      : '';
    
    const prompt = `Analyze the following assignment topic and course materials to create a summary and generate personalized opinion-based response options.

${blueprintContext}

Assignment Topic: ${assignmentTopic}

Course Materials:
${courseMaterials}

Your task:
1. Create a concise summary (200-300 words) explaining what this assignment is about based on the topic and course materials.
2. Generate 4-5 different opinion-based response options that students could take for this assignment. Each option should represent a distinct viewpoint or approach.
3. Make sure the options are relevant to the assignment topic and course materials.

Respond in the following JSON format:
{
  "summary": "Brief summary of what the assignment is about based on the topic and course materials...",
  "opinionOptions": [
    {
      "id": 1,
      "title": "Option 1 Title",
      "description": "Brief description of this opinion/approach (2-3 sentences). Make sure options align with the course materials and assignment requirements."
    },
    {
      "id": 2,
      "title": "Option 2 Title",
      "description": "Brief description of this opinion/approach (2-3 sentences)"
    }
  ]
}

IMPORTANT: Generate opinion options that are relevant to BOTH the assignment topic AND the course materials. Each option should represent a distinct viewpoint or approach that students could take, considering the requirements extracted from the course materials.

Only return valid JSON, no additional text.`;

    console.log('[analyzeAssignment] Calling OpenAI API...');
    console.log('[analyzeAssignment] Prompt length:', prompt.length);
    console.log('[analyzeAssignment] Assignment topic length:', assignmentTopic?.length || 0);
    console.log('[analyzeAssignment] Course materials length:', courseMaterials?.length || 0);
    
    // Try GPT-5-mini, fallback to gpt-4o-mini
    let response;
    try {
      response = await openai.chat.completions.create({
        model: 'gpt-5-mini', // Using GPT-5-mini for better quality
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
    } catch (error) {
      // Fallback to gpt-4o-mini if GPT-5 is not available
      console.log('[analyzeAssignment] GPT-5-mini not available, using gpt-4o-mini as fallback');
      response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
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
    }

    console.log('[analyzeAssignment] OpenAI API response received');
    console.log('[analyzeAssignment] Response structure:', {
      hasChoices: !!response.choices,
      choicesLength: response.choices?.length || 0,
      hasFirstChoice: !!response.choices?.[0],
      hasMessage: !!response.choices?.[0]?.message,
      hasContent: !!response.choices?.[0]?.message?.content,
      responseId: response.id,
      model: response.model,
      usage: response.usage
    });

    // Validate response structure
    if (!response || !response.choices || !Array.isArray(response.choices) || response.choices.length === 0) {
      console.error('[analyzeAssignment] Invalid response structure:', JSON.stringify(response, null, 2));
      throw new Error('Invalid response from OpenAI API: No choices in response');
    }

    if (!response.choices[0] || !response.choices[0].message) {
      console.error('[analyzeAssignment] Invalid response structure:', JSON.stringify(response.choices[0], null, 2));
      throw new Error('Invalid response from OpenAI API: No message in first choice');
    }

    if (!response.choices[0].message.content) {
      console.error('[analyzeAssignment] Invalid response structure:', JSON.stringify(response.choices[0].message, null, 2));
      throw new Error('Invalid response from OpenAI API: No content in message');
    }

    // Safely extract content from response
    let content = null;
    try {
      // Validate response structure before accessing
      if (!response || typeof response !== 'object') {
        throw new TypeError('Response is not an object');
      }
      if (!response.choices || !Array.isArray(response.choices)) {
        throw new TypeError('Response.choices is not an array');
      }
      if (response.choices.length === 0) {
        throw new TypeError('Response.choices is empty');
      }
      if (!response.choices[0] || typeof response.choices[0] !== 'object') {
        throw new TypeError('Response.choices[0] is not an object');
      }
      if (!response.choices[0].message || typeof response.choices[0].message !== 'object') {
        throw new TypeError('Response.choices[0].message is not an object');
      }
      if (!response.choices[0].message.content || typeof response.choices[0].message.content !== 'string') {
        throw new TypeError('Response.choices[0].message.content is not a string');
      }
      
      content = response.choices[0].message.content.trim();
      console.log('[analyzeAssignment] Content received, length:', content.length);
    } catch (accessError) {
      console.error('[analyzeAssignment] Error accessing response content:', accessError);
      console.error('[analyzeAssignment] Response structure:', {
        hasResponse: !!response,
        responseType: typeof response,
        hasChoices: !!response?.choices,
        choicesType: typeof response?.choices,
        isChoicesArray: Array.isArray(response?.choices),
        choicesLength: response?.choices?.length,
        hasFirstChoice: !!response?.choices?.[0],
        firstChoiceType: typeof response?.choices?.[0],
        hasMessage: !!response?.choices?.[0]?.message,
        messageType: typeof response?.choices?.[0]?.message,
        hasContent: !!response?.choices?.[0]?.message?.content,
        contentType: typeof response?.choices?.[0]?.message?.content
      });
      // Re-throw with more context
      throw new TypeError(`Failed to extract content from OpenAI response: ${accessError.message}. Response structure is invalid.`);
    }
    
    // Remove markdown code blocks if present
    if (content.startsWith('```json')) {
      content = content.replace(/```json\n?/g, '').replace(/```\n?$/g, '').trim();
      console.log('[analyzeAssignment] Removed ```json code blocks');
    } else if (content.startsWith('```')) {
      content = content.replace(/```\n?/g, '').trim();
      console.log('[analyzeAssignment] Removed ``` code blocks');
    }
    
    // Extract JSON from text if it's embedded
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      content = jsonMatch[0];
      console.log('[analyzeAssignment] Extracted JSON from text');
    }
    
    try {
      console.log('[analyzeAssignment] Attempting to parse JSON, content length:', content.length);
      console.log('[analyzeAssignment] Content preview (first 200 chars):', content.substring(0, 200));
      const result = JSON.parse(content);
      console.log('[analyzeAssignment] JSON parsed successfully');
      console.log('[analyzeAssignment] Result keys:', Object.keys(result || {}));
      
      // Add Assignment Blueprint to result if available
      if (assignmentBlueprint) {
        result.assignmentBlueprint = assignmentBlueprint;
        console.log('[analyzeAssignment] Assignment Blueprint added to result');
      }
      
      return result;
    } catch (parseError) {
      console.error('[analyzeAssignment] JSON parse error:', parseError.message);
      console.error('[analyzeAssignment] Parse error name:', parseError.name);
      console.error('[analyzeAssignment] Content that failed to parse (first 500 chars):', content.substring(0, 500));
      throw new Error(`Failed to parse JSON response: ${parseError.message}. Content preview: ${content.substring(0, 100)}`);
    }
  } catch (error) {
    // Preserve the original error type and details
    console.error('[analyzeAssignment] === ERROR ===');
    console.error('[analyzeAssignment] Error name:', error.name);
    console.error('[analyzeAssignment] Error message:', error.message);
    console.error('[analyzeAssignment] Error stack:', error.stack);
    console.error('[analyzeAssignment] Error type:', typeof error);
    console.error('[analyzeAssignment] Error constructor:', error.constructor?.name);
    
    // If it's already a TypeError, preserve it
    if (error instanceof TypeError) {
      // Create a new error with more context but preserve the TypeError
      const enhancedError = new TypeError(`Failed to analyze assignment: ${error.message}`);
      enhancedError.stack = error.stack;
      enhancedError.cause = error;
      throw enhancedError;
    }
    
    // If it's already an Error, wrap it but preserve the message
    if (error instanceof Error) {
      const wrappedError = new Error(`Failed to analyze assignment: ${error.message}`);
      wrappedError.name = error.name; // Preserve original error name
      wrappedError.stack = error.stack;
      wrappedError.cause = error;
      throw wrappedError;
    }
    
    // For any other type of error, convert to Error
    throw new Error(`Failed to analyze assignment: ${String(error)}`);
  }
}

module.exports = {
  analyzeAssignment,
};

