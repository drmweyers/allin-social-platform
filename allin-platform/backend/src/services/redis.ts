import Redis from 'ioredis';
import { logger } from '../utils/logger';

let redis: Redis | null = null;

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  SHORT: 300,     // 5 minutes
  MEDIUM: 1800,   // 30 minutes
  LONG: 3600,     // 1 hour
  VERY_LONG: 86400, // 24 hours
  USER_SESSION: 1800, // 30 minutes
  API_RATE_LIMIT: 900, // 15 minutes
  ANALYTICS: 3600, // 1 hour
  SOCIAL_POSTS: 600, // 10 minutes
};

// Cache key prefixes for organization
export const CACHE_KEYS = {
  USER_PROFILE: 'user:profile:',
  USER_SESSION: 'user:session:',
  SOCIAL_ACCOUNTS: 'social:accounts:',
  SOCIAL_POSTS: 'social:posts:',
  ANALYTICS_DATA: 'analytics:',
  API_RATE_LIMIT: 'rate:limit:',
  AI_RESPONSES: 'ai:responses:',
  WORKFLOW_TEMPLATES: 'workflow:templates:',
  CONTENT_DRAFTS: 'content:drafts:',
  TEAM_PERMISSIONS: 'team:permissions:',
};

export async function initializeRedis(): Promise<Redis> {
  try {
    const redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6380'),
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      enableReadyCheck: true,
      lazyConnect: true,
      family: 4,
      keepAlive: 30000,
      // Production optimizations
      db: 0,
      connectTimeout: 10000,
      commandTimeout: 5000,
    };

    redis = new Redis(redisConfig);

    redis.on('error', (error) => {
      logger.error('Redis error:', error);
    });

    redis.on('connect', () => {
      logger.info('✅ Redis connected successfully');
    });

    redis.on('ready', () => {
      logger.info('Redis is ready for operations');
    });

    redis.on('reconnecting', () => {
      logger.info('Redis reconnecting...');
    });

    redis.on('close', () => {
      logger.warn('Redis connection closed');
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

// Enhanced caching utilities with compression for large objects
export class CacheService {
  private redis: Redis;

  constructor() {
    this.redis = getRedis();
  }

  // Generic cache operations with automatic JSON serialization
  async set(key: string, value: any, ttl: number = CACHE_TTL.MEDIUM): Promise<boolean> {
    try {
      const serializedValue = JSON.stringify(value);
      const result = await this.redis.setex(key, ttl, serializedValue);
      return result === 'OK';
    } catch (error) {
      logger.error('Cache set error:', { key, error });
      return false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error('Cache get error:', { key, error });
      return null;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      const result = await this.redis.del(key);
      return result > 0;
    } catch (error) {
      logger.error('Cache delete error:', { key, error });
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Cache exists error:', { key, error });
      return false;
    }
  }

  // Batch operations for better performance
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      const values = await this.redis.mget(...keys);
      return values.map(value => value ? JSON.parse(value) as T : null);
    } catch (error) {
      logger.error('Cache mget error:', { keys, error });
      return keys.map(() => null);
    }
  }

  async mset(keyValuePairs: Array<{ key: string; value: any; ttl?: number }>): Promise<boolean> {
    try {
      const pipeline = this.redis.pipeline();
      
      keyValuePairs.forEach(({ key, value, ttl = CACHE_TTL.MEDIUM }) => {
        const serializedValue = JSON.stringify(value);
        pipeline.setex(key, ttl, serializedValue);
      });

      const results = await pipeline.exec();
      return results?.every(([error, result]) => !error && result === 'OK') || false;
    } catch (error) {
      logger.error('Cache mset error:', error);
      return false;
    }
  }

  // Pattern-based operations
  async deletePattern(pattern: string): Promise<number> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length === 0) return 0;
      
      const result = await this.redis.del(...keys);
      return result;
    } catch (error) {
      logger.error('Cache delete pattern error:', { pattern, error });
      return 0;
    }
  }

  // TTL operations
  async ttl(key: string): Promise<number> {
    try {
      return await this.redis.ttl(key);
    } catch (error) {
      logger.error('Cache TTL error:', { key, error });
      return -1;
    }
  }

  async expire(key: string, ttl: number): Promise<boolean> {
    try {
      const result = await this.redis.expire(key, ttl);
      return result === 1;
    } catch (error) {
      logger.error('Cache expire error:', { key, ttl, error });
      return false;
    }
  }

  // Cache-aside pattern with automatic refresh
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = CACHE_TTL.MEDIUM,
    refreshThreshold: number = 0.1 // Refresh when 10% of TTL remains
  ): Promise<T> {
    try {
      // Try to get from cache first
      const cached = await this.get<T>(key);
      if (cached) {
        // Check if we need to refresh soon
        const currentTtl = await this.ttl(key);
        if (currentTtl > 0 && currentTtl < ttl * refreshThreshold) {
          // Refresh in background
          this.refreshCache(key, fetcher, ttl).catch(error => {
            logger.error('Background cache refresh failed:', { key, error });
          });
        }
        return cached;
      }

      // Cache miss - fetch and cache
      const fresh = await fetcher();
      await this.set(key, fresh, ttl);
      return fresh;
    } catch (error) {
      logger.error('Cache getOrSet error:', { key, error });
      // If cache fails, still try to fetch fresh data
      return await fetcher();
    }
  }

  private async refreshCache<T>(key: string, fetcher: () => Promise<T>, ttl: number): Promise<void> {
    try {
      const fresh = await fetcher();
      await this.set(key, fresh, ttl);
      logger.debug('Cache refreshed successfully:', { key });
    } catch (error) {
      logger.error('Cache refresh failed:', { key, error });
    }
  }

  // Increment operations for counters
  async incr(key: string, ttl?: number): Promise<number> {
    try {
      const result = await this.redis.incr(key);
      if (ttl && result === 1) {
        // Set TTL only on first increment
        await this.redis.expire(key, ttl);
      }
      return result;
    } catch (error) {
      logger.error('Cache incr error:', { key, error });
      return 0;
    }
  }

  async incrby(key: string, increment: number, ttl?: number): Promise<number> {
    try {
      const result = await this.redis.incrby(key, increment);
      if (ttl && result === increment) {
        // Set TTL only on first increment
        await this.redis.expire(key, ttl);
      }
      return result;
    } catch (error) {
      logger.error('Cache incrby error:', { key, increment, error });
      return 0;
    }
  }

  // Health check for cache
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; latency?: number; error?: string }> {
    const start = Date.now();
    try {
      await this.redis.ping();
      const latency = Date.now() - start;
      return { status: 'healthy', latency };
    } catch (error) {
      return { 
        status: 'unhealthy', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Cache statistics
  async getStats(): Promise<{
    connected: boolean;
    memoryUsage?: string;
    keyCount?: number;
    hitRate?: number;
  }> {
    try {
      const info = await this.redis.info('memory');
      const keyCount = await this.redis.dbsize();
      
      return {
        connected: true,
        memoryUsage: this.parseMemoryInfo(info),
        keyCount,
      };
    } catch (error) {
      return { connected: false };
    }
  }

  private parseMemoryInfo(info: string): string {
    const match = info.match(/used_memory_human:([^\r\n]+)/);
    return match ? match[1].trim() : 'Unknown';
  }
}

// Global cache service instance
export const cacheService = new CacheService();