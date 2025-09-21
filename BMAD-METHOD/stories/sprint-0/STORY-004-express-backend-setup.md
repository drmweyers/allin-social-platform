# Story 004: Express Backend Setup
**Sprint**: 0 - Infrastructure Setup
**Points**: 5
**Priority**: CRITICAL
**Type**: Backend Setup

## Story Description
As a developer, I need to set up the Express.js backend with TypeScript, configure all middleware, implement the service architecture, and establish API structure so that we have a robust and scalable backend foundation ready for feature development.

## Acceptance Criteria
- [ ] Express application created with TypeScript
- [ ] All required middleware configured (security, CORS, rate limiting)
- [ ] Service-based architecture implemented
- [ ] Authentication middleware prepared
- [ ] Database connection established
- [ ] Redis connection configured
- [ ] API routing structure created
- [ ] Error handling implemented
- [ ] Logging system configured
- [ ] Environment variables loaded
- [ ] Backend starts without errors

## Technical Details

### Step 1: Initialize Backend Project
```bash
# From project root
cd backend
npm init -y

# Update package.json
npm pkg set name="allin-backend"
npm pkg set version="1.0.0"
npm pkg set description="AllIN Social Media Platform Backend API"
npm pkg set main="dist/server.js"
npm pkg set engines.node=">=18.0.0"
```

### Step 2: Install Dependencies
```bash
# Core dependencies
npm install express@4.21.1
npm install dotenv@16.4.5
npm install cors@2.8.5
npm install helmet@8.0.0
npm install compression
npm install cookie-parser
npm install express-rate-limit@7.4.1

# Authentication & Security
npm install jsonwebtoken@9.0.2
npm install bcryptjs
npm install express-validator@7.2.0

# Database & Cache
npm install @prisma/client@5.22.0
npm install ioredis
npm install bull

# Utilities
npm install winston@3.17.0
npm install morgan
npm install uuid@10.0.0
npm install date-fns@4.1.0
npm install zod@3.24.1

# File handling
npm install multer@1.4.5
npm install sharp

# Email
npm install nodemailer@6.9.17

# Real-time
npm install socket.io

# OpenAI
npm install openai

# Development dependencies
npm install -D typescript@5.7.2
npm install -D @types/node@latest
npm install -D @types/express@latest
npm install -D @types/cors@latest
npm install -D @types/compression@latest
npm install -D @types/cookie-parser@latest
npm install -D @types/jsonwebtoken@latest
npm install -D @types/bcryptjs@latest
npm install -D @types/multer@latest
npm install -D @types/nodemailer@latest
npm install -D nodemon@3.1.7
npm install -D ts-node@10.9.2
npm install -D tsconfig-paths@latest
npm install -D prisma@5.22.0

# Testing dependencies
npm install -D jest@29.7.0
npm install -D @types/jest@latest
npm install -D supertest@7.1.4
npm install -D @types/supertest@latest
npm install -D ts-jest@latest
```

### Step 3: Configure TypeScript

