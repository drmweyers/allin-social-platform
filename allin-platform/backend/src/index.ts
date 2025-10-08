import dotenv from 'dotenv';
import path from 'path';

// Load .env from root directory (one level up from backend)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// CRITICAL: Validate environment variables BEFORE importing any services
// This ensures security-critical variables (JWT secrets, encryption keys) are present
import { validateEnvironmentOrExit } from './utils/env-validator';
validateEnvironmentOrExit();

import express from 'express';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { errorHandler } from './middleware/error';
import { rateLimiter } from './middleware/rateLimiter';
import { setupSecurity, corsOptions } from './middleware/security';
import routes from './routes';
import { logger } from './utils/logger';
import { initializeRedis } from './services/redis';
import { checkDatabaseConnection, warmupDatabasePool } from './services/database';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: corsOptions,
});

// Use environment variable or default to 5000
const PORT = parseInt(process.env.API_PORT || '5000', 10);
console.log('Starting server on PORT:', PORT);

// Security middleware (comprehensive setup)
setupSecurity(app);

// Additional middleware
app.use(cookieParser());
app.use(express.json({ limit: '10mb' })); // Set reasonable limits
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

// Rate limiting
// LOAD TESTING: Can be disabled via DISABLE_RATE_LIMITING=true environment variable
// IMPORTANT: Always enable for production (security requirement)
if (process.env.DISABLE_RATE_LIMITING !== 'true') {
  app.use('/api/', rateLimiter);
  logger.info('✅ Rate limiting enabled');
} else {
  logger.warn('⚠️  Rate limiting DISABLED (for load testing only - DO NOT use in production)');
}

// Enhanced health check with security status
app.get('/health', (_req, res) => {
  const securityStatus = {
    rateLimitingEnabled: process.env.DISABLE_RATE_LIMITING !== 'true',
    securityHeadersEnabled: process.env.ENABLE_SECURITY_HEADERS === 'true',
    encryptionConfigured: !!(process.env.ENCRYPTION_KEY && process.env.ENCRYPTION_ALGORITHM),
    openaiConfigured: !!process.env.OPENAI_API_KEY,
    corsConfigured: !!process.env.CORS_ORIGIN,
  };

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    security: securityStatus,
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api', routes);

// Socket.io connection
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Error handling
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    // Initialize Redis
    await initializeRedis();

    // Check database connection (with graceful fallback)
    try {
      await checkDatabaseConnection();
      logger.info(`✅ Database connected successfully`);

      // PERFORMANCE OPTIMIZATION: Warm up connection pool on startup
      // Expected: Reduces first-query latency from 2283ms → <50ms (-98%)
      await warmupDatabasePool();
    } catch (dbError) {
      logger.warn(`⚠️  Database connection failed - some features may be limited:`, (dbError as Error).message);
    }

    // Auto-seed dev user in development mode (BEFORE server starts accepting requests)
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV !== 'production') {
      try {
        const { seedDevUser } = await import('../prisma/dev-seed');
        await seedDevUser();
      } catch (seedError) {
        logger.warn(`⚠️  Dev user seeding failed (non-critical):`, (seedError as Error).message);
      }
    }

    httpServer.listen(PORT, () => {
      logger.info(`🚀 Server running on http://localhost:${PORT}`);
      logger.info(`📄 API Documentation: http://localhost:${PORT}/api-docs`);
      logger.info(`🔌 WebSocket server ready`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  httpServer.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

export { app, io };
// Trigger restart


