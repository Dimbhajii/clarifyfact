const { OpenAI } = require('openai');
const config = require('../config');

// Validate API key before initializing
if (!config.openai.apiKey) {
  console.error('❌ ERROR: OpenAI API key is not configured!');
  throw new Error('OpenAI API key is not set. Please configure it using firebase functions:config:set openai.api_key="your-key"');
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

console.log('✅ OpenAI client initialized successfully');

/**
 * Explain a topic in simple, basic English using course materials
 * @param {string} topic - The assignment topic
 * @param {string} courseMaterials - Extracted text from course PDFs
 * @returns {Promise<string>} Simple explanation of the topic
 */
async function explainTopic(topic, courseMaterials) {
  try {
    const prompt = `Explain the following topic in simple, basic English suitable for students (high school level). 
Use only the information provided in the course materials below. Keep the explanation short (200-300 words), clear, and easy to understand.

Topic: ${topic}

Course Materials:
${courseMaterials}

Provide a clear, simple explanation:`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful teacher explaining topics to students in simple, clear language.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error explaining topic:', error);
    throw new Error(`Failed to explain topic: ${error.message}`);
  }
}

/**
 * Generate personalized assignment based on student's opinion and course materials
 * @param {string} topic - Assignment topic
 * @param {string} studentOpinion - Student's main idea/opinion about the topic
 * @param {string} courseMaterials - Extracted text from course PDFs
 * @param {Array} sources - Array of verified sources
 * @returns {Promise<string>} Generated assignment text
 */
async function generateAssignment(topic, studentOpinion, courseMaterials, sources = []) {
  try {
    // Format verified sources for the prompt
    const sourcesText = sources.length > 0
      ? `\n\nVerified Sources:\n${sources.map((s, i) => `${i + 1}. ${s.title || 'Untitled'}${s.author ? ` - ${s.author}` : ''}${s.url ? ` (${s.url})` : ''}`).join('\n')}`
      : '';

    // Build the prompt with the new academic writing style
    const systemMessage = `You are an academic writing assistant. Produce original work in simple academic English, sounding like a diligent undergraduate group. Prioritize accuracy, clarity, and honest sourcing. Do NOT fabricate citations. If a source cannot be verified, exclude it. When you use external sources, only use reputable educational or official domains (e.g., .edu, .ac.uk, .gov, NCSC, ICO, PMI, major academic publishers). Use Harvard style for in-text citations and a reference list.

If browsing/tools are available, verify facts and dates. If browsing is unavailable, rely only on the provided documents and well-known textbooks already cited. Never make up URLs. Keep the writing human and natural: vary sentence length, use light transitions, avoid robotic phrasing.

FORMATTING REQUIREMENTS:
- Use PLAIN TEXT only - NO markdown, NO hashtags, NO asterisks for bold/italic, NO bullet points with symbols
- Write section titles as plain text headings on their own line (e.g., "Task 1 – Understanding the Organisation")
- Use proper paragraph breaks (double line breaks between paragraphs)
- Format suitable for Microsoft Word submission
- Keep tone formal-academic but natural, like a university student's report
- Use Harvard citation style: (Author, Year) in parentheses for in-text citations
- Reference list should be plain text, one entry per line

CRITICAL: You MUST meet ALL requirements specified in the course materials/slides. If the course materials mention specific requirements (word count, sections, format, content areas, visual elements, etc.), you MUST fulfill every single requirement.`;

    const userMessage = `Write an academic assignment on the following topic:

Topic: ${topic}

Student's Viewpoint/Opinion: ${studentOpinion}

Course Materials (INCLUDING ALL REQUIREMENTS FROM SLIDES):
${courseMaterials}
${sourcesText}

CRITICAL REQUIREMENTS (MUST BE MET AT ALL COSTS):

1. Extract and fulfill ALL requirements from the course materials/slides above. Read through the course materials carefully and identify:
   - Required sections or headings
   - Required word count or page limits
   - Required content areas or topics to cover
   - Required format or structure
   - Any required visual elements (images, graphs, charts, diagrams, tables, etc.)
   - Any other specific requirements mentioned

2. For visual elements (images, graphs, charts, diagrams, tables, figures, illustrations, etc.) that cannot be generated as text:
   - When you reach a section that requires a visual element (image, graph, chart, diagram, table, figure, illustration, screenshot, etc.), write a clear placeholder instruction in the following format:
     [IMAGE_PLACEHOLDER: Description of what image/graph/chart should show here]
   - Be specific about what the visual should contain
   - Explain the context and purpose of the visual
   - Include any data or information that should be in the visual

3. Standard requirements:
   - Length: 800-1200 words (unless course materials specify differently - if so, follow course materials)
   - Use Harvard citation style for in-text citations and reference list
   - Only cite sources that are provided or can be verified
   - Do NOT fabricate citations or URLs
   - Write in simple academic English
   - Sound like a diligent undergraduate group
   - Vary sentence length naturally
   - Use light transitions
   - Avoid robotic phrasing
   - Keep the writing human and natural
   - Support the student's viewpoint with evidence from course materials and verified sources
   - Ensure content is 100% original and plagiarism-free
   - Use PLAIN TEXT format only - no markdown, no formatting symbols

4. Priority order:
   - FIRST: Meet ALL requirements from course materials/slides (this is mandatory)
   - SECOND: Meet standard academic writing requirements
   - THIRD: Support the student's viewpoint

Generate the assignment in plain text format suitable for Microsoft Word. Remember: ALL requirements from the course materials MUST be met. Use [IMAGE_PLACEHOLDER: ...] format for any required visual elements.`;

    console.log('[generateAssignment] Calling OpenAI API...');
    const apiStartTime = Date.now();

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemMessage,
        },
        {
          role: 'user',
          content: userMessage,
        },
      ],
      temperature: 0.7, // Balanced temperature for natural but coherent writing
      max_tokens: 3500,
    });

    const apiDuration = Date.now() - apiStartTime;
    console.log(`[generateAssignment] OpenAI API call completed in ${apiDuration}ms`);
    
    let result = response.choices[0].message.content.trim();
    console.log(`[generateAssignment] Generated assignment length: ${result.length}`);
    
    // Convert image placeholders to green HTML formatted text
    result = formatVisualRequirements(result);
    
    // Note: Academic text cleaning happens AFTER humanization to preserve formatting
    // during the humanization process
    
    return result;
  } catch (error) {
    console.error('Error generating assignment:', error);
    throw new Error(`Failed to generate assignment: ${error.message}`);
  }
}

