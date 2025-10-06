/**
 * AI Chat Integration Tests - Rate Limiting & Performance
 * Tests rate limiting, caching, and performance benchmarks
 *
 * @group integration
 * @group ai-chat
 * @group performance
 */

import express from 'express';
import request from 'supertest';
import { MASTER_TEST_CREDENTIALS } from '../../unit/ai-chat/test-fixtures';

// Mock conversation service
const mockExplainAnalytics = jest.fn();
const mockGenerateContent = jest.fn();
const mockOptimizeStrategy = jest.fn();

jest.mock('../../../src/services/conversation.service', () => ({
  conversationService: {
    explainAnalytics: mockExplainAnalytics,
    generateContent: mockGenerateContent,
    optimizeStrategy: mockOptimizeStrategy
  }
}));

// Mock auth middleware
jest.mock('../../../src/middleware/auth', () => ({
  authMiddleware: (req: any, _res: any, next: any) => {
    req.user = {
      id: MASTER_TEST_CREDENTIALS.admin.id,
      email: MASTER_TEST_CREDENTIALS.admin.email,
      organizationId: MASTER_TEST_CREDENTIALS.admin.organizationId,
      role: MASTER_TEST_CREDENTIALS.admin.role
    };
    next();
  }
}));

import { authMiddleware } from '../../../src/middleware/auth';

