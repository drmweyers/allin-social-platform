import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Counter, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const apiCallsCount = new Counter('api_calls');
const apiResponseTime = new Trend('api_response_time');

// Test configuration
export const options = {
  stages: [
    // Ramp up
    { duration: '2m', target: 10 },   // Ramp up to 10 users over 2 minutes
    { duration: '5m', target: 50 },   // Scale up to 50 users over 5 minutes
    { duration: '10m', target: 100 }, // Scale up to 100 users over 10 minutes
    
    // Sustained load
    { duration: '15m', target: 100 }, // Stay at 100 users for 15 minutes
    { duration: '5m', target: 200 },  // Scale up to 200 users for 5 minutes
    { duration: '10m', target: 200 }, // Stay at 200 users for 10 minutes
    
    // Peak load test
    { duration: '2m', target: 500 },  // Scale up to 500 users for 2 minutes
    { duration: '3m', target: 500 },  // Stay at 500 users for 3 minutes
    
    // Ramp down
    { duration: '5m', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    // API response time requirements
    'api_response_time': ['p(95)<200', 'p(99)<500'], // 95% under 200ms, 99% under 500ms
    'http_req_duration': ['p(95)<2000'], // 95% under 2 seconds
    'http_req_failed': ['rate<0.01'], // Error rate under 1%
    'errors': ['rate<0.05'], // Error rate under 5%
  },
};

// Base URLs
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';
const API_URL = __ENV.API_URL || 'http://localhost:5000/api';

// Test data
const TEST_USERS = [
  { email: 'admin@allin.demo', password: 'Admin123!@#' },
  { email: 'agency@allin.demo', password: 'Agency123!@#' },
  { email: 'manager@allin.demo', password: 'Manager123!@#' },
  { email: 'creator@allin.demo', password: 'Creator123!@#' },
  { email: 'client@allin.demo', password: 'Client123!@#' },
  { email: 'team@allin.demo', password: 'Team123!@#' },
];

// Authentication helper
function authenticate() {
  const user = TEST_USERS[Math.floor(Math.random() * TEST_USERS.length)];
  
  const loginResponse = http.post(`${API_URL}/auth/login`, JSON.stringify({
    email: user.email,
    password: user.password,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  const loginCheck = check(loginResponse, {
    'login successful': (r) => r.status === 200,
    'login response time < 500ms': (r) => r.timings.duration < 500,
  });

  if (!loginCheck) {
    errorRate.add(1);
    return null;
  }

  const authData = JSON.parse(loginResponse.body);
  return authData.token;
}

// Main test scenario
export default function () {
  // Authentication
  const token = authenticate();
  if (!token) {
    console.error('Authentication failed');
    return;
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // Test scenarios with different weights
  const scenarios = [
    { name: 'dashboard', weight: 30, func: testDashboard },
    { name: 'content_creation', weight: 25, func: testContentCreation },
    { name: 'social_accounts', weight: 20, func: testSocialAccounts },
    { name: 'analytics', weight: 15, func: testAnalytics },
    { name: 'ai_assistant', weight: 10, func: testAIAssistant },
  ];

  // Select scenario based on weight
  const totalWeight = scenarios.reduce((sum, s) => sum + s.weight, 0);
  const random = Math.random() * totalWeight;
  let cumulativeWeight = 0;
  
  for (const scenario of scenarios) {
    cumulativeWeight += scenario.weight;
    if (random <= cumulativeWeight) {
      scenario.func(headers);
      break;
    }
  }

  sleep(Math.random() * 3 + 1); // Random think time between 1-4 seconds
}

// Test scenarios
function testDashboard(headers) {
  const startTime = new Date();
  
  // Load dashboard
  const dashboardResponse = http.get(`${BASE_URL}/dashboard`, { headers });
  
  check(dashboardResponse, {
    'dashboard loads successfully': (r) => r.status === 200,
    'dashboard response time < 2s': (r) => r.timings.duration < 2000,
  });

  // Load dashboard data via API
  const dashboardDataResponse = http.get(`${API_URL}/dashboard/overview`, { headers });
  
  const apiCheck = check(dashboardDataResponse, {
    'dashboard API success': (r) => r.status === 200,
    'dashboard API response time < 200ms': (r) => r.timings.duration < 200,
  });

  apiCallsCount.add(1);
  apiResponseTime.add(dashboardDataResponse.timings.duration);
  
  if (!apiCheck) {
    errorRate.add(1);
  }
}

function testContentCreation(headers) {
  // Load content creation page
  const createPageResponse = http.get(`${BASE_URL}/content/create`, { headers });
  
  check(createPageResponse, {
    'content creation page loads': (r) => r.status === 200,
  });

  // Create a draft
  const draftData = {
    title: `Test Post ${Math.random().toString(36).substr(2, 9)}`,
    content: 'This is a test post created during load testing.',
    platforms: ['facebook', 'twitter'],
    scheduledFor: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
  };

  const createDraftResponse = http.post(`${API_URL}/drafts`, JSON.stringify(draftData), { headers });
  
  const draftCheck = check(createDraftResponse, {
    'draft creation success': (r) => r.status === 201,
    'draft API response time < 300ms': (r) => r.timings.duration < 300,
  });

  apiCallsCount.add(1);
  apiResponseTime.add(createDraftResponse.timings.duration);
  
  if (!draftCheck) {
    errorRate.add(1);
  }
}

function testSocialAccounts(headers) {
  // Load social accounts
  const accountsResponse = http.get(`${API_URL}/social/accounts`, { headers });
  
  const accountsCheck = check(accountsResponse, {
    'social accounts API success': (r) => r.status === 200,
    'social accounts response time < 150ms': (r) => r.timings.duration < 150,
  });

  apiCallsCount.add(1);
  apiResponseTime.add(accountsResponse.timings.duration);
  
  if (!accountsCheck) {
    errorRate.add(1);
  }

  // Load posts for first account
  if (accountsResponse.status === 200) {
    const accounts = JSON.parse(accountsResponse.body);
    if (accounts.length > 0) {
      const postsResponse = http.get(`${API_URL}/social/posts?accountId=${accounts[0].id}`, { headers });
      
      const postsCheck = check(postsResponse, {
        'social posts API success': (r) => r.status === 200,
        'social posts response time < 200ms': (r) => r.timings.duration < 200,
      });

      apiCallsCount.add(1);
      apiResponseTime.add(postsResponse.timings.duration);
      
      if (!postsCheck) {
        errorRate.add(1);
      }
    }
  }
}

function testAnalytics(headers) {
  // Load analytics data
  const analyticsResponse = http.get(`${API_URL}/analytics/overview?period=7d`, { headers });
  
  const analyticsCheck = check(analyticsResponse, {
    'analytics API success': (r) => r.status === 200,
    'analytics response time < 500ms': (r) => r.timings.duration < 500,
  });

  apiCallsCount.add(1);
  apiResponseTime.add(analyticsResponse.timings.duration);
  
  if (!analyticsCheck) {
    errorRate.add(1);
  }
}

function testAIAssistant(headers) {
  // Test AI chat functionality
  const aiChatData = {
    message: 'Generate a social media post about productivity tips',
    context: 'business',
  };

  const aiResponse = http.post(`${API_URL}/ai/chat`, JSON.stringify(aiChatData), { headers });
  
  const aiCheck = check(aiResponse, {
    'AI chat API success': (r) => r.status === 200,
    'AI response time < 3s': (r) => r.timings.duration < 3000, // AI calls can be slower
  });

  apiCallsCount.add(1);
  apiResponseTime.add(aiResponse.timings.duration);
  
  if (!aiCheck) {
    errorRate.add(1);
  }
}

// Setup function (runs once at the beginning)
export function setup() {
  console.log('Starting load test...');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`API URL: ${API_URL}`);
  
  // Health check before starting tests
  const healthResponse = http.get(`${API_URL}/health`);
  if (healthResponse.status !== 200) {
    throw new Error('API health check failed - aborting test');
  }
  
  console.log('Health check passed - proceeding with load test');
}

// Teardown function (runs once at the end)
export function teardown(data) {
  console.log('Load test completed');
}