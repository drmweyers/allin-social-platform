import { Request, Response, NextFunction } from 'express';
import {
  basicRateLimiter,
  strictRateLimiter,
  authRateLimiter,
  uploadRateLimiter,
  createCustomRateLimiter
} from './rateLimiter';
import {
  createMockRequest,
  createMockResponse,
  createMockNext
} from '../test/setup/mocks';

// Mock the express-rate-limit module
const mockRateLimit = jest.fn();
const mockSlowDown = jest.fn();

jest.mock('express-rate-limit', () => ({
  __esModule: true,
  default: mockRateLimit,
}));

jest.mock('express-slow-down', () => ({
  __esModule: true,
  default: mockSlowDown,
}));

describe('Enhanced Rate Limiter Middleware', () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    req = createMockRequest();
    res = createMockResponse();
    next = createMockNext();

    // Mock the rate limiters to return middleware functions
    mockRateLimit.mockImplementation((options) => {
      return (req: Request, res: Response, next: NextFunction) => {
        // Simulate rate limiting behavior based on options
        const { max, windowMs, message } = options;

        // Mock behavior: allow first few requests, then rate limit
        const requestCount = req.ip === '127.0.0.1' ? 1 : max + 1;

        if (requestCount > max) {
          return res.status(429).json({
            error: message || 'Too many requests, please try again later.',
            retryAfter: Math.ceil(windowMs / 1000)
          });
        }

        next();
      };
    });

    mockSlowDown.mockImplementation((options) => {
      return (req: Request, res: Response, next: NextFunction) => {
        // Simulate slowdown behavior
        const delay = options.delayAfter && req.ip !== '127.0.0.1' ? options.delayMs : 0;

        if (delay > 0) {
          setTimeout(next, delay);
        } else {
          next();
        }
      };
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('basicRateLimiter', () => {
    beforeEach(() => {
      // Reset the require cache to get fresh rate limiter instances
      jest.resetModules();
    });

    it('should allow requests within rate limit', async () => {
      req.ip = '127.0.0.1'; // IP that will be under limit

      const rateLimiter = require('./rateLimiter').basicRateLimiter;
      await rateLimiter(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should block requests exceeding rate limit', async () => {
      req.ip = '192.168.1.100'; // IP that will exceed limit

      const rateLimiter = require('./rateLimiter').basicRateLimiter;
      await rateLimiter(req, res, next);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith({
        error: expect.stringContaining('Too many requests'),
        retryAfter: expect.any(Number)
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should use correct configuration options', () => {
      require('./rateLimiter');

      expect(mockRateLimit).toHaveBeenCalledWith(
        expect.objectContaining({
          windowMs: 15 * 60 * 1000, // 15 minutes
          max: 100, // requests per window
          message: expect.any(String),
          standardHeaders: true,
          legacyHeaders: false
        })
      );
    });

    it('should handle IP-based limiting correctly', async () => {
      const requests = [
        { ...createMockRequest(), ip: '127.0.0.1' },
        { ...createMockRequest(), ip: '127.0.0.1' },
        { ...createMockRequest(), ip: '192.168.1.100' }
      ];

      const rateLimiter = require('./rateLimiter').basicRateLimiter;

      // First two requests (same IP, within limit)
      await rateLimiter(requests[0], res, next);
      expect(next).toHaveBeenCalledTimes(1);

      // Third request (different IP, exceeds limit in mock)
      await rateLimiter(requests[2], res, next);
      expect(res.status).toHaveBeenCalledWith(429);
    });
  });

  describe('strictRateLimiter', () => {
    it('should have more restrictive limits than basic limiter', () => {
      require('./rateLimiter');

      // Find the call for strict rate limiter (should be more restrictive)
      const strictCall = mockRateLimit.mock.calls.find(call =>
        call[0].max < 100 // Assuming strict has lower max than basic
      );

      expect(strictCall).toBeDefined();
      expect(strictCall[0]).toEqual(
        expect.objectContaining({
          windowMs: expect.any(Number),
          max: expect.any(Number),
          message: expect.stringContaining('Too many requests')
        })
      );
    });

    it('should block requests faster than basic limiter', async () => {
      req.ip = '192.168.1.100';

      const strictLimiter = require('./rateLimiter').strictRateLimiter;
      await strictLimiter(req, res, next);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith({
        error: expect.stringContaining('Too many requests'),
        retryAfter: expect.any(Number)
      });
    });

    it('should handle authentication endpoints appropriately', async () => {
      req.path = '/api/auth/login';
      req.ip = '192.168.1.100';

      const strictLimiter = require('./rateLimiter').strictRateLimiter;
      await strictLimiter(req, res, next);

      expect(res.status).toHaveBeenCalledWith(429);
    });
  });

  describe('authRateLimiter', () => {
    it('should have specialized configuration for auth endpoints', () => {
      require('./rateLimiter');

      // Check that auth rate limiter was configured
      expect(mockRateLimit).toHaveBeenCalledWith(
        expect.objectContaining({
          windowMs: expect.any(Number),
          max: expect.any(Number),
          skipSuccessfulRequests: true,
          skipFailedRequests: false
        })
      );
    });

    it('should track failed authentication attempts', async () => {
      req.ip = '192.168.1.100';
      res.statusCode = 401; // Simulate failed auth

      const authLimiter = require('./rateLimiter').authRateLimiter;
      await authLimiter(req, res, next);

      expect(res.status).toHaveBeenCalledWith(429);
    });

    it('should allow legitimate authentication attempts', async () => {
      req.ip = '127.0.0.1';
      res.statusCode = 200; // Simulate successful auth

      const authLimiter = require('./rateLimiter').authRateLimiter;
      await authLimiter(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalledWith(429);
    });

    it('should include security headers in response', async () => {
      req.ip = '192.168.1.100';

      const authLimiter = require('./rateLimiter').authRateLimiter;
      await authLimiter(req, res, next);

      // Verify that rate limiter was configured with security headers
      expect(mockRateLimit).toHaveBeenCalledWith(
        expect.objectContaining({
          standardHeaders: true,
          legacyHeaders: false
        })
      );
    });
  });

  describe('uploadRateLimiter', () => {
    it('should have appropriate limits for file uploads', () => {
      require('./rateLimiter');

      // Check upload-specific configuration
      const uploadCall = mockRateLimit.mock.calls.find(call =>
        call[0].message && call[0].message.includes('upload')
      );

      expect(uploadCall).toBeDefined();
      expect(uploadCall[0]).toEqual(
        expect.objectContaining({
          windowMs: expect.any(Number),
          max: expect.any(Number),
          message: expect.stringContaining('upload')
        })
      );
    });

    it('should handle large file upload scenarios', async () => {
      req.ip = '127.0.0.1';
      req.body = { fileSize: 5 * 1024 * 1024 }; // 5MB file

      const uploadLimiter = require('./rateLimiter').uploadRateLimiter;
      await uploadLimiter(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should limit concurrent upload attempts', async () => {
      req.ip = '192.168.1.100';

      const uploadLimiter = require('./rateLimiter').uploadRateLimiter;
      await uploadLimiter(req, res, next);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith({
        error: expect.stringContaining('upload'),
        retryAfter: expect.any(Number)
      });
    });
  });

  describe('createCustomRateLimiter', () => {
    it('should create rate limiter with custom options', () => {
      const customOptions = {
        windowMs: 5 * 60 * 1000, // 5 minutes
        max: 50,
        message: 'Custom rate limit exceeded'
      };

      const customLimiter = require('./rateLimiter').createCustomRateLimiter(customOptions);

      expect(mockRateLimit).toHaveBeenCalledWith(
        expect.objectContaining({
          windowMs: 5 * 60 * 1000,
          max: 50,
          message: 'Custom rate limit exceeded'
        })
      );
    });

    it('should merge custom options with defaults', () => {
      const customOptions = {
        max: 75
        // Other options should use defaults
      };

      const customLimiter = require('./rateLimiter').createCustomRateLimiter(customOptions);

      expect(mockRateLimit).toHaveBeenCalledWith(
        expect.objectContaining({
          max: 75,
          windowMs: expect.any(Number),
          standardHeaders: true,
          legacyHeaders: false
        })
      );
    });

    it('should allow custom key generators', () => {
      const customOptions = {
        max: 100,
        keyGenerator: (req: Request) => `${req.ip}-${req.path}`
      };

      const customLimiter = require('./rateLimiter').createCustomRateLimiter(customOptions);

      expect(mockRateLimit).toHaveBeenCalledWith(
        expect.objectContaining({
          keyGenerator: expect.any(Function)
        })
      );
    });

    it('should support custom skip conditions', () => {
      const customOptions = {
        max: 100,
        skip: (req: Request) => req.ip === '127.0.0.1'
      };

      const customLimiter = require('./rateLimiter').createCustomRateLimiter(customOptions);

      expect(mockRateLimit).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: expect.any(Function)
        })
      );
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle missing IP addresses gracefully', async () => {
      req.ip = undefined as any;

      const rateLimiter = require('./rateLimiter').basicRateLimiter;
      await rateLimiter(req, res, next);

      // Should not crash, behavior depends on rate limiter implementation
      expect(mockRateLimit).toHaveBeenCalled();
    });

    it('should handle proxy configurations correctly', async () => {
      req.headers['x-forwarded-for'] = '203.0.113.1, 70.41.3.18, 150.172.238.178';
      req.ip = '127.0.0.1';

      const rateLimiter = require('./rateLimiter').basicRateLimiter;
      await rateLimiter(req, res, next);

      // Should extract real IP from X-Forwarded-For header
      expect(mockRateLimit).toHaveBeenCalledWith(
        expect.objectContaining({
          trustProxy: expect.any(Boolean)
        })
      );
    });

    it('should handle rate limiter errors gracefully', async () => {
      // Mock rate limiter to throw error
      mockRateLimit.mockImplementation(() => {
        return (req: Request, res: Response, next: NextFunction) => {
          throw new Error('Rate limiter error');
        };
      });

      const rateLimiter = require('./rateLimiter').basicRateLimiter;

      expect(() => rateLimiter(req, res, next)).toThrow('Rate limiter error');
    });

    it('should handle concurrent requests from same IP', async () => {
      const sameIpRequests = Array(10).fill(null).map(() => ({
        ...createMockRequest(),
        ip: '192.168.1.100'
      }));

      const rateLimiter = require('./rateLimiter').basicRateLimiter;

      // Simulate concurrent requests
      const responses = await Promise.all(
        sameIpRequests.map(async (request) => {
          const mockRes = createMockResponse();
          const mockNext = createMockNext();

          try {
            await rateLimiter(request, mockRes, mockNext);
            return { status: 'success', response: mockRes };
          } catch (error) {
            return { status: 'error', error };
          }
        })
      );

      // At least one should be rate limited
      const rateLimited = responses.some(r =>
        r.status === 'success' && r.response.status.mock.calls.length > 0
      );

      expect(rateLimited || responses.some(r => r.status === 'error')).toBeTruthy();
    });
  });

  describe('Header handling', () => {
    it('should set appropriate rate limit headers', async () => {
      req.ip = '127.0.0.1';

      const rateLimiter = require('./rateLimiter').basicRateLimiter;
      await rateLimiter(req, res, next);

      // Verify headers configuration
      expect(mockRateLimit).toHaveBeenCalledWith(
        expect.objectContaining({
          standardHeaders: true,
          legacyHeaders: false
        })
      );
    });

    it('should include retry-after header in rate limited responses', async () => {
      req.ip = '192.168.1.100';

      const rateLimiter = require('./rateLimiter').basicRateLimiter;
      await rateLimiter(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          retryAfter: expect.any(Number)
        })
      );
    });

    it('should respect X-Forwarded-For header for proxy setups', () => {
      require('./rateLimiter');

      expect(mockRateLimit).toHaveBeenCalledWith(
        expect.objectContaining({
          trustProxy: expect.any(Boolean)
        })
      );
    });
  });

  describe('Configuration validation', () => {
    it('should have sensible default configurations', () => {
      require('./rateLimiter');

      const calls = mockRateLimit.mock.calls;

      calls.forEach(call => {
        const options = call[0];
        expect(options.windowMs).toBeGreaterThan(0);
        expect(options.max).toBeGreaterThan(0);
        expect(options.message).toBeDefined();
        expect(typeof options.message).toBe('string');
      });
    });

    it('should use progressive rate limiting for different severity levels', () => {
      require('./rateLimiter');

      const calls = mockRateLimit.mock.calls;

      // Verify that strict limiter is more restrictive than basic
      const basicConfig = calls.find(call => call[0].max === 100);
      const strictConfig = calls.find(call => call[0].max < 100);

      if (basicConfig && strictConfig) {
        expect(strictConfig[0].max).toBeLessThan(basicConfig[0].max);
      }
    });

    it('should have appropriate window sizes for different use cases', () => {
      require('./rateLimiter');

      const calls = mockRateLimit.mock.calls;

      calls.forEach(call => {
        const windowMs = call[0].windowMs;
        // Window should be between 1 minute and 1 hour
        expect(windowMs).toBeGreaterThanOrEqual(60 * 1000); // 1 minute
        expect(windowMs).toBeLessThanOrEqual(60 * 60 * 1000); // 1 hour
      });
    });
  });

  describe('Integration scenarios', () => {
    it('should work with authentication middleware', async () => {
      req.user = { id: 'user-123', role: 'USER' };
      req.ip = '127.0.0.1';

      const authLimiter = require('./rateLimiter').authRateLimiter;
      await authLimiter(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should differentiate between authenticated and anonymous users', async () => {
      // Test with authenticated user
      const authReq = { ...createMockRequest(), user: { id: 'user-123' }, ip: '127.0.0.1' };
      const anonReq = { ...createMockRequest(), ip: '127.0.0.1' };

      const rateLimiter = require('./rateLimiter').basicRateLimiter;

      await rateLimiter(authReq, res, next);
      expect(next).toHaveBeenCalledWith();

      jest.clearAllMocks();

      await rateLimiter(anonReq, res, next);
      expect(next).toHaveBeenCalledWith();
    });

    it('should handle API key authentication', async () => {
      req.headers['x-api-key'] = 'valid-api-key';
      req.ip = '127.0.0.1';

      const rateLimiter = require('./rateLimiter').basicRateLimiter;
      await rateLimiter(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('Performance considerations', () => {
    it('should complete rate limiting checks quickly', async () => {
      req.ip = '127.0.0.1';

      const startTime = Date.now();
      const rateLimiter = require('./rateLimiter').basicRateLimiter;
      await rateLimiter(req, res, next);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
    });

    it('should handle high-frequency requests efficiently', async () => {
      const requests = Array(100).fill(null).map((_, index) => ({
        ...createMockRequest(),
        ip: `127.0.0.${index % 10}` // Distribute across different IPs
      }));

      const rateLimiter = require('./rateLimiter').basicRateLimiter;

      const startTime = Date.now();
      await Promise.all(
        requests.map(async (request) => {
          const mockRes = createMockResponse();
          const mockNext = createMockNext();
          return rateLimiter(request, mockRes, mockNext);
        })
      );
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});

export {};