#### File: `/backend/tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "allowJs": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/services/*": ["src/services/*"],
      "@/controllers/*": ["src/controllers/*"],
      "@/middleware/*": ["src/middleware/*"],
      "@/routes/*": ["src/routes/*"],
      "@/lib/*": ["src/lib/*"],
      "@/types/*": ["src/types/*"],
      "@/utils/*": ["src/utils/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

### Step 4: Create Project Structure
```bash
# Create directory structure
mkdir -p src/controllers
mkdir -p src/services
mkdir -p src/routes
mkdir -p src/middleware
mkdir -p src/lib
mkdir -p src/utils
mkdir -p src/types
mkdir -p src/config
mkdir -p src/validators
mkdir -p src/jobs
mkdir -p src/websocket
```

### Step 5: Configure Environment Variables

#### File: `/backend/.env.development`
```env
# Server Configuration
NODE_ENV=development
PORT=5000
WS_PORT=5001
HOST=localhost

# Database
DATABASE_URL="postgresql://allin_user:allin_password@localhost:5432/allin_db?schema=public"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6380
REDIS_PASSWORD=allin_redis_password

# JWT Secrets
JWT_SECRET=dev-jwt-secret-change-in-production-abc123xyz789
JWT_REFRESH_SECRET=dev-refresh-secret-change-in-production-xyz789abc123
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# Encryption
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef

# CORS
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=debug

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

# Email (MailHog for development)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@allin.local

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# Social Media APIs (Add your test keys)
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
TWITTER_API_KEY=
TWITTER_API_SECRET=
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
```

### Step 6: Create Main Server File

#### File: `/backend/src/server.ts`
```typescript
import express, { Express } from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({
  path: `.env.${process.env.NODE_ENV || 'development'}`
});

// Import configurations
import { corsConfig } from './config/cors';
import { rateLimiter } from './config/rateLimit';
import { logger } from './lib/logger';
import { prisma } from './lib/prisma';
import { redis } from './lib/redis';
import { errorHandler } from './middleware/errorHandler';

// Import routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import postRoutes from './routes/post.routes';
import analyticsRoutes from './routes/analytics.routes';
import socialRoutes from './routes/social.routes';
import aiRoutes from './routes/ai.routes';
import teamRoutes from './routes/team.routes';

class Server {
  private app: Express;
  private server: http.Server;
  private io: SocketIOServer;
  private port: number;
  private wsPort: number;

  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: corsConfig,
    });
    this.port = parseInt(process.env.PORT || '5000', 10);
    this.wsPort = parseInt(process.env.WS_PORT || '5001', 10);

    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeWebSocket();
    this.initializeErrorHandling();
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }));
    this.app.use(cors(corsConfig));
    this.app.use(compression());

    // Request parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    this.app.use(cookieParser());

    // Logging
    if (process.env.NODE_ENV === 'development') {
      this.app.use(morgan('dev'));
    } else {
      this.app.use(morgan('combined', {
        stream: {
          write: (message) => logger.info(message.trim()),
        },
      }));
    }

    // Rate limiting
    this.app.use('/api', rateLimiter);

    // Static files
    this.app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    });
  }

  private initializeRoutes(): void {
    // API routes
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/users', userRoutes);
    this.app.use('/api/posts', postRoutes);
    this.app.use('/api/analytics', analyticsRoutes);
    this.app.use('/api/social', socialRoutes);
    this.app.use('/api/ai', aiRoutes);
    this.app.use('/api/teams', teamRoutes);

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.originalUrl} not found`,
      });
    });
  }

  private initializeWebSocket(): void {
    this.io.on('connection', (socket) => {
      logger.info(`WebSocket client connected: ${socket.id}`);

      socket.on('join-organization', (orgId: string) => {
        socket.join(`org:${orgId}`);
        logger.info(`Socket ${socket.id} joined org:${orgId}`);
      });

      socket.on('disconnect', () => {
        logger.info(`WebSocket client disconnected: ${socket.id}`);
      });
    });
  }

  private initializeErrorHandling(): void {
    this.app.use(errorHandler);

    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception:', error);
      this.shutdown();
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: any) => {
      logger.error('Unhandled Rejection:', reason);
      this.shutdown();
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      this.shutdown();
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully');
      this.shutdown();
    });
  }

  private async shutdown(): Promise<void> {
    try {
      // Close server
      this.server.close(() => {
        logger.info('HTTP server closed');
      });

      // Close database connections
      await prisma.$disconnect();
      logger.info('Database connection closed');

      // Close Redis connection
      redis.disconnect();
      logger.info('Redis connection closed');

      // Exit process
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  }

  public async start(): Promise<void> {
    try {
      // Test database connection
      await prisma.$connect();
      logger.info('Database connected successfully');

      // Test Redis connection
      await redis.ping();
      logger.info('Redis connected successfully');

      // Start server
      this.server.listen(this.port, () => {
        logger.info(`Server running on http://localhost:${this.port}`);
        logger.info(`WebSocket server running on ws://localhost:${this.port}`);
        logger.info(`Environment: ${process.env.NODE_ENV}`);
      });
    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }
}

// Create and start server
const server = new Server();
server.start();

export default server;
```

### Step 7: Create Core Libraries

#### File: `/backend/src/lib/logger.ts`
```typescript
import winston from 'winston';
import path from 'path';

const logDir = path.join(__dirname, '../../logs');

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'allin-backend' },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    // File transport for errors
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
    }),
    // File transport for all logs
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
    }),
  ],
});

// Create a stream object for Morgan
export const stream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};
```

#### File: `/backend/src/lib/prisma.ts`
```typescript
import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'info', 'warn', 'error']
      : ['error'],
  });
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

// Log database queries in development
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query' as any, (e: any) => {
    logger.debug('Query: ' + e.query);
    logger.debug('Duration: ' + e.duration + 'ms');
  });
}
```

#### File: `/backend/src/lib/redis.ts`
```typescript
import Redis from 'ioredis';
import { logger } from './logger';

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
};

export const redis = new Redis(redisConfig);

redis.on('connect', () => {
  logger.info('Redis client connected');
});

redis.on('error', (err) => {
  logger.error('Redis client error:', err);
});

redis.on('close', () => {
  logger.info('Redis connection closed');
});

// Cache helper functions
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  },

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    try {
      const data = JSON.stringify(value);
      if (ttlSeconds) {
        await redis.setex(key, ttlSeconds, data);
      } else {
        await redis.set(key, data);
      }
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
    }
  },

  async del(key: string | string[]): Promise<void> {
    try {
      await redis.del(key);
    } catch (error) {
      logger.error(`Cache delete error:`, error);
    }
  },

  async flush(): Promise<void> {
    try {
      await redis.flushdb();
    } catch (error) {
      logger.error('Cache flush error:', error);
    }
  },
};
```

### Step 8: Create Middleware

#### File: `/backend/src/middleware/errorHandler.ts`
```typescript
import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger';

