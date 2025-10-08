/**
 * k6 Stress Test - AllIN Social Media Platform
 *
 * This test gradually increases load to find the breaking point
 * and validate graceful degradation under extreme load.
 *
 * Usage:
 *   k6 run load-tests/stress-test.js
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const responseTimes = new Trend('response_times');

export const options = {
  stages: [
    { duration: '1m', target: 100 },   // Normal load
    { duration: '2m', target: 500 },   // High load
    { duration: '3m', target: 1000 },  // Stress load
    { duration: '2m', target: 1500 },  // Breaking point
    { duration: '1m', target: 0 },     // Recovery
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // More lenient for stress test
    http_req_failed: ['rate<0.05'],    // Allow up to 5% errors at peak
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:7000';

export function setup() {
  console.log('🔥 Starting stress test to find breaking point...');
  console.log('Target: 1500 concurrent users');

  const health = http.get(`${BASE_URL}/health`);
  if (health.status !== 200) {
    throw new Error(`Server not ready. Status: ${health.status}`);
  }

  return { startTime: new Date() };
}

export default function () {
  group('Stress Test - Health Endpoints', function () {
    const res = http.get(`${BASE_URL}/api/health`);

    responseTimes.add(res.timings.duration);

    check(res, {
      'status is 200': (r) => r.status === 200,
      'response time acceptable': (r) => r.timings.duration < 1000,
    }) || errorRate.add(1);
  });

  sleep(1);
}

export function teardown(data) {
  const endTime = new Date();
  const duration = (endTime - data.startTime) / 1000;

  console.log(`\n🏁 Stress test completed in ${duration.toFixed(2)} seconds`);
  console.log('\nAnalyze the results to determine:');
  console.log('- Maximum supported concurrent users');
  console.log('- Response time degradation curve');
  console.log('- Error rate at different load levels');
  console.log('- Resource utilization patterns');
}
