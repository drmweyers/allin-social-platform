# Load Testing Guide - AllIN Platform

## Overview

This directory contains k6 load testing scripts to validate the performance optimizations from BMAD FIX Phase Week 2.

## Installation

### Install k6

**Windows (Chocolatey)**:
```bash
choco install k6
```

**Windows (Direct Download)**:
Download from: https://k6.io/docs/getting-started/installation/

**Verify Installation**:
```bash
k6 version
```

## Available Tests

### 1. Basic Load Test (`basic-load-test.js`)

Tests the platform under realistic load conditions.

**What it tests**:
- Health check endpoints (/, /api/health, /api/health/database, /api/health/redis)
- Authentication flow (login endpoint)
- Cache hit rates
- Response times under load

**Load Profile**:
- Warm-up: 10 users (30s)
- Ramp-up: 50 users (1m)
- Target load: 100 users (2m)
- Stress: 200 users (1m)
- Cool down: 0 users (30s)

**Run the test**:
```bash
cd backend
k6 run load-tests/basic-load-test.js
```

**Expected Results**:
- P95 response time: <200ms ✅
- Error rate: <1% ✅
- Cache hit rate: >90% ✅
- Health check P95: <50ms ✅

---

### 2. Stress Test (`stress-test.js`)

Gradually increases load to find the breaking point.

**What it tests**:
- System behavior under extreme load
- Graceful degradation
- Maximum concurrent users supported
- Resource exhaustion points

**Load Profile**:
- Normal: 100 users (1m)
- High: 500 users (2m)
- Stress: 1000 users (3m)
- Breaking point: 1500 users (2m)
- Recovery: 0 users (1m)

**Run the test**:
```bash
cd backend
k6 run load-tests/stress-test.js
```

**Expected Results**:
- Supports 1000+ concurrent users ✅
- Graceful degradation (not crash) ✅
- P95 < 500ms at peak load ✅
- Error rate < 5% at peak load ✅

---

## Running Tests

### Basic Test (Recommended First)
```bash
cd backend
k6 run load-tests/basic-load-test.js
```

### Custom VU Count
```bash
# 50 virtual users for 30 seconds
k6 run --vus 50 --duration 30s load-tests/basic-load-test.js
```

### Stress Test
```bash
k6 run load-tests/stress-test.js
```

### With Environment Variable
```bash
# Test against different server
k6 run -e BASE_URL=http://localhost:5000 load-tests/basic-load-test.js
```

---

## Interpreting Results

### Key Metrics

**http_req_duration**: Request response time
- P95 should be <200ms for target load
- P95 should be <500ms for stress load

**http_req_failed**: Error rate
- Should be <1% for normal load
- Should be <5% for stress load

**cache_hits / cache_misses**: Cache effectiveness
- Cache hit rate should be >90%

**health_check_duration**: Health endpoint performance
- Should be <50ms P95 (most should be <5ms cached)

### Sample Good Output

```
scenarios: (100.00%) 1 scenario, 200 max VUs, 5m30s max duration
default: Up to 200 looping VUs for 5m0s over 5 stages

✓ health status is 200
✓ api health status is 200
✓ login status is 200
✓ login response time acceptable

checks.........................: 100.00% ✓ 45234      ✗ 0
errors.........................: 0.08%   ✓ 36         ✗ 0
http_req_duration..............: avg=45ms    min=2ms   med=35ms   max=856ms  p(95)=156ms
cache_hits.....................: 10234   ~90%
cache_misses...................: 1124    ~10%
```

### Warning Signs

❌ **High Error Rate**: >1% errors
- Check server logs for errors
- Verify database/Redis connections
- Check resource limits (memory, CPU)

❌ **Slow Response Times**: P95 >200ms
- Check if caching is working
- Verify database pool is warmed up
- Monitor resource utilization

❌ **Low Cache Hit Rate**: <80%
- Verify Redis is running
- Check cache TTLs are appropriate
- Ensure cache keys are consistent

---

## Monitoring During Tests

### Check Server Logs
```bash
# Backend logs
docker logs allin-backend-dev -f --tail 100

# Or if running locally
npm run dev
```

### Monitor Resource Usage
```bash
# Docker stats
docker stats allin-backend-dev

# Watch CPU/Memory
docker stats --no-stream
```

### Check Redis
```bash
# Connect to Redis
docker exec -it allin-redis redis-cli

# Check cache
> KEYS health:*
> GET health:status
> TTL health:status
```

### Check Database Connections
```bash
# PostgreSQL connections
docker exec -it allin-postgres psql -U postgres -d allin -c "SELECT count(*) FROM pg_stat_activity;"
```

---

## Troubleshooting

### Issue: Tests Fail to Connect

**Solution**:
```bash
# Verify server is running
curl http://localhost:7000/health

# Check if port is correct
docker ps | grep allin-backend

# Start server if needed
docker-compose --profile dev up -d
```

### Issue: High Error Rates

**Solution**:
```bash
# Check server logs
docker logs allin-backend-dev --tail 100

# Verify database is connected
curl http://localhost:7000/api/health/database

# Verify Redis is connected
curl http://localhost:7000/api/health/redis
```

### Issue: Slow Response Times

**Solution**:
```bash
# Verify database warmup happened
docker logs allin-backend-dev | grep "warmed up"

# Check cache is working
curl http://localhost:7000/api/health
curl http://localhost:7000/api/health  # Should show cached: true

# Monitor resource usage
docker stats allin-backend-dev
```

---

## Performance Targets (From BMAD Week 2)

### Response Times
- Health endpoints: <10ms (cached), <50ms (uncached)
- API health: <50ms P95
- Database health: <100ms P95
- Login endpoint: <200ms P95

### Cache Performance
- Hit rate: >90%
- TTL: 30-60 seconds
- Cached response time: <5ms

### Load Capacity
- Target load: 500 concurrent users
- Stress load: 1000+ concurrent users
- Error rate: <1% under target load

---

## Next Steps After Load Testing

1. **Analyze Results**: Review metrics and identify bottlenecks
2. **Create Report**: Document findings in `LOAD-TESTING-RESULTS.md`
3. **Fix Issues**: Address any performance problems found
4. **Re-test**: Validate fixes with another test run
5. **Move to Security Testing**: Start penetration testing

---

## Resources

- k6 Documentation: https://k6.io/docs/
- k6 Examples: https://k6.io/docs/examples/
- k6 Metrics: https://k6.io/docs/using-k6/metrics/
- k6 Thresholds: https://k6.io/docs/using-k6/thresholds/