interface ErrorWithStatus extends Error {
  status?: number;
  errors?: any;
}

export const errorHandler = (
  error: ErrorWithStatus,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let status = error.status || 500;
  let message = error.message || 'Internal Server Error';

  // Log error details
  logger.error({
    error: {
      message: error.message,
      stack: error.stack,
      status,
    },
    request: {
      method: req.method,
      url: req.url,
      body: req.body,
      params: req.params,
      query: req.query,
    },
  });

  // Handle specific error types
  if (error.name === 'ValidationError') {
    status = 400;
    message = 'Validation Error';
  } else if (error.name === 'UnauthorizedError') {
    status = 401;
    message = 'Unauthorized';
  } else if (error.name === 'CastError') {
    status = 400;
    message = 'Invalid ID format';
  }

  // Send error response
  res.status(status).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && {
        stack: error.stack,
        details: error.errors,
      }),
    },
  });
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
```

#### File: `/backend/src/middleware/auth.ts`
```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        organizations: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};
```

### Step 9: Create Configuration Files

#### File: `/backend/src/config/cors.ts`
```typescript
import { CorsOptions } from 'cors';

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:3000',
];

export const corsConfig: CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400, // 24 hours
};
```

#### File: `/backend/src/config/rateLimit.ts`
```typescript
import rateLimit from 'express-rate-limit';
import { logger } from '../lib/logger';

export const rateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
    });
  },
});

// Stricter rate limiter for auth endpoints
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many authentication attempts',
  skipSuccessfulRequests: true,
});
```

### Step 10: Create Sample Route

#### File: `/backend/src/routes/auth.routes.ts`
```typescript
import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';
import { authRateLimiter } from '../config/rateLimit';
import * as authController from '../controllers/auth.controller';

const router = Router();

// Register
router.post(
  '/register',
  authRateLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('name').trim().notEmpty(),
  ],
  validate,
  authController.register
);

// Login
router.post(
  '/login',
  authRateLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  validate,
  authController.login
);

// Refresh token
router.post(
  '/refresh',
  [body('refreshToken').notEmpty()],
  validate,
  authController.refreshToken
);

// Logout
router.post('/logout', authController.logout);

export default router;
```

### Step 11: Update Package.json Scripts

#### File: `/backend/package.json`
```json
{
  "scripts": {
    "dev": "nodemon",
    "build": "rimraf dist && tsc",
    "start": "node dist/server.js",
    "start:prod": "NODE_ENV=production node dist/server.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:push": "prisma db push",
    "prisma:studio": "prisma studio",
    "seed": "ts-node src/prisma/seed.ts"
  }
}
```

### Step 12: Create Nodemon Configuration

#### File: `/backend/nodemon.json`
```json
{
  "watch": ["src"],
  "ext": "ts,json",
  "ignore": ["src/**/*.test.ts"],
  "exec": "ts-node -r tsconfig-paths/register src/server.ts",
  "env": {
    "NODE_ENV": "development"
  }
}
```

## Implementation Notes

1. **Architecture**: Service-based architecture for scalability
2. **Security**: Helmet, CORS, rate limiting configured
3. **Database**: Prisma singleton pattern for connection pooling
4. **Caching**: Redis with helper functions
5. **Logging**: Winston with multiple transports
6. **Error Handling**: Centralized error handling
7. **WebSocket**: Socket.io for real-time features

## Testing Instructions

1. **Start Backend**:
```bash
cd backend
npm run dev
```

2. **Check Health Endpoint**:
```bash
curl http://localhost:5000/health
```

3. **Test Database Connection**:
- Should see "Database connected successfully" in logs

4. **Test Redis Connection**:
- Should see "Redis connected successfully" in logs

## Troubleshooting

1. **Port Already in Use**: Change PORT in .env
2. **Database Connection Failed**: Check Docker containers are running
3. **Redis Connection Failed**: Verify Redis password and port
4. **TypeScript Errors**: Run `npm run build` to check compilation

## Dependencies
All dependencies listed in Step 2

## Blocking Issues
- Docker containers must be running (from STORY-002)
- Database schema must be created (STORY-005)

## Next Steps
After completing this story:
- STORY-005: Implement Prisma schema
- STORY-006: Set up CI/CD
- Create initial controllers and services

## Time Estimate
- Project setup: 30 minutes
- Dependencies installation: 30 minutes
- Server configuration: 1 hour
- Middleware setup: 45 minutes
- Testing: 30 minutes
- Total: 3.25 hours

## Notes for Dev Agent
- Ensure all environment variables are set
- Test each middleware independently
- Verify WebSocket connection works
- Check rate limiting is working properly
- Monitor memory usage with large file uploads