/**
 * LinkedIn API Load Testing with k6
 * 
 * This comprehensive load test validates LinkedIn integration performance under various
 * load conditions including:
 * - OAuth flow performance
 * - API endpoint response times
 * - Concurrent user simulation
 * - Error rate monitoring
 * - Resource utilization tracking
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { SharedArray } from 'k6/data';

// Custom metrics
export let errorRate = new Rate('errors');
export let oauthSuccessRate = new Rate('oauth_success');
export let apiResponseTime = new Trend('api_response_time');
export let oauthResponseTime = new Trend('oauth_response_time');
export let requestCounter = new Counter('requests_total');

// Test configuration
export let options = {
  stages: [
    // Warm-up phase
    { duration: '1m', target: 5 },    // Ramp up to 5 users over 1 minute
    { duration: '2m', target: 5 },    // Stay at 5 users for 2 minutes
    
    // Load testing phase
    { duration: '2m', target: 20 },   // Ramp up to 20 users
    { duration: '5m', target: 20 },   // Stay at 20 users for 5 minutes
    
    // Stress testing phase
    { duration: '2m', target: 50 },   // Ramp up to 50 users
    { duration: '3m', target: 50 },   // Stay at 50 users for 3 minutes
    
    // Peak load testing
    { duration: '1m', target: 100 },  // Ramp up to 100 users
    { duration: '2m', target: 100 },  // Stay at 100 users for 2 minutes
    
    // Ramp down
    { duration: '2m', target: 0 },    // Ramp down to 0 users
  ],
  
  thresholds: {
    // LinkedIn-specific performance thresholds
    'http_req_duration': ['p(95)<500'],           // 95% of requests under 500ms
    'http_req_duration{name:oauth}': ['p(95)<300'], // OAuth requests under 300ms
    'http_req_duration{name:api}': ['p(95)<200'],   // API requests under 200ms
    'http_req_failed': ['rate<0.05'],              // Error rate under 5%
    'errors': ['rate<0.05'],                       // Custom error rate under 5%
    'oauth_success': ['rate>0.95'],                // OAuth success rate above 95%
    'api_response_time': ['p(90)<150'],            // 90% of API calls under 150ms
    'oauth_response_time': ['p(90)<250'],          // 90% of OAuth calls under 250ms
  },

  // Resource monitoring
  ext: {
    loadimpact: {
      projectID: 3599339,
      name: "LinkedIn Integration Load Test"
    }
  }
};

// Test data
const testUsers = new SharedArray('users', function () {
  return [
    { email: 'admin@allin.demo', password: 'AdminPass123', linkedinProfile: 'admin.linkedin@allin.demo' },
    { email: 'agency@allin.demo', password: 'AgencyPass123', linkedinProfile: 'agency.linkedin@allin.demo' },
    { email: 'manager@allin.demo', password: 'ManagerPass123', linkedinProfile: 'manager.linkedin@allin.demo' },
    { email: 'creator@allin.demo', password: 'CreatorPass123', linkedinProfile: 'creator.linkedin@allin.demo' },
    { email: 'client@allin.demo', password: 'ClientPass123', linkedinProfile: 'client.linkedin@allin.demo' },
    { email: 'team@allin.demo', password: 'TeamPass123', linkedinProfile: 'team.linkedin@allin.demo' }
  ];
});

// Base URLs
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';
const LINKEDIN_MOCK_URL = __ENV.LINKEDIN_MOCK_URL || 'http://localhost:8080';

// Test data for content creation
const linkedinPosts = [
  'Exciting news from our LinkedIn integration testing! 🚀 #testing #linkedin #automation',
  'Performance testing in progress. Monitoring system resilience under load. #performance #testing',
  'Building robust social media management solutions with comprehensive testing. #socialmedia #development',
  'Load testing our LinkedIn API integration to ensure bulletproof performance. #loadtesting #api',
  'Continuous integration and deployment practices for social media platforms. #cicd #devops'
];

/**
 * Main test function executed by each virtual user
 */
export default function() {
  // Select random user for this iteration
  const user = testUsers[Math.floor(Math.random() * testUsers.length)];
  
  // Test scenarios weighted by likelihood
  const scenario = Math.random();
  
  if (scenario < 0.3) {
    // 30% - OAuth connection flow
    testLinkedInOAuthFlow(user);
  } else if (scenario < 0.6) {
    // 30% - Content publishing
    testLinkedInContentPublishing(user);
  } else if (scenario < 0.8) {
    // 20% - Analytics fetching
    testLinkedInAnalytics(user);
  } else if (scenario < 0.9) {
    // 10% - Account management
    testLinkedInAccountManagement(user);
  } else {
    // 10% - Mixed operations
    testMixedLinkedInOperations(user);
  }
  
  // Random delay between operations (simulate user behavior)
  sleep(Math.random() * 3 + 1); // 1-4 seconds
}

