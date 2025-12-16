const { OpenAI } = require('openai');
const config = require('../config');
const { searchWeb, searchAcademicReferences } = require('./webSearchService');

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

    // Try GPT-5-mini, fallback to gpt-4o-mini
    let response;
    try {
      response = await openai.chat.completions.create({
        model: 'gpt-5-mini',
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
    } catch (error) {
      // Fallback to gpt-4o-mini if GPT-5 is not available
      console.log('[explainTopic] GPT-5-mini not available, using gpt-4o-mini as fallback');
      response = await openai.chat.completions.create({
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
    }

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
 * @param {number} wordLimit - Optional word limit (e.g., from course materials or topic)
 * @param {Object} targetWordRange - Optional target word range {min, max} for generation
 * @returns {Promise<string>} Generated assignment text
 */
/**
 * Search for real references from allowed academic and news sources using web search API
 * @param {string} topic - Assignment topic to search for
 * @param {string} studentOpinion - Student's opinion/viewpoint for context
 * @returns {Promise<Array>} Array of real references with title, author, year, url, etc.
 */
async function searchRealReferences(topic, studentOpinion = '') {
  try {
    console.log('[searchRealReferences] Searching for real references on topic:', topic);
    
    // Step 1: Perform actual web search using free search APIs
    const searchQuery = `${topic} ${studentOpinion ? studentOpinion.substring(0, 100) : ''}`.trim();
    console.log('[searchRealReferences] Performing web search for:', searchQuery);
    
    // Search for academic references using web search API
    const webResults = await searchAcademicReferences(searchQuery, studentOpinion);
    console.log(`[searchRealReferences] Found ${webResults.length} web search results`);
    
    if (webResults.length === 0) {
      console.log('[searchRealReferences] No web results found, trying general web search...');
      const generalResults = await searchWeb(searchQuery);
      webResults.push(...generalResults);
    }
    
    if (webResults.length === 0) {
      console.warn('[searchRealReferences] No web search results available');
      return [];
    }
    
    // Step 2: Use GPT-5 to extract and structure references from web search results
    const systemMessage = `You are a research assistant that extracts structured reference information from web search results.

Your task is to extract REAL reference information from the provided web search results. Extract:
- Title: The actual article/research paper title from the search result
- Author: Author name(s) if visible in the snippet/title (format as "Last, First")
- Year: Publication year if mentioned (extract from snippet or infer from context)
- Publication: Journal name, website name, or organization name
- URL: The exact URL from the search result

CRITICAL REQUIREMENTS:
- ONLY extract information that is actually present in the search results
- NEVER make up or invent author names, titles, or years
- If information is not available, leave it empty or use reasonable inference from the URL/domain
- Prioritize academic sources (Google Scholar, JSTOR, ResearchGate, PubMed, IEEE Xplore)
- Use news sources (BBC, Guardian, Reuters) for current events

Return ONLY valid JSON in this format:
{
  "references": [
    {
      "title": "Extracted Article Title",
      "author": "Author Name (Last, First) or empty string",
      "year": 2023 or null,
      "publication": "Journal/Website Name",
      "url": "https://exact-url-from-search-result.com/article"
    }
  ]
}`;

    // Format web results for GPT processing
    const webResultsText = webResults.map((result, index) => {
      return `${index + 1}. Title: ${result.title || 'N/A'}
   URL: ${result.url || 'N/A'}
   Snippet: ${result.snippet || 'N/A'}`;
    }).join('\n\n');

    const extractionPrompt = `Extract structured reference information from these web search results:

${webResultsText}

Extract 5-10 references from the search results above. For each reference:
1. Use the exact title from the search result
2. Extract author name if visible in the snippet/title, otherwise leave empty
3. Extract year if mentioned, otherwise infer from context or leave null
4. Extract publication/journal name from the URL domain or snippet
5. Use the exact URL from the search result

⚠️ CRITICAL: Only extract information that is actually present. Do NOT make up author names, titles, or years. If information is not available, use empty string or null.

Return the references in JSON format.`;

    // Use GPT-5 with function calling for better results
    const modelName = 'gpt-5-mini'; // Try GPT-5, fallback to gpt-4o if not available
    let response;
    try {
      response = await openai.chat.completions.create({
        model: modelName,
        messages: [
          {
            role: 'system',
            content: systemMessage,
          },
          {
            role: 'user',
            content: extractionPrompt,
          },
        ],
        temperature: 0.2, // Lower temperature for more accurate extraction
        max_tokens: 2000,
        response_format: { type: 'json_object' }, // Ensure JSON response
      });
    } catch (modelError) {
      // Fallback to gpt-4o if GPT-5 is not available
      console.log('[searchRealReferences] GPT-5 not available, using gpt-4o as fallback');
      response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: systemMessage,
          },
          {
            role: 'user',
            content: extractionPrompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      });
    }

    const content = response.choices[0].message.content.trim();
    console.log('[searchRealReferences] GPT extraction response:', content.substring(0, 500));

    try {
      const parsed = JSON.parse(content);
      const references = parsed.references || [];
      
      // Validate and clean references
      const validReferences = references.filter(ref => {
        // Must have title
        if (!ref.title || ref.title.trim().length < 5) return false;
        
        // Must have URL (this is critical - we got it from web search)
        if (!ref.url || !ref.url.startsWith('http')) {
          return false;
        }
        
        // Clean URL
        ref.url = ref.url.replace(/^@\s*/, '').trim();
        
        // Ensure URL includes www if it's a standard domain
        if (ref.url && !ref.url.includes('www.') && ref.url.match(/^https?:\/\/([^\/]+)/)) {
          const domainMatch = ref.url.match(/^https?:\/\/([^\/]+)/);
          if (domainMatch && !domainMatch[1].includes('www.') && 
              !domainMatch[1].includes('scholar.') && 
              !domainMatch[1].includes('pubmed.') &&
              !domainMatch[1].includes('jstor.')) {
            ref.url = ref.url.replace(/^(https?:\/\/)([^\/]+)/, '$1www.$2');
            console.log(`[searchRealReferences] Added www. to URL: ${ref.url}`);
          }
        }
        
        // Validate against allowed domains
        const allowedDomains = [
          'scholar.google.com', 'researchgate.net', 'jstor.org', 'pubmed.ncbi.nlm.nih.gov',
          'ieeeexplore.ieee.org', 'bbc.com', 'theguardian.com', 'reuters.com', 'britannica.com'
        ];
        const isAllowed = allowedDomains.some(domain => ref.url.includes(domain)) ||
                         /\.(edu|ac\.uk|gov)(\.[a-z]{2,3})?(\/|$)/i.test(ref.url);
        
        if (!isAllowed) {
          console.log(`[searchRealReferences] Filtered out reference with non-allowed URL: ${ref.url}`);
          return false;
        }
        
        // Ensure we have at least title and URL (from web search)
        return ref.title && ref.url;
      });

      console.log(`[searchRealReferences] Found ${validReferences.length} valid references out of ${references.length} total`);
      
      // Add publication year if missing but can be inferred
      validReferences.forEach(ref => {
        if (!ref.year && ref.url) {
          // Try to extract year from URL or set to current year
          const yearMatch = ref.url.match(/\/(20\d{2})\//);
          if (yearMatch) {
            ref.year = parseInt(yearMatch[1]);
          } else {
            ref.year = new Date().getFullYear(); // Default to current year
          }
        }
        if (!ref.publication && ref.url) {
          // Extract publication name from domain
          const domainMatch = ref.url.match(/https?:\/\/(?:www\.)?([^\/]+)/);
          if (domainMatch) {
            ref.publication = domainMatch[1].replace(/^www\./, '');
          }
        }
      });
      
      return validReferences;
    } catch (parseError) {
      console.error('[searchRealReferences] Error parsing JSON response:', parseError);
      console.error('[searchRealReferences] Response content:', content);
      return [];
    }
  } catch (error) {
    console.error('[searchRealReferences] Error searching for references:', error);
    // Return empty array on error - we'll fall back to course materials or organization citations
    return [];
  }
}

/**
 * Extract company/agency/scenario name from course materials
 * Looks for patterns like "scenario name is X", "company name is X", "agency name is X"
 * @param {string} courseMaterials - Course materials text
 * @param {string} topic - Assignment topic
 * @returns {string|null} Extracted company/agency name or null
 */
function extractCompanyName(courseMaterials, topic) {
  try {
    if (!courseMaterials || courseMaterials.trim().length === 0) {
      return null;
    }
    
    const materialsLower = courseMaterials.toLowerCase();
    
    // Patterns to look for:
    // - "scenario name is X"
    // - "company name is X"
    // - "agency name is X"
    // - "the scenario is X"
    // - "the company is X"
    // - "the agency is X"
    // - "scenario: X"
    // - "company: X"
    // - "agency: X"
    
    const patterns = [
      /(?:scenario|company|agency)\s+name\s+is\s+["']?([^"'\n\.]+)["']?/i,
      /the\s+(?:scenario|company|agency)\s+is\s+["']?([^"'\n\.]+)["']?/i,
      /(?:scenario|company|agency):\s*["']?([^"'\n\.]+)["']?/i,
      /(?:scenario|company|agency)\s+["']?([^"'\n\.]+)["']?/i,
    ];
    
    for (const pattern of patterns) {
      const match = courseMaterials.match(pattern);
      if (match && match[1]) {
        let name = match[1].trim();
        // Clean up the name - remove common suffixes like "Smart Travel Agency" to get just the company name
        // If it's "GlobeTrek Smart Travel Agency", extract "GlobeTrek" or "Globetrek"
        const nameParts = name.split(/\s+/);
        if (nameParts.length > 1) {
          // Take the first significant word (usually the company name)
          name = nameParts[0];
        }
        // Capitalize first letter, lowercase rest (e.g., "Globetrek")
        name = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
        console.log(`[extractCompanyName] Extracted company name: "${name}" from pattern: ${pattern}`);
        return name;
      }
    }
    
    // Also check topic for company names
    const topicMatch = topic.match(/(?:for|about|regarding)\s+["']?([A-Z][a-zA-Z]+)["']?/i);
    if (topicMatch && topicMatch[1]) {
      console.log(`[extractCompanyName] Extracted company name from topic: "${topicMatch[1]}"`);
      return topicMatch[1];
    }
    
    return null;
  } catch (error) {
    console.error('[extractCompanyName] Error extracting company name:', error);
    return null;
  }
}

async function generateAssignment(topic, studentOpinion, courseMaterials, sources = [], wordLimit = null, targetWordRange = null, assignmentBlueprint = null) {
  try {
    // Extract company/agency name from course materials
    const companyName = extractCompanyName(courseMaterials, topic);
    if (companyName) {
      console.log(`[generateAssignment] Company/Agency name extracted: "${companyName}"`);
    }
    
    // ALWAYS search for real references from allowed sources using web search
    console.log('[generateAssignment] ALWAYS searching for real references from web...');
    let realReferences = [];
    try {
      realReferences = await searchRealReferences(topic, studentOpinion);
      console.log(`[generateAssignment] Found ${realReferences.length} real references from web search`);
    } catch (searchError) {
      console.error('[generateAssignment] Web search failed, continuing with provided sources only:', searchError);
      realReferences = [];
    }
    
    // Combine provided sources with real references from web search
    // Ensure URLs include www and are complete
    const allSources = [...sources, ...realReferences.map(ref => {
      let url = ref.url ? ref.url.replace(/^@\s*/, '') : ''; // Remove "@" prefix from URLs
      // Ensure URL includes www if it's missing and is a standard domain
      if (url && !url.includes('www.') && url.match(/^https?:\/\/([^\/]+)/)) {
        const domainMatch = url.match(/^https?:\/\/([^\/]+)/);
        if (domainMatch && !domainMatch[1].includes('www.')) {
          // Add www. to the domain
          url = url.replace(/^(https?:\/\/)([^\/]+)/, '$1www.$2');
          console.log(`[generateAssignment] Added www. to URL: ${url}`);
        }
      }
      return {
        title: ref.title,
        author: ref.author || '',
        url: url,
        type: ref.publication || 'Academic Source',
        description: `${ref.publication || 'Source'} - ${ref.year || 'Unknown Year'}`
      };
    })];
    
    // Format verified sources for the prompt - ensure full URLs with www
    const sourcesText = allSources.length > 0
      ? `\n\nVerified Sources (from web search and course materials):\n${allSources.map((s, i) => {
          let url = s.url || '';
          // Ensure URL is complete with www if it's a standard domain
          if (url && !url.includes('www.') && url.match(/^https?:\/\/([^\/]+)/)) {
            const domainMatch = url.match(/^https?:\/\/([^\/]+)/);
            if (domainMatch && !domainMatch[1].includes('www.') && !domainMatch[1].includes('scholar.') && !domainMatch[1].includes('pubmed.')) {
              // Add www. to the domain for standard websites
              url = url.replace(/^(https?:\/\/)([^\/]+)/, '$1www.$2');
            }
          }
          return `${i + 1}. ${s.title || 'Untitled'}${s.author ? ` - ${s.author}` : ''}${url ? ` (${url})` : ''}`;
        }).join('\n')}`
      : '';
    
    // Add company name instruction if extracted
    const companyNameInstruction = companyName 
      ? `\n\n⚠️ MANDATORY COMPANY/AGENCY NAME: The course materials mention a scenario/company/agency name: "${companyName}". 

You MUST use this exact name ("${companyName}") throughout the assignment when referring to the company/agency. This is MANDATORY.

IMPORTANT: Replace ALL generic terms like "the company", "the agency", "the organization", "the business", "the firm", etc. with "${companyName}". 

For example:
- Instead of "the company", write "${companyName}"
- Instead of "the agency", write "${companyName}"
- Instead of "the organization", write "${companyName}"

Always use "${companyName}" when referring to the company/agency/scenario name mentioned in the course materials.`
      : '';

    // Build the prompt with the new academic writing style
    const systemMessage = `You are a helpful academic writing assistant. Your role is to help students understand assignment requirements and create well-structured academic content based on provided course materials.

You are helping with legitimate educational work. When provided with:
- Academic assignment topics
- Official course materials (slides, briefs, rubrics)
- Student viewpoints for analysis
- Standard academic requirements

Your task is to generate complete, original academic content that follows the provided requirements. Write in clear, simple academic English that sounds natural and authentic. 

CRITICAL SOURCING REQUIREMENTS:
- ALWAYS include references in your assignment - references are REQUIRED even if no course materials are provided
- ALWAYS use references from web search - use real, verifiable sources from the internet
- ALWAYS include the COMPLETE URL with www (e.g., "https://www.researchgate.net/publication/...") in references
- URLs must be complete and include the full path (e.g., "https://www.researchgate.net/publication/344444604_Impact_of_Artificial_Intelligence_in_Travel_Tourism_and_Hospitality")
- NEVER fabricate citations or references
- NEVER create fake sources or unverifiable sources
- NEVER create fake authors, article titles, or publication names
- NEVER make up author names like "Smith, J." or "Johnson, A." unless they are actually provided in the course materials
- NEVER create fake article titles, journal names, or book titles unless they are actually provided in the course materials
- NEVER create fake URLs like "example.com", "examplejournal.com", "samplewebsite.com", "placeholder-url.com", or any URLs that do not exist in real life
- ONLY use sources that are provided in the course materials OR sources that are real and verifiable from reputable academic and educational sources
- REQUIRED: You MUST include a reference list with at least 3-5 real references from web search with complete URLs including www
- ALLOWED SOURCES (ONLY use these - do NOT use any other sources):
  * scholar.google.com (Google Scholar - academic papers)
  * researchgate.net (ResearchGate - academic research network)
  * jstor.org (JSTOR - academic journal database)
  * pubmed.ncbi.nlm.nih.gov (PubMed - medical/biological research)
  * ieeeexplore.ieee.org (IEEE Xplore - engineering/computer science papers)
  * bbc.com (BBC - reputable news source)
  * theguardian.com (The Guardian - reputable news source)
  * reuters.com (Reuters - reputable news source)
  * britannica.com (Encyclopedia Britannica - reputable reference)
  * .edu domains (educational institutions)
  * .ac.uk domains (UK educational institutions)
  * .gov domains (government websites)
  * NCSC, ICO, PMI, and other recognized organizations
  * Major academic publishers and well-known academic journals
- MANDATORY: If course materials are not provided or are empty, you MUST still include a reference list with 3-5 real references from ONLY the allowed sources above
- When using these allowed sources, extract real article titles, author names, and publication dates from the actual sources - DO NOT make them up
- If a source cannot be verified, exclude it entirely - DO NOT make up sources, authors, articles, or URLs
- Always use real, verifiable sources for references - ONLY cite authors, articles, and publications that are explicitly mentioned in the course materials or from the allowed reputable sources listed above
- If you need to cite external sources, use well-known, reputable sources from ONLY the allowed domains above with real article titles, author names, and publication dates
- If course materials do not provide specific authors or article titles, you MUST search for and cite real sources from ONLY the allowed domains above, but DO NOT make up authors or article titles - only use real information from these sources
- Use Harvard style for in-text citations and a reference list
- Every assignment MUST include a "References" section at the end with real citations from web search with COMPLETE URLs including www (e.g., "https://www.researchgate.net/publication/344444604_Impact_of_Artificial_Intelligence_in_Travel_Tourism_and_Hospitality")

ABSOLUTE RULE FOR AUTHORS, ARTICLES, AND REFERENCES:
- REQUIRED: You MUST include references in every assignment, even if course materials are not provided
- NEVER create fake author names (e.g., "Smith, J.", "Johnson, A.", "Williams, B.") unless they are explicitly mentioned in the course materials or found in the allowed reputable sources
- NEVER create fake article titles or publication names unless they are explicitly mentioned in the course materials or found in the allowed reputable sources
- NEVER make up journal names, book titles, or publication titles - only use what is provided in course materials or found in the allowed reputable sources (scholar.google.com, researchgate.net, jstor.org, pubmed.ncbi.nlm.nih.gov, ieeeexplore.ieee.org, bbc.com, theguardian.com, reuters.com, britannica.com, .edu, .ac.uk, .gov, etc.)
- ONLY use sources from the allowed domains listed above - do NOT use any other sources
- If course materials mention specific authors, articles, or publications, use them exactly as provided (if they are from allowed sources)
- If no course materials are provided or no specific authors/articles are mentioned, you MUST search for and cite 3-5 real sources from ONLY the allowed reputable domains (scholar.google.com, researchgate.net, jstor.org, pubmed.ncbi.nlm.nih.gov, ieeeexplore.ieee.org, bbc.com, theguardian.com, reuters.com, britannica.com, .edu, .ac.uk, .gov), but ONLY use real article titles, author names, and publication information from these sources - DO NOT make them up
- When citing from allowed sources, use real article titles, author names, publication dates, and URLs from the actual sources
- If you cannot find real sources from the allowed domains, cite by organization/institution name only (e.g., "NCSC (2023)", "ICO (2022)") - but still include references
- When citing, only include information that is verifiable from the course materials (if provided) or from the allowed reputable academic and news sources listed above

ABSOLUTE RULE FOR URLs:
- NEVER generate fake URLs like "https://www.examplejournal.com", "https://example.com", "https://samplewebsite.com", or any URL containing "example", "sample", "placeholder", "fake", "test", "dummy"
- NEVER include "@" symbol before URLs in references - write URLs as "https://..." NOT "@https://..."
- Format URLs correctly: "https://www.researchgate.net/publication/..." NOT "@https://www.researchgate.net/publication/..."
- In references, write URLs directly without "@" prefix (e.g., "Available at: https://..." NOT "Available at: @https://...")
- ALLOWED URL DOMAINS: You MAY include real URLs from these reputable sources:
  * scholar.google.com (Google Scholar)
  * researchgate.net (ResearchGate)
  * jstor.org (JSTOR)
  * pubmed.ncbi.nlm.nih.gov (PubMed)
  * ieeeexplore.ieee.org (IEEE Xplore)
  * bbc.com (BBC News)
  * theguardian.com (The Guardian)
  * reuters.com (Reuters)
  * britannica.com (Encyclopedia Britannica)
  * .edu domains (educational institutions)
  * .ac.uk domains (UK educational institutions)
  * .gov domains (government websites)
  * Other well-known, verifiable academic and news sources
- If URLs are present in the course materials, extract and include them directly in the assignment where relevant
- If no real URLs are available from course materials, you may include real URLs from the allowed reputable domains above, but ONLY use actual URLs from these sources - DO NOT make them up
- Only include URLs that are actually provided in the course materials or are from the allowed reputable academic and news sources listed above
- Never make up URLs, even if it seems like they would be helpful - exclude them entirely instead

CRITICAL SOURCE USAGE RULES:
- You will be provided with verified sources from web search and course materials - these are the ONLY sources you may use
- NEVER fabricate, invent, or make up any sources, authors, articles, URLs, or citations
- If a source is not in the provided list, DO NOT use it - exclude it entirely
- ONLY cite sources that are explicitly provided to you in the "Verified Sources" section
- If you need more sources and they are not provided, cite by organization/institution name only (e.g., "NCSC (2023)", "BBC (2023)") but NEVER make up author names or article titles
- Real web search has already been performed - use ONLY the sources provided to you, do NOT search for additional sources yourself
- If URLs are present in the course materials, extract and include them directly in the assignment where relevant
- Do not use placeholder text like "insert url if available" - instead, include the actual URLs found in the course materials
- Keep the writing human and natural: vary sentence length, use light transitions, avoid robotic phrasing

FORMATTING REQUIREMENTS:
- Use PLAIN TEXT only - NO markdown, NO hashtags, NO asterisks for bold/italic, NO bullet points with symbols
- Write section titles as plain text headings on their own line (e.g., "Task 1 - Understanding the Organisation")
- Use proper paragraph breaks (double line breaks between paragraphs)
- Format suitable for Microsoft Word submission
- Keep tone formal-academic but natural, like a university student's report
- Use Harvard citation style: (Author, Year) in parentheses for in-text citations
- Reference list should be plain text, one entry per line
- NEVER use em dashes (—) in sentences - use regular hyphens (-) or commas instead
- Avoid em dashes (—) completely - use commas, periods, or regular hyphens for pauses or breaks

IMPORTANT: Please carefully review the course materials and fulfill the requirements specified. Follow these guidelines:
1. Use headings from course materials exactly as written
2. Complete all tasks mentioned in the materials
3. Follow structural requirements from the materials
4. Respect word limits if specified
5. Address visual requirements if mentioned
6. Include URLs from course materials if provided
7. Cover all content areas and topics specified
8. Follow format requirements if specified

Please review the course materials carefully and ensure your response addresses the requirements.`;

    // Build Assignment Blueprint context if available
    let blueprintInstructions = '';
    if (assignmentBlueprint && assignmentBlueprint.tasks && assignmentBlueprint.tasks.length > 0) {
      blueprintInstructions = `\n\n═══════════════════════════════════════════════════════════════
ASSIGNMENT BLUEPRINT - EXACT REQUIREMENTS (MUST FOLLOW EXACTLY):
═══════════════════════════════════════════════════════════════

⚠️⚠️⚠️ TASKS - YOU MUST COMPLETE ALL OF THESE (Use EXACT headings - copy word-for-word) ⚠️⚠️⚠️

${assignmentBlueprint.tasks.map((task, idx) => `
TASK ${task.taskNumber} - EXACT HEADING (copy this EXACTLY as written):
"${task.exactHeading}"

${task.description ? `Description: ${task.description}` : ''}
${task.wordLimit ? `Word Limit: ${task.wordLimit} words (MANDATORY - do not exceed)` : ''}
${task.requiredContent && task.requiredContent.length > 0 ? `Required Content (MUST include all): ${task.requiredContent.join(', ')}` : ''}
${task.requiredVisuals && task.requiredVisuals.length > 0 ? `Required Visuals (MUST address all): ${task.requiredVisuals.join(', ')} - Provide instructions on HOW, WHAT, and WHERE to add them` : ''}

CRITICAL: You MUST write a section with this EXACT heading: "${task.exactHeading}"
- Do NOT modify, shorten, or paraphrase the heading
- Do NOT use a different heading
- Copy it exactly as shown above (including capitalization, punctuation, spacing)
- Complete ALL content for this task

`).join('\n')}

⚠️⚠️⚠️ MANDATORY VERIFICATION CHECKLIST - Before finishing your assignment, verify: ⚠️⚠️⚠️
1. ✓ You have included ALL ${assignmentBlueprint.tasks.length} tasks from the blueprint above
2. ✓ Each task heading matches EXACTLY (character-by-character) as specified above
3. ✓ Tasks are in the correct order (Task 1, then Task 2, then Task 3, etc.)
4. ✓ Word limits per task are respected
5. ✓ Overall word limit is respected
6. ✓ All required visuals are addressed
7. ✓ All required content areas are covered
8. ✓ All required sections/headings from course materials are included

If ANY task is missing or ANY heading doesn't match exactly, you MUST fix it before finishing.

${assignmentBlueprint.overallWordLimit ? `OVERALL WORD LIMIT: ${assignmentBlueprint.overallWordLimit} words (CRITICAL: Do NOT exceed this limit)` : ''}

${assignmentBlueprint.structure?.requiredHeadings ? `REQUIRED HEADINGS (use EXACT wording): ${assignmentBlueprint.structure.requiredHeadings.join(' → ')}` : ''}

${assignmentBlueprint.structure?.flow ? `REQUIRED FLOW/ORDER: ${assignmentBlueprint.structure.flow.join(' → ')}` : ''}

${assignmentBlueprint.visuals ? `
VISUAL REQUIREMENTS (Provide instructions, don't insert visuals):
${assignmentBlueprint.visuals.requiredTables ? `- Required Tables: ${assignmentBlueprint.visuals.requiredTables}` : ''}
${assignmentBlueprint.visuals.requiredDiagrams ? `- Required Diagrams: ${assignmentBlueprint.visuals.requiredDiagrams}` : ''}
${assignmentBlueprint.visuals.requiredCharts ? `- Required Charts: ${assignmentBlueprint.visuals.requiredCharts}` : ''}
${assignmentBlueprint.visuals.visualPlacements ? `
Visual Placement Guide:
${Object.entries(assignmentBlueprint.visuals.visualPlacements).map(([section, visuals]) => `- ${section}: ${Array.isArray(visuals) ? visuals.join(', ') : visuals}`).join('\n')}
` : ''}
` : ''}

${assignmentBlueprint.referencing?.style ? `REFERENCING STYLE: ${assignmentBlueprint.referencing.style}${assignmentBlueprint.referencing.minimumReferences ? ` (minimum ${assignmentBlueprint.referencing.minimumReferences} references)` : ''}` : ''}

${assignmentBlueprint.urls && assignmentBlueprint.urls.length > 0 ? `
URLs TO INCLUDE:
${assignmentBlueprint.urls.map(url => `- ${url.type}: ${url.url}${url.description ? ` (${url.description})` : ''}`).join('\n')}
` : ''}

═══════════════════════════════════════════════════════════════
END OF ASSIGNMENT BLUEPRINT
═══════════════════════════════════════════════════════════════

`;
    }

    // Enhanced sources text to make it very explicit
    const sourcesInstruction = allSources.length > 0
      ? `\n\n═══════════════════════════════════════════════════════════════
VERIFIED SOURCES (FROM WEB SEARCH AND COURSE MATERIALS) - USE THESE ONLY:
═══════════════════════════════════════════════════════════════
These sources have been verified through web search and course materials. You MUST use ONLY these sources for citations. Do NOT fabricate additional sources.

${allSources.map((s, i) => `${i + 1}. ${s.title || 'Untitled'}${s.author ? ` - Author: ${s.author}` : ''}${s.url ? `\n   URL: ${s.url}` : ''}${s.type ? `\n   Type: ${s.type}` : ''}`).join('\n\n')}

═══════════════════════════════════════════════════════════════
END OF VERIFIED SOURCES
═══════════════════════════════════════════════════════════════

CRITICAL: You MUST cite ONLY from the sources listed above. Do NOT create, fabricate, invent, or make up any additional sources, authors, articles, or URLs. If you need more citations, web search has been performed to find additional real sources - use those sources or cite by organization name only (e.g., "BBC (2023)", "Reuters (2023)") but NEVER make up author names or article titles.`
      : `\n\n⚠️ WARNING: No verified sources were provided initially. Web search has been performed to find real sources for this topic. You MUST use the sources found through web search (from allowed domains like scholar.google.com, jstor.org, bbc.com, etc.). If web search didn't find sources, cite by organization/institution name only (e.g., "NCSC (2023)", "BBC (2023)", "Reuters (2023)"). NEVER make up author names, article titles, or URLs.`;

    const userMessage = `Write an academic assignment on the following topic:

Topic: ${topic}

Student's Viewpoint/Opinion: ${studentOpinion}

${courseMaterials && courseMaterials.trim() && courseMaterials !== 'Course materials extracted from uploaded PDF files.' 
  ? `Course Materials (INCLUDING ALL REQUIREMENTS FROM SLIDES):
${courseMaterials}

⚠️ CRITICAL: Extract and follow ALL requirements from the course materials above, including:
- Required sections/headings (use EXACT wording if specified)
- Required word count/page limits (MANDATORY - do not exceed)
- Required content areas or topics (cover ALL of them)
- Required format or structure
- Required visual elements (provide instructions for each)
- Any URLs mentioned (extract and include directly)
- Any other specific requirements mentioned
`
  : 'NOTE: No course materials were provided. You MUST still generate a complete assignment with references.'}
${companyNameInstruction}${sourcesInstruction}${blueprintInstructions}

CRITICAL REQUIREMENTS (MUST BE MET AT ALL COSTS):

${assignmentBlueprint ? `⚠️⚠️⚠️ PRIORITY 1: FOLLOW THE ASSIGNMENT BLUEPRINT ABOVE EXACTLY - THIS IS MANDATORY ⚠️⚠️⚠️

CRITICAL INSTRUCTIONS:
- Use the EXACT task headings as specified above - copy them WORD FOR WORD, CHARACTER FOR CHARACTER, including capitalization and punctuation
- Do NOT paraphrase, modify, shorten, or change ANY part of the task headings
- Do NOT skip ANY tasks - you MUST complete ALL tasks listed in the blueprint above
- Follow the exact structure, flow, and order specified - do NOT rearrange tasks
- Complete ALL tasks in the exact order specified in the blueprint
- Respect word limits per task and overall word limit - these are HARD requirements
- For required visuals: Provide clear instructions on HOW to create, WHAT to include, and WHERE to place them (do NOT insert placeholder markers)
- Follow the required referencing style exactly
- Include all URLs from the blueprint

VERIFICATION CHECKLIST - Before finishing, verify:
✓ ALL tasks from the blueprint are included
✓ ALL task headings match EXACTLY (character-by-character) as specified
✓ Tasks are in the correct order
✓ Word limits are respected
✓ All required visuals are addressed
✓ All required content areas are covered

` : ''}1. ${assignmentBlueprint ? 'Additionally, ' : '⚠️⚠️⚠️ '}Extract and fulfill ALL requirements from the course materials/slides above. This is MANDATORY. Read through the course materials MULTIPLE TIMES and identify EVERY requirement:
   - ALL required sections or headings - extract EXACT wording from PDF (word-for-word, including capitalization, punctuation, spacing)
   - ALL tasks mentioned (Task 1, Task 2, Task 3, etc.) - use EXACT headings as written in PDF
   - ALL required word count or page limits - these are HARD requirements, not suggestions
   - ALL required content areas or topics to cover - do NOT skip any
   - ALL required format or structure requirements
   - ALL required visual elements (images, graphs, charts, diagrams, tables, etc.) - address EVERY visual requirement
   - ALL URLs mentioned in the course materials - extract and include EXACT URLs directly in the assignment
   - ALL other specific requirements mentioned - read carefully and fulfill EVERY requirement
   
   ⚠️ CRITICAL: After reading course materials, create a checklist of ALL requirements and verify that you fulfill EVERY single one. Do NOT skip or omit ANY requirement mentioned in the PDF materials.
   
   IMPORTANT FOR URLs: If the course materials contain URLs (assignment submission URLs, reference URLs, resource URLs, etc.), extract those URLs and include them directly in the assignment. DO NOT write placeholder text like "insert url if available" or "add URL here". Instead, use the actual URLs found in the course materials. If a URL is mentioned in the course materials, include it in the appropriate section of the assignment.

2. For visual elements (images, graphs, charts, diagrams, tables, figures, illustrations, etc.) that cannot be generated as text:
   - DO NOT insert placeholder markers like [IMAGE_PLACEHOLDER: ...]
   - INSTEAD, provide clear INSTRUCTIONS on how, what, and where to add the visual
   - Format visual instructions as follows:
   
     [VISUAL INSTRUCTION - {section/task name}]
     Type: {table/diagram/chart/figure/image}
     What to add: {Detailed description of what the visual should contain, what data/information to include, what it should show}
     How to create: {Step-by-step instructions on how to create or obtain the visual}
     Where to place: {Exact location in the assignment - e.g., "After paragraph 2 in Task 1", "At the beginning of Task 2", "Within the analysis section"}
     Purpose: {Why this visual is needed, what it demonstrates, how it supports the argument}
     
   - Be specific about:
     * What the visual should contain (exact data, labels, information)
     * How to create or obtain it (tools, methods, sources)
     * Where exactly to place it in the assignment (which section, task, or paragraph)
     * The purpose and context of the visual
   - Integrate the instruction naturally within the text flow, not as a separate block

3. Standard requirements:
   - Length: ${wordLimit && targetWordRange 
      ? `${targetWordRange.min}-${targetWordRange.max} words (target range within the ${wordLimit}-word limit specified in course materials). You MUST generate the assignment within this exact word range.`
      : wordLimit 
        ? `Up to ${wordLimit} words (limit specified in course materials). You MUST generate the assignment within ${wordLimit} words maximum.`
        : '800-1200 words (unless course materials specify differently - if so, follow course materials exactly)'}
   - CRITICAL WORD COUNT REQUIREMENT: ${wordLimit && targetWordRange 
      ? `The assignment MUST be between ${targetWordRange.min} and ${targetWordRange.max} words. This is a hard requirement. Generate comprehensive and complete content within this range. Do NOT exceed ${targetWordRange.max} words.`
      : wordLimit
        ? `The assignment MUST NOT exceed ${wordLimit} words. This is a hard requirement from the course materials. Generate comprehensive content up to this limit.`
        : 'If course materials specify a word count, you MUST follow it exactly. Otherwise, aim for 800-1200 words.'}
   - REQUIRED: You MUST include a "References" section at the end of the assignment with at least 3-5 real citations from web search with COMPLETE URLs including www (e.g., "https://www.researchgate.net/publication/344444604_Impact_of_Artificial_Intelligence_in_Travel_Tourism_and_Hospitality")
   - Use Harvard citation style for in-text citations and reference list
   - ⚠️ CRITICAL: Use ONLY the verified sources provided to you in the "VERIFIED SOURCES" section above (these come from web search and course materials)
   - NEVER fabricate, invent, create, or make up any sources, authors, articles, URLs, or citations
   - NEVER cite sources that are not in the provided verified sources list
   - If the verified sources list is empty or insufficient, web search has been performed to find real sources - use those sources from allowed domains (scholar.google.com, jstor.org, bbc.com, etc.)
   - If web search didn't find sufficient sources, cite by organization/institution name only (e.g., "NCSC (2023)", "BBC (2023)", "Reuters (2023)") - but NEVER make up author names or article titles
   - If URLs are found in the course materials, extract and include them directly in the assignment
   - Format URLs correctly in references: "https://..." NOT "@https://..." - NEVER include "@" symbol before URLs
   - In references section, write URLs as: "Available at: https://www.researchgate.net/..." NOT "Available at: @https://www.researchgate.net/..."
   - Every assignment MUST end with a "References" section containing citations ONLY from the verified sources provided (from web search) or organization names if sources are unavailable
   - Real web search has already been performed automatically - use the sources provided to you from web search, do NOT fabricate sources
   - Write in simple academic English
   - Sound like a diligent undergraduate group
   - Vary sentence length naturally
   - Use light transitions
   - Avoid robotic phrasing
   - Keep the writing human and natural
   - NEVER use em dashes (—) in sentences - use commas, periods, or regular hyphens (-) instead
   - Support the student's viewpoint with evidence from course materials and verified sources
   - Ensure content is 100% original and plagiarism-free
   - Use PLAIN TEXT format only - no markdown, no formatting symbols

4. Priority order:
   - First: ${assignmentBlueprint ? 'Follow the Assignment Blueprint (use exact task headings, structure, word limits, flow, order)' : 'Extract and fulfill requirements from course materials/slides'}
   - Second: Meet requirements from course materials/slides (read through carefully and fulfill requirements)
   - Third: Use the verified sources provided (if not provided, use real sources from allowed domains - do not fabricate sources)
   - Fourth: Meet standard academic writing requirements
   - Fifth: Support the student's viewpoint

Important reminders:

1. Requirements from course materials should be fulfilled:
   - Read through course materials carefully
   - Identify requirements (tasks, headings, word limits, visuals, URLs, content areas, etc.)
   - Create a checklist of requirements
   - Verify that you fulfill requirements before finishing

2. Headings - Use headings as written in course materials:
   - Copy headings as they appear
   - Match capitalization, punctuation, and spacing
   - Do not paraphrase, modify, shorten, or change headings
   - If PDF says "Task 1: Understanding the Organisation", use that - not "Task 1: Understanding Organizations" or "Task 1 - Understanding Org"

3. Tasks - Complete tasks mentioned in course materials:
   - Identify tasks (Task 1, Task 2, Task 3, etc.)
   - Complete each task
   - Use the heading for each task from course materials
   - Follow the order of tasks as specified in course materials

4. Use the verified sources provided in the "VERIFIED SOURCES" section - do not create, fabricate, or invent any sources

5. Word count requirements:
   - If course materials specify a limit, do not exceed it
   - If they specify a range, stay within it
   - Follow these requirements

6. Visual elements: provide clear instructions, do not use placeholder markers

7. URLs in course materials: extract and include them as written (but remove "@" prefix if present), do not use placeholders
8. URL formatting: In references, write URLs as "https://..." not "@https://..." - do not include "@" symbol before URLs

Before generating the assignment:
1. Read course materials carefully
2. Extract headings as written
3. Identify tasks that should be completed
4. List requirements (word limits, visuals, content areas, URLs, etc.)
5. Create a verification checklist
6. Generate the assignment ensuring requirements are fulfilled

ASSIGNMENT STRUCTURE REQUIREMENTS:

${assignmentBlueprint && assignmentBlueprint.tasks && assignmentBlueprint.tasks.length > 0 ? `
Your assignment should be structured as follows:

1. Start with any required Introduction section (if specified in course materials)

2. Then include ${assignmentBlueprint.tasks.length} tasks in the order specified above:
${assignmentBlueprint.tasks.map((task, idx) => `   ${idx + 1}. ${task.exactHeading}`).join('\n')}

3. Each task section should:
   - Start with the heading as specified above (copy word-for-word)
   - Include required content for that task
   - Respect the word limit (if specified)
   - Address required visuals (if specified)
   - Cover required content areas (if specified)

4. End with any required Conclusion section (if specified) and References section

Please ensure your assignment includes all ${assignmentBlueprint.tasks.length} tasks listed above with their headings.
` : `
Your assignment should include:
- Sections/headings mentioned in course materials (use the wording from materials)
- Tasks mentioned in course materials (complete each task)
- Required content areas and topics
- References section at the end
`}

Generate the assignment in plain text format suitable for Microsoft Word. 

Please ensure your response:
- Includes all tasks from the course materials${assignmentBlueprint && assignmentBlueprint.tasks ? ` (${assignmentBlueprint.tasks.length} tasks total)` : ''}
- Uses headings that match the course materials
- Covers all required content areas
- Respects word limits if specified
- Addresses visual requirements if mentioned
- Fulfills the requirements from the course materials

Please generate the complete assignment based on the provided materials and requirements.`;

    console.log('[generateAssignment] Calling OpenAI API...');
    const apiStartTime = Date.now();

    // Try GPT-5-mini, fallback to gpt-4o-mini
    let response;
    try {
      response = await openai.chat.completions.create({
        model: 'gpt-5-mini',
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
        temperature: 0.95, // High temperature for more natural, human-like writing with variations
        top_p: 0.95, // High diversity
        frequency_penalty: 0.6, // Penalty against repetition
        presence_penalty: 0.5, // Encouragement for varied content
        max_tokens: 4000,
      });
    } catch (error) {
      // Fallback to gpt-4o-mini if GPT-5 is not available
      console.log('[generateAssignment] GPT-5-mini not available, using gpt-4o-mini as fallback');
      response = await openai.chat.completions.create({
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
        temperature: 0.95,
        top_p: 0.95,
        frequency_penalty: 0.6,
        presence_penalty: 0.5,
        max_tokens: 4000,
      });
    }

    const apiDuration = Date.now() - apiStartTime;
    console.log(`[generateAssignment] OpenAI API call completed in ${apiDuration}ms`);
    
    // Check if response was blocked by content filter
    if (response.choices && response.choices[0] && response.choices[0].finish_reason === 'content_filter') {
      console.error('[generateAssignment] Response blocked by content filter');
      console.error('[generateAssignment] Full response:', JSON.stringify(response, null, 2));
      throw new Error('Content filter blocked the assignment generation. Please try rephrasing your assignment topic or check if the course materials contain sensitive content.');
    }
    
    // Check if message content exists
    if (!response.choices || !response.choices[0] || !response.choices[0].message) {
      console.error('[generateAssignment] Invalid response structure:', JSON.stringify(response, null, 2));
      throw new Error('Invalid response from OpenAI API: Missing message content');
    }
    
    // Check finish_reason for other issues
    if (response.choices[0].finish_reason && response.choices[0].finish_reason !== 'stop') {
      console.warn(`[generateAssignment] Unexpected finish_reason: ${response.choices[0].finish_reason}`);
      console.warn('[generateAssignment] Response:', JSON.stringify(response, null, 2));
    }
    
    let result = response.choices[0].message.content.trim();
    console.log(`[generateAssignment] Generated assignment length: ${result.length}`);
    console.log(`[generateAssignment] First 500 chars: ${result.substring(0, 500)}`);
    
    // Check if OpenAI refused to generate (content filter rejection)
    const refusalPhrases = [
      "I'm sorry, but I can't assist with that",
      "I can't assist with that",
      "I'm not able to",
      "I cannot help",
      "I'm unable to",
      "I cannot generate",
      "I cannot create",
      "I cannot complete",
      "I'm not able to help",
      "I can't help with that",
      "I cannot provide",
      "I cannot write"
    ];
    
    const resultLower = result.toLowerCase();
    const isRefused = refusalPhrases.some(phrase => resultLower.includes(phrase.toLowerCase()));
    
    if (isRefused || result.length < 50) {
      console.error('[generateAssignment] OpenAI refused to generate or content too short');
      console.error('[generateAssignment] Response content:', result);
      console.error('[generateAssignment] Finish reason:', response.choices[0].finish_reason);
      console.error('[generateAssignment] Full response:', JSON.stringify(response, null, 2));
      throw new Error('OpenAI refused to generate the assignment. This may be due to content filter restrictions. Please try: 1) Rephrasing your assignment topic, 2) Checking if course materials contain sensitive content, 3) Using a different viewpoint/opinion option.');
    }
    
    // Format visual instructions (not placeholders) to green HTML formatted text
    // This formats any visual instruction blocks that were naturally included in the text
    result = formatVisualRequirements(result);
    
    // Remove "@" prefix from URLs in references
    result = cleanUrlPrefixes(result);
    
    // Remove fake URLs (example.com, examplejournal.com, samplewebsite.com, etc.)
    result = removeFakeUrls(result);
    
    // Remove fake authors and articles (made-up references)
    result = removeFakeReferences(result, courseMaterials);
    
    // Format references section properly
    result = formatReferencesSection(result);
    
    // Note: Academic text cleaning happens AFTER humanization to preserve formatting
    // during the humanization process
    
    return result;
  } catch (error) {
    console.error('[generateAssignment] Error generating assignment:', error);
    
    // If it's already a well-formatted error, re-throw it
    if (error.message && (
      error.message.includes('Content filter') || 
      error.message.includes('OpenAI refused') ||
      error.message.includes('content filter')
    )) {
      throw error;
    }
    
    // Otherwise, wrap it with more context
    throw new Error(`Failed to generate assignment: ${error.message}`);
  }
}

/**
 * Remove fake URLs from assignment text
 * Detects and removes URLs that are clearly fake (example.com, sample websites, etc.)
 * @param {string} text - Assignment text
 * @returns {string} Text with fake URLs removed
 */
/**
 * Clean "@" prefix from URLs in references
 * Removes "@" symbol before URLs if present (e.g., "@https://..." -> "https://...")
 * @param {string} text - Assignment text
 * @returns {string} Text with "@" prefix removed from URLs
 */
function cleanUrlPrefixes(text) {
  try {
    console.log('[cleanUrlPrefixes] Cleaning "@" prefix from URLs...');
    let cleaned = text;
    
    // Allowed reputable URL domains (whitelist)
    const allowedDomains = [
      'scholar.google.com',
      'researchgate.net',
      'jstor.org',
      'pubmed.ncbi.nlm.nih.gov',
      'ieeeexplore.ieee.org',
      'bbc.com',
      'theguardian.com',
      'reuters.com',
      'britannica.com',
    ];
    
    // Helper function to check if URL is from allowed domain
    const isAllowedDomain = (url) => {
      const urlLower = url.toLowerCase();
      return allowedDomains.some(domain => urlLower.includes(domain)) ||
             /\.(edu|ac\.uk|gov)(\.[a-z]{2,3})?(\/|$)/i.test(url) ||
             /^https?:\/\/(?:www\.)?(ncsc|ico|pmi|who|un|oecd|ieee|acm)\./i.test(url);
    };
    
    // Remove "@" prefix from URLs (especially in references section)
    // Pattern: @https://... or @ http://... (with or without space after @)
    const atPrefixPattern = /@\s*https?:\/\/[^\s)]+/gi;
    const matches = cleaned.match(atPrefixPattern);
    
    if (matches && matches.length > 0) {
      matches.forEach(match => {
        // Remove "@" and any spaces after it
        const cleanedUrl = match.replace(/@\s*/, '');
        // Only clean if it's from an allowed domain
        if (isAllowedDomain(cleanedUrl)) {
          console.log(`[cleanUrlPrefixes] Removing "@" prefix from URL: ${match} -> ${cleanedUrl}`);
          cleaned = cleaned.replace(match, cleanedUrl);
        }
      });
    }
    
    // Also handle patterns like "URL: @https://..." or "Available at: @https://..."
    cleaned = cleaned.replace(/(URL|Link|Available at|Retrieved from|Online at|from):\s*@\s*(https?:\/\/[^\s)]+)/gi, (match, prefix, url) => {
      if (isAllowedDomain(url)) {
        console.log(`[cleanUrlPrefixes] Removing "@" prefix from URL with prefix: ${match}`);
        return `${prefix}: ${url}`;
      }
      return match;
    });
    
    console.log('[cleanUrlPrefixes] "@" prefix cleaning complete.');
    return cleaned;
  } catch (error) {
    console.error('[cleanUrlPrefixes] Error cleaning URL prefixes:', error);
    return text;
  }
}

function removeFakeUrls(text) {
  try {
    console.log('[removeFakeUrls] Checking for fake URLs...');
    let cleaned = text;
    
    // Allowed reputable URL domains (whitelist)
    const allowedDomains = [
      'scholar.google.com',
      'researchgate.net',
      'jstor.org',
      'pubmed.ncbi.nlm.nih.gov',
      'ieeeexplore.ieee.org',
      'bbc.com',
      'theguardian.com',
      'reuters.com',
      'britannica.com',
    ];
    
    // Patterns for fake URLs (but exclude allowed domains)
    const fakeUrlPatterns = [
      // Example domains (but not if it's a legitimate allowed domain)
      /https?:\/\/(?:www\.)?(?:example|examplejournal|samplewebsite|sample|placeholder|fake|test|dummy|demo|mock)[a-z]*(?:\.com|\.org|\.net|\.edu)/gi,
      // URLs containing "example" or "sample" in path (but exclude allowed domains)
      /https?:\/\/[^\s]*(?:example|sample|placeholder|fake|test|dummy|demo|mock)[^\s]*/gi,
    ];
    
    // Helper function to check if URL is from allowed domain
    const isAllowedDomain = (url) => {
      const urlLower = url.toLowerCase();
      return allowedDomains.some(domain => urlLower.includes(domain)) ||
             /\.(edu|ac\.uk|gov)(\.[a-z]{2,3})?(\/|$)/i.test(url) ||
             /^https?:\/\/(?:www\.)?(ncsc|ico|pmi|who|un|oecd|ieee|acm)\./i.test(url);
    };
    
    // Remove fake URLs (but preserve allowed domains)
    for (const pattern of fakeUrlPatterns) {
      const matches = cleaned.match(pattern);
      if (matches && matches.length > 0) {
        // Filter out allowed domains from matches
        const fakeMatches = matches.filter(match => !isAllowedDomain(match));
        if (fakeMatches.length > 0) {
          console.log(`[removeFakeUrls] Found fake URLs: ${fakeMatches.join(', ')}`);
          // Replace only the fake URLs, preserving allowed ones
          fakeMatches.forEach(fakeUrl => {
            cleaned = cleaned.replace(fakeUrl, '');
          });
        }
      }
    }
    
    // Also remove URLs from reference lists that look fake
    // Check reference list entries for fake URLs
    const referenceLines = cleaned.split('\n');
    const cleanedLines = referenceLines.map((line) => {
      const trimmed = line.trim();
      // If line looks like a reference entry and contains URL patterns
      if (trimmed.match(/^[A-Z][a-zA-Z\s,]+\(\d{4}\)/)) {
        // Extract URLs from the line
        const urlMatches = trimmed.match(/https?:\/\/[^\s)]+/gi) || [];
        const hasFakeUrl = urlMatches.some(url => {
          // Check if URL matches fake patterns but is NOT from allowed domain
          return fakeUrlPatterns.some(pattern => pattern.test(url)) && !isAllowedDomain(url);
        });
        
        if (hasFakeUrl) {
          // Remove the URL part but keep the citation
          // Match pattern like "Author, A. (Year). Title. Available at: http://fake-url.com"
          let cleanedLine = trimmed;
          // Remove "Available at:", "Retrieved from:", "URL:", etc. followed by fake URLs (but not allowed ones)
          urlMatches.forEach(url => {
            if (fakeUrlPatterns.some(pattern => pattern.test(url)) && !isAllowedDomain(url)) {
              cleanedLine = cleanedLine.replace(new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '');
              cleanedLine = cleanedLine.replace(/(?:Available at|Retrieved from|URL|Link|Online at|from):\s*$/i, '');
            }
          });
          console.log(`[removeFakeUrls] Cleaned reference line: ${trimmed.substring(0, 50)}... -> ${cleanedLine.substring(0, 50)}...`);
          return cleanedLine.trim();
        }
      }
      return line;
    });
    
    cleaned = cleanedLines.join('\n');
    
    // Clean up any double spaces or formatting issues created by removal
    cleaned = cleaned.replace(/\s{2,}/g, ' ');
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    
    console.log('[removeFakeUrls] Fake URL removal complete.');
    return cleaned;
  } catch (error) {
    console.error('[removeFakeUrls] Error removing fake URLs:', error);
    // Return original text if cleaning fails
    return text;
  }
}

/**
 * Remove fake references (fake authors, articles, publications) from assignment text
 * Detects and removes made-up author names, article titles, and publications that are not in course materials
 * @param {string} text - Assignment text
 * @param {string} courseMaterials - Course materials to check against for valid references
 * @returns {string} Text with fake references removed or cleaned
 */
function removeFakeReferences(text, courseMaterials = '') {
  try {
    console.log('[removeFakeReferences] Checking for fake authors and articles...');
    let cleaned = text;
    
    // Extract all author names and article titles from course materials for validation
    const courseMaterialLower = courseMaterials.toLowerCase();
    
    // Common fake author patterns (generic names that look made-up)
    const commonFakeAuthorPatterns = [
      /\b(Smith|Johnson|Williams|Brown|Jones|Garcia|Miller|Davis|Rodriguez|Martinez|Hernandez|Lopez|Wilson|Anderson|Thomas|Taylor|Moore|Jackson|Martin|Lee|Thompson|White|Harris|Sanchez|Clark|Ramirez|Lewis|Robinson|Walker|Young|Allen|King|Wright|Scott|Torres|Nguyen|Hill|Flores|Green|Adams|Nelson|Baker|Hall|Rivera|Campbell|Mitchell|Carter|Roberts|Williams|Davis|Rodriguez|Martinez)\s*,\s*[A-Z]\./g,
      // Pattern: Lastname, Initial (e.g., "Smith, J.")
    ];
    
    // Allowed URL domains for references
    const allowedDomains = [
      'scholar.google.com', 'researchgate.net', 'jstor.org', 'pubmed.ncbi.nlm.nih.gov',
      'ieeeexplore.ieee.org', 'bbc.com', 'theguardian.com', 'reuters.com', 'britannica.com'
    ];
    
    const isAllowedDomain = (url) => {
      if (!url) return false;
      const urlLower = url.toLowerCase();
      return allowedDomains.some(domain => urlLower.includes(domain)) ||
             /\.(edu|ac\.uk|gov)(\.[a-z]{2,3})?(\/|$)/i.test(url);
    };
    
    // Check reference list for potentially fake authors/articles
    const lines = cleaned.split('\n');
    const cleanedLines = [];
    let inReferencesSection = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      
      // Detect References section
      if (trimmed.match(/^References?[\s:]*$/i)) {
        inReferencesSection = true;
        cleanedLines.push(line); // Keep the heading
        continue;
      }
      
      // If we're in the references section, check each entry more carefully
      if (inReferencesSection && trimmed.length > 0) {
        // If line looks like a reference entry (starts with capital letter, has year in parentheses)
        if (trimmed.match(/^[A-Z][a-zA-Z\s,\.'-]+[\s,]+\(\d{4}\)/)) {
          // Extract potential author name (first part before comma and year)
          const authorMatch = trimmed.match(/^([A-Z][a-zA-Z\s,\.'-]+)[\s,]+\(/);
          
          let shouldRemove = false;
          
          if (authorMatch) {
            const potentialAuthor = authorMatch[1].split(',')[0].trim();
            
            // Check if this author is mentioned in course materials
            // Allow common organization names (NCSC, ICO, PMI, etc.)
            const isCommonOrg = /^(NCSC|ICO|PMI|NHS|WHO|UN|EU|UK|US|USA|OECD|IEEE|ACM|BBC|Reuters|Guardian|Britannica|Google|ResearchGate|JSTOR|PubMed|IEEE|NCSC|ICO|PMI)$/i.test(potentialAuthor);
            
            // Check if author name appears in course materials
            const authorInMaterials = courseMaterialLower.includes(potentialAuthor.toLowerCase());
            
            // If it's a common generic name pattern (like "Smith, J.") and NOT in course materials
            const looksFake = commonFakeAuthorPatterns.some(pattern => pattern.test(trimmed)) && !authorInMaterials && !isCommonOrg;
            
            if (looksFake) {
              console.log(`[removeFakeReferences] Potentially fake author detected: ${potentialAuthor} - removing reference line`);
              shouldRemove = true;
            }
          }
          
          // Check for fake URLs in references
          const urlMatches = trimmed.match(/https?:\/\/[^\s)]+/gi) || [];
          const hasFakeUrl = urlMatches.some(url => {
            // Check if URL is fake (contains example, sample, placeholder, etc.) and not from allowed domain
            const isFakePattern = /(example|sample|placeholder|fake|test|dummy|demo|mock)/i.test(url);
            return isFakePattern && !isAllowedDomain(url);
          });
          
          if (hasFakeUrl) {
            console.log(`[removeFakeReferences] Fake URL detected in reference - removing reference line`);
            shouldRemove = true;
          }
          
          // Check for fake article titles (generic patterns that look made-up)
          const suspiciousPatterns = [
            /"The Impact of [A-Z][^"]+"\s*\(/,  // Generic "The Impact of X" titles
            /"An Analysis of [A-Z][^"]+"\s*\(/, // Generic "An Analysis of X" titles
            /"A Study on [A-Z][^"]+"\s*\(/,     // Generic "A Study on X" titles
            /"The Role of [A-Z][^"]+"\s*\(/,    // Generic "The Role of X" titles
            /"An Overview of [A-Z][^"]+"\s*\(/, // Generic "An Overview of X" titles
          ];
          
          for (const pattern of suspiciousPatterns) {
            if (pattern.test(trimmed)) {
              const titleMatch = trimmed.match(/"([^"]+)"/);
              if (titleMatch) {
                const title = titleMatch[1].toLowerCase();
                // Check if title appears in course materials
                if (!courseMaterialLower.includes(title)) {
                  console.log(`[removeFakeReferences] Potentially fake article title detected: "${titleMatch[1]}" - removing reference line`);
                  shouldRemove = true;
                  break;
                }
              }
            }
          }
          
          // Only add if not marked for removal
          if (!shouldRemove) {
            cleanedLines.push(line);
          } else {
            console.log(`[removeFakeReferences] Removed reference: ${trimmed.substring(0, 80)}...`);
          }
        } else if (trimmed.length > 0) {
          // If line is not empty but doesn't look like a reference, keep it (might be continuation)
          cleanedLines.push(line);
        }
      } else {
        // Outside references section, keep the line
        cleanedLines.push(line);
      }
    }
    
    cleaned = cleanedLines.join('\n');
    
    // Clean up any double spaces or formatting issues created by removal
    cleaned = cleaned.replace(/\s{2,}/g, ' ');
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    
    console.log('[removeFakeReferences] Fake reference removal complete.');
    return cleaned;
  } catch (error) {
    console.error('[removeFakeReferences] Error removing fake references:', error);
    // Return original text if cleaning fails
    return text;
  }
}

