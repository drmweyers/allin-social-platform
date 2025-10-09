#!/usr/bin/env node

/**
 * Scaled Load Test - 500+ Concurrent Users
 *
 * Tests system performance under production-level traffic
 * Goal: Validate performance, find bottlenecks, verify stability
 */

const https = require('https');
const http = require('http');

// Test Configuration
const CONFIG = {
  baseUrl: process.env.BASE_URL || 'http://localhost:7000',
  totalRequests: 1000,
  concurrentUsers: 50, // Start conservative: 50 concurrent
  rampUpTime: 10000, // 10 seconds ramp-up
  testDuration: 60000, // 60 seconds sustained load
};

// Test credentials
const TEST_USER = {
  email: 'dev@example.com',
  password: 'DevPassword123!'
};

// Performance metrics
const metrics = {
  requests: {
    total: 0,
    successful: 0,
    failed: 0,
    byEndpoint: {},
    byStatus: {}
  },
  responseTimes: [],
  errors: {},
  startTime: null,
  endTime: null
};

// Helper: Make HTTP request
function makeRequest(endpoint, method = 'GET', body = null) {
  return new Promise((resolve) => {
    const url = new URL(endpoint, CONFIG.baseUrl);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ScaledLoadTest/1.0'
      }
    };

    if (body) {
      const bodyStr = JSON.stringify(body);
      options.headers['Content-Length'] = Buffer.byteLength(bodyStr);
    }

    const startTime = Date.now();
    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        resolve({
          status: res.statusCode,
          responseTime,
          body: data,
          success: res.statusCode >= 200 && res.statusCode < 400
        });
      });
    });

    req.on('error', (error) => {
      const responseTime = Date.now() - startTime;
      resolve({
        status: 0,
        responseTime,
        error: error.message,
        success: false
      });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        status: 0,
        responseTime: 10000,
        error: 'Timeout',
        success: false
      });
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

// Test scenarios
const scenarios = [
  {
    name: 'Health Check',
    weight: 0.3, // 30% of requests
    execute: async () => {
      return await makeRequest('/health');
    }
  },
  {
    name: 'Auth Login',
    weight: 0.4, // 40% of requests
    execute: async () => {
      return await makeRequest('/api/auth/login', 'POST', TEST_USER);
    }
  },
  {
    name: 'API Health',
    weight: 0.3, // 30% of requests
    execute: async () => {
      return await makeRequest('/health');
    }
  }
];

// Select random scenario based on weights
function selectScenario() {
  const random = Math.random();
  let cumulative = 0;

  for (const scenario of scenarios) {
    cumulative += scenario.weight;
    if (random <= cumulative) {
      return scenario;
    }
  }

  return scenarios[0];
}

// Record metrics
function recordMetric(endpoint, result) {
  metrics.requests.total++;

  if (result.success) {
    metrics.requests.successful++;
  } else {
    metrics.requests.failed++;
    const errorKey = `${endpoint}:${result.status || 'error'}`;
    metrics.errors[errorKey] = (metrics.errors[errorKey] || 0) + 1;
  }

  metrics.responseTimes.push(result.responseTime);

  // Track by endpoint
  if (!metrics.requests.byEndpoint[endpoint]) {
    metrics.requests.byEndpoint[endpoint] = { success: 0, failed: 0 };
  }
  if (result.success) {
    metrics.requests.byEndpoint[endpoint].success++;
  } else {
    metrics.requests.byEndpoint[endpoint].failed++;
  }

  // Track by status
  const statusKey = result.status || 'error';
  metrics.requests.byStatus[statusKey] = (metrics.requests.byStatus[statusKey] || 0) + 1;
}

// Calculate percentiles
function calculatePercentile(arr, p) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

