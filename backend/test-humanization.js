/**
 * Test script for humanization system
 * 
 * Usage:
 *   node test-humanization.js
 * 
 * This script tests the humanization function with sample text
 * and provides instructions for testing with AI detectors
 */

require('dotenv').config();
const { humanizeText, generateAssignment } = require('./services/openaiService');

// Sample text to test humanization
const sampleText = `Artificial intelligence has become increasingly prevalent in modern society. The technology offers numerous benefits across various industries. Machine learning algorithms can process vast amounts of data efficiently. This capability enables organizations to make data-driven decisions. However, there are also concerns about the ethical implications of AI. Privacy and security issues remain significant challenges. The future of artificial intelligence will likely involve continued innovation and regulation.`;

async function testHumanization() {
  console.log('🧪 Testing Humanization System\n');
  console.log('='.repeat(60));
  
  try {
    // Check if mock mode is enabled
    const config = require('./config');
    if (config.openai.useMock) {
      console.log('⚠️  WARNING: Mock mode is enabled!');
      console.log('   Set OPENAI_USE_MOCK=false in .env to test real humanization\n');
    }

    console.log('📝 Original Text:');
    console.log('-'.repeat(60));
    console.log(sampleText);
    console.log('-'.repeat(60));
    console.log(`\n📊 Original Text Stats:`);
    console.log(`   Words: ${sampleText.split(/\s+/).length}`);
    console.log(`   Sentences: ${sampleText.split(/[.!?]+/).filter(s => s.trim().length > 0).length}`);
    console.log(`   Characters: ${sampleText.length}\n`);

    console.log('🔄 Starting humanization (3 passes)...\n');
    const startTime = Date.now();
    
    const humanizedText = await humanizeText(sampleText);
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('\n✅ Humanized Text:');
    console.log('='.repeat(60));
    console.log(humanizedText);
    console.log('='.repeat(60));
    console.log(`\n📊 Humanized Text Stats:`);
    console.log(`   Words: ${humanizedText.split(/\s+/).length}`);
    console.log(`   Sentences: ${humanizedText.split(/[.!?]+/).filter(s => s.trim().length > 0).length}`);
    console.log(`   Characters: ${humanizedText.length}`);
    console.log(`   Processing Time: ${duration} seconds\n`);

    // Save to file for easy testing
    const fs = require('fs');
    const testDir = './test-outputs';
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir);
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const originalFile = `${testDir}/original-${timestamp}.txt`;
    const humanizedFile = `${testDir}/humanized-${timestamp}.txt`;
    
    fs.writeFileSync(originalFile, sampleText);
    fs.writeFileSync(humanizedFile, humanizedText);
    
    console.log('💾 Files saved:');
    console.log(`   Original: ${originalFile}`);
    console.log(`   Humanized: ${humanizedFile}\n`);

    console.log('🔍 Next Steps for AI Detection Testing:');
    console.log('='.repeat(60));
    console.log('1. Copy the humanized text above');
    console.log('2. Test it on these AI detection tools:');
    console.log('   • GPTZero: https://www.gptzero.me/');
    console.log('   • ZeroGPT: https://www.zerogpt.com/');
    console.log('   • Turnitin (if you have access)');
    console.log('   • Copyleaks: https://copyleaks.com/ai-content-detector');
    console.log('   • Originality.ai: https://originality.ai/');
    console.log('   • NaturalWrite: https://www.naturalwrite.com/');
    console.log('\n3. Target AI detection score: <10-20%');
    console.log('4. Compare original vs humanized scores\n');

  } catch (error) {
    console.error('❌ Error testing humanization:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Make sure OPENAI_API_KEY is set in .env file');
    console.error('2. Make sure OPENAI_USE_MOCK=false (or remove it)');
    console.error('3. Check your OpenAI API key is valid');
    console.error('4. Ensure you have API credits available');
    process.exit(1);
  }
}

async function testFullWorkflow() {
  console.log('\n\n🧪 Testing Full Assignment Generation Workflow\n');
  console.log('='.repeat(60));
  
  try {
    const topic = "The impact of artificial intelligence on modern education";
    const opinion = "I believe AI can enhance learning but requires careful implementation";
    const materials = "AI technology has transformed various industries. Educational institutions are exploring AI tools for personalized learning. However, concerns about data privacy and student autonomy remain important considerations.";
    
    console.log('📝 Generating assignment...\n');
    const assignment = await generateAssignment(topic, opinion, materials, []);
    
    console.log('✅ Generated Assignment (before humanization):');
    console.log('-'.repeat(60));
    console.log(assignment.substring(0, 500) + '...\n');
    
    console.log('🔄 Humanizing assignment...\n');
    const humanized = await humanizeText(assignment);
    
    console.log('✅ Humanized Assignment:');
    console.log('='.repeat(60));
    console.log(humanized.substring(0, 500) + '...\n');
    
    // Save full assignment
    const fs = require('fs');
    const testDir = './test-outputs';
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir);
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    fs.writeFileSync(`${testDir}/full-assignment-${timestamp}.txt`, humanized);
    console.log(`💾 Full assignment saved to: ${testDir}/full-assignment-${timestamp}.txt\n`);
    
  } catch (error) {
    console.error('❌ Error testing full workflow:', error.message);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--full') || args.includes('-f')) {
    await testFullWorkflow();
  } else {
    await testHumanization();
    
    console.log('💡 Tip: Run with --full flag to test full assignment generation workflow');
    console.log('   Example: node test-humanization.js --full\n');
  }
}

main();

