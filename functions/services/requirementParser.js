const { OpenAI } = require('openai');
const config = require('../config');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

/**
 * Parse requirements from course materials and build Assignment Blueprint
 * This extracts EXACT assignment instructions, tasks, structure, word limits, etc.
 * @param {string} assignmentTopic - The assignment topic from user
 * @param {string} courseMaterials - Extracted text from course PDFs
 * @returns {Promise<Object>} Assignment Blueprint with parsed requirements
 */
async function parseRequirements(assignmentTopic, courseMaterials) {
  try {
    console.log('[parseRequirements] Starting requirement parsing...');
    console.log('[parseRequirements] Assignment topic length:', assignmentTopic?.length || 0);
    console.log('[parseRequirements] Course materials length:', courseMaterials?.length || 0);

    const prompt = `Analyze the following assignment topic and course materials to extract ALL assignment requirements and build a detailed Assignment Blueprint.

Assignment Topic: ${assignmentTopic}

Course Materials:
${courseMaterials}

Your task is to extract and structure ALL requirements from the course materials:

1. TASK BREAKDOWN: Identify ALL tasks (Task 1, Task 2, Task 3, etc.) with their EXACT names/titles as stated in the assignment brief
   - Extract the EXACT wording of each task heading WORD FOR WORD, CHARACTER FOR CHARACTER (e.g., "Task 1: Understanding the Organisation and Its Information Systems")
   - Preserve EXACT capitalization, punctuation, spacing, and formatting
   - Do NOT modify, paraphrase, shorten, or change ANY part of task headings
   - Note the EXACT order and sequence of tasks
   - Include ALL tasks mentioned - do NOT skip any
   - If the assignment mentions "Task 1", "Task 2", "Task 3", etc., extract ALL of them

2. STRUCTURAL REQUIREMENTS:
   - ALL required headings and subheadings (extract EXACT wording word-for-word)
   - ALL required sections (Introduction, Methodology, Analysis, Conclusion, etc.) - extract exact names
   - Required flow/order of content - note the EXACT sequence
   - Formatting rules (font, spacing, margins, etc.)
   - Any specific structure requirements
   - Any section titles or headings mentioned in the assignment brief - extract them EXACTLY as written

3. WORD LIMITS:
   - Overall word count (if specified)
   - Word limits per task/section (if specified)
   - Page limits (if specified)
   - Whether word count includes/excludes references

4. VISUAL REQUIREMENTS:
   - Required tables
   - Required diagrams
   - Required charts/graphs
   - Required figures/illustrations
   - Required screenshots or images
   - Location/placement of visuals (which section)

5. REFERENCING STYLE:
   - Required citation style (Harvard, APA, MLA, etc.)
   - Minimum number of references (if specified)
   - Types of sources allowed (academic journals, books, websites, etc.)

6. CONTENT REQUIREMENTS:
   - Required topics/areas to cover
   - Required theories/concepts to include
   - Required examples or case studies
   - "Must include" items
   - "Should not include" items

7. WRITING STYLE REQUIREMENTS:
   - Tone (formal, academic, professional, etc.)
   - Person (first person, third person, etc.)
   - Voice (active, passive, etc.)
   - Examples or templates provided (if any)

8. ADDITIONAL RESOURCES:
   - URLs mentioned (submission URLs, resource URLs, reference URLs)
   - Additional reading materials
   - Required tools or software
   - Submission requirements

Respond in the following JSON format:
{
  "tasks": [
    {
      "taskNumber": 1,
      "exactHeading": "Task 1: Understanding the Organisation and Its Information Systems",
      "description": "Brief description of what this task requires",
      "wordLimit": 500,
      "requiredContent": ["Content area 1", "Content area 2"],
      "requiredVisuals": ["table", "diagram"]
    },
    {
      "taskNumber": 2,
      "exactHeading": "Task 2: Evaluating the Impact of Digital Transformation",
      "description": "Brief description",
      "wordLimit": 700,
      "requiredContent": [],
      "requiredVisuals": ["chart"]
    }
  ],
  "overallWordLimit": 2500,
  "totalWordLimit": 2500,
  "structure": {
    "requiredHeadings": ["Introduction", "Task 1: ...", "Task 2: ...", "Conclusion"],
    "requiredSections": ["Introduction", "Main Analysis", "Conclusion"],
    "formattingRules": ["12pt font", "double spacing", "APA style"],
    "flow": ["Introduction", "Task 1", "Task 2", "Task 3", "Conclusion"]
  },
  "visuals": {
    "requiredTables": 2,
    "requiredDiagrams": 1,
    "requiredCharts": 1,
    "visualPlacements": {
      "Task 1": ["table"],
      "Task 2": ["diagram", "chart"]
    }
  },
  "referencing": {
    "style": "Harvard",
    "minimumReferences": 10,
    "allowedSourceTypes": ["academic journals", "books", "reputable websites"]
  },
  "contentRequirements": {
    "mustInclude": ["Theory X", "Concept Y"],
    "shouldNotInclude": ["Personal opinions without evidence"],
    "requiredTopics": ["Topic A", "Topic B"]
  },
  "writingStyle": {
    "tone": "formal academic",
    "person": "third person",
    "voice": "active",
    "examplesProvided": false
  },
  "urls": [
    {
      "url": "https://example.com/submission",
      "type": "submission",
      "description": "Assignment submission URL"
    }
  ],
  "additionalResources": []
}

⚠️⚠️⚠️ CRITICAL REQUIREMENTS - READ CAREFULLY ⚠️⚠️⚠️:

1. Extract the EXACT wording of task headings as they appear in the assignment brief:
   - Copy WORD FOR WORD, CHARACTER FOR CHARACTER
   - Preserve EXACT capitalization (uppercase, lowercase, title case)
   - Preserve EXACT punctuation (colons, dashes, commas, periods)
   - Preserve EXACT spacing between words
   - Do NOT modify, paraphrase, shorten, abbreviate, or change ANY part of headings
   - Do NOT correct spelling or grammar in headings (use them as written)

2. Extract ALL tasks mentioned:
   - If the assignment mentions Task 1, Task 2, Task 3, etc., extract ALL of them
   - Do NOT skip any tasks
   - Include tasks even if they seem similar or repetitive
   - If there are multiple sections or parts, extract ALL of them

3. Extract ALL headings and section names:
   - Identify every heading mentioned in the assignment brief
   - Extract the exact wording of each heading
   - Preserve the exact format and wording

4. Extract ALL requirements:
   - Word limits, page limits, formatting rules
   - Visual requirements, content requirements
   - Referencing style, submission requirements
   - Any other specific requirements mentioned

VERIFICATION: Before returning the JSON, verify that you have extracted:
- ALL tasks with their EXACT headings
- ALL headings and section names mentioned
- ALL requirements (word limits, visuals, content areas, etc.)

Only return valid JSON, no additional text.`;

    console.log('[parseRequirements] Calling OpenAI API...');
    // Try GPT-5, fallback to gpt-4o
    let response;
    try {
      response = await openai.chat.completions.create({
        model: 'gpt-5',
        messages: [
          {
            role: 'system',
            content: 'You are an expert requirement parser that extracts precise assignment instructions from course materials. You MUST preserve exact wording, especially for task headings and section names. Always respond with valid JSON only. Do not include any text outside the JSON object. Start your response with { and end with }.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2, // Lower temperature for more accurate extraction
        max_tokens: 4000
      });
    } catch (error) {
      // Fallback to gpt-4o if GPT-5 is not available
      console.log('[parseRequirements] GPT-5 not available, using gpt-4o as fallback');
      response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert requirement parser that extracts precise assignment instructions from course materials. You MUST preserve exact wording, especially for task headings and section names. Always respond with valid JSON only. Do not include any text outside the JSON object. Start your response with { and end with }.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 4000
      });
    }

    let content = response.choices[0].message.content.trim();
    
    // Remove markdown code blocks if present
    if (content.startsWith('```json')) {
      content = content.replace(/```json\n?/g, '').replace(/```\n?$/g, '').trim();
      console.log('[parseRequirements] Removed ```json code blocks');
    } else if (content.startsWith('```')) {
      content = content.replace(/```\n?/g, '').trim();
      console.log('[parseRequirements] Removed ``` code blocks');
    }
    
    // Extract JSON from text if it's embedded
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      content = jsonMatch[0];
      console.log('[parseRequirements] Extracted JSON from text');
    }
    
    try {
      const blueprint = JSON.parse(content);
      console.log('[parseRequirements] Blueprint parsed successfully');
      console.log('[parseRequirements] Number of tasks:', blueprint.tasks?.length || 0);
      console.log('[parseRequirements] Overall word limit:', blueprint.overallWordLimit || 'not specified');
      return blueprint;
    } catch (parseError) {
      console.error('[parseRequirements] JSON parse error:', parseError.message);
      console.error('[parseRequirements] Content preview:', content.substring(0, 500));
      throw new Error(`Failed to parse requirement blueprint: ${parseError.message}`);
    }
  } catch (error) {
    console.error('[parseRequirements] Error parsing requirements:', error);
    throw new Error(`Failed to parse requirements: ${error.message}`);
  }
}

module.exports = {
  parseRequirements,
};

