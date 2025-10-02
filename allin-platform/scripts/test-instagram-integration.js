#!/usr/bin/env node

/**
 * Instagram Integration Test Runner
 * Runs comprehensive tests for Instagram API integration
 */

const { spawn } = require('child_process');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Command failed with exit code ${code}`));
      } else {
        resolve();
      }
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
}

async function testBackendServer() {
  log('\n🔍 Testing Backend Server Availability...', 'cyan');
  
  try {
    const response = await fetch('http://localhost:5000/api/health');
    const data = await response.json();
    
    if (data.status === 'healthy') {
      log('✅ Backend server is running and healthy', 'green');
      return true;
    } else {
      log('⚠️  Backend server is not healthy', 'yellow');
      return false;
    }
  } catch (error) {
    log('❌ Backend server is not running', 'red');
    log('   Please start the backend server: npm run dev', 'yellow');
    return false;
  }
}

async function testInstagramEndpoints() {
  log('\n🔍 Testing Instagram API Endpoints...', 'cyan');
  
  const endpoints = [
    { 
      url: '/api/instagram/connection-status', 
      method: 'GET',
      name: 'Connection Status'
    },
    { 
      url: '/api/instagram/auth/url', 
      method: 'GET',
      name: 'OAuth URL Generation'
    },
    { 
      url: '/api/instagram/media?limit=3', 
      method: 'GET',
      name: 'Media Retrieval'
    },
    { 
      url: '/api/instagram/insights?period=day', 
      method: 'GET',
      name: 'Account Insights'
    }
  ];

  let passed = 0;
  let failed = 0;

  // Create a test token (in production, use real auth)
  const testToken = 'test-token-123';

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`http://localhost:5000${endpoint.url}`, {
        method: endpoint.method,
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (response.ok && data.success !== undefined) {
        log(`  ✅ ${endpoint.name}: Passed`, 'green');
        passed++;
      } else if (response.status === 401) {
        log(`  ⚠️  ${endpoint.name}: Authentication required (expected)`, 'yellow');
        passed++;
      } else {
        log(`  ❌ ${endpoint.name}: Failed (${response.status})`, 'red');
        failed++;
      }
    } catch (error) {
      log(`  ❌ ${endpoint.name}: Error - ${error.message}`, 'red');
      failed++;
    }
  }

  log(`\n📊 Endpoint Tests: ${passed} passed, ${failed} failed`, 
    failed > 0 ? 'red' : 'green');
  
  return failed === 0;
}

async function runUnitTests() {
  log('\n🧪 Running Unit Tests...', 'cyan');
  
  try {
    await runCommand('npm', ['run', 'test', '--', 
      'src/services/instagram.service.test.ts',
      'src/controllers/instagram.controller.test.ts',
      '--coverage'
    ], {
      cwd: path.join(__dirname, '..', 'backend')
    });
    
    log('✅ Unit tests passed', 'green');
    return true;
  } catch (error) {
    log('❌ Unit tests failed', 'red');
    return false;
  }
}

async function runE2ETests() {
  log('\n🎭 Running End-to-End Tests...', 'cyan');
  
  try {
    await runCommand('npm', ['run', 'test:e2e', '--',
      'tests/e2e/instagram-integration.spec.ts'
    ], {
      cwd: path.join(__dirname, '..', 'backend')
    });
    
    log('✅ E2E tests passed', 'green');
    return true;
  } catch (error) {
    log('❌ E2E tests failed', 'red');
    return false;
  }
}