/**
 * Format visual requirements (images, graphs, charts) in green HTML
 * Converts [IMAGE_PLACEHOLDER: ...] to green formatted HTML
 * Also detects mentions of visual elements and formats them appropriately
 * @param {string} text - Assignment text
 * @returns {string} Text with visual requirements formatted in green HTML
 */
function formatVisualRequirements(text) {
  try {
    console.log('[formatVisualRequirements] Processing visual requirements...');
    
    // Pattern to match [IMAGE_PLACEHOLDER: description]
    const placeholderPattern = /\[IMAGE_PLACEHOLDER:\s*([^\]]+)\]/gi;
    
    // Replace placeholders with green HTML
    let formatted = text.replace(placeholderPattern, (match, description) => {
      console.log(`[formatVisualRequirements] Found placeholder: ${description.substring(0, 50)}...`);
      return `<span style="color: #28a745; font-weight: 600; background-color: #f0fff4; padding: 2px 4px; border-radius: 3px;">[ADD VISUAL ELEMENT: ${description.trim()}]</span>`;
    });
    
    // Also detect common phrases that indicate visual requirements
    // Only process text that's not already inside HTML tags
    // Split text by HTML tags to process only plain text portions
    const parts = formatted.split(/(<[^>]*>)/);
    let processedParts = parts.map((part, index) => {
      // Skip HTML tags
      if (part.startsWith('<') && part.endsWith('>')) {
        return part;
      }
      
      // Process plain text for visual indicators
      let processedPart = part;
      
      // Pattern 1: "add/include/insert [visual element]"
      processedPart = processedPart.replace(
        /\b(add|include|insert|provide|create|show|display)\s+(?:an?\s+)?(image|graph|chart|diagram|table|figure|illustration|picture|photo|screenshot|visual|graphic)\s+(?:showing|of|that|depicting|illustrating)?[^.]*\./gi,
        (match) => {
          console.log(`[formatVisualRequirements] Found visual indicator: ${match.substring(0, 50)}...`);
          return `<span style="color: #28a745; font-weight: 600; background-color: #f0fff4; padding: 2px 4px; border-radius: 3px;">${match}</span>`;
        }
      );
      
      // Pattern 2: "[visual element] should/must show..."
      processedPart = processedPart.replace(
        /\b(image|graph|chart|diagram|table|figure|illustration|picture|photo|screenshot|visual|graphic)\s+(?:should|must|needs to|required to)\s+(?:show|display|depict|illustrate|represent)[^.]*\./gi,
        (match) => {
          console.log(`[formatVisualRequirements] Found visual requirement: ${match.substring(0, 50)}...`);
          return `<span style="color: #28a745; font-weight: 600; background-color: #f0fff4; padding: 2px 4px; border-radius: 3px;">${match}</span>`;
        }
      );
      
      // Pattern 3: "requirement to include/add/show [visual element]"
      processedPart = processedPart.replace(
        /\b(requirement|required|must|should)\s+(?:to\s+)?(?:include|add|show|provide|create|insert)\s+(?:an?\s+)?(image|graph|chart|diagram|table|figure|illustration|picture|photo|screenshot|visual|graphic)[^.]*(?:\.[^.]*)?/gi,
        (match) => {
          console.log(`[formatVisualRequirements] Found requirement mention: ${match.substring(0, 50)}...`);
          return `<span style="color: #28a745; font-weight: 600; background-color: #f0fff4; padding: 2px 4px; border-radius: 3px;">${match}</span>`;
        }
      );
      
      return processedPart;
    });
    
    formatted = processedParts.join('');
    
    console.log(`[formatVisualRequirements] Processing complete. Formatted text length: ${formatted.length}`);
    return formatted;
  } catch (error) {
    console.error('[formatVisualRequirements] Error formatting visual requirements:', error);
    // Return original text if formatting fails
    return text;
  }
}