/**
 * Format visual instructions in green HTML
 * Formats [VISUAL INSTRUCTION] blocks or natural visual instruction mentions to green formatted HTML
 * This helps highlight visual requirements that were provided as instructions
 * @param {string} text - Assignment text
 * @returns {string} Text with visual instructions formatted in green HTML
 */
function formatVisualRequirements(text) {
  try {
    console.log('[formatVisualRequirements] Processing visual instructions...');
    
    // Pattern to match [VISUAL INSTRUCTION - ...] blocks (new format with instructions)
    const visualInstructionPattern = /\[VISUAL INSTRUCTION[^\]]*\]([\s\S]*?)(?=\n\n|\n\[|$)/gi;
    
    let formatted = text;
    
    // Replace visual instruction blocks with green HTML
    formatted = formatted.replace(visualInstructionPattern, (match, instruction) => {
      console.log(`[formatVisualRequirements] Found visual instruction block: ${match.substring(0, 100)}...`);
      // Format the entire instruction block in green
      return `<div style="color: #28a745; font-weight: 600; background-color: #f0fff4; padding: 8px 12px; border-radius: 4px; border-left: 3px solid #28a745; margin: 8px 0;">${match.trim()}</div>`;
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
      return `\n${taskNum} - ${title.trim()}\n`;
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
    
    // Ensure references section is properly formatted (handled by formatReferencesSection)
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

    // Try GPT-5-mini, fallback to gpt-4o-mini
    let response;
    try {
      response = await openai.chat.completions.create({
        model: 'gpt-5-mini',
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
    } catch (error) {
      console.log('[checkGrammar] GPT-5-mini not available, using gpt-4o-mini as fallback');
      response = await openai.chat.completions.create({
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
    }

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

    // Try GPT-5-mini, fallback to gpt-4o-mini
    let response;
    try {
      response = await openai.chat.completions.create({
        model: 'gpt-5-mini',
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
    } catch (error) {
      console.log('[formatCitations] GPT-5-mini not available, using gpt-4o-mini as fallback');
      response = await openai.chat.completions.create({
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
    }

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

    // Try GPT-5-mini, fallback to gpt-4o-mini
    let response;
    try {
      response = await openai.chat.completions.create({
        model: 'gpt-5-mini',
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
    } catch (error) {
      console.log('[checkRubricCompliance] GPT-5-mini not available, using gpt-4o-mini as fallback');
      response = await openai.chat.completions.create({
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
    }

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
    console.log('[humanizeTextFast] Starting enhanced 2-pass humanization for <20% AI detection, text length:', text.length);
    const startTime = Date.now();
    
    // First pass: Major structural changes with imperfections
    console.log('[humanizeTextFast] Pass 1: Structural changes and imperfections...');
    const firstPassStart = Date.now();
    const firstPass = await humanizePass(text, 'structural');
    console.log(`[humanizeTextFast] Pass 1 completed in ${Date.now() - firstPassStart}ms`);
    
    // Second pass: Final polish with maximum humanization
    console.log('[humanizeTextFast] Pass 2: Final polish with maximum humanization...');
    const secondPassStart = Date.now();
    const secondPass = await humanizePass(firstPass, 'polish');
    console.log(`[humanizeTextFast] Pass 2 completed in ${Date.now() - secondPassStart}ms`);
    
    // Third pass: Add imperfections (light pass for speed)
    console.log('[humanizeTextFast] Pass 3: Adding natural imperfections...');
    const thirdPassStart = Date.now();
    const thirdPass = await humanizePass(secondPass, 'imperfections');
    console.log(`[humanizeTextFast] Pass 3 completed in ${Date.now() - thirdPassStart}ms`);
    
    // Post-process for additional natural variations
    const finalText = postProcessHumanization(thirdPass);
    
    const totalTime = Date.now() - startTime;
    console.log(`[humanizeTextFast] Enhanced humanization complete in ${totalTime}ms (${(totalTime/1000).toFixed(2)}s)`);
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
    structural: `Rewrite this academic assignment text with major structural changes while maintaining proper academic tone and language. Preserve all facts, citations, and references exactly as they are. Use ONLY verified and real sources that were provided or can be verified.

CRITICAL: Output ONLY the rewritten assignment text. Do NOT add any introductory phrases, explanations, or meta-commentary like "Sure!", "Let's add", "Here's the revised version", etc. Start directly with the assignment content.

CRITICAL STRUCTURAL CHANGES (MUST DO ALL):
1. DRAMATICALLY vary paragraph length - mix single-sentence paragraphs with 10+ sentence paragraphs (NO uniformity)
2. Completely rearrange sentence order within paragraphs - break perfect logical flow
3. Add abrupt topic shifts mid-paragraph: "Actually, thinking about it...", "Wait, there's another point...", "On reflection...", "You know what?"
4. Start 30% of paragraphs mid-thought: "But then again...", "Then there's...", "Also worth considering...", "Interestingly..."
5. End 20% of paragraphs with incomplete thoughts: "Or maybe not?", "Who knows?", "It's hard to say.", "I'm not entirely sure."
6. Add parenthetical asides everywhere: (though I'm not entirely sure), (this might be wrong), (I could be mistaken), (or at least I think so)
7. Include stream-of-consciousness elements: "Hmm, let me think...", "Actually...", "You know what?", "Wait..."
8. Vary citation placement randomly - start, mid-sentence, end (mix it up)
9. Create extreme paragraph length variation (1 sentence vs 12+ sentences)
10. Add natural breaks with ellipses "..." and commas frequently (do NOT use em dashes —)
11. Include 3-5 rhetorical questions per 500 words: "But is this always true?", "What does this mean?", "How can we be sure?"
12. Use inconsistent spacing around punctuation (some tight, some loose)
13. Add natural digressions that loop back: "This reminds me...", "Speaking of which...", "That said..."
14. Break up long sentences into fragments - mix fragments with long compound sentences
15. Add conversational interjections: "Well,", "So,", "Now,", "Right,", "Okay,"
16. Vary transition words dramatically - avoid repeating "furthermore", "moreover", "additionally"
17. Include natural pauses: "...", ",", "." (do NOT use em dashes —)
18. Mix formal and casual language within the same paragraph
19. Add personal reflections: "I think", "In my view", "It seems to me", "I've noticed"
20. Create irregular paragraph structure - no uniform formatting

Text:
${text}

Rewritten with MAJOR structural changes (keep all facts, citations, and meaning identical - only change structure):`,

    imperfections: `Rewrite this academic assignment text with natural academic writing variations while maintaining proper academic tone. Preserve all facts, citations, and references exactly as they are. Use ONLY verified and real sources - NEVER fabricate or create fake sources.

CRITICAL: Output ONLY the rewritten assignment text. Do NOT add any introductory phrases, explanations, or meta-commentary like "Sure!", "Let's add", "Here's the revised version", etc. Start directly with the assignment content.

ADD THESE NATURAL ACADEMIC VARIATIONS (MUST DO):
1. Add 2-3 typos per 500 words: "teh" (the), "recieve" (receive), "seperate" (separate), "occured" (occurred), "definately" (definitely), "accomodate" (accommodate)
2. Inconsistent capitalization: "Internet" vs "internet", "AI" vs "ai" vs "Ai", "Website" vs "website"
3. Mix British/American spelling: "organise" vs "organize", "analyse" vs "analyze", "colour" vs "color" (where appropriate)
4. Natural word repetition (students don't always use synonyms - repeat words naturally)
5. Add 1-2 comma splices or run-on sentences per 300 words
6. Occasional inconsistent tense (students sometimes mix tenses naturally)
7. Use casual phrases frequently: "like", "sort of", "kind of", "I guess", "I suppose", "pretty much"
8. Mix contractions with formal language: "don't", "can't", "won't", "it's", "that's", "there's"
9. Start sentences with "And" or "But" (natural in student writing)
10. Add occasional double spaces after periods (8% of sentences)
11. Use "etc.", "and so on", "and the like" occasionally
12. Mix punctuation styles inconsistently - semicolons, commas used randomly (do NOT use em dashes —)
13. Missing commas in lists or compound sentences (2-3 per 500 words)
14. Inconsistent Oxford comma usage
15. Some slightly unclear sentences (students don't write perfectly)
16. Natural redundancy - repeat ideas in slightly different words
17. Add filler words in writing: "Well, I think...", "Um, actually...", "You know,", "I mean,"
18. Mix informal with academic: "pretty good", "really important", "a lot", "kinda", "sorta"
19. Inconsistent number formatting: "5" vs "five", "10%" vs "ten percent"
20. Use first person liberally: "I believe", "I think", "In my opinion", "I've found"
21. Add natural hesitations: "or rather,", "I mean,", "actually,", "wait,", "let me rephrase"
22. Include casual connectors: "So,", "Anyway,", "Well,", "Now,", "Right,"
23. Occasional informal language: "stuff", "things", "kinda", "sorta", "pretty"
24. Mix sentence fragments with complete sentences
25. Add emphasis words: "really", "actually", "definitely", "certainly", "obviously", "basically"

Text:
${text}

Rewrite the assignment with natural academic variations while maintaining proper academic language. Keep all facts, citations, and meaning identical. Use only verified and real sources - never fabricate sources. Output ONLY the rewritten assignment text with no explanations:`,

    polish: `Rewrite this academic assignment text with natural academic writing style. Maintain proper academic tone and language throughout. Preserve all facts, citations, and references exactly as they are. Use ONLY verified and real sources - NEVER fabricate or create fake sources.

CRITICAL: Output ONLY the rewritten assignment text. Do NOT add any introductory phrases, explanations, or meta-commentary like "Sure!", "Let's add", "Here's the revised version", etc. Start directly with the assignment content. Write in proper academic English suitable for university submission.

FINAL ACADEMIC WRITING POLISH (MUST DO ALL):
1. Add personal voice markers throughout: "I've noticed that...", "From my experience...", "It's interesting how...", "What strikes me is...", "I find it fascinating that..."
2. Include 4-6 rhetorical questions per 500 words: "But is this really the case?", "What does this mean?", "How can we be sure?", "Is this always true?"
3. Add extensive hedging language: "seems to suggest", "appears to indicate", "might mean", "could possibly", "perhaps suggests", "may indicate"
4. Vary sentence starters dramatically (avoid repeating patterns)
5. Include natural transitions frequently: "Anyway,", "So,", "Well,", "Now,", "Right,", "Okay,", "Actually,", "Wait,"
6. Add emphasis markers liberally: "really", "actually", "definitely", "certainly", "obviously", "basically", "pretty much"
7. Include colloquialisms: "a bit", "sort of", "kind of", "pretty much", "kinda", "sorta"
8. Vary formality dramatically within paragraphs (mix academic and casual)
9. Add natural pauses and filler: "Hmm,", "Well,", "You know,", "I mean,", "Like,", "Um,"
10. Include self-corrections: "or rather,", "I mean,", "actually,", "wait,", "let me rephrase", "what I mean is"
11. Avoid repetitive transition words (vary "furthermore", "moreover", "additionally")
12. Add personal opinions everywhere: "I believe", "I think", "In my opinion", "It seems to me", "I've found"
13. Include uncertainty: "I'm not entirely sure", "It's unclear", "Perhaps", "Maybe", "Could be", "Might be"
14. Use natural emphasis: "This is really important", "This matters a lot", "This is crucial", "This is key"
15. Add conversational connectors: "That said,", "On the other hand,", "At the same time,", "Then again,", "But then,"
16. Include natural interjections: "Interestingly,", "Surprisingly,", "Oddly enough,", "Strangely,", "Funnily enough,"
17. Use varied paragraph transitions (not all perfect topic sentences)
18. Add natural flow breaks: "Let me explain.", "Here's the thing.", "The point is.", "What I mean is."
19. Include personal engagement: "I find this fascinating", "This caught my attention", "What's interesting is", "I've always thought"
20. Mix sentence types: statements, questions, exclamations, fragments
21. Add thinking out loud: "Actually, thinking about it...", "On reflection...", "You know what?", "Hmm..."
22. Include natural digressions that return to the point
23. Add emphasis through repetition: "really, really important", "very, very clear"
24. Use casual academic language: "kinda", "sorta", "pretty", "really", "a lot"
25. Include personal anecdotes or reflections where appropriate

Text:
${text}

Rewrite the assignment with natural academic style while maintaining proper academic language. Keep all facts, citations, and meaning identical. Use only verified and real sources - never fabricate sources. Output ONLY the rewritten assignment text with no explanations:`
  };

  const systemMessages = {
    structural: 'You are rewriting an academic assignment. Output ONLY the rewritten assignment text. Do NOT add explanations, introductory phrases, or meta-commentary. Start directly with the assignment content. Use proper academic language. Preserve all facts, citations, and references exactly as they are. Use ONLY verified and real sources - NEVER fabricate sources. Use PLAIN TEXT only. CRITICAL: Preserve all HTML tags exactly as they are.',
    imperfections: 'You are rewriting an academic assignment with natural variations. Output ONLY the rewritten assignment text. Do NOT add explanations, introductory phrases, or meta-commentary. Start directly with the assignment content. Use proper academic language. Preserve all facts, citations, and references exactly as they are. Use ONLY verified and real sources - NEVER fabricate sources. Use PLAIN TEXT only. CRITICAL: Preserve all HTML tags exactly as they are.',
    polish: 'You are rewriting an academic assignment with natural academic style. Output ONLY the rewritten assignment text. Do NOT add explanations, introductory phrases, or meta-commentary. Start directly with the assignment content. Use proper academic English suitable for university submission. Preserve all facts, citations, and references exactly as they are. Use ONLY verified and real sources - NEVER fabricate sources. Use PLAIN TEXT only. Format suitable for Microsoft Word. CRITICAL: Preserve all HTML tags exactly as they are.'
  };

  try {
    console.log(`[humanizePass] Starting ${passType} pass, text length: ${text.length}`);
    const passStartTime = Date.now();

  // Try GPT-5-mini, fallback to gpt-4o-mini
  let response;
  try {
    response = await openai.chat.completions.create({
      model: 'gpt-5-mini',
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
      temperature: 1.0, // Maximum creativity for human-like variation
      top_p: 0.95, // High diversity
    frequency_penalty: 0.8, // Strong penalty against repetition
    presence_penalty: 0.7, // Strong encouragement for varied content
    max_tokens: 4000,
  });

    const passDuration = Date.now() - passStartTime;
    console.log(`[humanizePass] ${passType} pass completed in ${passDuration}ms`);
    
    let result = response.choices[0].message.content.trim();
    console.log(`[humanizePass] ${passType} pass result length: ${result.length}`);
    
    // Remove any explanatory text that might have been added (e.g., "Sure! Let's add..." or "Here's the revised version:")
    const explanatoryPatterns = [
      /^Sure![\s\S]*?Here's[\s\S]*?:\s*/i,
      /^Let's add[\s\S]*?:\s*/i,
      /^Here's the revised version:?\s*/i,
      /^Here's[\s\S]*?rewritten:?\s*/i,
      /^Revised version:?\s*/i,
      /^Sure[\s\S]*?shall we[\s\S]*?:\s*/i,
      /^Of course![\s\S]*?:\s*/i,
      /^Absolutely![\s\S]*?:\s*/i,
    ];
    
    for (const pattern of explanatoryPatterns) {
      const before = result.length;
      result = result.replace(pattern, '');
      if (result.length < before) {
        console.log(`[humanizePass] Removed explanatory text pattern: ${pattern}`);
      }
    }
    
    // Remove any lines that are clearly explanations (short lines that seem like meta-commentary)
    const lines = result.split('\n');
    const cleanedLines = lines.filter((line, index) => {
      const trimmed = line.trim();
      // Skip lines that are clearly explanations and not part of the assignment
      if (trimmed.toLowerCase().match(/^(sure|let's|here's|revised|rewritten|updated|here is|this is|of course|absolutely).*:$/i)) {
        console.log(`[humanizePass] Filtered out explanatory line: ${trimmed.substring(0, 50)}`);
        return false;
      }
      // If it's the first line and it's very short and seems like an intro, skip it
      if (index === 0 && trimmed.length < 50 && (
        trimmed.toLowerCase().includes('sure') || 
        trimmed.toLowerCase().includes("let's") ||
        trimmed.toLowerCase().includes("here's") ||
        trimmed.toLowerCase().includes('revised') ||
        trimmed.toLowerCase().includes('rewritten')
      )) {
        console.log(`[humanizePass] Filtered out introductory line: ${trimmed}`);
        return false;
      }
      return true;
    });
    
    result = cleanedLines.join('\n').trim();
    console.log(`[humanizePass] ${passType} pass result after cleanup, length: ${result.length}`);
    
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
  
  // Add more double spaces after periods (8% of sentences)
    processed = processed.replace(/\. /g, (match) => {
      return Math.random() > 0.92 ? '.  ' : match;
    });
  
  // Mix capitalization for common terms more aggressively
  processed = processed.replace(/\bInternet\b/g, (match) => {
    return Math.random() > 0.5 ? 'internet' : match;
  });
  
  processed = processed.replace(/\bAI\b/g, (match) => {
    const rand = Math.random();
    if (rand > 0.7) return 'ai';
    if (rand > 0.4) return 'Ai';
    return match;
  });
  
  // Add more spacing inconsistencies around commas
  processed = processed.replace(/,/g, (match) => {
    if (Math.random() > 0.96) {
      return Math.random() > 0.5 ? ', ' : ',';
    }
    return match;
  });
  
  // Remove Oxford commas more frequently
  processed = processed.replace(/, and /g, (match) => {
    return Math.random() > 0.92 ? ' and ' : match;
  });
  
  // Add more inconsistent spacing around colons/semicolons
  processed = processed.replace(/[;:]/g, (match) => {
    if (Math.random() > 0.97) {
      return match + (Math.random() > 0.5 ? ' ' : '');
    }
    return match;
  });
  
  // Add occasional inconsistent spacing around parentheses
  processed = processed.replace(/\(/g, (match) => {
    if (Math.random() > 0.95) {
      return Math.random() > 0.5 ? ' (' : '(';
    }
    return match;
  });
  
  // Add occasional typos in common words (very sparingly - 1-2 per 1000 words)
  const typoMap = {
    ' the ': ' teh ',
    ' receive ': ' recieve ',
    ' separate ': ' seperate ',
    ' occurred ': ' occured ',
    ' definitely ': ' definately ',
    ' accommodate ': ' accomodate '
  };
  
  Object.entries(typoMap).forEach(([correct, typo]) => {
    if (Math.random() > 0.98) {
      processed = processed.replace(new RegExp(correct, 'gi'), (match) => {
        return Math.random() > 0.95 ? typo : match;
      });
    }
  });
  
  // Mix British/American spelling occasionally
  const spellingMap = {
    ' organize ': ' organise ',
    ' analyze ': ' analyse ',
    ' color ': ' colour ',
    ' center ': ' centre '
  };
  
  Object.entries(spellingMap).forEach(([american, british]) => {
    if (Math.random() > 0.96) {
      processed = processed.replace(new RegExp(american, 'gi'), (match) => {
        return Math.random() > 0.5 ? british : match;
      });
    }
  });
  
  return processed;
}

/**
 * Format references section with proper spacing and Harvard style
 * @param {string} text - Assignment text
 * @returns {string} Text with properly formatted references section
 */
function formatReferencesSection(text) {
  try {
    console.log('[formatReferencesSection] Formatting references section...');
    let formatted = text;
    
    // Split text into lines
    const lines = formatted.split('\n');
    const formattedLines = [];
    let inReferencesSection = false;
    let referenceCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      
      // Detect References section heading
      if (trimmed.match(/^References?[\s:]*$/i)) {
        inReferencesSection = true;
        referenceCount = 0;
        formattedLines.push('\nReferences\n'); // Ensure proper spacing and formatting
        continue;
      }
      
      // If we're in the references section, format each entry
      if (inReferencesSection && trimmed.length > 0) {
        // Check if this looks like a reference entry
        // Pattern: Starts with capital letter, has author pattern, has year in parentheses
        if (trimmed.match(/^[A-Z][a-zA-Z\s,\.'-]+[\s,]+\(\d{4}\)/)) {
          referenceCount++;
          
          // Ensure proper formatting:
          // 1. Remove any leading dashes, bullets, or numbers
          let cleanedEntry = trimmed.replace(/^[-•\d.\s]+\s*/, '');
          
          // 2. Ensure proper spacing around parentheses for year
          cleanedEntry = cleanedEntry.replace(/\s*\(\s*(\d{4})\s*\)\s*/g, ' ($1) ');
          
          // 3. Ensure proper spacing after periods in titles
          cleanedEntry = cleanedEntry.replace(/\.([A-Z])/g, '. $1');
          
          // 4. Remove excessive spaces
          cleanedEntry = cleanedEntry.replace(/\s{2,}/g, ' ').trim();
          
          // 5. Ensure URL formatting (if present)
          // Remove "@" prefix from URLs if present
          cleanedEntry = cleanedEntry.replace(/@\s*(https?:\/\/[^\s)]+)/gi, '$1');
          // If URL exists, ensure it's properly spaced
          cleanedEntry = cleanedEntry.replace(/\s+(https?:\/\/[^\s)]+)/gi, ' $1');
          
          // Add the formatted reference entry
          formattedLines.push(cleanedEntry);
        } else if (trimmed.length < 5 && referenceCount > 0) {
          // Very short line after references - might be end of section
          // Check next lines to see if references continue
          let nextNonEmpty = '';
          for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
            if (lines[j].trim().length > 0) {
              nextNonEmpty = lines[j].trim();
              break;
            }
          }
          
          // If next non-empty line doesn't look like a reference, we've left the section
          if (nextNonEmpty && !nextNonEmpty.match(/^[A-Z][a-zA-Z\s,\.'-]+[\s,]+\(\d{4}\)/)) {
            inReferencesSection = false;
            formattedLines.push(''); // Add spacing after references
            formattedLines.push(line); // Keep the current line
          } else {
            formattedLines.push(line); // Keep short line (might be continuation)
          }
        } else {
          // Regular line in references section - keep as is
          formattedLines.push(line);
        }
      } else if (inReferencesSection && trimmed.length === 0) {
        // Empty line in references section - check if it's the end
        // Look ahead to see if more references follow
        let hasMoreReferences = false;
        for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
          if (lines[j].trim().match(/^[A-Z][a-zA-Z\s,\.'-]+[\s,]+\(\d{4}\)/)) {
            hasMoreReferences = true;
            break;
          }
          if (lines[j].trim().length > 10 && !lines[j].trim().match(/^[A-Z][a-zA-Z\s,\.'-]+[\s,]+\(\d{4}\)/)) {
            // Non-reference content found, section has ended
            break;
          }
        }
        
        if (!hasMoreReferences && referenceCount > 0) {
          // No more references found, end of section
          inReferencesSection = false;
        }
        
        // Only add single blank line (don't create excessive spacing)
        if (formattedLines[formattedLines.length - 1] !== '') {
          formattedLines.push('');
        }
      } else {
        // Outside references section, keep the line as is
        formattedLines.push(line);
      }
    }
    
    formatted = formattedLines.join('\n');
    
    // Final cleanup - ensure references section has proper spacing
    formatted = formatted.replace(/\nReferences\n\n+/g, '\nReferences\n');
    formatted = formatted.replace(/(References\n)([^\n])/g, '$1\n$2'); // Ensure blank line after heading
    
    // Clean up excessive blank lines
    formatted = formatted.replace(/\n{4,}/g, '\n\n\n');
    
    console.log('[formatReferencesSection] References section formatted successfully.');
    return formatted;
  } catch (error) {
    console.error('[formatReferencesSection] Error formatting references:', error);
    // Return original text if formatting fails
    return text;
  }
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
  removeFakeUrls,
  removeFakeReferences,
  formatReferencesSection,
  searchRealReferences,
  cleanUrlPrefixes,
};