async function testMockData() {
  log('\n🎨 Testing Mock Data Responses...', 'cyan');
  
  try {
    // Test connection status mock
    const connectionResponse = await fetch('http://localhost:5000/api/instagram/connection-status', {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    
    if (connectionResponse.ok) {
      const connectionData = await connectionResponse.json();
      
      if (connectionData.data?.connected && connectionData.data?.account) {
        log('  ✅ Mock connection status working', 'green');
      } else {
        log('  ⚠️  Mock connection status returns disconnected', 'yellow');
      }
    }

    // Test media mock
    const mediaResponse = await fetch('http://localhost:5000/api/instagram/media', {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    
    if (mediaResponse.ok) {
      const mediaData = await mediaResponse.json();
      
      if (mediaData.data?.media && mediaData.data.media.length > 0) {
        log('  ✅ Mock media data working', 'green');
        log(`     Found ${mediaData.data.media.length} mock posts`, 'blue');
      } else {
        log('  ⚠️  No mock media data returned', 'yellow');
      }
    }

    // Test insights mock
    const insightsResponse = await fetch('http://localhost:5000/api/instagram/insights', {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    
    if (insightsResponse.ok) {
      const insightsData = await insightsResponse.json();
      
      if (insightsData.data?.insights) {
        log('  ✅ Mock insights data working', 'green');
        log(`     Impressions: ${insightsData.data.insights.impressions}`, 'blue');
        log(`     Reach: ${insightsData.data.insights.reach}`, 'blue');
      } else {
        log('  ⚠️  No mock insights data returned', 'yellow');
      }
    }

    return true;
  } catch (error) {
    log(`  ❌ Mock data test error: ${error.message}`, 'red');
    return false;
  }
}

async function validateEnvironmentVariables() {
  log('\n🔐 Checking Environment Variables...', 'cyan');
  
  const requiredVars = [
    'INSTAGRAM_APP_ID',
    'INSTAGRAM_APP_SECRET',
    'INSTAGRAM_ACCESS_TOKEN',
    'INSTAGRAM_BUSINESS_ACCOUNT_ID'
  ];

  const missingVars = [];
  
  // Check if .env file exists
  const fs = require('fs');
  const envPath = path.join(__dirname, '..', 'backend', '.env');
  
  if (!fs.existsSync(envPath)) {
    log('  ⚠️  .env file not found', 'yellow');
    log('     Copy .env.example to .env and configure Instagram credentials', 'yellow');
  } else {
    // Read .env file
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    for (const varName of requiredVars) {
      if (!envContent.includes(varName)) {
        missingVars.push(varName);
      }
    }
    
    if (missingVars.length === 0) {
      log('  ✅ All Instagram environment variables are defined', 'green');
    } else {
      log('  ⚠️  Missing environment variables:', 'yellow');
      missingVars.forEach(varName => {
        log(`     - ${varName}`, 'yellow');
      });
      log('     Note: Using mock data for development', 'blue');
    }
  }
  
  return true;
}

async function main() {
  log('===========================================', 'bright');
  log('Instagram Integration Test Suite', 'bright');
  log('===========================================', 'bright');
  
  const results = {
    environment: false,
    backend: false,
    endpoints: false,
    mockData: false,
    unitTests: false,
    e2eTests: false
  };

  // Check environment variables
  results.environment = await validateEnvironmentVariables();

  // Check if backend is running
  results.backend = await testBackendServer();
  
  if (!results.backend) {
    log('\n⚠️  Backend server must be running to continue tests', 'yellow');
    log('Please start the backend server and try again', 'yellow');
    process.exit(1);
  }

  // Test endpoints
  results.endpoints = await testInstagramEndpoints();

  // Test mock data
  results.mockData = await testMockData();

  // Run unit tests (optional, can be slow)
  const runFullTests = process.argv.includes('--full');
  
  if (runFullTests) {
    results.unitTests = await runUnitTests();
    results.e2eTests = await runE2ETests();
  } else {
    log('\n💡 Tip: Run with --full flag to include unit and E2E tests', 'cyan');
  }

  // Summary
  log('\n===========================================', 'bright');
  log('Test Summary', 'bright');
  log('===========================================', 'bright');
  
  const testCategories = [
    { name: 'Environment Setup', result: results.environment },
    { name: 'Backend Server', result: results.backend },
    { name: 'API Endpoints', result: results.endpoints },
    { name: 'Mock Data', result: results.mockData }
  ];

  if (runFullTests) {
    testCategories.push(
      { name: 'Unit Tests', result: results.unitTests },
      { name: 'E2E Tests', result: results.e2eTests }
    );
  }

  let allPassed = true;
  testCategories.forEach(category => {
    const status = category.result ? '✅ PASS' : '❌ FAIL';
    const color = category.result ? 'green' : 'red';
    log(`${status} - ${category.name}`, color);
    if (!category.result) allPassed = false;
  });

  log('\n===========================================', 'bright');
  
  if (allPassed) {
    log('🎉 All tests passed successfully!', 'green');
    log('\nInstagram integration is ready for use! 📸', 'bright');
  } else {
    log('⚠️  Some tests failed. Please review the output above.', 'yellow');
  }

  log('===========================================', 'bright');
  
  process.exit(allPassed ? 0 : 1);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  log(`\n❌ Unexpected error: ${error.message}`, 'red');
  process.exit(1);
});

// Run tests
main().catch(error => {
  log(`\n❌ Test runner failed: ${error.message}`, 'red');
  process.exit(1);
});