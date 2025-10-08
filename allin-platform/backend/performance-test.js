/**
 * Performance Testing Script for AllIN Social Media Management Platform
 * Measures API response times and identifies bottlenecks
 */

const https = require('https');
const http = require('http');

// Test configuration
const BASE_URL = 'http://localhost:5000';
const ITERATIONS = 10; // Number of iterations per endpoint
const MASTER_CREDENTIALS = {
  admin: { email: 'admin@allin.demo', password: 'AdminPass123' },
  agency: { email: 'agency@allin.demo', password: 'AgencyPass123' },
  manager: { email: 'manager@allin.demo', password: 'ManagerPass123' }
};

// Results storage
const results = {
  endpoints: [],
  summary: {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    averageResponseTime: 0,
    p95ResponseTime: 0,
    p99ResponseTime: 0
  }
};

/**
 * Make HTTP request and measure performance
 */
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const protocol = options.port === 443 ? https : http;

    const req = protocol.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        let parsedBody = null;
        try {
          parsedBody = body ? JSON.parse(body) : null;
        } catch (e) {
          // Not JSON, keep as string
          parsedBody = body;
        }

        resolve({
          statusCode: res.statusCode,
          responseTime,
          headers: res.headers,
          body: parsedBody
        });
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

/**
 * Test endpoint multiple times and calculate statistics
 */
async function testEndpoint(name, options, data = null, requiresAuth = false, authToken = null) {
  console.log(`\nTesting: ${name}`);
  console.log(`Method: ${options.method} ${options.path}`);

  const times = [];
  let successCount = 0;
  let errorCount = 0;

  // Add auth header if required
  if (requiresAuth && authToken) {
    options.headers = options.headers || {};
    options.headers['Cookie'] = `sessionToken=${authToken}`;
  }

  for (let i = 0; i < ITERATIONS; i++) {
    try {
      const result = await makeRequest(options, data);
      times.push(result.responseTime);

      if (result.statusCode >= 200 && result.statusCode < 300) {
        successCount++;
        process.stdout.write('✓');
      } else {
        errorCount++;
        process.stdout.write('✗');
      }
    } catch (error) {
      errorCount++;
      process.stdout.write('✗');
      times.push(5000); // Timeout/error penalty
    }

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(''); // New line after progress

  // Calculate statistics
  times.sort((a, b) => a - b);
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const min = times[0];
  const max = times[times.length - 1];
  const p50 = times[Math.floor(times.length * 0.5)];
  const p95 = times[Math.floor(times.length * 0.95)];
  const p99 = times[Math.floor(times.length * 0.99)];

  const endpointResult = {
    name,
    method: options.method,
    path: options.path,
    iterations: ITERATIONS,
    successCount,
    errorCount,
    stats: {
      min,
      max,
      avg: Math.round(avg),
      p50,
      p95,
      p99
    },
    passesBenchmark: p95 < 200
  };

  results.endpoints.push(endpointResult);
  results.summary.totalTests += ITERATIONS;
  results.summary.passedTests += successCount;
  results.summary.failedTests += errorCount;

  console.log(`Min: ${min}ms | Avg: ${Math.round(avg)}ms | Max: ${max}ms | P95: ${p95}ms | P99: ${p99}ms`);
  console.log(`Success Rate: ${((successCount / ITERATIONS) * 100).toFixed(1)}%`);
  console.log(`Benchmark (<200ms P95): ${endpointResult.passesBenchmark ? '✅ PASS' : '❌ FAIL'}`);

  return endpointResult;
}

/**
 * Login and get session token
 */
async function login(credentials) {
  console.log(`\n🔐 Logging in as ${credentials.email}...`);

  try {
    const result = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, credentials);

    if (result.statusCode === 200) {
      // Extract session token from Set-Cookie header
      const setCookie = result.headers['set-cookie'];
      if (setCookie) {
        const sessionCookie = setCookie.find(c => c.startsWith('sessionToken='));
        if (sessionCookie) {
          const token = sessionCookie.split(';')[0].split('=')[1];
          console.log(`✅ Login successful`);
          return token;
        }
      }
    }

    console.log(`❌ Login failed: ${result.statusCode}`);
    return null;
  } catch (error) {
    console.log(`❌ Login error: ${error.message}`);
    return null;
  }
}

