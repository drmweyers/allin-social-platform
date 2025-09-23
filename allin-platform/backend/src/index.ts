import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
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
import { checkDatabaseConnection } from './services/database';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: corsOptions,
});

const PORT = process.env.API_PORT || 5000;

// Security middleware (comprehensive setup)
setupSecurity(app);

// Additional middleware
app.use(cookieParser());
app.use(express.json({ limit: '10mb' })); // Set reasonable limits
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

// Rate limiting
app.use('/api/', rateLimiter);

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
    // Check database connection
    await checkDatabaseConnection();
    
    // Initialize Redis
    await initializeRedis();
    
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