/**
 * Test LinkedIn OAuth connection flow
 */
function testLinkedInOAuthFlow(user) {
  group('LinkedIn OAuth Flow', function() {
    let authToken;
    
    // Step 1: Login to AllIN platform
    const loginResponse = http.post(`${BASE_URL}/api/auth/login`, {
      email: user.email,
      password: user.password
    }, {
      tags: { name: 'login' }
    });
    
    const loginSuccess = check(loginResponse, {
      'login successful': (r) => r.status === 200,
      'login response time < 200ms': (r) => r.timings.duration < 200
    });
    
    if (!loginSuccess) {
      errorRate.add(1);
      return;
    }
    
    authToken = loginResponse.json('data.token');
    
    // Step 2: Initiate LinkedIn OAuth
    const oauthStartTime = Date.now();
    const oauthResponse = http.post(`${BASE_URL}/api/social/connect/linkedin`, {}, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      tags: { name: 'oauth' }
    });
    
    const oauthDuration = Date.now() - oauthStartTime;
    oauthResponseTime.add(oauthDuration);
    
    const oauthSuccess = check(oauthResponse, {
      'oauth initiation successful': (r) => r.status === 200,
      'oauth response contains authUrl': (r) => r.json('data.authUrl') !== undefined,
      'oauth response time < 300ms': (r) => r.timings.duration < 300
    });
    
    if (oauthSuccess) {
      oauthSuccessRate.add(1);
      
      // Step 3: Simulate OAuth callback (using mock server)
      const authData = oauthResponse.json('data');
      const callbackResponse = http.get(`${BASE_URL}/api/social/callback/linkedin`, {
        params: {
          code: 'mock_auth_code_load_test',
          state: authData.state
        },
        tags: { name: 'oauth_callback' }
      });
      
      check(callbackResponse, {
        'oauth callback successful': (r) => r.status === 200,
        'account connected': (r) => r.json('data.platform') === 'LINKEDIN'
      });
      
    } else {
      oauthSuccessRate.add(0);
      errorRate.add(1);
    }
    
    requestCounter.add(1);
  });
}

/**
 * Test LinkedIn content publishing
 */
function testLinkedInContentPublishing(user) {
  group('LinkedIn Content Publishing', function() {
    const authToken = authenticateUser(user);
    if (!authToken) return;
    
    // Create and publish LinkedIn post
    const postContent = linkedinPosts[Math.floor(Math.random() * linkedinPosts.length)];
    
    const publishStartTime = Date.now();
    const publishResponse = http.post(`${BASE_URL}/api/content/publish`, {
      platform: 'LINKEDIN',
      content: postContent,
      accountId: 'linkedin-test-account-123'
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      tags: { name: 'api' }
    });
    
    const publishDuration = Date.now() - publishStartTime;
    apiResponseTime.add(publishDuration);
    
    const publishSuccess = check(publishResponse, {
      'publish successful': (r) => r.status === 200 || r.status === 201,
      'publish response time < 500ms': (r) => r.timings.duration < 500,
      'post id returned': (r) => r.json('data.id') !== undefined
    });
    
    if (!publishSuccess) {
      errorRate.add(1);
    }
    
    requestCounter.add(1);
  });
}

/**
 * Test LinkedIn analytics fetching
 */
function testLinkedInAnalytics(user) {
  group('LinkedIn Analytics', function() {
    const authToken = authenticateUser(user);
    if (!authToken) return;
    
    // Fetch LinkedIn analytics
    const analyticsStartTime = Date.now();
    const analyticsResponse = http.get(`${BASE_URL}/api/analytics/linkedin/test-account-123`, {
      params: {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      },
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      tags: { name: 'api' }
    });
    
    const analyticsDuration = Date.now() - analyticsStartTime;
    apiResponseTime.add(analyticsDuration);
    
    const analyticsSuccess = check(analyticsResponse, {
      'analytics fetch successful': (r) => r.status === 200,
      'analytics response time < 200ms': (r) => r.timings.duration < 200,
      'analytics data present': (r) => r.json('data.metrics') !== undefined
    });
    
    if (!analyticsSuccess) {
      errorRate.add(1);
    }
    
    requestCounter.add(1);
  });
}

