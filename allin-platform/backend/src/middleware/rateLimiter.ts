import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
const disableRateLimiting = process.env.DISABLE_RATE_LIMITING === 'true';

// Create a key generator that includes user ID for authenticated requests
const createKeyGenerator = (prefix: string = 'rl') => {
  return (req: Request): string => {
    const userId = (req as any).user?.id;
    const ip = req.ip || req.socket.remoteAddress || 'unknown';

    // For authenticated users, use user ID + IP for more granular control
    if (userId) {
      return `${prefix}:user:${userId}:${ip}`;
    }

    // For unauthenticated users, use IP only
    return `${prefix}:ip:${ip}`;
  };
};

// Enhanced rate limiter with per-user limits
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req: Request) => {
    if (disableRateLimiting || isDevelopment) return 1000;

    const userId = (req as any).user?.id;
    // Authenticated users get higher limits
    return userId ? 200 : 100;
  },
  keyGenerator: createKeyGenerator('general'),
  message: {
    error: 'Rate limit exceeded',
    message: 'Too many requests, please try again later.',
    type: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (_req: Request) => {
    return disableRateLimiting && isDevelopment;
  },
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Too many requests, please try again later.',
      type: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil(15 * 60), // 15 minutes in seconds
    });
  },
});

// Strict rate limiter for sensitive operations (login, password reset, etc.)
export const strictRateLimiter = rateLimit({
  windowMs: isDevelopment ? 5 * 60 * 1000 : 15 * 60 * 1000, // Shorter window in dev
  max: (req: Request) => {
    if (disableRateLimiting || isDevelopment) return 20;

    const userId = (req as any).user?.id;
    // Even authenticated users have strict limits for sensitive operations
    return userId ? 8 : 5;
  },
  keyGenerator: createKeyGenerator('strict'),
  message: {
    error: 'Rate limit exceeded',
    message: 'Too many attempts, please try again later.',
    type: 'STRICT_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (_req: Request) => {
    return disableRateLimiting && isDevelopment;
  },
  handler: (_req: Request, res: Response) => {
    const windowMinutes = isDevelopment ? 5 : 15;
    res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Too many attempts, please try again later.',
      type: 'STRICT_RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil(windowMinutes * 60),
    });
  },
});

// AI-specific rate limiter with per-user quotas
export const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: (req: Request) => {
    if (disableRateLimiting || isDevelopment) return 50;

    const userId = (req as any).user?.id;
    if (!userId) return 2; // Very limited for unauthenticated users

    // Different limits based on user plan (could be extended)
    const userPlan = (req as any).user?.plan || 'basic';
    switch (userPlan) {
      case 'premium':
        return 30;
      case 'pro':
        return 20;
      case 'basic':
      default:
        return 10;
    }
  },
  keyGenerator: createKeyGenerator('ai'),
  message: {
    error: 'AI rate limit exceeded',
    message: 'AI request limit exceeded. Please wait before making more AI requests.',
    type: 'AI_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (_req: Request) => {
    return disableRateLimiting && isDevelopment;
  },
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      error: 'AI rate limit exceeded',
      message: 'AI request limit exceeded. Please wait before making more AI requests.',
      type: 'AI_RATE_LIMIT_EXCEEDED',
      retryAfter: 60, // 1 minute
      upgradeMessage: 'Upgrade your plan for higher AI request limits.',
    });
  },
});

// Upload rate limiter
export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: (req: Request) => {
    if (disableRateLimiting || isDevelopment) return 100;

    const userId = (req as any).user?.id;
    return userId ? 50 : 10; // Much higher limit for authenticated users
  },
  keyGenerator: createKeyGenerator('upload'),
  message: {
    error: 'Upload rate limit exceeded',
    message: 'Upload limit exceeded. Please wait before uploading more files.',
    type: 'UPLOAD_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (_req: Request) => {
    return disableRateLimiting && isDevelopment;
  },
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      error: 'Upload rate limit exceeded',
      message: 'Upload limit exceeded. Please wait before uploading more files.',
      type: 'UPLOAD_RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil(60 * 60), // 1 hour
    });
  },
});