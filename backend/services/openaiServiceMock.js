/**
 * Mock OpenAI Service for Testing
 * Returns simulated responses without making actual API calls
 */

// Simulate delay like real API calls
const simulateDelay = () => new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

/**
 * Mock: Explain a topic in simple, basic English using course materials
 */
async function explainTopic(topic, courseMaterials) {
  await simulateDelay();
  
  return `Here's a simple explanation of ${topic}:

Based on the course materials you've provided, ${topic} is a fundamental concept that helps students understand key principles in the subject. 

In simple terms, ${topic} involves understanding how different elements work together. The materials you've shared cover the basics and provide examples that make this concept easier to grasp.

This explanation is designed to help you get started with the topic before we dive deeper into creating your assignment.`;
}

/**
 * Mock: Generate personalized assignment based on student's opinion and course materials
 */
async function generateAssignment(topic, studentOpinion, courseMaterials, sources = []) {
  await simulateDelay();
  
  const sourceCitations = sources.length > 0
    ? sources.map((s, i) => `(Source ${i + 1}: ${s.title})`).join(' ')
    : '';
  
  return `# Assignment: ${topic}

## Introduction

Based on my understanding of ${topic}, I believe that ${studentOpinion}. This perspective is supported by the course materials and provides a comprehensive view of the subject matter.

The course materials demonstrate several key points that align with this viewpoint. Throughout this assignment, I will explore how ${studentOpinion} relates to ${topic} and examine the evidence that supports this position.

## Main Discussion

### Understanding the Core Concepts

The course materials provide valuable insights into ${topic}. When examining these resources, it becomes clear that ${studentOpinion}. This perspective is not only supported by the information provided but also offers a nuanced understanding of the subject.

### Supporting Evidence

The materials suggest several important considerations. First, there is evidence that supports the idea that ${studentOpinion}. Second, the course content demonstrates how this perspective can be applied in practical situations. Finally, the sources indicate that this viewpoint is consistent with established knowledge in the field. ${sourceCitations}

### Critical Analysis

When analyzing ${topic} from the perspective that ${studentOpinion}, several factors emerge. The course materials help illuminate these connections and provide context for understanding how different elements relate to each other.

## Conclusion

In conclusion, ${studentOpinion} provides a valuable framework for understanding ${topic}. The course materials support this perspective and offer evidence that helps strengthen this viewpoint. By examining the relationship between these concepts, we can gain deeper insights into the subject matter.

This assignment demonstrates my understanding of ${topic} while incorporating my personal perspective that ${studentOpinion}. The analysis is grounded in the course materials and reflects a thoughtful consideration of the subject.`;
}

/**
 * Mock: Check grammar and spelling in text
 */
async function checkGrammar(text) {
  await simulateDelay();
  
  return {
    score: 95,
    errors: [],
    correctedText: text,
    suggestions: [
      "The text appears to be well-written with minimal issues.",
      "Consider varying sentence length for better readability.",
    ]
  };
}

/**
 * Mock: Format citations in the specified style (APA, MLA, etc.)
 */
async function formatCitations(text, style = 'APA') {
  await simulateDelay();
  
  // Simulate citation formatting
  return text.replace(
    /\(Source \d+:[^)]+\)/g,
    (match) => {
      if (style === 'APA') {
        return '(Author, Year)';
      } else if (style === 'MLA') {
        return '(Author Page)';
      }
      return match;
    }
  );
}

/**
 * Mock: Check if assignment complies with rubric requirements
 */
async function checkRubricCompliance(assignment, requirements) {
  await simulateDelay();
  
  return {
    compliant: true,
    score: 92,
    issues: [],
    suggestions: [
      "Consider adding more specific examples to strengthen your arguments.",
      "The assignment meets most requirements. Minor improvements could enhance clarity.",
    ]
  };
}

/**
 * Mock: Humanize text to avoid AI detection
 */
async function humanizeText(text) {
  await simulateDelay();
  
  // Simulate humanization by adding slight variations
  return text
    .replace(/Furthermore/g, 'Additionally')
    .replace(/Moreover/g, 'Also')
    .replace(/Therefore/g, 'So')
    + '\n\n[Note: This is a mock response. Actual humanization would provide more varied sentence structures and natural language patterns.]';
}

module.exports = {
  explainTopic,
  generateAssignment,
  checkGrammar,
  formatCitations,
  checkRubricCompliance,
  humanizeText,
};