/**
 * Test LinkedIn account management
 */
function testLinkedInAccountManagement(user) {
  group('LinkedIn Account Management', function() {
    const authToken = authenticateUser(user);
    if (!authToken) return;
    
    // Fetch connected accounts
    const accountsResponse = http.get(`${BASE_URL}/api/social/accounts`, {
      params: {
        platform: 'LINKEDIN'
      },
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      tags: { name: 'api' }
    });
    
    const accountsSuccess = check(accountsResponse, {
      'accounts fetch successful': (r) => r.status === 200,
      'accounts response time < 150ms': (r) => r.timings.duration < 150,
      'accounts data is array': (r) => Array.isArray(r.json('data'))
    });
    
    if (!accountsSuccess) {
      errorRate.add(1);
    }
    
    requestCounter.add(1);
  });
}

/**
 * Test mixed LinkedIn operations
 */
function testMixedLinkedInOperations(user) {
  group('Mixed LinkedIn Operations', function() {
    const authToken = authenticateUser(user);
    if (!authToken) return;
    
    // Perform multiple operations in sequence
    const operations = [
      () => http.get(`${BASE_URL}/api/social/accounts?platform=LINKEDIN`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
        tags: { name: 'api' }
      }),
      () => http.get(`${BASE_URL}/api/analytics/linkedin/summary`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
        tags: { name: 'api' }
      }),
      () => http.post(`${BASE_URL}/api/content/schedule`, {
        platform: 'LINKEDIN',
        content: 'Scheduled test post',
        scheduledAt: new Date(Date.now() + 86400000).toISOString()
      }, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        tags: { name: 'api' }
      })
    ];
    
    operations.forEach((operation, index) => {
      const response = operation();
      check(response, {
        [`operation ${index + 1} successful`]: (r) => r.status >= 200 && r.status < 300,
        [`operation ${index + 1} response time < 200ms`]: (r) => r.timings.duration < 200
      }) || errorRate.add(1);
      
      requestCounter.add(1);
      sleep(0.1); // Brief pause between operations
    });
  });
}

/**
 * Helper function to authenticate user and return token
 */
function authenticateUser(user) {
  const loginResponse = http.post(`${BASE_URL}/api/auth/login`, {
    email: user.email,
    password: user.password
  }, {
    tags: { name: 'auth' }
  });
  
  if (loginResponse.status === 200) {
    return loginResponse.json('data.token');
  }
  
  errorRate.add(1);
  return null;
}

/**
 * Setup function - runs once before all test iterations
 */
export function setup() {
  console.log('Starting LinkedIn Load Test...');
  console.log(`Target URL: ${BASE_URL}`);
  console.log(`LinkedIn Mock URL: ${LINKEDIN_MOCK_URL}`);
  
  // Verify API is accessible
  const healthCheck = http.get(`${BASE_URL}/api/health`);
  if (healthCheck.status !== 200) {
    throw new Error(`API health check failed: ${healthCheck.status}`);
  }
  
  console.log('Health check passed. Starting load test...');
  
  return {
    startTime: new Date().toISOString(),
    baseUrl: BASE_URL
  };
}

/**
 * Teardown function - runs once after all test iterations
 */
export function teardown(data) {
  console.log('LinkedIn Load Test completed');
  console.log(`Test started at: ${data.startTime}`);
  console.log(`Test completed at: ${new Date().toISOString()}`);
  
  // Generate summary report
  console.log('\n=== LOAD TEST SUMMARY ===');
  console.log(`Base URL: ${data.baseUrl}`);
  console.log('Performance thresholds:');
  console.log('- API response time (p95): < 500ms');
  console.log('- OAuth response time (p95): < 300ms');
  console.log('- Error rate: < 5%');
  console.log('- OAuth success rate: > 95%');
}

/**
 * Handle summary statistics
 */
export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'linkedin-load-test-results.json': JSON.stringify(data, null, 2),
    'linkedin-load-test-summary.html': htmlReport(data)
  };
}

/**
 * Generate HTML report
 */