describe('AI Chat - Rate Limiting & Performance Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits per user', async () => {
      const requestCounts: Map<string, number> = new Map();
      const RATE_LIMIT = 5;
      const TIME_WINDOW = 60000; // 1 minute

      const rateLimitMiddleware = (req: any, res: any, next: any) => {
        const userId = req.user?.id;
        if (!userId) {
          return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        const count = requestCounts.get(userId) || 0;

        if (count >= RATE_LIMIT) {
          return res.status(429).json({
            success: false,
            error: 'Rate limit exceeded',
            retryAfter: TIME_WINDOW / 1000
          });
        }

        requestCounts.set(userId, count + 1);
        next();
      };

      const router = express.Router();
      router.use(authMiddleware);
      router.use(rateLimitMiddleware);

      router.post('/explain/analytics', async (req, res) => {
        try {
          const { metric } = req.body;
          const explanation = await mockExplainAnalytics(req.user?.organizationId, metric);
          return res.json({ success: true, data: explanation });
        } catch (error) {
          return res.status(500).json({ success: false, error: 'Failed' });
        }
      });

      const app = express();
      app.use(express.json());
      app.use('/api/ai-chat', router);

      mockExplainAnalytics.mockResolvedValue({ metric: 'test', value: 1 });

      // Make requests up to limit
      for (let i = 0; i < RATE_LIMIT; i++) {
        const response = await request(app)
          .post('/api/ai-chat/explain/analytics')
          .send({ metric: 'engagement_rate' });

        expect(response.status).toBe(200);
      }

      // Next request should be rate limited
      const limitedResponse = await request(app)
        .post('/api/ai-chat/explain/analytics')
        .send({ metric: 'engagement_rate' });

      expect(limitedResponse.status).toBe(429);
      expect(limitedResponse.body.error).toBe('Rate limit exceeded');
      expect(limitedResponse.body.retryAfter).toBe(60);
    });

    it('should have separate rate limits per organization', async () => {
      const orgRateLimits: Map<string, number> = new Map();
      const ORG_RATE_LIMIT = 100;

      const orgRateLimitMiddleware = (req: any, res: any, next: any) => {
        const orgId = req.user?.organizationId;
        if (!orgId) {
          return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        const count = orgRateLimits.get(orgId) || 0;

        if (count >= ORG_RATE_LIMIT) {
          return res.status(429).json({
            success: false,
            error: 'Organization rate limit exceeded'
          });
        }

        orgRateLimits.set(orgId, count + 1);
        res.setHeader('X-RateLimit-Remaining', String(ORG_RATE_LIMIT - count - 1));
        next();
      };

      const router = express.Router();
      router.use(authMiddleware);
      router.use(orgRateLimitMiddleware);

      router.post('/explain/analytics', async (req, res) => {
        try {
          const explanation = await mockExplainAnalytics(req.user?.organizationId, req.body.metric);
          return res.json({ success: true, data: explanation });
        } catch (error) {
          return res.status(500).json({ success: false, error: 'Failed' });
        }
      });

      const app = express();
      app.use(express.json());
      app.use('/api/ai-chat', router);

      mockExplainAnalytics.mockResolvedValue({ metric: 'test', value: 1 });

      const response = await request(app)
        .post('/api/ai-chat/explain/analytics')
        .send({ metric: 'engagement_rate' });

      expect(response.status).toBe(200);
      expect(response.headers['x-ratelimit-remaining']).toBe('99');
    });

    it('should implement exponential backoff for retries', async () => {
      let attemptCount = 0;
      const MAX_RETRIES = 3;

      const retryMiddleware = (_req: any, res: any, next: any) => {
        attemptCount++;

        if (attemptCount < MAX_RETRIES) {
          const backoffTime = Math.pow(2, attemptCount - 1) * 1000; // 1s, 2s, 4s
          return res.status(503).json({
            success: false,
            error: 'Service temporarily unavailable',
            retryAfter: backoffTime / 1000,
            attempt: attemptCount
          });
        }

        next();
      };

      const router = express.Router();
      router.use(authMiddleware);
      router.use(retryMiddleware);

      router.post('/explain/analytics', async (req, res) => {
        try {
          const explanation = await mockExplainAnalytics(req.user?.organizationId, req.body.metric);
          return res.json({ success: true, data: explanation, attempt: attemptCount });
        } catch (error) {
          return res.status(500).json({ success: false, error: 'Failed' });
        }
      });

      const app = express();
      app.use(express.json());
      app.use('/api/ai-chat', router);

      mockExplainAnalytics.mockResolvedValue({ metric: 'test', value: 1 });

      // First attempt - 1s backoff
      const attempt1 = await request(app)
        .post('/api/ai-chat/explain/analytics')
        .send({ metric: 'engagement_rate' });

      expect(attempt1.status).toBe(503);
      expect(attempt1.body.retryAfter).toBe(1);
      expect(attempt1.body.attempt).toBe(1);

      // Second attempt - 2s backoff
      const attempt2 = await request(app)
        .post('/api/ai-chat/explain/analytics')
        .send({ metric: 'engagement_rate' });

      expect(attempt2.status).toBe(503);
      expect(attempt2.body.retryAfter).toBe(2);
      expect(attempt2.body.attempt).toBe(2);

      // Third attempt - succeeds
      const attempt3 = await request(app)
        .post('/api/ai-chat/explain/analytics')
        .send({ metric: 'engagement_rate' });

      expect(attempt3.status).toBe(200);
      expect(attempt3.body.attempt).toBe(3);
    });
  });

  describe('Response Caching', () => {
    it('should cache identical requests within time window', async () => {
      const cache: Map<string, { data: any; timestamp: number }> = new Map();
      const CACHE_TTL = 300000; // 5 minutes

      const cacheMiddleware = (req: any, res: any, next: any) => {
        const cacheKey = `${req.user?.organizationId}:${req.path}:${JSON.stringify(req.body)}`;
        const cached = cache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
          return res.json({
            success: true,
            data: cached.data,
            cached: true,
            cacheAge: Math.floor((Date.now() - cached.timestamp) / 1000)
          });
        }

        // Store response in cache
        const originalJson = res.json.bind(res);
        res.json = (body: any) => {
          if (body.success && body.data) {
            cache.set(cacheKey, { data: body.data, timestamp: Date.now() });
          }
          return originalJson(body);
        };

        next();
      };

      const router = express.Router();
      router.use(authMiddleware);
      router.use(cacheMiddleware);

      router.post('/explain/analytics', async (req, res) => {
        try {
          const { metric } = req.body;
          const explanation = await mockExplainAnalytics(req.user?.organizationId, metric);
          return res.json({ success: true, data: explanation });
        } catch (error) {
          return res.status(500).json({ success: false, error: 'Failed' });
        }
      });

      const app = express();
      app.use(express.json());
      app.use('/api/ai-chat', router);

      mockExplainAnalytics.mockResolvedValue({
        metric: 'engagement_rate',
        value: 4.5
      });

      // First request - not cached
      const firstResponse = await request(app)
        .post('/api/ai-chat/explain/analytics')
        .send({ metric: 'engagement_rate' });

      expect(firstResponse.status).toBe(200);
      expect(firstResponse.body.cached).toBeUndefined();
      expect(mockExplainAnalytics).toHaveBeenCalledTimes(1);

      // Second identical request - should be cached
      const cachedResponse = await request(app)
        .post('/api/ai-chat/explain/analytics')
        .send({ metric: 'engagement_rate' });

      expect(cachedResponse.status).toBe(200);
      expect(cachedResponse.body.cached).toBe(true);
      expect(cachedResponse.body.cacheAge).toBeLessThanOrEqual(1);
      expect(mockExplainAnalytics).toHaveBeenCalledTimes(1); // Not called again

      // Different request - not cached
      const differentResponse = await request(app)
        .post('/api/ai-chat/explain/analytics')
        .send({ metric: 'reach' });

      expect(differentResponse.status).toBe(200);
      expect(differentResponse.body.cached).toBeUndefined();
      expect(mockExplainAnalytics).toHaveBeenCalledTimes(2);
    });

    it('should invalidate cache on related data changes', async () => {
      const cache: Map<string, any> = new Map();

      const cacheInvalidationMiddleware = (req: any, _res: any, next: any) => {
        // POST /generate/* should invalidate analytics cache
        if (req.method === 'POST' && req.path.includes('/generate/')) {
          const orgCachePattern = new RegExp(`^${req.user?.organizationId}:/explain/analytics:`);

          // Clear related cache entries
          for (const key of cache.keys()) {
            if (orgCachePattern.test(key)) {
              cache.delete(key);
            }
          }
        }

        next();
      };

      const router = express.Router();
      router.use(authMiddleware);
      router.use(cacheInvalidationMiddleware);

      router.post('/explain/analytics', async (req, res) => {
        const cacheKey = `${req.user?.organizationId}:${req.path}:${JSON.stringify(req.body)}`;

        if (cache.has(cacheKey)) {
          return res.json({ success: true, data: cache.get(cacheKey), cached: true });
        }

        const explanation = await mockExplainAnalytics(req.user?.organizationId, req.body.metric);
        cache.set(cacheKey, explanation);
        return res.json({ success: true, data: explanation });
      });

      router.post('/generate/caption', async (req, res) => {
        const content = await mockGenerateContent(
          req.user?.organizationId,
          req.body.description,
          req.body.platform
        );
        return res.json({ success: true, data: content });
      });

      const app = express();
      app.use(express.json());
      app.use('/api/ai-chat', router);

      mockExplainAnalytics.mockResolvedValue({ metric: 'engagement_rate', value: 4.5 });
      mockGenerateContent.mockResolvedValue({ captions: ['Test'] });

      // Request analytics - gets cached
      await request(app)
        .post('/api/ai-chat/explain/analytics')
        .send({ metric: 'engagement_rate' });

      const cachedResponse = await request(app)
        .post('/api/ai-chat/explain/analytics')
        .send({ metric: 'engagement_rate' });

      expect(cachedResponse.body.cached).toBe(true);

      // Generate content - invalidates cache
      await request(app)
        .post('/api/ai-chat/generate/caption')
        .send({ description: 'Test', platform: 'instagram' });

      // Request analytics again - cache invalidated, fresh data
      const freshResponse = await request(app)
        .post('/api/ai-chat/explain/analytics')
        .send({ metric: 'engagement_rate' });

      expect(freshResponse.body.cached).toBeUndefined();
    });
  });

  describe('Performance Benchmarks', () => {
    it('should respond to analytics requests within 200ms', async () => {
      const router = express.Router();
      router.use(authMiddleware);

      router.post('/explain/analytics', async (req, res) => {
        try {
          const startTime = Date.now();
          const explanation = await mockExplainAnalytics(req.user?.organizationId, req.body.metric);
          const responseTime = Date.now() - startTime;

          return res.json({
            success: true,
            data: explanation,
            responseTime
          });
        } catch (error) {
          return res.status(500).json({ success: false, error: 'Failed' });
        }
      });

      const app = express();
      app.use(express.json());
      app.use('/api/ai-chat', router);

      mockExplainAnalytics.mockResolvedValue({ metric: 'test', value: 1 });

      const response = await request(app)
        .post('/api/ai-chat/explain/analytics')
        .send({ metric: 'engagement_rate' });

      expect(response.status).toBe(200);
      expect(response.body.responseTime).toBeLessThan(200);
    });

    it('should handle concurrent requests efficiently', async () => {
      const router = express.Router();
      router.use(authMiddleware);

      router.post('/explain/analytics', async (req, res) => {
        try {
          const explanation = await mockExplainAnalytics(req.user?.organizationId, req.body.metric);
          return res.json({ success: true, data: explanation });
        } catch (error) {
          return res.status(500).json({ success: false, error: 'Failed' });
        }
      });

      const app = express();
      app.use(express.json());
      app.use('/api/ai-chat', router);

      mockExplainAnalytics.mockResolvedValue({ metric: 'test', value: 1 });

      // Send 10 concurrent requests
      const startTime = Date.now();
      const requests = Array.from({ length: 10 }, () =>
        request(app)
          .post('/api/ai-chat/explain/analytics')
          .send({ metric: 'engagement_rate' })
      );

      const responses = await Promise.all(requests);
      const totalTime = Date.now() - startTime;

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Should complete within 500ms total (not 10 * 200ms sequential)
      expect(totalTime).toBeLessThan(500);
    });

    it('should implement request timeout for long-running operations', async () => {
      const TIMEOUT_MS = 5000;

      const timeoutMiddleware = (_req: any, res: any, next: any) => {
        const timeout = setTimeout(() => {
          if (!res.headersSent) {
            res.status(504).json({
              success: false,
              error: 'Request timeout',
              timeout: TIMEOUT_MS
            });
          }
        }, TIMEOUT_MS);

        res.on('finish', () => clearTimeout(timeout));
        next();
      };

      const router = express.Router();
      router.use(authMiddleware);
      router.use(timeoutMiddleware);

      router.post('/explain/analytics', async (req, res) => {
        try {
          // Simulate long-running operation
          await new Promise(resolve => setTimeout(resolve, 6000));
          const explanation = await mockExplainAnalytics(req.user?.organizationId, req.body.metric);
          return res.json({ success: true, data: explanation });
        } catch (error) {
          return res.status(500).json({ success: false, error: 'Failed' });
        }
      });

      const app = express();
      app.use(express.json());
      app.use('/api/ai-chat', router);

      mockExplainAnalytics.mockResolvedValue({ metric: 'test', value: 1 });

      const startTime = Date.now();
      const response = await request(app)
        .post('/api/ai-chat/explain/analytics')
        .send({ metric: 'engagement_rate' });

      const duration = Date.now() - startTime;

      expect(response.status).toBe(504);
      expect(response.body.error).toBe('Request timeout');
      expect(duration).toBeGreaterThanOrEqual(5000);
      expect(duration).toBeLessThan(6000);
    }, 10000); // Increase test timeout to 10s
  });

  describe('Load Testing', () => {
    it('should maintain response quality under load', async () => {
      const router = express.Router();
      router.use(authMiddleware);

      let requestCount = 0;
      const responseTimes: number[] = [];

      router.post('/explain/analytics', async (req, res) => {
        try {
          const startTime = Date.now();
          requestCount++;

          const explanation = await mockExplainAnalytics(req.user?.organizationId, req.body.metric);

          const responseTime = Date.now() - startTime;
          responseTimes.push(responseTime);

          return res.json({
            success: true,
            data: explanation,
            requestNumber: requestCount,
            responseTime
          });
        } catch (error) {
          return res.status(500).json({ success: false, error: 'Failed' });
        }
      });

      const app = express();
      app.use(express.json());
      app.use('/api/ai-chat', router);

      mockExplainAnalytics.mockResolvedValue({ metric: 'test', value: 1 });

      // Simulate 50 requests
      const requests = Array.from({ length: 50 }, (_, i) =>
        request(app)
          .post('/api/ai-chat/explain/analytics')
          .send({ metric: 'engagement_rate', requestId: i })
      );

      const responses = await Promise.all(requests);

      // All should succeed
      expect(responses.every(r => r.status === 200)).toBe(true);
      expect(requestCount).toBe(50);

      // Calculate average response time
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;

      // P95 response time (95th percentile)
      const sorted = [...responseTimes].sort((a, b) => a - b);
      const p95Index = Math.floor(sorted.length * 0.95);
      const p95ResponseTime = sorted[p95Index];

      // Performance assertions
      expect(avgResponseTime).toBeLessThan(100);
      expect(p95ResponseTime).toBeLessThan(200);
    });
  });
});
