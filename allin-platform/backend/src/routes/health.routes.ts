import { Router } from 'express';
import { prisma } from '../services/database';
import { getRedis } from '../services/redis';

const router = Router();

// Health check endpoint
router.get('/', async (_req, res) => {
  try {
    // Check database connection
    let databaseStatus = 'disconnected';
    try {
      await prisma.$queryRaw`SELECT 1`;
      databaseStatus = 'connected';
    } catch (error) {
      console.error('Database check failed:', error);
    }

    // Check Redis connection
    let redisStatus = 'disconnected';
    try {
      const redisClient = getRedis();
      await redisClient.ping();
      redisStatus = 'connected';
    } catch (error) {
      console.error('Redis check failed:', error);
    }

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: databaseStatus,
        redis: redisStatus,
        server: 'running'
      },
      version: '1.0.0'
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Database health check
router.get('/database', async (_req, res) => {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - start;

    res.json({
      connected: true,
      latency,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      connected: false,
      error: error instanceof Error ? error.message : 'Database connection failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Redis health check
router.get('/redis', async (_req, res) => {
  try {
    const start = Date.now();
    const redisClient = getRedis();
    await redisClient.ping();
    const latency = Date.now() - start;

    res.json({
      connected: true,
      latency,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      connected: false,
      error: error instanceof Error ? error.message : 'Redis connection failed',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;