/**
 * Clean and format academic text for professional submission
 * Removes markdown, emojis, and formatting symbols while preserving content and citations
 * @param {string} text - Text to clean and format
 * @returns {string} Cleaned and formatted academic text
 */
function cleanAcademicText(text) {
  try {
    console.log('[cleanAcademicText] Starting academic text cleaning...');
    let cleaned = text;
    
    // Preserve HTML tags for visual requirements by temporarily replacing them
    const htmlPlaceholders = [];
    const htmlPattern = /<span style="[^"]*">[^<]*<\/span>/gi;
    let htmlMatch;
    let placeholderIndex = 0;
    
    while ((htmlMatch = htmlPattern.exec(cleaned)) !== null) {
      const placeholder = `__HTML_PLACEHOLDER_${placeholderIndex}__`;
      htmlPlaceholders.push({
        placeholder: placeholder,
        html: htmlMatch[0]
      });
      cleaned = cleaned.replace(htmlMatch[0], placeholder);
      placeholderIndex++;
    }
    
    // Remove markdown headers (# ## ### etc.) and convert to plain text headings
    cleaned = cleaned.replace(/^#{1,6}\s+(.+)$/gm, (match, title) => {
      // Convert markdown header to plain text heading
      return `\n${title.trim()}\n`;
    });
    
    // Remove asterisks used for bold/italic (**text** or *text*)
    // But preserve if it's part of a citation pattern like (Author, *Year*)
    cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1'); // Bold
    // Be careful with single asterisks - only remove if not part of citation
    cleaned = cleaned.replace(/\*([^*\n]+)\*/g, (match, content) => {
      // Don't remove if it looks like part of a citation (Author, Year format)
      if (/\([^)]*\)/.test(content) || /\d{4}/.test(content)) {
        return match;
      }
      return content;
    });
    
    // Remove markdown links but keep the text [text](url) -> text
    // But preserve if it's in a reference list format
    cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, (match, text) => {
      // If it looks like a reference (has author, year, title pattern), keep as is
      if (text.match(/\d{4}/) && text.length > 20) {
        return text;
      }
      return text;
    });
    
    // Remove bullet emojis and markdown bullets
    cleaned = cleaned.replace(/[•◦▪▫▪▫]\s*/g, ''); // Remove bullet emojis
    cleaned = cleaned.replace(/^[-*+]\s+/gm, ''); // Remove markdown bullet points at start of line
    
    // Remove hashtags but keep the word (e.g., #hashtag -> hashtag)
    cleaned = cleaned.replace(/#(\w+)/g, '$1');
    
    // Remove markdown code blocks
    cleaned = cleaned.replace(/```[\s\S]*?```/g, '');
    cleaned = cleaned.replace(/`([^`]+)`/g, '$1');
    
    // Remove markdown horizontal rules
    cleaned = cleaned.replace(/^[-*_]{3,}$/gm, '');
    
    // Clean up excessive whitespace but preserve paragraph breaks
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n'); // Max 2 newlines
    cleaned = cleaned.replace(/[ \t]+/g, ' '); // Multiple spaces to single space
    cleaned = cleaned.replace(/[ \t]+\n/g, '\n'); // Trailing spaces
    cleaned = cleaned.replace(/\n[ \t]+/g, '\n'); // Leading spaces after newline
    
    // Ensure proper paragraph structure
    // Split into paragraphs and clean each
    const paragraphs = cleaned.split(/\n\n+/);
    const cleanedParagraphs = paragraphs.map(para => {
      para = para.trim();
      if (!para) return '';
      
      // If it looks like a heading (short, no period, or ends with colon)
      if (para.length < 100 && (para.endsWith(':') || !para.match(/[.!?]$/))) {
        // It's likely a heading - ensure it's on its own line
        return para;
      }
      
      // Regular paragraph - ensure it starts with capital and ends properly
      if (para.length > 0) {
        // Capitalize first letter if needed
        para = para.charAt(0).toUpperCase() + para.slice(1);
      }
      
      return para;
    }).filter(p => p.length > 0);
    
    cleaned = cleanedParagraphs.join('\n\n');
    
    // Clean up section titles - ensure they're formatted clearly
    // Pattern: "Task 1 – Title" or "Section 1: Title" etc.
    cleaned = cleaned.replace(/^(Task \d+)[\s\-–—]+(.+)$/gmi, (match, taskNum, title) => {
      return `\n${taskNum} – ${title.trim()}\n`;
    });
    
    cleaned = cleaned.replace(/^(Section \d+)[\s:]+(.+)$/gmi, (match, sectionNum, title) => {
      return `\n${sectionNum} – ${title.trim()}\n`;
    });
    
    // Restore HTML placeholders
    htmlPlaceholders.forEach(({ placeholder, html }) => {
      cleaned = cleaned.replace(placeholder, html);
    });
    
    // Final cleanup - preserve Harvard citations and references
    // Harvard in-text citations: (Author, Year) - these use parentheses, NOT brackets
    // Reference list: Author, A. (Year). Title. Journal, etc. - may have URLs in brackets
    
    // Process line by line to preserve reference list formatting
    cleaned = cleaned.split('\n').map(line => {
      const trimmedLine = line.trim();
      
      // If line looks like a reference entry (has author name pattern, year, title)
      // Pattern: Starts with capital letter, has comma, has 4-digit year, may have URL
      if (trimmedLine.match(/^[A-Z][a-zA-Z\s,]+\(\d{4}\)/)) {
        // This is a reference list entry - preserve as-is (may have brackets for URLs)
        return line;
      }
      
      // If line contains URL patterns, preserve brackets around URLs
      if (trimmedLine.includes('http://') || trimmedLine.includes('https://') || trimmedLine.includes('www.')) {
        // URL present - preserve brackets that might contain URLs
        return line;
      }
      
      // For regular text lines, remove markdown-style square brackets
      // But preserve parentheses (used for Harvard citations)
      // Convert markdown link syntax [text](url) to just "text" or "text (url)" if URL is important
      let processedLine = line;
      
      // Remove markdown link brackets but keep the link text
      processedLine = processedLine.replace(/\[([^\]]+)\]/g, '$1');
      
      // Remove any remaining markdown link syntax ](url)
      processedLine = processedLine.replace(/\]\([^)]+\)/g, '');
      
      return processedLine;
    }).join('\n');
    
    // Ensure references section is properly formatted
    // Look for "References" or "Reference List" heading
    cleaned = cleaned.replace(/^(References?|Reference List)[\s:]*$/gmi, '\nReferences\n');
    
    // Clean up any double spaces that might have been created
    cleaned = cleaned.replace(/  +/g, ' ');
    cleaned = cleaned.replace(/\n\n\n+/g, '\n\n'); // Max 2 newlines
    
    console.log('[cleanAcademicText] Academic text cleaning complete.');
    return cleaned.trim();
  } catch (error) {
    console.error('[cleanAcademicText] Error cleaning academic text:', error);
    // Return original text if cleaning fails
    return text;
  }
}

/**
 * Check grammar and spelling in text
 * @param {string} text - Text to check
 * @returns {Promise<Object>} Grammar check results with corrections
 */
async function checkGrammar(text) {
  try {
    const prompt = `Check the following text for grammar, spelling, and style errors. 
