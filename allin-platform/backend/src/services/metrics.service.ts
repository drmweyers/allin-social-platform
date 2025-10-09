import { Request, Response } from 'express';
import client from 'prom-client';

/**
 * Prometheus Metrics Service
 *
 * Provides comprehensive monitoring metrics for the AllIN platform:
 * - HTTP request duration histograms
 * - Request counters by endpoint and status
 * - Active connections gauge
 * - Cache hit/miss counters
 * - Database query performance
 */

// Create a Registry to register metrics
const register = new client.Registry();

// Add default metrics (CPU, memory, event loop, etc.)
client.collectDefaultMetrics({
  register,
  prefix: 'allin_',
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
});

// Custom Metrics

// HTTP Request Duration Histogram
export const httpRequestDuration = new client.Histogram({
  name: 'allin_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10], // 1ms to 10s
});

// HTTP Request Counter
export const httpRequestCounter = new client.Counter({
  name: 'allin_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

// Active Connections Gauge
export const activeConnections = new client.Gauge({
  name: 'allin_active_connections',
  help: 'Number of active HTTP connections',
});

// Cache Operations
export const cacheHits = new client.Counter({
  name: 'allin_cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_type'],
});

export const cacheMisses = new client.Counter({
  name: 'allin_cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache_type'],
});

// Database Query Performance
export const dbQueryDuration = new client.Histogram({
  name: 'allin_db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});

export const dbQueryCounter = new client.Counter({
  name: 'allin_db_queries_total',
  help: 'Total number of database queries',
  labelNames: ['operation', 'table', 'status'],
});

// OAuth Operations
export const oauthOperations = new client.Counter({
  name: 'allin_oauth_operations_total',
  help: 'Total number of OAuth operations',
  labelNames: ['platform', 'operation', 'status'],
});

// Social Media API Calls
export const socialApiCalls = new client.Counter({
  name: 'allin_social_api_calls_total',
  help: 'Total number of social media API calls',
  labelNames: ['platform', 'endpoint', 'status'],
});

export const socialApiDuration = new client.Histogram({
  name: 'allin_social_api_duration_seconds',
  help: 'Duration of social media API calls in seconds',
  labelNames: ['platform', 'endpoint'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
});

// Register all custom metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestCounter);
register.registerMetric(activeConnections);
register.registerMetric(cacheHits);
register.registerMetric(cacheMisses);
register.registerMetric(dbQueryDuration);
register.registerMetric(dbQueryCounter);
register.registerMetric(oauthOperations);
register.registerMetric(socialApiCalls);
register.registerMetric(socialApiDuration);

/**
 * Metrics endpoint handler
 * Returns Prometheus-formatted metrics
 */
export const getMetrics = async (_req: Request, res: Response): Promise<void> => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
};

/**
 * Middleware to track HTTP request metrics
 */
export const metricsMiddleware = (req: Request, res: Response, next: Function) => {
  const start = Date.now();

  // Increment active connections
  activeConnections.inc();

  // Track response metrics when request finishes
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000; // Convert to seconds
    const route = req.route?.path || req.path || 'unknown';
    const statusCode = res.statusCode.toString();

    // Record duration
    httpRequestDuration.observe(
      { method: req.method, route, status_code: statusCode },
      duration
    );

    // Increment request counter
    httpRequestCounter.inc({
      method: req.method,
      route,
      status_code: statusCode,
    });

    // Decrement active connections
    activeConnections.dec();
  });

  next();
};

export { register };
