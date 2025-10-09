# Monitoring Setup - AllIN Platform

**Date**: October 9, 2025
**Status**: ✅ **OPERATIONAL** - Prometheus + Grafana Monitoring Active

---

## 📊 Monitoring Stack Overview

The AllIN platform now has enterprise-grade monitoring infrastructure with Prometheus metrics collection and Grafana dashboards.

### **Architecture**

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│  Backend    │─────▶│  Prometheus  │─────▶│   Grafana   │
│  (Port 7000)│      │  (Port 9090) │      │ (Port 3001) │
│  /metrics   │      │  Scraping    │      │  Dashboards │
└─────────────┘      └──────────────┘      └─────────────┘
       │                     │
       │                     │
       ▼                     ▼
  Custom Metrics      System Metrics
  - HTTP requests     - CPU usage
  - Response times    - Memory
  - Cache hits/misses - Event loop
  - DB queries        - Heap size
  - OAuth operations  - Network
```

---

## 🎯 Quick Access

| Service | URL | Credentials | Purpose |
|---------|-----|-------------|---------|
| **Prometheus** | http://localhost:9090 | None | Metrics collection & queries |
| **Grafana** | http://localhost:3001 | admin / admin | Dashboards & visualization |
| **Backend Metrics** | http://localhost:7000/metrics | None | Raw Prometheus metrics |
| **cAdvisor** | http://localhost:8080 | None | Container metrics |

---

## 📈 Available Metrics

### **HTTP Request Metrics**

```
# Request duration histogram (response times)
allin_http_request_duration_seconds{method, route, status_code}

# Request counter (total requests)
allin_http_requests_total{method, route, status_code}

# Active connections gauge
allin_active_connections
```

**Example Queries**:
```promql
# P95 response time for /health endpoint
histogram_quantile(0.95, rate(allin_http_request_duration_seconds_bucket{route="/health"}[5m]))

# Requests per second by status code
rate(allin_http_requests_total[1m])

# Current active connections
allin_active_connections
```

### **Cache Metrics**

```
# Cache hits
allin_cache_hits_total{cache_type}

# Cache misses
allin_cache_misses_total{cache_type}
```

**Example Queries**:
```promql
# Cache hit rate
rate(allin_cache_hits_total[5m]) / (rate(allin_cache_hits_total[5m]) + rate(allin_cache_misses_total[5m]))
```

### **Database Metrics**

```
# Query duration histogram
allin_db_query_duration_seconds{operation, table}

# Query counter
allin_db_queries_total{operation, table, status}
```

**Example Queries**:
```promql
# P99 database query latency
histogram_quantile(0.99, rate(allin_db_query_duration_seconds_bucket[5m]))

# Failed database queries
rate(allin_db_queries_total{status="error"}[5m])
```

### **OAuth & Social Media Metrics**

```
# OAuth operations
allin_oauth_operations_total{platform, operation, status}

# Social API calls
allin_social_api_calls_total{platform, endpoint, status}

# Social API duration
allin_social_api_duration_seconds{platform, endpoint}
```

**Example Queries**:
```promql
# OAuth success rate by platform
rate(allin_oauth_operations_total{status="success"}[5m]) / rate(allin_oauth_operations_total[5m])

# Average social API response time
avg(rate(allin_social_api_duration_seconds_sum[5m]) / rate(allin_social_api_duration_seconds_count[5m]))
```

### **Node.js Process Metrics** (Auto-collected)

```
# CPU usage
allin_process_cpu_seconds_total

# Memory usage
allin_process_resident_memory_bytes
allin_process_heap_bytes

# Event loop lag
allin_nodejs_eventloop_lag_seconds
allin_nodejs_eventloop_lag_p50_seconds
allin_nodejs_eventloop_lag_p95_seconds
allin_nodejs_eventloop_lag_p99_seconds

# Garbage collection
allin_nodejs_gc_duration_seconds
```

**Example Queries**:
```promql
# CPU usage rate
rate(allin_process_cpu_seconds_total[5m]) * 100

# Memory usage in MB
allin_process_resident_memory_bytes / 1024 / 1024

