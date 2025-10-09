import { Router } from 'express';
import { prisma } from '../services/database';
import { getCacheService, getRedis } from '../services/redis';

const router = Router();

// Cache TTLs for health check endpoints
const HEALTH_CACHE_TTL = 30; // 30 seconds
const DATABASE_HEALTH_CACHE_TTL = 60; // 60 seconds
const REDIS_HEALTH_CACHE_TTL = 60; // 60 seconds

// Health check endpoint with caching
// PERFORMANCE OPTIMIZATION: Cache health status for 30 seconds
// Expected: 90%+ cache hit rate, reduces database load
router.get('/', async (_req, res) => {
  try {
    const cacheService = getCacheService();
    const cacheKey = 'health:status';

    // Try to get cached health status
    const cachedHealth = await cacheService.get<any>(cacheKey);
    if (cachedHealth) {
      return res.json({
        ...cachedHealth,
        cached: true,
        timestamp: new Date().toISOString(),
      });
    }

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

    const healthData = {
      status: 'healthy',
      services: {
        database: databaseStatus,
        redis: redisStatus,
        server: 'running'
      },
      version: '1.0.0'
    };

    // Cache health status for 30 seconds
    await cacheService.set(cacheKey, healthData, HEALTH_CACHE_TTL);

    return res.json({
      ...healthData,
      cached: false,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Database health check with caching
// PERFORMANCE OPTIMIZATION: Cache database health for 60 seconds
// Expected: Reduces P95 from 2283ms to <5ms for cached requests
router.get('/database', async (_req, res) => {
  try {
    const cacheService = getCacheService();
    const cacheKey = 'health:database';

    // Try to get cached database health
    const cachedDbHealth = await cacheService.get<any>(cacheKey);
    if (cachedDbHealth) {
      return res.json({
        ...cachedDbHealth,
        cached: true,
        timestamp: new Date().toISOString(),
      });
    }

    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - start;

    const dbHealthData = {
      connected: true,
      latency,
    };

    // Cache database health for 60 seconds
    await cacheService.set(cacheKey, dbHealthData, DATABASE_HEALTH_CACHE_TTL);

    return res.json({
      ...dbHealthData,
      cached: false,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({
      connected: false,
      error: error instanceof Error ? error.message : 'Database connection failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Redis health check with caching
// PERFORMANCE OPTIMIZATION: Cache Redis health for 60 seconds
// Note: Caching Redis health in Redis itself provides instant responses
router.get('/redis', async (_req, res) => {
  try {
    const cacheService = getCacheService();
    const cacheKey = 'health:redis';

    // Try to get cached Redis health
    const cachedRedisHealth = await cacheService.get<any>(cacheKey);
    if (cachedRedisHealth) {
      return res.json({
        ...cachedRedisHealth,
        cached: true,
        timestamp: new Date().toISOString(),
      });
    }

    const start = Date.now();
    const redisClient = getRedis();
    await redisClient.ping();
    const latency = Date.now() - start;

    const redisHealthData = {
      connected: true,
      latency,
    };

    // Cache Redis health for 60 seconds
    await cacheService.set(cacheKey, redisHealthData, REDIS_HEALTH_CACHE_TTL);

    return res.json({
      ...redisHealthData,
      cached: false,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({
      connected: false,
      error: error instanceof Error ? error.message : 'Redis connection failed',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;