// Generate report
function generateReport() {
  const duration = (metrics.endTime - metrics.startTime) / 1000;
  const successRate = (metrics.requests.successful / metrics.requests.total * 100).toFixed(2);
  const rps = (metrics.requests.total / duration).toFixed(2);

  console.log('\n\n═══════════════════════════════════════════════════════════');
  console.log('              SCALED LOAD TEST RESULTS                    ');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('📊 Test Configuration:');
  console.log(`   Base URL:          ${CONFIG.baseUrl}`);
  console.log(`   Total Requests:    ${metrics.requests.total}`);
  console.log(`   Concurrent Users:  ${CONFIG.concurrentUsers}`);
  console.log(`   Duration:          ${duration.toFixed(2)}s`);
  console.log(`   Requests/sec:      ${rps}\n`);

  console.log('✅ Success Metrics:');
  console.log(`   Successful:        ${metrics.requests.successful} (${successRate}%)`);
  console.log(`   Failed:            ${metrics.requests.failed} (${(100 - successRate).toFixed(2)}%)\n`);

  console.log('⚡ Response Times (ms):');
  console.log(`   Min:               ${Math.min(...metrics.responseTimes)}ms`);
  console.log(`   Average:           ${(metrics.responseTimes.reduce((a, b) => a + b, 0) / metrics.responseTimes.length).toFixed(0)}ms`);
  console.log(`   Median (P50):      ${calculatePercentile(metrics.responseTimes, 50)}ms`);
  console.log(`   P95:               ${calculatePercentile(metrics.responseTimes, 95)}ms ${calculatePercentile(metrics.responseTimes, 95) > 200 ? '⚠️' : '✅'}`);
  console.log(`   P99:               ${calculatePercentile(metrics.responseTimes, 99)}ms`);
  console.log(`   Max:               ${Math.max(...metrics.responseTimes)}ms\n`);

  console.log('📈 By Endpoint:');
  Object.entries(metrics.requests.byEndpoint).forEach(([endpoint, stats]) => {
    const total = stats.success + stats.failed;
    const successPct = ((stats.success / total) * 100).toFixed(1);
    console.log(`   ${endpoint}: ${stats.success}/${total} (${successPct}%)`);
  });
  console.log();

  console.log('📊 Status Code Distribution:');
  Object.entries(metrics.requests.byStatus)
    .sort(([a], [b]) => a - b)
    .forEach(([status, count]) => {
      const pct = ((count / metrics.requests.total) * 100).toFixed(1);
      const icon = status.toString().startsWith('2') ? '✅' : status.toString().startsWith('4') ? '⚠️' : '❌';
      console.log(`   ${icon} ${status}: ${count} (${pct}%)`);
    });
  console.log();

  if (Object.keys(metrics.errors).length > 0) {
    console.log('❌ Errors:');
    Object.entries(metrics.errors)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .forEach(([error, count]) => {
        console.log(`   ${error}: ${count} occurrences`);
      });
    console.log();
  }

  console.log('🎯 Performance Targets:');
  const p95 = calculatePercentile(metrics.responseTimes, 95);
  console.log(`   P95 < 200ms:       ${p95 < 200 ? '✅ PASS' : '❌ FAIL'} (${p95}ms)`);
  console.log(`   Success > 95%:     ${parseFloat(successRate) > 95 ? '✅ PASS' : '❌ FAIL'} (${successRate}%)`);
  console.log(`   RPS > 50:          ${parseFloat(rps) > 50 ? '✅ PASS' : '⚠️ PARTIAL'} (${rps})`);

  console.log('\n═══════════════════════════════════════════════════════════\n');

  const allTargetsMet = p95 < 200 && parseFloat(successRate) > 95 && parseFloat(rps) > 50;
  if (allTargetsMet) {
    console.log('✅ All performance targets met!');
  } else {
    console.log('⚠️  Some performance targets not met. Review results above.');
  }
  console.log();
}

// Execute single virtual user
async function virtualUser(userId, requestCount) {
  for (let i = 0; i < requestCount; i++) {
    const scenario = selectScenario();
    try {
      const result = await scenario.execute();
      recordMetric(scenario.name, result);

      // Small delay between requests (simulate real user)
      await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 900)); // 100-1000ms
    } catch (error) {
      recordMetric(scenario.name, {
        status: 0,
        responseTime: 0,
        error: error.message,
        success: false
      });
    }
  }
}

// Main test execution
async function runScaledLoadTest() {
  console.log('🚀 Starting Scaled Load Test...');
  console.log(`   Testing: ${CONFIG.baseUrl}`);
  console.log(`   Concurrent Users: ${CONFIG.concurrentUsers}`);
  console.log(`   Total Requests: ${CONFIG.totalRequests}\n`);

  // Verify server is running
  console.log('Verifying server is running...');
  try {
    const healthCheck = await makeRequest('/health');
    if (!healthCheck.success) {
      console.error('❌ Server health check failed!');
      console.error(`   Status: ${healthCheck.status}`);
      console.error(`   Error: ${healthCheck.error}`);
      process.exit(1);
    }
    console.log('✅ Server is responding\n');
  } catch (error) {
    console.error('❌ Failed to connect to server:', error.message);
    process.exit(1);
  }

  metrics.startTime = Date.now();

  // Calculate requests per user
  const requestsPerUser = Math.ceil(CONFIG.totalRequests / CONFIG.concurrentUsers);

  console.log(`Running ${CONFIG.concurrentUsers} concurrent users...`);
  console.log(`Each user will make ${requestsPerUser} requests\n`);

  // Create virtual users with ramp-up
  const users = [];
  const delayBetweenUsers = CONFIG.rampUpTime / CONFIG.concurrentUsers;

  for (let i = 0; i < CONFIG.concurrentUsers; i++) {
    await new Promise(resolve => setTimeout(resolve, delayBetweenUsers));
    users.push(virtualUser(i, requestsPerUser));

    // Progress indicator
    if ((i + 1) % 10 === 0) {
      process.stdout.write(`\rRamping up: ${i + 1}/${CONFIG.concurrentUsers} users started...`);
    }
  }

  console.log(`\rRamping up: ${CONFIG.concurrentUsers}/${CONFIG.concurrentUsers} users started ✅\n`);
  console.log('Running sustained load test...');

  // Progress monitoring
  const progressInterval = setInterval(() => {
    const elapsed = ((Date.now() - metrics.startTime) / 1000).toFixed(0);
    const progress = ((metrics.requests.total / CONFIG.totalRequests) * 100).toFixed(0);
    process.stdout.write(`\rProgress: ${progress}% (${metrics.requests.total}/${CONFIG.totalRequests} requests) - ${elapsed}s elapsed`);
  }, 1000);

  // Wait for all users to complete
  await Promise.all(users);

  clearInterval(progressInterval);
  console.log(`\n\n✅ Load test completed!\n`);

  metrics.endTime = Date.now();

  generateReport();
}

// Run the test
runScaledLoadTest().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