Provide corrections and suggestions. Format your response as JSON:
{
  "score": <score out of 100>,
  "errors": [
    {
      "text": "<incorrect text>",
      "correction": "<corrected text>",
      "type": "<error type>"
    }
  ],
  "correctedText": "<fully corrected text>"
}

Text to check:
${text}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a grammar and writing expert. Always respond with valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 1500,
    });

    const result = JSON.parse(response.choices[0].message.content.trim());
    return result;
  } catch (error) {
    console.error('Error checking grammar:', error);
    throw new Error(`Failed to check grammar: ${error.message}`);
  }
}

/**
 * Format citations in the specified style (APA, MLA, etc.)
 * @param {string} text - Text with citations to format
 * @param {string} style - Citation style (APA, MLA, Chicago)
 * @returns {Promise<string>} Text with properly formatted citations
 */
async function formatCitations(text, style = 'APA') {
  try {
    const prompt = `Format all citations in the following text according to ${style} style guidelines. 
Keep all other content the same, only update citations.

Text:
${text}

Return the text with properly formatted ${style} citations:`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert in ${style} citation formatting.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error formatting citations:', error);
    throw new Error(`Failed to format citations: ${error.message}`);
  }
}

/**
 * Check if assignment complies with rubric requirements
 * @param {string} assignment - Generated assignment text
 * @param {string} requirements - Assignment requirements/rubric
 * @returns {Promise<Object>} Rubric compliance report
 */
