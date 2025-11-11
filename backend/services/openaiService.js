const { OpenAI } = require('openai');
const config = require('../config');
const assignmentExamples = require('./assignmentExamples');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

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
    const sourcesText = sources.length > 0
      ? `\n\nVerified Sources:\n${sources.map((s, i) => `${i + 1}. ${s.title} - ${s.author || 'Unknown'} (${s.url || 'N/A'})`).join('\n')}`
      : '';

    // Get examples for few-shot learning (use 1-2 examples to save tokens)
    const examples = assignmentExamples.slice(0, Math.min(2, assignmentExamples.length));

    // Build messages array with few-shot examples
    const messages = [
      {
        role: 'system',
        content: 'You are a student writing an academic assignment. Write naturally with occasional imperfections, dramatically varied sentence structure, and personal reflections. Study the examples provided and match their style, quality, and natural writing patterns exactly. Avoid AI-detection patterns by writing like a real student - with natural imperfections, varied sentence length (3-40 words), conversational elements, and human thinking patterns. Write as a thoughtful but imperfect student would, not as a perfect AI assistant.',
      }
    ];

    // Add few-shot examples to teach the model the desired style
    examples.forEach((ex) => {
      messages.push({
        role: 'user',
        content: `Write an assignment on: ${ex.topic}\n\nStudent Opinion: ${ex.studentOpinion}\n\nCourse Materials: ${ex.courseMaterials}\n\nWrite an 800-1200 word assignment that matches the style and quality of the examples provided.`
      });
      messages.push({
        role: 'assistant',
        content: ex.example
      });
    });

    // Add the actual request
    messages.push({
      role: 'user',
      content: `Write an assignment on: ${topic}

Student's Viewpoint/Opinion: ${studentOpinion}

Course Materials:
${courseMaterials}
${sourcesText}

CRITICAL REQUIREMENTS (Target: <20% AI detection):
1. Match the style and quality of the examples above exactly
2. Write as a real student would - with natural imperfections and varied patterns
3. Dramatically vary sentence length (mix 3-word sentences with 45+ word sentences)
4. Include conversational elements: "I think", "In my view", "It seems to me", "That said", "On the other hand", "Actually", "Wait"
5. Add natural imperfections:
   - Occasional minor grammar inconsistencies (1-2 per 300 words)
   - Natural word choice variations (not perfect synonyms)
   - Some sentences that could be clearer
   - Occasional run-on sentences
   - Natural redundancy (humans repeat ideas)
   - Occasional typos: "teh", "recieve", "seperate" (very sparingly)
6. Use varied sentence structures - don't use the same pattern repeatedly
7. Include personal reflections and opinions throughout
8. Show uncertainty where appropriate ("perhaps", "might", "could be", "I'm not entirely sure")
9. Mix formal and conversational language naturally
10. Include natural paragraph breaks (mix 1-sentence paragraphs with 8+ sentence paragraphs)
11. Use varied vocabulary - not thesaurus-perfect, repeat words naturally
12. Include filler words and natural pauses: "Well,", "Hmm,", "You know,", "I mean"
13. Show genuine engagement with the topic
14. Support the student's viewpoint with evidence from course materials and sources
15. Include proper in-text citations where sources are used (vary citation style)
16. Ensure content is 100% plagiarism-free and original
17. Length: 800-1200 words
18. Add rhetorical questions: "But is this always true?", "What does this mean?"
19. Include stream-of-consciousness: "Actually, thinking about it...", "On reflection..."
20. Use natural digressions that loop back to the main point

DO NOT:
- Write in perfect, AI-generated structure
- Use overly formal language throughout
- Make every sentence grammatically perfect
- Use the same sentence structure repeatedly
- Avoid personal pronouns completely
- Write in a way that sounds like an AI assistant
- Use perfect synonyms for every word
- Create perfectly structured paragraphs (uniform length)
- Avoid all imperfections
- Sound like a professional writer - sound like a student
- Follow perfect logical flow (add natural jumps)
- Use the same transition words repeatedly
- Create uniform paragraph lengths
- Write in a way that would score high on AI detectors

Generate the assignment:`
    });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Using GPT-4o-mini for better quality and cost efficiency
      messages: messages,
      temperature: 0.95, // Very high temperature for maximum natural variation
      top_p: 0.98, // Very high diversity
      frequency_penalty: 0.6, // Strong penalty against repetition
      presence_penalty: 0.5, // Strong encouragement for varied content
      max_tokens: 3500,
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generating assignment:', error);
    throw new Error(`Failed to generate assignment: ${error.message}`);
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
    console.log('Starting multi-pass humanization...');
    
    // First pass: Major structural and pattern changes
    console.log('Pass 1: Structural changes...');
    const firstPass = await humanizePass(text, 'structural');
    
    // Second pass: Add natural imperfections and style variations
    console.log('Pass 2: Style and imperfections...');
    const secondPass = await humanizePass(firstPass, 'imperfections');
    
    // Third pass: Final polish with maximum humanization
    console.log('Pass 3: Final polish...');
    const thirdPass = await humanizePass(secondPass, 'polish');
    
    // Post-process for additional natural variations
    const finalText = postProcessHumanization(thirdPass);
    
    console.log('Humanization complete.');
    return finalText;
  } catch (error) {
    console.error('Error humanizing text:', error);
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
    structural: `Rewrite this text with MAJOR structural and pattern changes to bypass AI detectors (Turnitin, GPTZero, ZeroGPT, Copyleaks, Originality.ai). Target: <15% AI detection score.

CRITICAL STRUCTURAL CHANGES:
1. Break up paragraphs irregularly - mix 1-sentence paragraphs with 8+ sentence paragraphs (not uniform)
2. Rearrange ideas - don't follow perfect logical flow, add natural jumps
3. Add abrupt topic shifts: "Actually, thinking about it...", "Wait, there's another point...", "On reflection..."
4. Start some paragraphs mid-thought: "But then again...", "Then there's...", "Also worth considering..."
5. End paragraphs with incomplete thoughts or questions: "Or maybe not?", "Who knows?", "It's hard to say."
6. Use inconsistent paragraph formatting - some indented, some not
7. Add parenthetical asides: (though I'm not entirely sure), (this might be wrong), (I could be mistaken)
8. Include stream-of-consciousness: "Hmm, let me think...", "Actually...", "You know what?"
9. Vary citation placement randomly (start, mid-sentence, end)
10. Mix short and long paragraphs dramatically (1 sentence vs 10+ sentences)
11. Add natural breaks with ellipses: "...", or dashes: "—"
12. Include rhetorical questions mid-paragraph: "But is this always true?", "What does this mean?"
13. Use inconsistent spacing around punctuation (some tight, some loose)
14. Add natural digressions that loop back: "This reminds me...", "Speaking of which..."

Text:
${text}

Rewritten with major structural changes (keep all facts and meaning identical):`,

    imperfections: `Rewrite this text to add natural student writing imperfections. Target: <12% AI detection score.

ADD THESE NATURAL IMPERFECTIONS:
1. Occasional typos (1-2 per 500 words): "teh" instead of "the", "recieve" instead of "receive", "seperate" instead of "separate", "occured" instead of "occurred"
2. Inconsistent capitalization: "Internet" vs "internet", "AI" vs "ai" vs "Ai"
3. Mixed British/American spelling if context allows: "organise" vs "organize", "analyse" vs "analyze"
4. Natural word repetition (students repeat words, don't always use synonyms)
5. Occasional comma splices or run-on sentences that a student might write
6. Inconsistent tense in some places (students sometimes mix tenses)
7. Use casual phrases: "like", "sort of", "kind of", "I guess", "I suppose"
8. Contractions mixed with formal language: "don't", "can't", "won't", "it's"
9. Sentences starting with "And" or "But" (academic writing sometimes allows this)
10. Occasional double spaces or spacing inconsistencies
11. Use "etc." or "and so on" or "and the like" occasionally
12. Mix punctuation styles: semicolons, dashes, and commas used inconsistently
13. Occasional missing commas in lists or compound sentences
14. Inconsistent use of Oxford commas
15. Some sentences that are slightly unclear (students don't always write perfectly)
16. Natural redundancy - repeat ideas in slightly different words
17. Use "um", "uh", "well" in written form occasionally: "Well, I think...", "Um, actually..."
18. Occasional use of informal language mixed with academic: "pretty good", "really important", "a lot"
19. Inconsistent formatting of numbers: "5" vs "five", "10%" vs "ten percent"
20. Occasional use of first person when it might not be strictly necessary

Text:
${text}

Rewritten with natural imperfections (keep all facts and meaning identical):`,

    polish: `Final pass: Make this text sound exactly like a real student wrote it. Target: <10% AI detection score.

FINAL HUMANIZATION TOUCHES:
1. Add personal voice markers: "I've noticed that...", "From my experience...", "It's interesting how...", "What strikes me is..."
2. Include rhetorical questions: "But is this really the case?", "What does this mean?", "How can we be sure?"
3. Add hedging language: "seems to suggest", "appears to indicate", "might mean", "could possibly", "perhaps suggests"
4. Use varied sentence starters (avoid starting multiple sentences the same way)
5. Include natural transitions: "Anyway,", "So,", "Well,", "Now,", "Right,", "Okay,"
6. Add emphasis markers: "really", "actually", "definitely", "certainly", "obviously"
7. Include occasional colloquialisms: "a bit", "sort of", "kind of", "pretty much"
8. Vary formality within paragraphs (mix academic and casual)
9. Add natural pauses and filler: "Hmm,", "Well,", "You know,", "I mean,", "Like,"
10. Include self-corrections: "or rather,", "I mean,", "actually,", "wait,", "let me rephrase"
11. Use varied transition words (don't repeat "furthermore", "moreover", "additionally")
12. Add personal opinions: "I believe", "I think", "In my opinion", "It seems to me"
13. Include uncertainty: "I'm not entirely sure", "It's unclear", "Perhaps", "Maybe"
14. Use natural emphasis: "This is really important", "This matters a lot", "This is crucial"
15. Add conversational connectors: "That said,", "On the other hand,", "At the same time,", "Then again,"
16. Include natural interjections: "Interestingly,", "Surprisingly,", "Oddly enough,", "Strangely,"
17. Use varied paragraph transitions (not all perfect topic sentences)
18. Add natural flow breaks: "Let me explain.", "Here's the thing.", "The point is."
19. Include personal engagement: "I find this fascinating", "This caught my attention", "What's interesting is"
20. Mix sentence types: statements, questions, exclamations, fragments

Text:
${text}

Final polished version (keep all facts and meaning identical):`
  };

  const systemMessages = {
    structural: 'You are an expert at restructuring AI text to bypass detection. Your goal is <15% AI detection. Make major structural changes while keeping all facts identical. Write like a real student with natural flow breaks and irregular patterns.',
    imperfections: 'You are an expert at adding natural writing imperfections. Your goal is <12% AI detection. Add typos, inconsistencies, and natural student errors while keeping all facts identical. Make it look like a real student wrote it.',
    polish: 'You are an expert at final humanization. Your goal is <10% AI detection. Add personal voice, natural language, and human thinking patterns while keeping all facts identical. Make it sound exactly like a real student.'
  };

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
    temperature: 0.98, // Maximum variation
    top_p: 0.99, // Very high diversity
    frequency_penalty: 0.7, // Strong penalty against repetition
    presence_penalty: 0.6, // Strong encouragement for varied content
    max_tokens: 3500,
  });

  return response.choices[0].message.content.trim();
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
};

