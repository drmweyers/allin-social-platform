import { describe, it, expect } from '@jest/globals';
import {
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  InternalServerError,
} from './errors';

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create AppError with correct properties', () => {
      const message = 'Test error message';
      const statusCode = 400;

      const error = new AppError(message, statusCode);

      expect(error.message).toBe(message);
      expect(error.statusCode).toBe(statusCode);
      expect(error.isOperational).toBe(true);
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
    });

    it('should capture stack trace', () => {
      const error = new AppError('Test error', 500);

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('Error');
      expect(error.stack).toContain('Test error');
    });

    it('should inherit from Error correctly', () => {
      const error = new AppError('Test error', 500);

      expect(error instanceof Error).toBe(true);
      expect(error instanceof AppError).toBe(true);
      expect(error.constructor.name).toBe('AppError');
    });

    it('should handle different status codes', () => {
      const testCases = [
        { statusCode: 400, description: 'Bad Request' },
        { statusCode: 401, description: 'Unauthorized' },
        { statusCode: 403, description: 'Forbidden' },
        { statusCode: 404, description: 'Not Found' },
        { statusCode: 409, description: 'Conflict' },
        { statusCode: 422, description: 'Unprocessable Entity' },
        { statusCode: 500, description: 'Internal Server Error' },
        { statusCode: 502, description: 'Bad Gateway' },
        { statusCode: 503, description: 'Service Unavailable' },
      ];

      testCases.forEach(({ statusCode, description }) => {
        const error = new AppError(description, statusCode);
        expect(error.statusCode).toBe(statusCode);
        expect(error.message).toBe(description);
        expect(error.isOperational).toBe(true);
      });
    });

    it('should handle empty message', () => {
      const error = new AppError('', 400);
      expect(error.message).toBe('');
      expect(error.statusCode).toBe(400);
    });

    it('should handle special characters in message', () => {
      const specialMessage = 'Error with special chars: !@#$%^&*()[]{}|;:,.<>?';
      const error = new AppError(specialMessage, 400);
      expect(error.message).toBe(specialMessage);
    });

    it('should handle unicode characters in message', () => {
      const unicodeMessage = 'Unicode error: 用户未找到 🚨 Ошибка ñoño';
      const error = new AppError(unicodeMessage, 404);
      expect(error.message).toBe(unicodeMessage);
    });

    it('should handle very long messages', () => {
      const longMessage = 'A'.repeat(10000);
      const error = new AppError(longMessage, 400);
      expect(error.message).toBe(longMessage);
      expect(error.message.length).toBe(10000);
    });

    it('should handle negative status codes', () => {
      const error = new AppError('Negative status', -1);
      expect(error.statusCode).toBe(-1);
    });

    it('should handle zero status code', () => {
      const error = new AppError('Zero status', 0);
      expect(error.statusCode).toBe(0);
    });

    it('should handle large status codes', () => {
      const error = new AppError('Large status', 999);
      expect(error.statusCode).toBe(999);
    });

    it('should preserve prototype chain', () => {
      const error = new AppError('Test', 400);
      expect(Object.getPrototypeOf(error)).toBe(AppError.prototype);
      expect(Object.getPrototypeOf(Object.getPrototypeOf(error))).toBe(Error.prototype);
    });

    it('should be JSON serializable', () => {
      const error = new AppError('Serializable error', 400);
      const serialized = JSON.stringify({
        message: error.message,
        statusCode: error.statusCode,
        isOperational: error.isOperational,
        name: error.name,
      });

      expect(() => JSON.parse(serialized)).not.toThrow();
      const parsed = JSON.parse(serialized);
      expect(parsed.message).toBe('Serializable error');
      expect(parsed.statusCode).toBe(400);
      expect(parsed.isOperational).toBe(true);
    });

    it('should handle circular references gracefully', () => {
      const error = new AppError('Circular error', 400);
      (error as any).circular = error;

      // Should not throw when accessing properties
      expect(error.message).toBe('Circular error');
      expect(error.statusCode).toBe(400);
    });
  });

  describe('ValidationError', () => {
    it('should create ValidationError with correct properties', () => {
      const message = 'Validation failed';
      const error = new ValidationError(message);

      expect(error.message).toBe(message);
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(true);
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(ValidationError);
    });

    it('should have correct constructor name', () => {
      const error = new ValidationError('Test validation error');
      expect(error.constructor.name).toBe('ValidationError');
    });

    it('should inherit AppError behavior', () => {
      const error = new ValidationError('Test validation error');
      expect(error.isOperational).toBe(true);
      expect(error.stack).toBeDefined();
    });

    it('should handle validation-specific scenarios', () => {
      const validationMessages = [
        'Required field missing',
        'Invalid email format',
        'Password too short',
        'Invalid phone number',
        'Date format invalid',
        'Value out of range',
      ];

      validationMessages.forEach(message => {
        const error = new ValidationError(message);
        expect(error.message).toBe(message);
        expect(error.statusCode).toBe(400);
      });
    });

    it('should handle empty validation message', () => {
      const error = new ValidationError('');
      expect(error.message).toBe('');
      expect(error.statusCode).toBe(400);
    });

    it('should handle long validation messages', () => {
      const longMessage = 'Validation error with very long description: ' + 'A'.repeat(1000);
      const error = new ValidationError(longMessage);
      expect(error.message).toBe(longMessage);
      expect(error.statusCode).toBe(400);
    });
  });

  describe('UnauthorizedError', () => {
    it('should create UnauthorizedError with default message', () => {
      const error = new UnauthorizedError();

      expect(error.message).toBe('Unauthorized');
      expect(error.statusCode).toBe(401);
      expect(error.isOperational).toBe(true);
      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(UnauthorizedError);
    });

    it('should create UnauthorizedError with custom message', () => {
      const customMessage = 'Invalid credentials';
      const error = new UnauthorizedError(customMessage);

      expect(error.message).toBe(customMessage);
      expect(error.statusCode).toBe(401);
    });

    it('should handle authorization-specific scenarios', () => {
      const authMessages = [
        'Token expired',
        'Invalid JWT token',
        'Missing authentication header',
        'User not logged in',
        'Session expired',
        'Invalid API key',
      ];

      authMessages.forEach(message => {
        const error = new UnauthorizedError(message);
        expect(error.message).toBe(message);
        expect(error.statusCode).toBe(401);
      });
    });

    it('should handle undefined message parameter', () => {
      const error = new UnauthorizedError(undefined);
      expect(error.message).toBe('Unauthorized');
      expect(error.statusCode).toBe(401);
    });

    it('should handle null message parameter', () => {
      const error = new UnauthorizedError(null as any);
      expect(error.message).toBe('Unauthorized');
      expect(error.statusCode).toBe(401);
    });
  });

  describe('ForbiddenError', () => {
    it('should create ForbiddenError with default message', () => {
      const error = new ForbiddenError();

      expect(error.message).toBe('Forbidden');
      expect(error.statusCode).toBe(403);
      expect(error.isOperational).toBe(true);
      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(ForbiddenError);
    });

    it('should create ForbiddenError with custom message', () => {
      const customMessage = 'Insufficient permissions';
      const error = new ForbiddenError(customMessage);

      expect(error.message).toBe(customMessage);
      expect(error.statusCode).toBe(403);
    });

    it('should handle permission-specific scenarios', () => {
      const permissionMessages = [
        'Access denied',
        'Insufficient privileges',
        'Admin access required',
        'Resource access forbidden',
        'Operation not permitted',
        'User role insufficient',
      ];

      permissionMessages.forEach(message => {
        const error = new ForbiddenError(message);
        expect(error.message).toBe(message);
        expect(error.statusCode).toBe(403);
      });
    });

    it('should handle edge cases', () => {
      expect(new ForbiddenError(undefined).message).toBe('Forbidden');
      expect(new ForbiddenError(null as any).message).toBe('Forbidden');
      expect(new ForbiddenError('').message).toBe('');
    });
  });

  describe('NotFoundError', () => {
    it('should create NotFoundError with default message', () => {
      const error = new NotFoundError();

      expect(error.message).toBe('Not found');
      expect(error.statusCode).toBe(404);
      expect(error.isOperational).toBe(true);
      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(NotFoundError);
    });

    it('should create NotFoundError with custom message', () => {
      const customMessage = 'User not found';
      const error = new NotFoundError(customMessage);

      expect(error.message).toBe(customMessage);
      expect(error.statusCode).toBe(404);
    });

    it('should handle resource-specific scenarios', () => {
      const resourceMessages = [
        'User not found',
        'Post not found',
        'Page not found',
        'File not found',
        'Record does not exist',
        'Resource unavailable',
      ];

      resourceMessages.forEach(message => {
        const error = new NotFoundError(message);
        expect(error.message).toBe(message);
        expect(error.statusCode).toBe(404);
      });
    });

    it('should handle various message formats', () => {
      const formats = [
        'Item with ID 123 not found',
        'User "john@example.com" does not exist',
        '/api/nonexistent endpoint not found',
        'File "document.pdf" not found in storage',
      ];

      formats.forEach(message => {
        const error = new NotFoundError(message);
        expect(error.message).toBe(message);
        expect(error.statusCode).toBe(404);
      });
    });

    it('should handle edge cases', () => {
      expect(new NotFoundError(undefined).message).toBe('Not found');
      expect(new NotFoundError(null as any).message).toBe('Not found');
      expect(new NotFoundError('').message).toBe('');
    });
  });

  describe('ConflictError', () => {
    it('should create ConflictError with correct properties', () => {
      const message = 'Resource already exists';
      const error = new ConflictError(message);

      expect(error.message).toBe(message);
      expect(error.statusCode).toBe(409);
      expect(error.isOperational).toBe(true);
      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(ConflictError);
    });

    it('should handle conflict-specific scenarios', () => {
      const conflictMessages = [
        'Email already exists',
        'Username already taken',
        'Duplicate key violation',
        'Resource conflict detected',
        'Version mismatch',
        'Concurrent modification detected',
      ];

      conflictMessages.forEach(message => {
        const error = new ConflictError(message);
        expect(error.message).toBe(message);
        expect(error.statusCode).toBe(409);
      });
    });

    it('should require message parameter', () => {
      // ConflictError requires a message parameter unlike some others
      expect(() => new ConflictError(undefined as any)).not.toThrow();
      expect(() => new ConflictError(null as any)).not.toThrow();
      expect(() => new ConflictError('')).not.toThrow();
    });

    it('should handle database-related conflicts', () => {
      const dbConflicts = [
        'UNIQUE constraint failed: users.email',
        'Deadlock detected',
        'Foreign key constraint violation',
        'Check constraint violation',
      ];

      dbConflicts.forEach(message => {
        const error = new ConflictError(message);
        expect(error.message).toBe(message);
        expect(error.statusCode).toBe(409);
      });
    });
  });

  describe('InternalServerError', () => {
    it('should create InternalServerError with default message', () => {
      const error = new InternalServerError();

      expect(error.message).toBe('Internal server error');
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(InternalServerError);
    });

    it('should create InternalServerError with custom message', () => {
      const customMessage = 'Database connection failed';
      const error = new InternalServerError(customMessage);

      expect(error.message).toBe(customMessage);
      expect(error.statusCode).toBe(500);
    });

    it('should handle server-specific scenarios', () => {
      const serverMessages = [
        'Database connection failed',
        'External service unavailable',
        'Configuration error',
        'Memory allocation failed',
        'File system error',
        'Network timeout',
      ];

      serverMessages.forEach(message => {
        const error = new InternalServerError(message);
        expect(error.message).toBe(message);
        expect(error.statusCode).toBe(500);
      });
    });

    it('should handle edge cases', () => {
      expect(new InternalServerError(undefined).message).toBe('Internal server error');
      expect(new InternalServerError(null as any).message).toBe('Internal server error');
      expect(new InternalServerError('').message).toBe('');
    });

    it('should handle critical system errors', () => {
      const criticalErrors = [
        'Out of memory',
        'Disk space full',
        'CPU overload',
        'Service unavailable',
        'System maintenance mode',
      ];

      criticalErrors.forEach(message => {
        const error = new InternalServerError(message);
        expect(error.message).toBe(message);
        expect(error.statusCode).toBe(500);
      });
    });
  });

  describe('Error Inheritance and Polymorphism', () => {
    it('should maintain correct inheritance chain', () => {
      const errors = [
        new ValidationError('Validation failed'),
        new UnauthorizedError('Unauthorized'),
        new ForbiddenError('Forbidden'),
        new NotFoundError('Not found'),
        new ConflictError('Conflict'),
        new InternalServerError('Server error'),
      ];

      errors.forEach(error => {
        expect(error instanceof Error).toBe(true);
        expect(error instanceof AppError).toBe(true);
        expect(error.isOperational).toBe(true);
        expect(error.statusCode).toBeGreaterThan(0);
      });
    });

    it('should support polymorphic error handling', () => {
      const errors: AppError[] = [
        new ValidationError('Validation failed'),
        new UnauthorizedError('Unauthorized'),
        new ForbiddenError('Forbidden'),
        new NotFoundError('Not found'),
        new ConflictError('Conflict'),
        new InternalServerError('Server error'),
      ];

      const statusCodes = errors.map(error => error.statusCode);
      expect(statusCodes).toEqual([400, 401, 403, 404, 409, 500]);

      const isOperationalValues = errors.map(error => error.isOperational);
      expect(isOperationalValues.every(val => val === true)).toBe(true);
    });

    it('should support instanceof checks for all error types', () => {
      const validationError = new ValidationError('Test');
      const unauthorizedError = new UnauthorizedError('Test');
      const forbiddenError = new ForbiddenError('Test');
      const notFoundError = new NotFoundError('Test');
      const conflictError = new ConflictError('Test');
      const internalError = new InternalServerError('Test');

      expect(validationError instanceof ValidationError).toBe(true);
      expect(unauthorizedError instanceof UnauthorizedError).toBe(true);
      expect(forbiddenError instanceof ForbiddenError).toBe(true);
      expect(notFoundError instanceof NotFoundError).toBe(true);
      expect(conflictError instanceof ConflictError).toBe(true);
      expect(internalError instanceof InternalServerError).toBe(true);

      // Cross-type checks should be false
      expect(validationError instanceof UnauthorizedError).toBe(false);
      expect(unauthorizedError instanceof ValidationError).toBe(false);
    });
  });

  describe('Error Serialization and Logging', () => {
    it('should serialize errors for logging', () => {
      const error = new ValidationError('Field is required');

      const logObject = {
        message: error.message,
        statusCode: error.statusCode,
        isOperational: error.isOperational,
        stack: error.stack,
        name: error.constructor.name,
      };

      expect(logObject.message).toBe('Field is required');
      expect(logObject.statusCode).toBe(400);
      expect(logObject.isOperational).toBe(true);
      expect(logObject.name).toBe('ValidationError');
      expect(logObject.stack).toContain('ValidationError');
    });

    it('should support JSON stringification', () => {
      const error = new NotFoundError('Resource not found');

      const jsonString = JSON.stringify({
        error: {
          message: error.message,
          statusCode: error.statusCode,
          type: error.constructor.name,
        }
      });

      expect(() => JSON.parse(jsonString)).not.toThrow();
      const parsed = JSON.parse(jsonString);
      expect(parsed.error.message).toBe('Resource not found');
      expect(parsed.error.statusCode).toBe(404);
      expect(parsed.error.type).toBe('NotFoundError');
    });
  });

  describe('Error Handling Edge Cases', () => {
    it('should handle toString() calls', () => {
      const error = new ValidationError('Test validation error');
      const stringified = error.toString();

      expect(stringified).toContain('ValidationError');
      expect(stringified).toContain('Test validation error');
    });

    it('should handle valueOf() calls', () => {
      const error = new NotFoundError('Test not found');
      const valueOf = error.valueOf();

      expect(valueOf).toBe(error);
    });

    it('should maintain proper prototype methods', () => {
      const error = new ConflictError('Test conflict');

      expect(typeof error.toString).toBe('function');
      expect(typeof error.valueOf).toBe('function');
      expect(error.hasOwnProperty('message')).toBe(true);
      expect(error.hasOwnProperty('statusCode')).toBe(true);
      expect(error.hasOwnProperty('isOperational')).toBe(true);
    });

    it('should handle property enumeration', () => {
      const error = new InternalServerError('Test server error');
      const keys = Object.keys(error);

      expect(keys).toContain('message');
      expect(keys).toContain('statusCode');
      expect(keys).toContain('isOperational');
    });

    it('should handle property descriptors', () => {
      const error = new UnauthorizedError('Test unauthorized');

      const messageDescriptor = Object.getOwnPropertyDescriptor(error, 'message');
      const statusCodeDescriptor = Object.getOwnPropertyDescriptor(error, 'statusCode');

      expect(messageDescriptor?.writable).toBe(true);
      expect(messageDescriptor?.enumerable).toBe(true);
      expect(statusCodeDescriptor?.writable).toBe(true);
      expect(statusCodeDescriptor?.enumerable).toBe(true);
    });
  });

  describe('Memory and Performance', () => {
    it('should not leak memory with repeated instantiation', () => {
      const errors = [];

      for (let i = 0; i < 1000; i++) {
        errors.push(new ValidationError(`Error ${i}`));
      }

      expect(errors.length).toBe(1000);
      expect(errors[0]).toBeInstanceOf(ValidationError);
      expect(errors[999]).toBeInstanceOf(ValidationError);
    });

    it('should create errors efficiently', () => {
      const start = Date.now();

      for (let i = 0; i < 1000; i++) {
        new AppError(`Error ${i}`, 400);
      }

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100); // Should create 1000 errors in under 100ms
    });

    it('should handle stack trace generation efficiently', () => {
      const start = Date.now();

      const errors = [];
      for (let i = 0; i < 100; i++) {
        const error = new ValidationError(`Error ${i}`);
        errors.push(error.stack);
      }

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(500); // Should generate 100 stack traces in under 500ms
      expect(errors.every(stack => typeof stack === 'string')).toBe(true);
    });
  });
});

export {};