import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

// Production-optimized Prisma configuration
const prismaConfig = {
  log: (process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn']
    : ['error']) as ('query' | 'error' | 'warn' | 'info')[],
  
  // Connection pool settings for production
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  
  // Performance optimizations
  transactionOptions: {
    maxWait: 5000, // 5 seconds
    timeout: 10000, // 10 seconds
  },
  
  // Error handling
  errorFormat: 'minimal' as const,
  
  // Query engine optimizations
  // engineType: 'binary' as const, // Removed due to Prisma compatibility issues
};

// Create Prisma client with optimized settings
const prismaInstance = new PrismaClient(prismaConfig);

// Connection pool monitoring
let connectionCount = 0;
let lastHealthCheck = 0;
// const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds (for future use)

// Database health metrics
interface DatabaseMetrics {
  connectionPool: {
    active: number;
    idle: number;
    total: number;
  };
  performance: {
    avgQueryTime: number;
    slowQueries: number;
    totalQueries: number;
  };
  health: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    lastCheck: Date;
    uptime: number;
  };
}

class DatabaseService {
  private prisma: PrismaClient;
  private queryMetrics: { startTime: number; duration: number }[] = [];
  private startTime: number = Date.now();

  constructor() {
    this.prisma = prismaInstance;
    this.setupQueryLogging();
    this.setupGracefulShutdown();
  }

  private setupQueryLogging() {
    // Track query performance in production
    if (process.env.NODE_ENV === 'production') {
      this.prisma.$use(async (params, next) => {
        const start = Date.now();
        const result = await next(params);
        const duration = Date.now() - start;
        
        // Track metrics
        this.queryMetrics.push({ startTime: start, duration });
        
        // Keep only last 1000 queries in memory
        if (this.queryMetrics.length > 1000) {
          this.queryMetrics = this.queryMetrics.slice(-1000);
        }
        
        // Log slow queries
        if (duration > 1000) { // 1 second threshold
          logger.warn('Slow query detected:', {
            model: params.model,
            action: params.action,
            duration,
            args: this.sanitizeArgs(params.args),
          });
        }
        
        return result;
      });
    }
  }

  private sanitizeArgs(args: any): any {
    // Remove sensitive data from logs
    if (!args) return args;
    
    const sanitized = { ...args };
    if (sanitized.data?.password) sanitized.data.password = '[REDACTED]';
    if (sanitized.where?.password) sanitized.where.password = '[REDACTED]';
    
    return sanitized;
  }

  private setupGracefulShutdown() {
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);
      
      try {
        await this.prisma.$disconnect();
        logger.info('Database connections closed successfully');
        process.exit(0);
      } catch (error) {
        logger.error('Error during database shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  }

  async connect(): Promise<boolean> {
    try {
      await this.prisma.$connect();
      connectionCount++;
      logger.info('✅ Database connected successfully', { 
        connectionCount,
        environment: process.env.NODE_ENV 
      });
      return true;
    } catch (error) {
      logger.error('❌ Database connection failed:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      connectionCount--;
      logger.info('Database disconnected', { connectionCount });
    } catch (error) {
      logger.error('Error disconnecting from database:', error);
    }
  }

  // Health check with detailed diagnostics
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    latency?: number;
    error?: string;
    details?: any;
  }> {
    const now = Date.now();
    
    try {
      const start = Date.now();
      
      // Simple query to test connection
      await this.prisma.$queryRaw`SELECT 1 as test`;
      
      const latency = Date.now() - start;
      lastHealthCheck = now;
      
      // Check if we have any concerning metrics
      const recentMetrics = this.queryMetrics.filter(m => m.startTime > now - 60000); // Last minute
      const avgLatency = recentMetrics.length > 0 
        ? recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length 
        : 0;
      
      const status = latency > 1000 || avgLatency > 500 ? 'degraded' : 'healthy';
      
      return {
        status,
        latency,
        details: {
          avgQueryTime: Math.round(avgLatency),
          recentQueries: recentMetrics.length,
          connectionCount,
        }
      };
    } catch (error) {
      logger.error('Database health check failed:', error);
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Get comprehensive database metrics
  async getMetrics(): Promise<DatabaseMetrics> {
    const now = Date.now();
    const recentMetrics = this.queryMetrics.filter(m => m.startTime > now - 300000); // Last 5 minutes
    
    const avgQueryTime = recentMetrics.length > 0
      ? recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length
      : 0;
    
    const slowQueries = recentMetrics.filter(m => m.duration > 1000).length;
    
    const healthStatus = await this.healthCheck();
    
    return {
      connectionPool: {
        active: connectionCount,
        idle: 0, // Prisma manages this internally
        total: connectionCount,
      },
      performance: {
        avgQueryTime: Math.round(avgQueryTime),
        slowQueries,
        totalQueries: this.queryMetrics.length,
      },
      health: {
        status: healthStatus.status,
        lastCheck: new Date(lastHealthCheck),
        uptime: now - this.startTime,
      },
    };
  }

  // Execute queries with retry logic and performance monitoring
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error | undefined;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const start = Date.now();
        const result = await operation();
        const duration = Date.now() - start;
        
        if (duration > 5000) {
          logger.warn('Long-running query completed:', { duration, attempt });
        }
        
        return result;
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on certain errors
        if (error instanceof Error && (
          error.message.includes('Unique constraint') ||
          error.message.includes('Foreign key constraint') ||
          error.message.includes('Invalid input')
        )) {
          throw error;
        }
        
        if (attempt < maxRetries) {
          const backoffDelay = delay * Math.pow(2, attempt - 1); // Exponential backoff
          logger.warn(`Database operation failed, retrying in ${backoffDelay}ms:`, {
            attempt,
            maxRetries,
            error: error instanceof Error ? error.message : error,
          });
          
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
        }
      }
    }
    
    logger.error('Database operation failed after all retries:', lastError);
    throw lastError || new Error('Unknown error occurred');
  }

  // Batch operations for better performance
  async batchInsert<T>(
    model: string,
    data: T[],
    batchSize: number = 1000
  ): Promise<number> {
    let totalInserted = 0;
    
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      
      try {
        await this.executeWithRetry(async () => {
          const result = await (this.prisma as any)[model].createMany({
            data: batch,
            skipDuplicates: true,
          });
          return result;
        });
        
        totalInserted += batch.length;
        logger.debug(`Batch insert completed: ${totalInserted}/${data.length}`);
      } catch (error) {
        logger.error('Batch insert failed:', { 
          model, 
          batchStart: i, 
          batchSize: batch.length,
          error 
        });
        throw error;
      }
    }
    
    return totalInserted;
  }

  // Transaction with automatic retry
  async transaction<T>(
    operations: (prisma: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>,
    options?: { timeout?: number; maxWait?: number }
  ): Promise<T> {
    return this.executeWithRetry(async () => {
      return this.prisma.$transaction(operations, {
        timeout: options?.timeout || 10000,
        maxWait: options?.maxWait || 5000,
      });
    });
  }

  // Get the Prisma client instance
  getClient(): PrismaClient {
    return this.prisma;
  }
}

// Global database service instance
export const databaseService = new DatabaseService();

// Legacy exports for backwards compatibility
export const prisma = databaseService.getClient();
export const checkDatabaseConnection = () => databaseService.connect();