/**
 * Simple Load Test - AllIN Platform
 *
 * No external dependencies required - uses Node.js built-in modules
 *
 * Usage: node load-tests/simple-load-test.js
 */

const http = require('http');
const https = require('https');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:7000';
const TOTAL_REQUESTS = parseInt(process.env.REQUESTS || '100');
const CONCURRENT_USERS = parseInt(process.env.CONCURRENT || '5'); // Reduced to avoid rate limiting

// Parse URL
const url = new URL(BASE_URL);
const isHttps = url.protocol === 'https:';
const httpModule = isHttps ? https : http;

// Metrics
const metrics = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  responseTimes: [],
  cacheHits: 0,
  cacheMisses: 0,
  errors: [],
  startTime: null,
  endTime: null,
};

// Make HTTP request
function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (data && method === 'POST') {
      const body = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(body);
    }

    const startTime = Date.now();

    const req = httpModule.request(options, (res) => {
      let responseBody = '';

      res.on('data', (chunk) => {
        responseBody += chunk;
      });

      res.on('end', () => {
        const duration = Date.now() - startTime;

        resolve({
          statusCode: res.statusCode,
          duration,
          body: responseBody,
          headers: res.headers,
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data && method === 'POST') {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Test health endpoint
async function testHealthEndpoint() {
  try {
    const response = await makeRequest('/health');
    metrics.totalRequests++;
    metrics.responseTimes.push(response.duration);

    if (response.statusCode === 200) {
      metrics.successfulRequests++;
    } else {
      metrics.failedRequests++;
      metrics.errors.push({
        endpoint: '/health',
        status: response.statusCode,
        duration: response.duration,
      });
    }

    return response;
  } catch (error) {
    metrics.totalRequests++;
    metrics.failedRequests++;
    metrics.errors.push({
      endpoint: '/health',
      error: error.message,
    });
    throw error;
  }
}

// Test API health endpoint
async function testAPIHealthEndpoint() {
  try {
    const response = await makeRequest('/api/health');
    metrics.totalRequests++;
    metrics.responseTimes.push(response.duration);

    if (response.statusCode === 200) {
      metrics.successfulRequests++;

      // Check if response was cached
      try {
        const body = JSON.parse(response.body);
        if (body.cached === true) {
          metrics.cacheHits++;
        } else {
          metrics.cacheMisses++;
        }
      } catch (e) {
        // Ignore parse errors
      }
    } else {
      metrics.failedRequests++;
      metrics.errors.push({
        endpoint: '/api/health',
        status: response.statusCode,
        duration: response.duration,
      });
    }

    return response;
  } catch (error) {
    metrics.totalRequests++;
    metrics.failedRequests++;
    metrics.errors.push({
      endpoint: '/api/health',
      error: error.message,
    });
    throw error;
  }
}

// Test login endpoint
async function testLoginEndpoint() {
  const loginData = {
    email: 'dev@example.com',
    password: 'DevPassword123!',
  };

  try {
    const response = await makeRequest('/api/auth/login', 'POST', loginData);
    metrics.totalRequests++;
    metrics.responseTimes.push(response.duration);

    if (response.statusCode === 200) {
      metrics.successfulRequests++;
    } else {
      metrics.failedRequests++;
      metrics.errors.push({
        endpoint: '/api/auth/login',
        status: response.statusCode,
        duration: response.duration,
      });
    }

    return response;
  } catch (error) {
    metrics.totalRequests++;
    metrics.failedRequests++;
    metrics.errors.push({
      endpoint: '/api/auth/login',
      error: error.message,
    });
    throw error;
  }
}

// Run a single user scenario
async function runUserScenario() {
  try {
    // Test health endpoint
    await testHealthEndpoint();
    await sleep(100);

    // Test API health endpoint (should be cached most times)
    await testAPIHealthEndpoint();
    await sleep(100);

    // Test API health again (should be cached)
    await testAPIHealthEndpoint();
    await sleep(100);

    // Test login
    await testLoginEndpoint();
    await sleep(1000); // Increased delay to avoid rate limiting

  } catch (error) {
    // Errors already tracked in metrics
  }
}

// Sleep helper
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Calculate statistics
function calculateStats() {
  if (metrics.responseTimes.length === 0) {
    return {
      min: 0,
      max: 0,
      avg: 0,
      p50: 0,
      p95: 0,
      p99: 0,
    };
  }

  const sorted = [...metrics.responseTimes].sort((a, b) => a - b);
  const len = sorted.length;

  return {
    min: sorted[0],
    max: sorted[len - 1],
    avg: Math.round(sorted.reduce((a, b) => a + b, 0) / len),
    p50: sorted[Math.floor(len * 0.5)],
    p95: sorted[Math.floor(len * 0.95)],
    p99: sorted[Math.floor(len * 0.99)],
  };
}

// Print results
function printResults() {
  const stats = calculateStats();
  const duration = (metrics.endTime - metrics.startTime) / 1000;
  const successRate = ((metrics.successfulRequests / metrics.totalRequests) * 100).toFixed(2);
  const errorRate = ((metrics.failedRequests / metrics.totalRequests) * 100).toFixed(2);
  const cacheHitRate = metrics.cacheHits + metrics.cacheMisses > 0
    ? ((metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses)) * 100).toFixed(2)
    : 0;

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('                  LOAD TEST RESULTS                        ');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('📊 Test Configuration:');
  console.log(`   Base URL:          ${BASE_URL}`);
  console.log(`   Total Requests:    ${metrics.totalRequests}`);
  console.log(`   Concurrent Users:  ${CONCURRENT_USERS}`);
  console.log(`   Duration:          ${duration.toFixed(2)}s`);
  console.log(`   Requests/sec:      ${(metrics.totalRequests / duration).toFixed(2)}`);

  console.log('\n✅ Success Metrics:');
  console.log(`   Successful:        ${metrics.successfulRequests} (${successRate}%)`);
  console.log(`   Failed:            ${metrics.failedRequests} (${errorRate}%)`);

  console.log('\n⚡ Response Times (ms):');
  console.log(`   Min:               ${stats.min}ms`);
  console.log(`   Average:           ${stats.avg}ms`);
  console.log(`   Median (P50):      ${stats.p50}ms`);
  console.log(`   P95:               ${stats.p95}ms ${stats.p95 < 200 ? '✅' : '⚠️'}`);
  console.log(`   P99:               ${stats.p99}ms`);
  console.log(`   Max:               ${stats.max}ms`);

  console.log('\n💾 Cache Performance:');
  console.log(`   Cache Hits:        ${metrics.cacheHits}`);
  console.log(`   Cache Misses:      ${metrics.cacheMisses}`);
  console.log(`   Hit Rate:          ${cacheHitRate}% ${parseFloat(cacheHitRate) > 90 ? '✅' : '⚠️'}`);

  console.log('\n🎯 Performance Targets:');
  console.log(`   P95 < 200ms:       ${stats.p95 < 200 ? '✅ PASS' : '❌ FAIL'} (${stats.p95}ms)`);
  console.log(`   Error Rate < 1%:   ${parseFloat(errorRate) < 1 ? '✅ PASS' : '❌ FAIL'} (${errorRate}%)`);
  console.log(`   Cache Hit > 90%:   ${parseFloat(cacheHitRate) > 90 ? '✅ PASS' : '⚠️  PARTIAL'} (${cacheHitRate}%)`);

  if (metrics.errors.length > 0) {
    console.log('\n❌ Errors:');
    const errorSummary = {};
    metrics.errors.forEach(err => {
      const key = err.endpoint + (err.status || err.error);
      errorSummary[key] = (errorSummary[key] || 0) + 1;
    });
    Object.entries(errorSummary).forEach(([key, count]) => {
      console.log(`   ${key}: ${count} occurrences`);
    });
  }

  console.log('\n═══════════════════════════════════════════════════════════\n');

  // Overall assessment
  const allPassed = stats.p95 < 200 && parseFloat(errorRate) < 1;
  if (allPassed) {
    console.log('🎉 All performance targets MET! System is production-ready.');
  } else {
    console.log('⚠️  Some performance targets not met. Review results above.');
  }
  console.log('');
}

// Main test execution
async function runLoadTest() {
  console.log('\n🚀 Starting Simple Load Test...');
  console.log(`   Testing: ${BASE_URL}`);
  console.log(`   Concurrent Users: ${CONCURRENT_USERS}`);
  console.log(`   Total Requests: ${TOTAL_REQUESTS}\n`);

  // Verify server is running
  try {
    console.log('Verifying server is running...');
    await makeRequest('/health');
    console.log('✅ Server is responding\n');
  } catch (error) {
    console.error('❌ Server not responding:', error.message);
    console.error('   Make sure the server is running at:', BASE_URL);
    process.exit(1);
  }

  metrics.startTime = Date.now();

  // Run concurrent users
  const iterations = Math.ceil(TOTAL_REQUESTS / CONCURRENT_USERS / 4); // 4 requests per scenario
  console.log(`Running ${iterations} iterations with ${CONCURRENT_USERS} concurrent users...\n`);

  for (let i = 0; i < iterations; i++) {
    const progress = ((i + 1) / iterations * 100).toFixed(0);
    process.stdout.write(`\rProgress: ${progress}% (${metrics.totalRequests}/${TOTAL_REQUESTS * 4} requests)`);

    // Run concurrent user scenarios
    const promises = [];
    for (let j = 0; j < CONCURRENT_USERS; j++) {
      promises.push(runUserScenario());
    }

    await Promise.all(promises);
    await sleep(100); // Small delay between iterations
  }

  metrics.endTime = Date.now();

  console.log('\n\n✅ Load test completed!\n');
  printResults();
}

// Run the test
runLoadTest().catch(error => {
  console.error('\n❌ Load test failed:', error);
  process.exit(1);
});