/**
 * Run all performance tests
 */
async function runPerformanceTests() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('   AllIN Platform - API Performance Benchmark Report');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Target: ${BASE_URL}`);
  console.log(`Iterations per endpoint: ${ITERATIONS}`);
  console.log(`Target P95: <200ms`);
  console.log('═══════════════════════════════════════════════════════════\n');

  // Test 1: Health Check Endpoint (No Auth)
  await testEndpoint(
    'Health Check',
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/health',
      method: 'GET'
    }
  );

  // Test 2: Root Health Check
  await testEndpoint(
    'Root Health Check',
    {
      hostname: 'localhost',
      port: 5000,
      path: '/health',
      method: 'GET'
    }
  );

  // Test 3: Database Health Check
  await testEndpoint(
    'Database Health Check',
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/health/database',
      method: 'GET'
    }
  );

  // Test 4: Redis Health Check
  await testEndpoint(
    'Redis Health Check',
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/health/redis',
      method: 'GET'
    }
  );

  // Test 5: Login Endpoint
  const loginResult = await testEndpoint(
    'Login Authentication',
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    },
    MASTER_CREDENTIALS.admin
  );

  // Get session token for authenticated tests
  const sessionToken = await login(MASTER_CREDENTIALS.admin);

  if (sessionToken) {
    // Test 6: Session Validation
    await testEndpoint(
      'Session Validation',
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/session',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      },
      null,
      true,
      sessionToken
    );

    // Test 7: Get Current User
    await testEndpoint(
      'Get Current User',
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/me',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      },
      null,
      true,
      sessionToken
    );
  }

  // Calculate summary statistics
  const allResponseTimes = results.endpoints.flatMap(e =>
    Array(e.iterations).fill(e.stats.avg)
  );
  allResponseTimes.sort((a, b) => a - b);

  results.summary.averageResponseTime = Math.round(
    allResponseTimes.reduce((a, b) => a + b, 0) / allResponseTimes.length
  );
  results.summary.p95ResponseTime = allResponseTimes[Math.floor(allResponseTimes.length * 0.95)];
  results.summary.p99ResponseTime = allResponseTimes[Math.floor(allResponseTimes.length * 0.99)];

  // Print summary
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('                    PERFORMANCE SUMMARY');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log(`Total Tests: ${results.summary.totalTests}`);
  console.log(`Passed: ${results.summary.passedTests} (${((results.summary.passedTests / results.summary.totalTests) * 100).toFixed(1)}%)`);
  console.log(`Failed: ${results.summary.failedTests} (${((results.summary.failedTests / results.summary.totalTests) * 100).toFixed(1)}%)`);
  console.log(`\nAverage Response Time: ${results.summary.averageResponseTime}ms`);
  console.log(`P95 Response Time: ${results.summary.p95ResponseTime}ms`);
  console.log(`P99 Response Time: ${results.summary.p99ResponseTime}ms`);

  const passedBenchmarks = results.endpoints.filter(e => e.passesBenchmark).length;
  const totalEndpoints = results.endpoints.length;

  console.log(`\nBenchmark Compliance: ${passedBenchmarks}/${totalEndpoints} endpoints (<200ms P95)`);

  // Performance score calculation
  const successRate = results.summary.passedTests / results.summary.totalTests;
  const benchmarkRate = passedBenchmarks / totalEndpoints;
  const performanceScore = Math.round((successRate * 0.5 + benchmarkRate * 0.5) * 100);

  console.log(`\n🎯 Performance Score: ${performanceScore}/100`);

  if (performanceScore >= 90) {
    console.log('✅ EXCELLENT - Production ready!');
  } else if (performanceScore >= 75) {
    console.log('⚠️  GOOD - Minor optimizations recommended');
  } else if (performanceScore >= 60) {
    console.log('⚠️  FAIR - Performance improvements needed');
  } else {
    console.log('❌ POOR - Critical performance issues detected');
  }

  console.log('\n═══════════════════════════════════════════════════════════\n');

  return results;
}

// Run tests
runPerformanceTests()
  .then(results => {
    // Save results to file
    const fs = require('fs');
    fs.writeFileSync(
      'performance-results.json',
      JSON.stringify(results, null, 2)
    );
    console.log('📊 Results saved to performance-results.json\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Performance test failed:', error);
    process.exit(1);
  });
