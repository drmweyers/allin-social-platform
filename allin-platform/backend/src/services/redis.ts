import Redis from 'ioredis';
import { logger } from '../utils/logger';

let redis: Redis | null = null;

export async function initializeRedis(): Promise<Redis> {
  try {
    redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6380'),
      maxRetriesPerRequest: 3,
    });

    redis.on('error', (error) => {
      logger.error('Redis error:', error);
    });

    redis.on('connect', () => {
      logger.info('✅ Redis connected successfully');
    });

    await redis.ping();
    return redis;
  } catch (error) {
    logger.error('❌ Redis connection failed:', error);
    throw error;
  }
}

export function getRedis(): Redis {
  if (!redis) {
    throw new Error('Redis not initialized');
  }
  return redis;
}