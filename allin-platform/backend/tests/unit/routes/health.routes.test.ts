/**
 * Health Routes Tests - BMAD MONITOR Phase 3
 * Tests for health check endpoints (database, Redis, overall)
 */

import request from 'supertest';
import express from 'express';
import healthRoutes from '../../../src/routes/health.routes';

// Mock Prisma
jest.mock('../../../src/services/database', () => ({
  prisma: {
    $queryRaw: jest.fn()
  }
}));

// Mock Redis
jest.mock('../../../src/services/redis', () => ({
  getRedis: jest.fn()
}));

import { prisma } from '../../../src/services/database';
import { getRedis } from '../../../src/services/redis';

describe('Health Routes', () => {
  let app: express.Application;
  let mockRedisClient: any;

  beforeEach(() => {
    app = express();
    app.use('/health', healthRoutes);

    // Setup Redis mock
    mockRedisClient = {
      ping: jest.fn()
    };
    (getRedis as jest.Mock).mockReturnValue(mockRedisClient);

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('GET /health', () => {
    it('should return healthy status when all services are connected', async () => {
      // Mock successful database connection
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);

      // Mock successful Redis connection
      mockRedisClient.ping.mockResolvedValue('PONG');

      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('version', '1.0.0');
      expect(response.body.services).toEqual({
        database: 'connected',
        redis: 'connected',
        server: 'running'
      });
    });

    it('should return healthy status with disconnected database', async () => {
      // Mock database connection failure
      (prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('Database error'));

      // Mock successful Redis connection
      mockRedisClient.ping.mockResolvedValue('PONG');

      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.services).toEqual({
        database: 'disconnected',
        redis: 'connected',
        server: 'running'
      });
    });

    it('should return healthy status with disconnected Redis', async () => {
      // Mock successful database connection
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);

      // Mock Redis connection failure
      mockRedisClient.ping.mockRejectedValue(new Error('Redis error'));

      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.services).toEqual({
        database: 'connected',
        redis: 'disconnected',
        server: 'running'
      });
    });

    it('should return healthy status with both services disconnected', async () => {
      // Mock database connection failure
      (prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('Database error'));

      // Mock Redis connection failure
      mockRedisClient.ping.mockRejectedValue(new Error('Redis error'));

      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.services).toEqual({
        database: 'disconnected',
        redis: 'disconnected',
        server: 'running'
      });
    });

    it('should include timestamp in response', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);
      mockRedisClient.ping.mockResolvedValue('PONG');

      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.timestamp).toBeDefined();
      expect(new Date(response.body.timestamp).toISOString()).toBe(response.body.timestamp);
    });
  });

  describe('GET /health/database', () => {
    it('should return connected status when database is healthy', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);

      const response = await request(app)
        .get('/health/database')
        .expect(200);

      expect(response.body).toHaveProperty('connected', true);
      expect(response.body).toHaveProperty('latency');
      expect(response.body).toHaveProperty('timestamp');
      expect(typeof response.body.latency).toBe('number');
      expect(response.body.latency).toBeGreaterThanOrEqual(0);
    });

    it('should return disconnected status when database fails', async () => {
      const errorMessage = 'Connection refused';
      (prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error(errorMessage));

      const response = await request(app)
        .get('/health/database')
        .expect(500);

      expect(response.body).toHaveProperty('connected', false);
      expect(response.body).toHaveProperty('error', errorMessage);
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should measure database latency', async () => {
      // Add a small delay to simulate database query time
      (prisma.$queryRaw as jest.Mock).mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve([{ '?column?': 1 }]), 10))
      );

      const response = await request(app)
        .get('/health/database')
        .expect(200);

      expect(response.body.latency).toBeGreaterThanOrEqual(10);
    });

    it('should handle generic error messages', async () => {
      (prisma.$queryRaw as jest.Mock).mockRejectedValue('String error');

      const response = await request(app)
        .get('/health/database')
        .expect(500);

      expect(response.body.connected).toBe(false);
      expect(response.body.error).toBe('Database connection failed');
    });
  });

  describe('GET /health/redis', () => {
    it('should return connected status when Redis is healthy', async () => {
      mockRedisClient.ping.mockResolvedValue('PONG');

      const response = await request(app)
        .get('/health/redis')
        .expect(200);

      expect(response.body).toHaveProperty('connected', true);
      expect(response.body).toHaveProperty('latency');
      expect(response.body).toHaveProperty('timestamp');
      expect(typeof response.body.latency).toBe('number');
      expect(response.body.latency).toBeGreaterThanOrEqual(0);
    });

    it('should return disconnected status when Redis fails', async () => {
      const errorMessage = 'Redis connection timeout';
      mockRedisClient.ping.mockRejectedValue(new Error(errorMessage));

      const response = await request(app)
        .get('/health/redis')
        .expect(500);

      expect(response.body).toHaveProperty('connected', false);
      expect(response.body).toHaveProperty('error', errorMessage);
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should measure Redis latency', async () => {
      // Add a small delay to simulate Redis ping time
      mockRedisClient.ping.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve('PONG'), 5))
      );

      const response = await request(app)
        .get('/health/redis')
        .expect(200);

      expect(response.body.latency).toBeGreaterThanOrEqual(5);
    });

    it('should handle generic error messages', async () => {
      mockRedisClient.ping.mockRejectedValue('String error');

      const response = await request(app)
        .get('/health/redis')
        .expect(500);

      expect(response.body.connected).toBe(false);
      expect(response.body.error).toBe('Redis connection failed');
    });

    it('should call getRedis to get client', async () => {
      mockRedisClient.ping.mockResolvedValue('PONG');

      await request(app)
        .get('/health/redis')
        .expect(200);

      expect(getRedis).toHaveBeenCalled();
      expect(mockRedisClient.ping).toHaveBeenCalled();
    });
  });

  describe('Health Routes - Integration', () => {
    it('should handle rapid health check requests', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);
      mockRedisClient.ping.mockResolvedValue('PONG');

      // Make 5 rapid requests
      const requests = Array(5).fill(null).map(() =>
        request(app).get('/health')
      );

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('healthy');
      });
    });

    it('should handle health check for all endpoints concurrently', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);
      mockRedisClient.ping.mockResolvedValue('PONG');

      const [health, database, redis] = await Promise.all([
        request(app).get('/health'),
        request(app).get('/health/database'),
        request(app).get('/health/redis')
      ]);

      expect(health.status).toBe(200);
      expect(health.body.status).toBe('healthy');

      expect(database.status).toBe(200);
      expect(database.body.connected).toBe(true);

      expect(redis.status).toBe(200);
      expect(redis.body.connected).toBe(true);
    });

    it('should maintain correct status codes across different scenarios', async () => {
      // Scenario 1: All healthy
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);
      mockRedisClient.ping.mockResolvedValue('PONG');

      let response = await request(app).get('/health');
      expect(response.status).toBe(200);

      // Scenario 2: Database unhealthy
      (prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('DB error'));

      response = await request(app).get('/health');
      expect(response.status).toBe(200);  // Overall health still returns 200

      response = await request(app).get('/health/database');
      expect(response.status).toBe(500);  // Specific endpoint returns 500

      // Scenario 3: Redis unhealthy
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);
      mockRedisClient.ping.mockRejectedValue(new Error('Redis error'));

      response = await request(app).get('/health');
      expect(response.status).toBe(200);  // Overall health still returns 200

      response = await request(app).get('/health/redis');
      expect(response.status).toBe(500);  // Specific endpoint returns 500
    });
  });

  describe('Health Routes - Performance', () => {
    it('should complete health check quickly', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);
      mockRedisClient.ping.mockResolvedValue('PONG');

      const start = Date.now();
      await request(app).get('/health');
      const duration = Date.now() - start;

      // Health check should complete in under 1 second
      expect(duration).toBeLessThan(1000);
    });

    it('should include latency measurements in database health', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);

      const response = await request(app)
        .get('/health/database')
        .expect(200);

      expect(response.body.latency).toBeDefined();
      expect(typeof response.body.latency).toBe('number');
    });

    it('should include latency measurements in Redis health', async () => {
      mockRedisClient.ping.mockResolvedValue('PONG');

      const response = await request(app)
        .get('/health/redis')
        .expect(200);

      expect(response.body.latency).toBeDefined();
      expect(typeof response.body.latency).toBe('number');
    });
  });
});
