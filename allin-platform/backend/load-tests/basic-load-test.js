/**
 * k6 Load Test Script - AllIN Social Media Platform
 *
 * This script tests the platform under various load conditions
 * to validate performance optimizations from Week 2.
 *
 * Installation:
 *   Windows: choco install k6
 *   Or download from: https://k6.io/docs/getting-started/installation/
 *
 * Usage:
 *   k6 run load-tests/basic-load-test.js
 *   k6 run --vus 100 --duration 30s load-tests/basic-load-test.js
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const healthCheckDuration = new Trend('health_check_duration');
const apiResponseTime = new Trend('api_response_time');
const cacheHits = new Counter('cache_hits');
const cacheMisses = new Counter('cache_misses');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Warm-up: 10 users
    { duration: '1m', target: 50 },    // Ramp-up: 50 users
    { duration: '2m', target: 100 },   // Target load: 100 users
    { duration: '1m', target: 200 },   // Stress test: 200 users
    { duration: '30s', target: 0 },    // Cool down
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'], // 95% of requests should be below 200ms
    http_req_failed: ['rate<0.01'],   // Less than 1% errors
    errors: ['rate<0.01'],
    health_check_duration: ['p(95)<50'], // Health checks should be very fast
  },
};

// Base URL - adjust if needed
const BASE_URL = __ENV.BASE_URL || 'http://localhost:7000';

// Test user credentials (from seed data)
const TEST_USERS = [
  { email: 'dev@example.com', password: 'DevPassword123!' },
  { email: 'admin@allin.demo', password: 'AdminPass123' },
  { email: 'agency@allin.demo', password: 'AgencyPass123' },
  { email: 'manager@allin.demo', password: 'ManagerPass123' },
];

export function setup() {
  console.log(`Starting load test against: ${BASE_URL}`);
  console.log('Test configuration:', JSON.stringify(options.stages, null, 2));

  // Verify server is running
  const healthCheck = http.get(`${BASE_URL}/health`);
  if (healthCheck.status !== 200) {
    throw new Error(`Server not responding. Status: ${healthCheck.status}`);
  }

  console.log('✅ Server is healthy and ready for testing');
  return { startTime: new Date() };
}

export default function (data) {
  // Select random user for this iteration
  const user = TEST_USERS[Math.floor(Math.random() * TEST_USERS.length)];

  group('Health Check Endpoints', function () {
    // Test basic health endpoint (should be very fast)
    const healthStart = new Date();
    const health = http.get(`${BASE_URL}/health`);
    const healthDuration = new Date() - healthStart;

    healthCheckDuration.add(healthDuration);

    check(health, {
      'health status is 200': (r) => r.status === 200,
      'health response is valid': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.status === 'ok' || body.status === 'healthy';
        } catch (e) {
          return false;
        }
      },
    }) || errorRate.add(1);

    sleep(0.1);

    // Test API health endpoint (with caching)
    const apiHealthStart = new Date();
    const apiHealth = http.get(`${BASE_URL}/api/health`);
    const apiHealthDuration = new Date() - apiHealthStart;

    apiResponseTime.add(apiHealthDuration);

    const apiHealthChecks = check(apiHealth, {
      'api health status is 200': (r) => r.status === 200,
      'api health has cached flag': (r) => {
        try {
          const body = JSON.parse(r.body);
          return 'cached' in body;
        } catch (e) {
          return false;
        }
      },
    });

    if (!apiHealthChecks) {
      errorRate.add(1);
    } else {
      // Track cache hits
      try {
        const body = JSON.parse(apiHealth.body);
        if (body.cached === true) {
          cacheHits.add(1);
        } else {
          cacheMisses.add(1);
        }
      } catch (e) {
        // Ignore parse errors
      }
    }

    sleep(0.1);

    // Test database health endpoint (should be cached most of the time)
    const dbHealth = http.get(`${BASE_URL}/api/health/database`);

    check(dbHealth, {
      'db health status is 200': (r) => r.status === 200,
      'db health response time acceptable': (r) => {
        try {
          const body = JSON.parse(r.body);
          // Cached requests should be very fast (<10ms)
          // Uncached can be slower but should still be reasonable
          return body.cached === true ? true : body.latency < 500;
        } catch (e) {
          return false;
        }
      },
    }) || errorRate.add(1);

    sleep(0.1);

    // Test Redis health endpoint
    const redisHealth = http.get(`${BASE_URL}/api/health/redis`);

    check(redisHealth, {
      'redis health status is 200': (r) => r.status === 200,
    }) || errorRate.add(1);
  });

  sleep(1);

  group('Authentication Flow', function () {
    // Test login endpoint
    const loginPayload = JSON.stringify({
      email: user.email,
      password: user.password,
    });

    const loginParams = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const loginStart = new Date();
    const loginRes = http.post(
      `${BASE_URL}/api/auth/login`,
      loginPayload,
      loginParams
    );
    const loginDuration = new Date() - loginStart;

    apiResponseTime.add(loginDuration);

    const loginChecks = check(loginRes, {
      'login status is 200': (r) => r.status === 200,
      'login response time acceptable': () => loginDuration < 500,
      'login returns access token': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.accessToken && body.accessToken.length > 0;
        } catch (e) {
          return false;
        }
      },
    });

    if (!loginChecks) {
      errorRate.add(1);
    }
  });

  sleep(2);
}

export function teardown(data) {
  const endTime = new Date();
  const duration = (endTime - data.startTime) / 1000;

  console.log(`\n✅ Load test completed in ${duration.toFixed(2)} seconds`);
  console.log('\nExpected results:');
  console.log('- P95 response time: <200ms');
  console.log('- Error rate: <1%');
  console.log('- Cache hit rate: >90%');
  console.log('- Health check P95: <50ms');
}