function htmlReport(data) {
  const metrics = data.metrics;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <title>LinkedIn Load Test Results</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    .header { background: #0077b5; color: white; padding: 20px; border-radius: 8px; }
    .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin: 20px 0; }
    .metric-card { border: 1px solid #ddd; padding: 20px; border-radius: 8px; }
    .metric-value { font-size: 24px; font-weight: bold; color: #0077b5; }
    .pass { color: green; } .fail { color: red; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background: #f5f5f5; }
  </style>
</head>
<body>
  <div class="header">
    <h1>LinkedIn Integration Load Test Results</h1>
    <p>Generated: ${new Date().toISOString()}</p>
  </div>
  
  <div class="metrics">
    <div class="metric-card">
      <h3>HTTP Requests</h3>
      <div class="metric-value">${metrics.http_reqs?.count || 0}</div>
      <p>Total requests executed</p>
    </div>
    
    <div class="metric-card">
      <h3>Average Response Time</h3>
      <div class="metric-value">${Math.round(metrics.http_req_duration?.avg || 0)}ms</div>
      <p>Mean response time across all requests</p>
    </div>
    
    <div class="metric-card">
      <h3>Error Rate</h3>
      <div class="metric-value ${(metrics.http_req_failed?.rate || 0) < 0.05 ? 'pass' : 'fail'}">
        ${((metrics.http_req_failed?.rate || 0) * 100).toFixed(2)}%
      </div>
      <p>Percentage of failed requests</p>
    </div>
    
    <div class="metric-card">
      <h3>OAuth Success Rate</h3>
      <div class="metric-value ${(metrics.oauth_success?.rate || 0) > 0.95 ? 'pass' : 'fail'}">
        ${((metrics.oauth_success?.rate || 0) * 100).toFixed(2)}%
      </div>
      <p>LinkedIn OAuth completion rate</p>
    </div>
  </div>
  
  <h2>Performance Thresholds</h2>
  <table>
    <tr><th>Metric</th><th>Threshold</th><th>Actual</th><th>Status</th></tr>
    <tr>
      <td>95th Percentile Response Time</td>
      <td>&lt; 500ms</td>
      <td>${Math.round(metrics.http_req_duration?.['p(95)'] || 0)}ms</td>
      <td class="${(metrics.http_req_duration?.['p(95)'] || 0) < 500 ? 'pass' : 'fail'}">
        ${(metrics.http_req_duration?.['p(95)'] || 0) < 500 ? 'PASS' : 'FAIL'}
      </td>
    </tr>
    <tr>
      <td>Error Rate</td>
      <td>&lt; 5%</td>
      <td>${((metrics.http_req_failed?.rate || 0) * 100).toFixed(2)}%</td>
      <td class="${(metrics.http_req_failed?.rate || 0) < 0.05 ? 'pass' : 'fail'}">
        ${(metrics.http_req_failed?.rate || 0) < 0.05 ? 'PASS' : 'FAIL'}
      </td>
    </tr>
    <tr>
      <td>OAuth Success Rate</td>
      <td>&gt; 95%</td>
      <td>${((metrics.oauth_success?.rate || 0) * 100).toFixed(2)}%</td>
      <td class="${(metrics.oauth_success?.rate || 0) > 0.95 ? 'pass' : 'fail'}">
        ${(metrics.oauth_success?.rate || 0) > 0.95 ? 'PASS' : 'FAIL'}
      </td>
    </tr>
  </table>
  
  <h2>Test Configuration</h2>
  <ul>
    <li><strong>Test Duration:</strong> 20 minutes (including ramp up/down)</li>
    <li><strong>Peak Users:</strong> 100 concurrent users</li>
    <li><strong>Scenarios:</strong> OAuth flow, content publishing, analytics, account management</li>
    <li><strong>Target API:</strong> ${BASE_URL}</li>
  </ul>
</body>
</html>
  `;
}

function textSummary(data, options = {}) {
  // Basic text summary for console output
  const metrics = data.metrics;
  
  return `
     ✓ LinkedIn Load Test Summary
     
     Requests: ${metrics.http_reqs?.count || 0}
     Response Time (avg): ${Math.round(metrics.http_req_duration?.avg || 0)}ms
     Response Time (p95): ${Math.round(metrics.http_req_duration?.['p(95)'] || 0)}ms
     Error Rate: ${((metrics.http_req_failed?.rate || 0) * 100).toFixed(2)}%
     OAuth Success: ${((metrics.oauth_success?.rate || 0) * 100).toFixed(2)}%
     
     Thresholds: ${data.threshold_results ? 
       Object.values(data.threshold_results).every(t => t.ok) ? 'PASSED' : 'FAILED' 
       : 'UNKNOWN'}
  `;
}