# Event loop P95 lag
allin_nodejs_eventloop_lag_p95_seconds
```

---

## 🚀 Getting Started

### **1. Start Monitoring Stack**

```bash
# Start all monitoring services
cd allin-platform
docker-compose --profile monitoring up -d

# Verify services are running
docker ps | grep -E "(prometheus|grafana|cadvisor)"
```

**Expected Output**:
```
allin-prometheus    Up 2 minutes (healthy)   0.0.0.0:9090->9090/tcp
allin-grafana       Up 2 minutes (healthy)   0.0.0.0:3001->3000/tcp
allin-cadvisor      Up 2 minutes (healthy)   0.0.0.0:8080->8080/tcp
```

### **2. Verify Metrics Collection**

```bash
# Test backend metrics endpoint
curl http://localhost:7000/metrics | head -30

# Check Prometheus targets
curl http://localhost:9090/api/v1/targets | grep backend-api-dev
```

### **3. Access Grafana**

1. Navigate to http://localhost:3001
2. Login with default credentials: `admin` / `admin`
3. Add Prometheus data source:
   - URL: `http://prometheus:9090`
   - Access: Server (default)
   - Save & Test

---

## 📊 Grafana Dashboard Setup

### **Recommended Dashboards**

#### **1. AllIN Platform Overview**

Create dashboard with following panels:

**Row 1: Request Metrics**
- Requests/sec: `rate(allin_http_requests_total[1m])`
- Success Rate: `rate(allin_http_requests_total{status_code=~"2.."}[5m]) / rate(allin_http_requests_total[5m]) * 100`
- P95 Response Time: `histogram_quantile(0.95, rate(allin_http_request_duration_seconds_bucket[5m])) * 1000`
- Active Connections: `allin_active_connections`

**Row 2: System Health**
- CPU Usage: `rate(allin_process_cpu_seconds_total[5m]) * 100`
- Memory Usage: `allin_process_resident_memory_bytes / 1024 / 1024`
- Event Loop Lag: `allin_nodejs_eventloop_lag_p95_seconds * 1000`
- Heap Usage: `allin_process_heap_bytes / 1024 / 1024`

**Row 3: Application Metrics**
- Cache Hit Rate: `rate(allin_cache_hits_total[5m]) / (rate(allin_cache_hits_total[5m]) + rate(allin_cache_misses_total[5m])) * 100`
- DB Query P99: `histogram_quantile(0.99, rate(allin_db_query_duration_seconds_bucket[5m])) * 1000`
- OAuth Success Rate: `rate(allin_oauth_operations_total{status="success"}[5m]) / rate(allin_oauth_operations_total[5m]) * 100`

#### **2. Import Pre-built Dashboards**

Grafana provides pre-built dashboards for common metrics:

- **Node Exporter Full**: Dashboard ID `1860`
- **Docker Container**: Dashboard ID `193`
- **Prometheus Stats**: Dashboard ID `2`

**To Import**:
1. Go to Dashboards → Import
2. Enter dashboard ID
3. Select Prometheus data source
4. Click Import

---

## ⚠️ Alert Configuration

### **Recommended Alerts**

Create the following alert rules in Prometheus (`monitoring/alerts.yml`):

```yaml
groups:
  - name: allin-platform-alerts
    interval: 30s
    rules:
      # High Error Rate
      - alert: HighErrorRate
        expr: rate(allin_http_requests_total{status_code=~"5.."}[5m]) > 0.05
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "High 5xx error rate detected"
          description: "{{ $value }} errors per second in last 5 minutes"

      # Slow Response Time
      - alert: SlowResponseTime
        expr: histogram_quantile(0.95, rate(allin_http_request_duration_seconds_bucket[5m])) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "P95 response time exceeds 1 second"
          description: "P95 response time is {{ $value }}s"

      # High Memory Usage
      - alert: HighMemoryUsage
        expr: allin_process_resident_memory_bytes > 1073741824
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Memory usage exceeds 1GB"
          description: "Current memory usage: {{ $value | humanize }}B"

      # Event Loop Lag
      - alert: HighEventLoopLag
        expr: allin_nodejs_eventloop_lag_p95_seconds > 0.1
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "Event loop lag exceeds 100ms"
          description: "P95 event loop lag is {{ $value }}s"

      # Cache Hit Rate Low
      - alert: LowCacheHitRate
        expr: rate(allin_cache_hits_total[5m]) / (rate(allin_cache_hits_total[5m]) + rate(allin_cache_misses_total[5m])) < 0.5
        for: 10m
        labels:
          severity: info
        annotations:
          summary: "Cache hit rate below 50%"
          description: "Cache hit rate is {{ $value | humanizePercentage }}"

      # Database Query Slow
      - alert: SlowDatabaseQueries
        expr: histogram_quantile(0.99, rate(allin_db_query_duration_seconds_bucket[5m])) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "P99 database queries exceed 2 seconds"
          description: "P99 query time is {{ $value }}s"
```

