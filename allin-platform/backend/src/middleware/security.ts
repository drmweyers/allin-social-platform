import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import cors from 'cors'; // force restart

// Rate limiting configurations for different endpoints
export const createRateLimiter = (windowMs: number, max: number, message?: string) => {
  return rateLimit({
    windowMs,
    max,
    message: message || 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req: Request, res: Response) => {
      res.status(429).json({
        error: 'Rate limit exceeded',
        message: message || 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil(windowMs / 1000),
      });
    },
  });
};

// Different rate limiters for different endpoints
export const authLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // limit each IP to 5 requests per windowMs
  'Too many authentication attempts, please try again later.'
);

export const apiLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  100, // limit each IP to 100 requests per windowMs
);

export const aiLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  10, // limit each IP to 10 AI requests per minute
  'AI request limit exceeded. Please wait before making more AI requests.'
);

export const uploadLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  20, // limit each IP to 20 uploads per hour
  'Upload limit exceeded. Please wait before uploading more files.'
);

// Enhanced security headers middleware with XSS protection
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://cdn.jsdelivr.net'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'https://cdn.jsdelivr.net'],
      imgSrc: ["'self'", 'data:', 'https:', 'blob:', 'https://images.unsplash.com'],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://cdn.jsdelivr.net'],
      connectSrc: ["'self'", 'https://api.openai.com', 'https://api.anthropic.com', 'wss:', 'ws:', 'https:'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", 'blob:', 'data:'],
      frameSrc: ["'self'", 'https:'],
      frameAncestors: ["'self'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  frameguard: { action: 'deny' },
  xssFilter: true,
  referrerPolicy: { policy: ['strict-origin-when-cross-origin'] },
  permittedCrossDomainPolicies: false,
  hidePoweredBy: true,
});

// Enhanced CORS configuration with better security
export const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    const corsOrigins = process.env.CORS_ORIGIN?.split(',').map(o => o.trim()) || [];
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:4000',
      process.env.FRONTEND_URL,
      ...corsOrigins,
    ].filter(Boolean);

    // In development, allow requests with no origin (like mobile apps or Postman)
    // In production, be more strict
    const isDevelopment = process.env.NODE_ENV === 'development';

    if (!origin) {
      // No origin means same-origin or tool like Postman
      if (isDevelopment) {
        callback(null, true);
      } else {
        // In production, log and potentially allow based on other headers
        console.warn('CORS: Request without origin header in production');
        callback(null, true); // Allow for now, but could be stricter
      }
    } else if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error('CORS: Blocked request from origin:', origin);
      callback(new Error(`Origin ${origin} not allowed by CORS policy`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-API-Key',
    'X-Client-Version',
    'X-Request-ID'
  ],
  exposedHeaders: [
    'X-Total-Count',
    'X-Page',
    'X-Per-Page',
    'X-Rate-Limit-Remaining',
    'X-Rate-Limit-Reset',
    'X-Request-ID'
  ],
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 200, // For legacy browser support
};

// Input sanitization middleware
export const sanitizeInput = (req: Request, _res: Response, next: NextFunction) => {
  // Sanitize request body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  // Sanitize params
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
};

