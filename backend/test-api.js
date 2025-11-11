/**
 * Test script for API endpoints
 * 
 * Usage:
 *   node test-api.js
 * 
 * Make sure the backend server is running first:
 *   npm start
 *   or
 *   npm run dev
 */

const http = require('http');

const API_BASE = 'http://localhost:5000';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testHealthCheck() {
  log('\n🧪 Testing Health Check Endpoint', 'cyan');
  log('='.repeat(60), 'cyan');
  
  try {
    const response = await makeRequest('GET', '/health');
    if (response.status === 200) {
      log('✅ Health check passed', 'green');
      log(`   Response: ${JSON.stringify(response.data)}`, 'green');
      return true;
    } else {
      log(`❌ Health check failed: Status ${response.status}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Health check failed: ${error.message}`, 'red');
    log('   Make sure the server is running: npm start', 'yellow');
    return false;
  }
}

async function testGenerateAssignment() {
  log('\n🧪 Testing Assignment Generation Endpoint', 'cyan');
  log('='.repeat(60), 'cyan');
  
  const testData = {
    assignmentTopic: "The impact of artificial intelligence on modern education",
    selectedOpinion: "I believe AI can enhance learning but requires careful implementation to address privacy concerns and maintain student autonomy.",
    courseMaterials: "Artificial intelligence technology has transformed various industries including healthcare, finance, and education. Educational institutions are exploring AI tools for personalized learning experiences. Machine learning algorithms can adapt to individual student needs. However, concerns about data privacy, algorithmic bias, and student autonomy remain important considerations. The future of AI in education will likely involve continued innovation alongside thoughtful regulation.",
    verifiedSources: [
      {
        title: "AI in Education: Opportunities and Challenges",
        author: "Smith, J.",
        type: "Academic Journal",
        description: "Discusses the potential benefits and concerns of AI in educational settings"
      }
    ]
  };

  try {
    log('📤 Sending request...', 'blue');
    log(`   Topic: ${testData.assignmentTopic}`, 'blue');
    
    const startTime = Date.now();
    const response = await makeRequest('POST', '/api/generate-assignment', testData);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    if (response.status === 200 && response.data.success) {
      log('✅ Assignment generated successfully!', 'green');
      log(`   Processing time: ${duration} seconds`, 'green');
      log(`   Mode: ${response.data.mode}`, 'green');
      log(`   Humanized: ${response.data.humanized}`, 'green');
      
      const assignment = response.data.assignment;
      const wordCount = assignment.split(/\s+/).length;
      const charCount = assignment.length;
      
      log(`\n📊 Assignment Stats:`, 'cyan');
      log(`   Words: ${wordCount}`, 'cyan');
      log(`   Characters: ${charCount}`, 'cyan');
      
      log(`\n📝 Assignment Preview (first 500 chars):`, 'cyan');
      log('-'.repeat(60), 'cyan');
      log(assignment.substring(0, 500) + '...', 'reset');
      log('-'.repeat(60), 'cyan');
      
      // Save to file
      const fs = require('fs');
      const testDir = './test-outputs';
      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir);
      }
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `${testDir}/api-test-${timestamp}.txt`;
      fs.writeFileSync(filename, assignment);
      
      log(`\n💾 Full assignment saved to: ${filename}`, 'green');
      log('\n🔍 Next Steps:', 'yellow');
      log('1. Copy the assignment text', 'yellow');
      log('2. Test it on AI detection tools:', 'yellow');
      log('   • GPTZero: https://www.gptzero.me/', 'yellow');
      log('   • ZeroGPT: https://www.zerogpt.com/', 'yellow');
      log('   • Copyleaks: https://copyleaks.com/ai-content-detector', 'yellow');
      log('3. Target AI detection score: <10-20%', 'yellow');
      
      return true;
    } else {
      log(`❌ Request failed: Status ${response.status}`, 'red');
      log(`   Error: ${JSON.stringify(response.data)}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Request failed: ${error.message}`, 'red');
    return false;
  }
}

async function testOpenAI() {
  log('\n🧪 Testing OpenAI Connection', 'cyan');
  log('='.repeat(60), 'cyan');
  
  try {
    const response = await makeRequest('GET', '/api/test-openai');
    if (response.status === 200 && response.data.success) {
      log('✅ OpenAI connection successful!', 'green');
      log(`   Mode: ${response.data.mode}`, 'green');
      log(`   Message: ${response.data.message}`, 'green');
      return true;
    } else {
      log(`❌ OpenAI test failed: ${JSON.stringify(response.data)}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ OpenAI test failed: ${error.message}`, 'red');
    return false;
  }
}

async function main() {
  log('\n🚀 API Testing Suite', 'blue');
  log('='.repeat(60), 'blue');
  log('Make sure the backend server is running on port 5000', 'yellow');
  log('Start server with: npm start (or npm run dev)\n', 'yellow');
  
  // Test health check first
  const healthOk = await testHealthCheck();
  if (!healthOk) {
    log('\n❌ Server is not running. Please start it first.', 'red');
    process.exit(1);
  }
  
  // Test OpenAI connection
  await testOpenAI();
  
  // Test assignment generation
  await testGenerateAssignment();
  
  log('\n✅ Testing complete!', 'green');
}

main();