async function checkRubricCompliance(assignment, requirements) {
  try {
    const prompt = `Check if the following assignment meets all the requirements in the rubric.
Provide a JSON response:
{
  "compliant": <true/false>,
  "score": <score out of 100>,
  "issues": ["<issue 1>", "<issue 2>", ...],
  "suggestions": ["<suggestion 1>", "<suggestion 2>", ...]
}

Assignment Requirements/Rubric:
${requirements}

Assignment Text:
${assignment}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at evaluating assignments against rubrics. Always respond with valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const result = JSON.parse(response.choices[0].message.content.trim());
    return result;
  } catch (error) {
    console.error('Error checking rubric:', error);
    throw new Error(`Failed to check rubric compliance: ${error.message}`);
  }
}

/**
 * Humanize text to avoid AI detection using multi-pass approach
 * @param {string} text - Text to humanize
 * @returns {Promise<string>} Humanized text
 */
async function humanizeText(text) {
  try {
    console.log('[humanizeText] Starting multi-pass humanization, text length:', text.length);
    const startTime = Date.now();
    
    // First pass: Major structural and pattern changes
    console.log('[humanizeText] Pass 1: Structural changes...');
    const firstPassStart = Date.now();
    const firstPass = await humanizePass(text, 'structural');
    console.log(`[humanizeText] Pass 1 completed in ${Date.now() - firstPassStart}ms`);
    
    // Second pass: Add natural imperfections and style variations
    console.log('[humanizeText] Pass 2: Style and imperfections...');
    const secondPassStart = Date.now();
    const secondPass = await humanizePass(firstPass, 'imperfections');
    console.log(`[humanizeText] Pass 2 completed in ${Date.now() - secondPassStart}ms`);
    
    // Third pass: Final polish with maximum humanization
    console.log('[humanizeText] Pass 3: Final polish...');
    const thirdPassStart = Date.now();
    const thirdPass = await humanizePass(secondPass, 'polish');
    console.log(`[humanizeText] Pass 3 completed in ${Date.now() - thirdPassStart}ms`);
    
    // Post-process for additional natural variations
    const finalText = postProcessHumanization(thirdPass);
    
    const totalTime = Date.now() - startTime;
    console.log(`[humanizeText] Humanization complete in ${totalTime}ms (${(totalTime/1000).toFixed(2)}s)`);
    return finalText;
  } catch (error) {
    console.error('[humanizeText] Error humanizing text:', error);
    console.error('[humanizeText] Error stack:', error.stack);
    throw new Error(`Failed to humanize text: ${error.message}`);
  }
}

/**
 * Fast humanization using 2-pass approach (for timeout-sensitive scenarios)
 * This is faster than the 3-pass version but still provides good humanization
 * @param {string} text - Text to humanize
 * @returns {Promise<string>} Humanized text
 */
async function humanizeTextFast(text) {
  try {
    console.log('[humanizeTextFast] Starting fast 2-pass humanization, text length:', text.length);
    const startTime = Date.now();
    
    // First pass: Combine structural changes and imperfections
    console.log('[humanizeTextFast] Pass 1: Structural changes...');
    const firstPassStart = Date.now();
    const firstPass = await humanizePass(text, 'structural');
    console.log(`[humanizeTextFast] Pass 1 completed in ${Date.now() - firstPassStart}ms`);
    
    // Second pass: Final polish
    console.log('[humanizeTextFast] Pass 2: Final polish...');
    const secondPassStart = Date.now();
    const secondPass = await humanizePass(firstPass, 'polish');
    console.log(`[humanizeTextFast] Pass 2 completed in ${Date.now() - secondPassStart}ms`);
    
    // Post-process for additional natural variations
    const finalText = postProcessHumanization(secondPass);
    
    const totalTime = Date.now() - startTime;
    console.log(`[humanizeTextFast] Fast humanization complete in ${totalTime}ms (${(totalTime/1000).toFixed(2)}s)`);
    return finalText;
  } catch (error) {
    console.error('[humanizeTextFast] Error humanizing text:', error);
    console.error('[humanizeTextFast] Error stack:', error.stack);
    throw new Error(`Failed to humanize text: ${error.message}`);
  }
}

/**
 * Single pass of humanization with specific focus
 * @param {string} text - Text to process
 * @param {string} passType - Type of pass: 'structural', 'imperfections', or 'polish'
 * @returns {Promise<string>} Processed text
 */
async function humanizePass(text, passType) {
  const prompts = {
    structural: `Rewrite this academic text with natural structural variations while maintaining all facts, citations, and academic integrity. Make it sound more human-written and less formulaic.

STRUCTURAL IMPROVEMENTS:
1. Vary paragraph length naturally (mix shorter and longer paragraphs)
2. Vary sentence length and structure throughout
3. Use natural transitions between ideas
4. Vary the placement of citations (some at start, some mid-sentence, some at end)
5. Use different ways to introduce ideas and evidence
6. Vary how you connect paragraphs
7. Use a mix of simple and complex sentences
8. Natural flow that doesn't feel robotic or overly structured

IMPORTANT: 
- Keep all facts, citations, and academic content exactly the same. Only change the structure and flow to make it more natural.
- PRESERVE ALL HTML TAGS EXACTLY AS THEY ARE. Do not modify, remove, or alter any HTML formatting tags (like <span style="...">...</span>). These are critical formatting markers and must remain unchanged.

Text:
${text}

Rewritten with natural structural variations (keep all facts, citations, HTML tags, and meaning identical):`,

    imperfections: `Refine this academic text to sound more natural and human-written while maintaining academic quality and accuracy.

NATURAL WRITING IMPROVEMENTS:
1. Vary word choice naturally (avoid excessive repetition, but don't overuse thesaurus)
2. Use natural academic phrasing (not overly formal or robotic)
3. Vary sentence structure (avoid starting every sentence the same way)
4. Use appropriate academic transitions naturally
5. Maintain consistent tone throughout
6. Ensure proper grammar and spelling (academic quality)
7. Use citations naturally within the text flow
8. Vary how you present evidence and arguments

IMPORTANT: 
- Maintain all facts, citations, and academic integrity. Keep the writing clear, accurate, and appropriate for undergraduate academic work.
- PRESERVE ALL HTML TAGS EXACTLY AS THEY ARE. Do not modify, remove, or alter any HTML formatting tags (like <span style="...">...</span>). These are critical formatting markers and must remain unchanged.

Text:
${text}

Refined with natural writing improvements (keep all facts, citations, HTML tags, and meaning identical):`,

    polish: `Finalize this academic text to ensure it sounds natural, human-written, and like work from a diligent undergraduate group. Maintain academic quality and integrity.

FINAL POLISH:
1. Ensure natural sentence length variation
2. Use light, natural transitions (avoid repetitive connectors)
3. Avoid robotic or formulaic phrasing
4. Maintain clear, simple academic English
5. Ensure citations are integrated naturally
6. Keep the writing engaging but academic
7. Vary how you present ideas and evidence
8. Ensure the text flows naturally from one idea to the next

IMPORTANT: 
- Keep all facts, citations, and academic content accurate. The writing should sound like a diligent undergraduate group wrote it - clear, accurate, and natural, but maintaining academic standards.
- PRESERVE ALL HTML TAGS EXACTLY AS THEY ARE. Do not modify, remove, or alter any HTML formatting tags (like <span style="...">...</span>). These are critical formatting markers and must remain unchanged.

Text:
${text}

Final polished version (keep all facts, citations, HTML tags, and meaning identical):`
  };

  const systemMessages = {
    structural: 'You are an academic writing assistant. Restructure the text to make it sound more natural and human-written while maintaining all facts and academic integrity. Vary sentence structure, paragraph length, and flow patterns naturally. Keep the writing clear and academic. Use PLAIN TEXT only - no markdown, no formatting symbols, no hashtags, no asterisks. CRITICAL: Preserve all HTML tags exactly as they are - do not modify, remove, or alter any HTML formatting.',
    imperfections: 'You are an academic writing assistant. Refine the text to sound more natural and human-written while maintaining academic quality. Add subtle natural variations in language, sentence structure, and flow. Keep all facts and citations accurate. Use PLAIN TEXT only - no markdown, no formatting symbols, no hashtags, no asterisks. CRITICAL: Preserve all HTML tags exactly as they are - do not modify, remove, or alter any HTML formatting.',
    polish: 'You are an academic writing assistant. Finalize the text to ensure it sounds natural, human-written, and like work from a diligent undergraduate group. Vary sentence length naturally, use light transitions, and avoid robotic phrasing. Maintain all facts, citations, and academic integrity. Use PLAIN TEXT only - no markdown, no formatting symbols, no hashtags, no asterisks. Format suitable for Microsoft Word submission. CRITICAL: Preserve all HTML tags exactly as they are - do not modify, remove, or alter any HTML formatting.'
  };

  try {
    console.log(`[humanizePass] Starting ${passType} pass, text length: ${text.length}`);
    const passStartTime = Date.now();

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: systemMessages[passType],
      },
      {
        role: 'user',
        content: prompts[passType],
      },
    ],
      temperature: 0.8, // Balanced variation for natural academic writing
    max_tokens: 3500,
  });

    const passDuration = Date.now() - passStartTime;
    console.log(`[humanizePass] ${passType} pass completed in ${passDuration}ms`);
    
    const result = response.choices[0].message.content.trim();
    console.log(`[humanizePass] ${passType} pass result length: ${result.length}`);
    return result;
  } catch (error) {
    console.error(`[humanizePass] Error in ${passType} pass:`, error);
    console.error(`[humanizePass] Error name:`, error.name);
    console.error(`[humanizePass] Error message:`, error.message);
    if (error.response) {
      console.error(`[humanizePass] Error response status:`, error.response.status);
      console.error(`[humanizePass] Error response data:`, error.response.data);
    }
    throw error;
  }
}

/**
 * Post-process text to add final natural variations
 * @param {string} text - Text to post-process
 * @returns {string} Post-processed text
 */
function postProcessHumanization(text) {
  let processed = text;
  
  // Occasionally add double spaces after periods (students do this)
  if (Math.random() > 0.6) {
    processed = processed.replace(/\. /g, (match) => {
      return Math.random() > 0.92 ? '.  ' : match;
    });
  }
  
  // Mix capitalization for common terms
  processed = processed.replace(/\bInternet\b/g, (match) => {
    return Math.random() > 0.4 ? 'internet' : match;
  });
  
  processed = processed.replace(/\bAI\b/g, (match) => {
    const rand = Math.random();
    if (rand > 0.6) return 'ai';
    if (rand > 0.3) return 'Ai';
    return match;
  });
  
  // Add occasional spacing inconsistencies around commas
  processed = processed.replace(/,/g, (match) => {
    if (Math.random() > 0.97) {
      return Math.random() > 0.5 ? ', ' : ',';
    }
    return match;
  });
  
  // Occasionally remove Oxford commas
  processed = processed.replace(/, and /g, (match) => {
    return Math.random() > 0.95 ? ' and ' : match;
  });
  
  // Add occasional inconsistent spacing around colons/semicolons
  processed = processed.replace(/[;:]/g, (match) => {
    if (Math.random() > 0.98) {
      return match + (Math.random() > 0.5 ? ' ' : '');
    }
    return match;
  });
  
  return processed;
}

module.exports = {
  explainTopic,
  generateAssignment,
  checkGrammar,
  formatCitations,
  checkRubricCompliance,
  humanizeText,
  humanizeTextFast,
  cleanAcademicText,
  formatVisualRequirements,
};