// Helper function to sanitize objects with enhanced XSS protection
function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    // Enhanced XSS protection - remove potential XSS vectors
    let sanitized = obj
      // Remove script tags
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Remove javascript: protocol
      .replace(/javascript:/gi, '')
      // Remove on* event handlers
      .replace(/on\w+\s*=/gi, '')
      // Remove data: protocol with javascript
      .replace(/data:\s*text\/html/gi, '')
      // Remove vbscript: protocol
      .replace(/vbscript:/gi, '')
      // Remove expression() CSS
      .replace(/expression\s*\(/gi, '')
      // Remove iframe, object, embed tags
      .replace(/<(iframe|object|embed|applet|meta)\b[^>]*>/gi, '')
      // Remove link tags with suspicious href
      .replace(/<link\b[^>]*href\s*=\s*["']?javascript:/gi, '')
      // Remove style tags with javascript
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      // Remove HTML comments that might contain scripts
      .replace(/<!--[\s\S]*?-->/g, '')
      // Remove XML CDATA sections
      .replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '')
      // Escape angle brackets
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      // Escape quotes
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      // Escape ampersands (but not already escaped entities)
      .replace(/&(?!#?[a-zA-Z0-9]+;)/g, '&amp;')
      .trim();

    // Additional check for encoded scripts
    const decodedString = decodeURIComponent(sanitized);
    if (decodedString !== sanitized && decodedString.toLowerCase().includes('script')) {
      // If decoding reveals script tags, apply sanitization again
      return sanitizeObject(decodedString);
    }

    return sanitized;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  if (obj !== null && typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        // Skip potentially dangerous keys
        if (!['__proto__', 'constructor', 'prototype', '__defineGetter__', '__defineSetter__', '__lookupGetter__', '__lookupSetter__'].includes(key)) {
          sanitized[key] = sanitizeObject(obj[key]);
        }
      }
    }
    return sanitized;
  }

  return obj;
}

// SQL injection prevention (for raw queries if any)
// @ts-ignore - TS7030: Middleware functions can return early or call next()
export const preventSQLInjection = (req: Request, res: Response, next: NextFunction) => {
  const suspiciousPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
    /(--|\||;|\/\*|\*\/|xp_|sp_|0x)/gi,
    /(\bOR\b\s*\d+\s*=\s*\d+|\bAND\b\s*\d+\s*=\s*\d+)/gi,
  ];

  const checkValue = (value: any): boolean => {
    if (typeof value === 'string') {
      return !suspiciousPatterns.some(pattern => pattern.test(value));
    }
    return true;
  };

  const checkObject = (obj: any): boolean => {
    if (typeof obj === 'string') {
      return checkValue(obj);
    }

    if (Array.isArray(obj)) {
      return obj.every(checkObject);
    }

    if (obj !== null && typeof obj === 'object') {
      return Object.values(obj).every(checkObject);
    }

    return true;
  };

  if (!checkObject(req.body) || !checkObject(req.query) || !checkObject(req.params)) {
    return res.status(400).json({
      error: 'Invalid input detected',
      message: 'Your request contains potentially harmful content.',
    });
  }

  next();
};

// API key validation middleware
// @ts-ignore - TS7030: Middleware functions can return early or call next()
export const validateApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    return res.status(401).json({
      error: 'API key required',
      message: 'Please provide a valid API key in the x-api-key header.',
    });
  }

  // In production, validate against stored API keys
  const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];

  if (!validApiKeys.includes(apiKey)) {
    return res.status(401).json({
      error: 'Invalid API key',
      message: 'The provided API key is not valid.',
    });
  }

  next();
};

// Prevent parameter pollution
export const preventParamPollution = hpp({
  whitelist: ['sort', 'fields', 'page', 'limit', 'filter'],
});

// Security audit logging
export const securityAuditLog = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  // Log security-relevant events
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent'),
      statusCode: res.statusCode,
      duration,
      userId: (req as any).user?.id,
    };

    // Log suspicious activities
    if (res.statusCode === 401 || res.statusCode === 403 || res.statusCode === 429) {
      console.warn('Security event:', logData);
    }

    // Log potential attacks
    if (res.statusCode === 400 && duration < 10) {
      console.error('Potential attack detected:', logData);
    }
  });

  next();
};

// Combined security middleware
export const setupSecurity = (app: any) => {
  // Basic security headers
  app.use(securityHeaders);

  // CORS
  app.use(cors(corsOptions));

  // Body parsing security
  app.use(mongoSanitize());

  // Prevent parameter pollution
  app.use(preventParamPollution);

  // Input sanitization
  app.use(sanitizeInput);

  // SQL injection prevention
  app.use(preventSQLInjection);

  // Security audit logging
  app.use(securityAuditLog);

  // Trust proxy (for accurate IP addresses behind reverse proxy)
  app.set('trust proxy', 1);

  // Disable X-Powered-By header
  app.disable('x-powered-by');
};