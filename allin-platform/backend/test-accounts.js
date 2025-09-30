/**
 * Test Account Validation Script
 * This script tests all AllIN platform test accounts via API
 * Handles proper escaping for special characters in passwords
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000';

// Test accounts with properly escaped passwords
const TEST_ACCOUNTS = [
  { email: 'admin@allin.demo', password: 'Admin123!@#', role: 'Admin' },
  { email: 'agency@allin.demo', password: 'Agency123!@#', role: 'Agency Owner' },
  { email: 'manager@allin.demo', password: 'Manager123!@#', role: 'Manager' },
  { email: 'creator@allin.demo', password: 'Creator123!@#', role: 'Creator' },
  { email: 'client@allin.demo', password: 'Client123!@#', role: 'Client' },
  { email: 'team@allin.demo', password: 'Team123!@#', role: 'Team' }
];

// Function to test login for an account
async function testLogin(account) {
  try {
    console.log(`\n📧 Testing ${account.role}: ${account.email}`);

    const response = await axios.post(`${API_URL}/api/auth/login`, {
      email: account.email,
      password: account.password
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 200 && response.data.token) {
      console.log(`✅ Login successful!`);
      console.log(`   Token: ${response.data.token.substring(0, 20)}...`);
      console.log(`   User ID: ${response.data.user.id}`);
      console.log(`   User Role: ${response.data.user.role}`);
      return { success: true, account, token: response.data.token };
    }
    // If we got here without success, return failure
    return { success: false, account, error: 'No token received' };
  } catch (error) {
    console.log(`❌ Login failed!`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Error: ${error.response.data.error || error.response.data.message}`);
    } else if (error.request) {
      console.log(`   No response from server`);
    } else {
      console.log(`   Error: ${error.message}`);
    }
    return { success: false, account, error: error.message };
  }
}

// Function to test authenticated endpoint
async function testAuthenticatedEndpoint(token, email) {
  try {
    const response = await axios.get(`${API_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.status === 200) {
      console.log(`   🔐 Authenticated endpoint test: PASSED`);
      return true;
    }
  } catch (error) {
    console.log(`   🔐 Authenticated endpoint test: FAILED`);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 AllIN Platform - Test Account Validation');
  console.log('='.repeat(60));

  // Check if backend is running
  try {
    console.log('\n🔍 Checking backend server...');
    const health = await axios.get(`${API_URL}/api/health`);
    console.log('✅ Backend server is running');
    console.log(`   Status: ${health.data.status}`);
    console.log(`   Database: ${health.data.database}`);
    console.log(`   Redis: ${health.data.redis}`);
  } catch (error) {
    console.log('❌ Backend server is not running!');
    console.log('   Please start the backend with: npm run dev');
    process.exit(1);
  }

  // Test all accounts
  const results = [];
  for (const account of TEST_ACCOUNTS) {
    const result = await testLogin(account);
    if (result.success) {
      // Test authenticated endpoint
      await testAuthenticatedEndpoint(result.token, account.email);
    }
    results.push(result);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary');
  console.log('='.repeat(60));

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`\n✅ Successful logins: ${successful}/${TEST_ACCOUNTS.length}`);
  console.log(`❌ Failed logins: ${failed}/${TEST_ACCOUNTS.length}`);

  if (successful === TEST_ACCOUNTS.length) {
    console.log('\n🎉 All test accounts are working correctly!');
  } else {
    console.log('\n⚠️  Some test accounts failed. Please check the errors above.');
  }

  // Additional info
  console.log('\n' + '='.repeat(60));
  console.log('📝 Access Information');
  console.log('='.repeat(60));
  console.log('\n🌐 Web Interface:');
  console.log('   Frontend: http://localhost:3002/login');
  console.log('   Dashboard: http://localhost:3002/dashboard');
  console.log('\n🔌 API Endpoints:');
  console.log('   Health Check: http://localhost:5000/api/health');
  console.log('   API Docs: http://localhost:5000/api-docs');
  console.log('\n💡 Testing via cURL:');
  console.log('   Use the test-login.sh script for command-line testing');
}

// Run tests
runTests().catch(error => {
  console.error('\n❌ Test script error:', error.message);
  process.exit(1);
});