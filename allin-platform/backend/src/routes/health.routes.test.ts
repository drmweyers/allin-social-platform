import request from 'supertest';
import express from 'express';

// Mock dependencies before importing the routes
const mockPrisma = {
  $queryRaw: jest.fn(),
};

const mockRedisClient = {
  ping: jest.fn(),
};

const mockGetRedis = jest.fn(() => mockRedisClient);

jest.mock('../services/database', () => ({
  prisma: mockPrisma,
}));

jest.mock('../services/redis', () => ({
  getRedis: mockGetRedis,
}));

// Import routes after mocking
import healthRoutes from './health.routes';

describe('Health Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use('/health', healthRoutes);
    jest.clearAllMocks();
  });

  describe('GET /', () => {
    it('should return healthy status when all services are connected', async () => {
      // Mock successful database connection
      mockPrisma.$queryRaw.mockResolvedValue([{ 1: 1 }]);

      // Mock successful Redis connection
      mockRedisClient.ping.mockResolvedValue('PONG');

      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        status: 'healthy',
        services: {
          database: 'connected',
          redis: 'connected',
          server: 'running'
        },
        version: '1.0.0'
      });
      expect(response.body.timestamp).toBeDefined();
    });

    it('should return healthy status with disconnected database when database fails', async () => {
      // Mock database connection failure
      mockPrisma.$queryRaw.mockRejectedValue(new Error('Database connection failed'));

      // Mock successful Redis connection
      mockRedisClient.ping.mockResolvedValue('PONG');

      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        status: 'healthy',
        services: {
          database: 'disconnected',
          redis: 'connected',
          server: 'running'
        }
      });
    });

    it('should return healthy status with disconnected redis when redis fails', async () => {
      // Mock successful database connection
      mockPrisma.$queryRaw.mockResolvedValue([{ 1: 1 }]);

      // Mock Redis connection failure
      mockRedisClient.ping.mockRejectedValue(new Error('Redis connection failed'));

      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        status: 'healthy',
        services: {
          database: 'connected',
          redis: 'disconnected',
          server: 'running'
        }
      });
    });

    it('should return healthy status with both services disconnected', async () => {
      // Mock both services to fail
      mockPrisma.$queryRaw.mockRejectedValue(new Error('Database connection failed'));
      mockRedisClient.ping.mockRejectedValue(new Error('Redis connection failed'));

      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        status: 'healthy',
        services: {
          database: 'disconnected',
          redis: 'disconnected',
          server: 'running'
        }
      });
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('GET /database', () => {
    it('should return database connected status with latency', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ 1: 1 }]);

      const response = await request(app).get('/health/database');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        connected: true
      });
      expect(response.body.latency).toBeGreaterThanOrEqual(0);
      expect(response.body.timestamp).toBeDefined();
    });

    it('should return database disconnected status when connection fails', async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error('Connection timeout'));

      const response = await request(app).get('/health/database');

      expect(response.status).toBe(500);
      expect(response.body).toMatchObject({
        connected: false,
        error: 'Connection timeout'
      });
      expect(response.body.timestamp).toBeDefined();
    });

    it('should handle unknown database errors', async () => {
      mockPrisma.$queryRaw.mockRejectedValue('Unknown error');

      const response = await request(app).get('/health/database');

      expect(response.status).toBe(500);
      expect(response.body).toMatchObject({
        connected: false,
        error: 'Database connection failed'
      });
    });
  });

  describe('GET /redis', () => {
    it('should return redis connected status with latency', async () => {
      mockRedisClient.ping.mockResolvedValue('PONG');

      const response = await request(app).get('/health/redis');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        connected: true
      });
      expect(response.body.latency).toBeGreaterThanOrEqual(0);
      expect(response.body.timestamp).toBeDefined();
    });

    it('should return redis disconnected status when connection fails', async () => {
      mockRedisClient.ping.mockRejectedValue(new Error('Redis unavailable'));

      const response = await request(app).get('/health/redis');

      expect(response.status).toBe(500);
      expect(response.body).toMatchObject({
        connected: false,
        error: 'Redis unavailable'
      });
      expect(response.body.timestamp).toBeDefined();
    });

    it('should handle unknown redis errors', async () => {
      mockGetRedis.mockImplementation(() => {
        throw 'Unknown error';
      });

      const response = await request(app).get('/health/redis');

      expect(response.status).toBe(500);
      expect(response.body).toMatchObject({
        connected: false,
        error: 'Redis connection failed'
      });
    });
  });
});