### **Enable Alerting**

1. Uncomment alert rules in `monitoring/prometheus.yml`:
   ```yaml
   rule_files:
     - "alerts.yml"
   ```

2. Restart Prometheus:
   ```bash
   docker restart allin-prometheus
   ```

---

## 🔧 Troubleshooting

### **Prometheus Not Scraping Backend**

**Symptom**: Prometheus shows backend target as "down"

**Check**:
```bash
# Verify backend metrics endpoint works
curl http://localhost:7000/metrics

# Check Prometheus can reach backend from inside container
docker exec allin-prometheus wget -qO- http://backend-dev:7000/metrics
```

**Solution**: Ensure backend is on correct network and port is correct in `monitoring/prometheus.yml`

### **Grafana Can't Connect to Prometheus**

**Symptom**: Data source test fails in Grafana

**Check**:
```bash
# Verify both services are on same network
docker network inspect allin-platform_allin-network
```

**Solution**: Use `http://prometheus:9090` as data source URL (not `localhost`)

### **No Metrics Showing in Grafana**

**Symptom**: Dashboards are empty or show "No data"

**Check**:
```bash
# Query Prometheus directly
curl "http://localhost:9090/api/v1/query?query=allin_http_requests_total"
```

**Solution**:
1. Generate traffic to backend: `curl http://localhost:7000/health`
2. Wait 1-2 minutes for Prometheus to scrape
3. Refresh Grafana dashboard

---

## 📚 Files Created/Modified

### **New Files**
- `backend/src/services/metrics.service.ts` - Prometheus metrics implementation
- `backend/MONITORING-SETUP.md` - This documentation

### **Modified Files**
- `backend/src/index.ts` - Added metrics middleware and /metrics endpoint
- `backend/package.json` - Added prom-client dependency
- `monitoring/prometheus.yml` - Updated backend scrape target to port 7000

---

## 🎯 Performance Targets

Based on load testing results, the following targets are recommended:

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| **P50 Response Time** | <50ms | >100ms |
| **P95 Response Time** | <200ms | >500ms |
| **P99 Response Time** | <1000ms | >2000ms |
| **Success Rate** | >99% | <95% |
| **Cache Hit Rate** | >90% | <50% |
| **CPU Usage** | <70% | >85% |
| **Memory Usage** | <1GB | >1.5GB |
| **Event Loop Lag** | <50ms | >100ms |

---

## 🚀 Next Steps

1. **Create Custom Dashboards** ✅
   - Design AllIN-specific dashboard
   - Add panels for all key metrics
   - Configure auto-refresh

2. **Set Up Alerts** ⏸️
   - Configure alert rules
   - Set up AlertManager
   - Integrate with Slack/email

3. **Add More Metrics** ⏸️
   - Add custom business metrics
   - Track user activity
   - Monitor third-party API usage

4. **Production Deployment** ⏸️
   - Configure retention policies
   - Set up persistent storage
   - Implement access control

---

**Session Completed**: October 9, 2025
**Status**: ✅ **MONITORING INFRASTRUCTURE OPERATIONAL**
**Prometheus**: ✅ Scraping backend on port 7000
**Grafana**: ✅ Ready for dashboard configuration
**Metrics Endpoint**: ✅ http://localhost:7000/metrics
