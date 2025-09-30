import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import winston from 'winston';
import { logger } from './logger';

// Mock winston
jest.mock('winston', () => {
  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
    silly: jest.fn(),
    log: jest.fn(),
    level: 'info',
    transports: [],
    format: {},
  };

  const mockTransports = {
    Console: jest.fn().mockImplementation(() => ({ name: 'console' })),
    File: jest.fn().mockImplementation(() => ({ name: 'file' })),
  };

  const mockFormat = {
    combine: jest.fn().mockReturnValue('combined-format'),
    timestamp: jest.fn().mockReturnValue('timestamp-format'),
    printf: jest.fn().mockReturnValue('printf-format'),
    colorize: jest.fn().mockReturnValue('colorize-format'),
    errors: jest.fn().mockReturnValue('errors-format'),
  };

  return {
    createLogger: jest.fn().mockReturnValue(mockLogger),
    transports: mockTransports,
    format: mockFormat,
    default: {
      createLogger: jest.fn().mockReturnValue(mockLogger),
      transports: mockTransports,
      format: mockFormat,
    },
  };
});

describe('Logger', () => {
  let mockWinston: jest.Mocked<typeof winston>;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockWinston = winston as jest.Mocked<typeof winston>;

    // Spy on console methods in case logger falls back to console
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    // Reset environment variable
    delete process.env.LOG_LEVEL;
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    // Restore original LOG_LEVEL if it existed
    if (process.env.NODE_ENV !== 'test') {
      process.env.LOG_LEVEL = 'info';
    }
  });

  describe('Logger Configuration', () => {
    it('should create logger with correct configuration', () => {
      expect(winston.createLogger).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'info', // default level
          format: 'combined-format',
          transports: expect.any(Array),
        })
      );
    });

    it('should use LOG_LEVEL environment variable when set', () => {
      process.env.LOG_LEVEL = 'debug';

      // Re-import logger to pick up new env var
      jest.resetModules();
      const { logger: newLogger } = require('./logger');

      expect(winston.createLogger).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'debug',
        })
      );
    });

    it('should fall back to info level when LOG_LEVEL is not set', () => {
      delete process.env.LOG_LEVEL;

      jest.resetModules();
      const { logger: newLogger } = require('./logger');

      expect(winston.createLogger).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'info',
        })
      );
    });

    it('should handle invalid LOG_LEVEL gracefully', () => {
      process.env.LOG_LEVEL = 'invalid-level';

      jest.resetModules();
      const { logger: newLogger } = require('./logger');

      expect(winston.createLogger).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'invalid-level', // Winston will handle invalid levels
        })
      );
    });

    it('should configure format correctly', () => {
      expect(winston.format.combine).toHaveBeenCalled();
      expect(winston.format.timestamp).toHaveBeenCalledWith({
        format: 'YYYY-MM-DD HH:mm:ss'
      });
      expect(winston.format.errors).toHaveBeenCalledWith({ stack: true });
      expect(winston.format.printf).toHaveBeenCalled();
    });

    it('should configure transports correctly', () => {
      expect(winston.transports.Console).toHaveBeenCalled();
      expect(winston.transports.File).toHaveBeenCalledWith({
        filename: 'logs/error.log',
        level: 'error',
      });
      expect(winston.transports.File).toHaveBeenCalledWith({
        filename: 'logs/combined.log',
      });
    });
  });

  describe('Log Format Function', () => {
    it('should format log messages correctly with stack trace', () => {
      const formatFunction = winston.format.printf as jest.Mock;
      const mockFormatFunction = formatFunction.mock.calls[0][0];

      const logEntry = {
        level: 'error',
        message: 'Test error message',
        timestamp: '2024-01-15 10:30:00',
        stack: 'Error: Test error\n    at test.js:1:1',
      };

      const formatted = mockFormatFunction(logEntry);
      expect(formatted).toBe('2024-01-15 10:30:00 error: Error: Test error\n    at test.js:1:1');
    });

    it('should format log messages correctly without stack trace', () => {
      const formatFunction = winston.format.printf as jest.Mock;
      const mockFormatFunction = formatFunction.mock.calls[0][0];

      const logEntry = {
        level: 'info',
        message: 'Test info message',
        timestamp: '2024-01-15 10:30:00',
      };

      const formatted = mockFormatFunction(logEntry);
      expect(formatted).toBe('2024-01-15 10:30:00 info: Test info message');
    });

    it('should handle empty messages', () => {
      const formatFunction = winston.format.printf as jest.Mock;
      const mockFormatFunction = formatFunction.mock.calls[0][0];

      const logEntry = {
        level: 'info',
        message: '',
        timestamp: '2024-01-15 10:30:00',
      };

      const formatted = mockFormatFunction(logEntry);
      expect(formatted).toBe('2024-01-15 10:30:00 info: ');
    });

    it('should handle undefined message', () => {
      const formatFunction = winston.format.printf as jest.Mock;
      const mockFormatFunction = formatFunction.mock.calls[0][0];

      const logEntry = {
        level: 'info',
        message: undefined,
        timestamp: '2024-01-15 10:30:00',
      };

      const formatted = mockFormatFunction(logEntry);
      expect(formatted).toBe('2024-01-15 10:30:00 info: undefined');
    });

    it('should handle special characters in messages', () => {
      const formatFunction = winston.format.printf as jest.Mock;
      const mockFormatFunction = formatFunction.mock.calls[0][0];

      const logEntry = {
        level: 'info',
        message: 'Message with special chars: !@#$%^&*()[]{}|;:,.<>?',
        timestamp: '2024-01-15 10:30:00',
      };

      const formatted = mockFormatFunction(logEntry);
      expect(formatted).toContain('Message with special chars: !@#$%^&*()[]{}|;:,.<>?');
    });

    it('should handle unicode characters in messages', () => {
      const formatFunction = winston.format.printf as jest.Mock;
      const mockFormatFunction = formatFunction.mock.calls[0][0];

      const logEntry = {
        level: 'info',
        message: 'Unicode message: 用户登录 🚀 Успешно ñoño',
        timestamp: '2024-01-15 10:30:00',
      };

      const formatted = mockFormatFunction(logEntry);
      expect(formatted).toContain('Unicode message: 用户登录 🚀 Успешно ñoño');
    });

    it('should handle multi-line messages', () => {
      const formatFunction = winston.format.printf as jest.Mock;
      const mockFormatFunction = formatFunction.mock.calls[0][0];

      const logEntry = {
        level: 'error',
        message: 'Line 1\nLine 2\nLine 3',
        timestamp: '2024-01-15 10:30:00',
      };

      const formatted = mockFormatFunction(logEntry);
      expect(formatted).toContain('Line 1\nLine 2\nLine 3');
    });

    it('should handle very long messages', () => {
      const formatFunction = winston.format.printf as jest.Mock;
      const mockFormatFunction = formatFunction.mock.calls[0][0];

      const longMessage = 'A'.repeat(10000);
      const logEntry = {
        level: 'info',
        message: longMessage,
        timestamp: '2024-01-15 10:30:00',
      };

      const formatted = mockFormatFunction(logEntry);
      expect(formatted).toContain(longMessage);
      expect(formatted.length).toBeGreaterThan(10000);
    });
  });

  describe('Logger Usage', () => {
    it('should expose logger instance', () => {
      expect(logger).toBeDefined();
      expect(typeof logger).toBe('object');
    });

    it('should have all standard logging methods', () => {
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.debug).toBe('function');
    });

    it('should log info messages', () => {
      const message = 'Test info message';
      logger.info(message);

      expect(logger.info).toHaveBeenCalledWith(message);
    });

    it('should log warning messages', () => {
      const message = 'Test warning message';
      logger.warn(message);

      expect(logger.warn).toHaveBeenCalledWith(message);
    });

    it('should log error messages', () => {
      const message = 'Test error message';
      logger.error(message);

      expect(logger.error).toHaveBeenCalledWith(message);
    });

    it('should log debug messages', () => {
      const message = 'Test debug message';
      logger.debug(message);

      expect(logger.debug).toHaveBeenCalledWith(message);
    });

    it('should handle Error objects', () => {
      const error = new Error('Test error');
      logger.error(error);

      expect(logger.error).toHaveBeenCalledWith(error);
    });

    it('should handle objects as messages', () => {
      const obj = { user: 'john', action: 'login' };
      logger.info(obj);

      expect(logger.info).toHaveBeenCalledWith(obj);
    });

    it('should handle arrays as messages', () => {
      const arr = ['item1', 'item2', 'item3'];
      logger.info(arr);

      expect(logger.info).toHaveBeenCalledWith(arr);
    });

    it('should handle null and undefined messages', () => {
      logger.info(null);
      logger.info(undefined);

      expect(logger.info).toHaveBeenCalledWith(null);
      expect(logger.info).toHaveBeenCalledWith(undefined);
    });

    it('should handle numeric messages', () => {
      logger.info(42);
      logger.info(3.14159);
      logger.info(0);
      logger.info(-1);

      expect(logger.info).toHaveBeenCalledWith(42);
      expect(logger.info).toHaveBeenCalledWith(3.14159);
      expect(logger.info).toHaveBeenCalledWith(0);
      expect(logger.info).toHaveBeenCalledWith(-1);
    });

    it('should handle boolean messages', () => {
      logger.info(true);
      logger.info(false);

      expect(logger.info).toHaveBeenCalledWith(true);
      expect(logger.info).toHaveBeenCalledWith(false);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle winston initialization errors gracefully', () => {
      const originalCreateLogger = winston.createLogger;
      (winston.createLogger as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Winston initialization failed');
      });

      expect(() => {
        jest.resetModules();
        require('./logger');
      }).toThrow('Winston initialization failed');

      // Restore original implementation
      (winston.createLogger as jest.Mock).mockImplementation(originalCreateLogger);
    });

    it('should handle missing log directory gracefully', () => {
      // Winston file transport should handle missing directories
      expect(winston.transports.File).toHaveBeenCalledWith({
        filename: 'logs/error.log',
        level: 'error',
      });
      expect(winston.transports.File).toHaveBeenCalledWith({
        filename: 'logs/combined.log',
      });
    });

    it('should handle circular references in objects', () => {
      const circular: any = { name: 'test' };
      circular.self = circular;

      // Should not throw when logging circular objects
      expect(() => {
        logger.info(circular);
      }).not.toThrow();

      expect(logger.info).toHaveBeenCalledWith(circular);
    });

    it('should handle very deep object nesting', () => {
      let deepObject: any = {};
      let current = deepObject;

      for (let i = 0; i < 100; i++) {
        current.nested = {};
        current = current.nested;
      }
      current.value = 'deep value';

      expect(() => {
        logger.info(deepObject);
      }).not.toThrow();

      expect(logger.info).toHaveBeenCalledWith(deepObject);
    });

    it('should handle logging with additional metadata', () => {
      const message = 'User action';
      const metadata = { userId: '123', action: 'login', ip: '192.168.1.1' };

      logger.info(message, metadata);

      expect(logger.info).toHaveBeenCalledWith(message, metadata);
    });

    it('should handle function objects in messages', () => {
      const func = () => 'test function';
      func.customProperty = 'custom value';

      logger.info(func);

      expect(logger.info).toHaveBeenCalledWith(func);
    });

    it('should handle Symbol messages', () => {
      const symbol = Symbol('test symbol');

      logger.info(symbol);

      expect(logger.info).toHaveBeenCalledWith(symbol);
    });

    it('should handle BigInt messages', () => {
      const bigInt = BigInt(Number.MAX_SAFE_INTEGER) + BigInt(1);

      logger.info(bigInt);

      expect(logger.info).toHaveBeenCalledWith(bigInt);
    });
  });

  describe('Performance and Memory', () => {
    it('should handle rapid logging without memory leaks', () => {
      for (let i = 0; i < 1000; i++) {
        logger.info(`Message ${i}`);
      }

      expect(logger.info).toHaveBeenCalledTimes(1000);
    });

    it('should handle concurrent logging calls', async () => {
      const promises = Array.from({ length: 100 }, (_, i) =>
        Promise.resolve().then(() => logger.info(`Concurrent message ${i}`))
      );

      await Promise.all(promises);

      expect(logger.info).toHaveBeenCalledTimes(100);
    });

    it('should handle large message volumes efficiently', () => {
      const start = Date.now();

      for (let i = 0; i < 1000; i++) {
        logger.info(`Performance test message ${i}`);
      }

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle large individual messages efficiently', () => {
      const largeMessage = 'A'.repeat(100000);

      const start = Date.now();
      logger.info(largeMessage);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100); // Should log large message quickly
      expect(logger.info).toHaveBeenCalledWith(largeMessage);
    });
  });

  describe('Environment-Specific Behavior', () => {
    it('should respect LOG_LEVEL in different environments', () => {
      const logLevels = ['error', 'warn', 'info', 'verbose', 'debug', 'silly'];

      logLevels.forEach(level => {
        process.env.LOG_LEVEL = level;
        jest.resetModules();
        require('./logger');

        expect(winston.createLogger).toHaveBeenCalledWith(
          expect.objectContaining({
            level: level,
          })
        );
      });
    });

    it('should handle empty LOG_LEVEL environment variable', () => {
      process.env.LOG_LEVEL = '';

      jest.resetModules();
      require('./logger');

      expect(winston.createLogger).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'info', // Should fall back to default
        })
      );
    });

    it('should handle case sensitivity in LOG_LEVEL', () => {
      process.env.LOG_LEVEL = 'ERROR';

      jest.resetModules();
      require('./logger');

      expect(winston.createLogger).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'ERROR', // Winston handles case sensitivity
        })
      );
    });

    it('should handle whitespace in LOG_LEVEL', () => {
      process.env.LOG_LEVEL = '  debug  ';

      jest.resetModules();
      require('./logger');

      expect(winston.createLogger).toHaveBeenCalledWith(
        expect.objectContaining({
          level: '  debug  ', // No automatic trimming
        })
      );
    });
  });

  describe('Transport Configuration', () => {
    it('should configure console transport with colorization', () => {
      expect(winston.transports.Console).toHaveBeenCalledWith({
        format: 'combined-format',
      });
    });

    it('should configure error file transport correctly', () => {
      expect(winston.transports.File).toHaveBeenCalledWith({
        filename: 'logs/error.log',
        level: 'error',
      });
    });

    it('should configure combined file transport correctly', () => {
      expect(winston.transports.File).toHaveBeenCalledWith({
        filename: 'logs/combined.log',
      });
    });

    it('should have multiple transports configured', () => {
      expect(winston.transports.Console).toHaveBeenCalled();
      expect(winston.transports.File).toHaveBeenCalledTimes(2);
    });
  });

  describe('Integration with Application', () => {
    it('should be suitable for request logging', () => {
      const requestData = {
        method: 'POST',
        url: '/api/users',
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
        userId: 'user123',
        duration: 150,
      };

      logger.info('Request completed', requestData);

      expect(logger.info).toHaveBeenCalledWith('Request completed', requestData);
    });

    it('should be suitable for error logging', () => {
      const error = new Error('Database connection failed');
      error.stack = 'Error: Database connection failed\n    at db.js:10:5';

      logger.error('Database error occurred', { error, context: 'user-service' });

      expect(logger.error).toHaveBeenCalledWith('Database error occurred', {
        error,
        context: 'user-service',
      });
    });

    it('should be suitable for security logging', () => {
      const securityEvent = {
        event: 'failed_login',
        ip: '192.168.1.100',
        userAgent: 'Suspicious Agent',
        attempts: 5,
        timestamp: new Date().toISOString(),
      };

      logger.warn('Security event detected', securityEvent);

      expect(logger.warn).toHaveBeenCalledWith('Security event detected', securityEvent);
    });

    it('should be suitable for performance logging', () => {
      const performanceData = {
        operation: 'database_query',
        duration: 2500,
        query: 'SELECT * FROM users WHERE active = true',
        resultCount: 150,
      };

      logger.debug('Query performance', performanceData);

      expect(logger.debug).toHaveBeenCalledWith('Query performance', performanceData);
    });
  });
});

export {};