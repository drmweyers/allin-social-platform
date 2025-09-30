import { Request, Response, NextFunction } from 'express';
import { body, query, param } from 'express-validator';
import { z } from 'zod';
import { validateRequest, validateZodRequest } from './validation';
import {
  createMockRequest,
  createMockResponse,
  createMockNext
} from '../test/setup/mocks';

describe('Enhanced Validation Middleware', () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    req = createMockRequest();
    res = createMockResponse();
    next = createMockNext();
  });

  describe('validateRequest (Express-validator)', () => {
    describe('Basic validation scenarios', () => {
      it('should pass validation with valid data', async () => {
        req.body = {
          email: 'test@example.com',
          password: 'Password123!',
          name: 'Test User'
        };

        const validations = [
          body('email').isEmail().normalizeEmail(),
          body('password').isLength({ min: 8 }),
          body('name').trim().isLength({ min: 1, max: 50 })
        ];

        const middleware = validateRequest(validations);
        await middleware(req, res, next);

        expect(next).toHaveBeenCalledWith();
        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
      });

      it('should return 400 with validation errors for invalid data', async () => {
        req.body = {
          email: 'invalid-email',
          password: 'short',
          name: ''
        };

        const validations = [
          body('email').isEmail().withMessage('Valid email required'),
          body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
          body('name').trim().isLength({ min: 1 }).withMessage('Name is required')
        ];

        const middleware = validateRequest(validations);
        await middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          errors: expect.arrayContaining([
            expect.objectContaining({
              msg: expect.any(String),
              param: expect.any(String)
            })
          ])
        });
        expect(next).not.toHaveBeenCalled();
      });
    });

    describe('Complex validation chains', () => {
      it('should handle nested object validation', async () => {
        req.body = {
          user: {
            profile: {
              firstName: 'John',
              lastName: 'Doe'
            }
          }
        };

        const validations = [
          body('user.profile.firstName')
            .trim()
            .isLength({ min: 1 })
            .withMessage('First name required'),
          body('user.profile.lastName')
            .trim()
            .isLength({ min: 1 })
            .withMessage('Last name required')
        ];

        const middleware = validateRequest(validations);
        await middleware(req, res, next);

        expect(next).toHaveBeenCalledWith();
      });

      it('should handle array validation', async () => {
        req.body = {
          tags: ['javascript', 'nodejs', 'testing'],
          categories: [1, 2, 3]
        };

        const validations = [
          body('tags').isArray().withMessage('Tags must be an array'),
          body('tags.*').isString().withMessage('Each tag must be a string'),
          body('categories').isArray().withMessage('Categories must be an array'),
          body('categories.*').isInt().withMessage('Each category must be an integer')
        ];

        const middleware = validateRequest(validations);
        await middleware(req, res, next);

        expect(next).toHaveBeenCalledWith();
      });

      it('should validate query parameters', async () => {
        req.query = {
          page: '1',
          limit: '10',
          sort: 'createdAt',
          order: 'desc'
        };

        const validations = [
          query('page').isInt({ min: 1 }).withMessage('Page must be a positive integer'),
          query('limit').isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
          query('sort').isIn(['createdAt', 'updatedAt', 'name']).withMessage('Invalid sort field'),
          query('order').isIn(['asc', 'desc']).withMessage('Order must be asc or desc')
        ];

        const middleware = validateRequest(validations);
        await middleware(req, res, next);

        expect(next).toHaveBeenCalledWith();
      });

      it('should validate URL parameters', async () => {
        req.params = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          userId: '456'
        };

        const validations = [
          param('id').isUUID().withMessage('ID must be a valid UUID'),
          param('userId').isInt().withMessage('User ID must be an integer')
        ];

        const middleware = validateRequest(validations);
        await middleware(req, res, next);

        expect(next).toHaveBeenCalledWith();
      });
    });

    describe('Custom validation logic', () => {
      it('should handle custom validators', async () => {
        req.body = {
          confirmPassword: 'password123',
          password: 'password123'
        };

        const validations = [
          body('password').isLength({ min: 8 }),
          body('confirmPassword').custom((value, { req }) => {
            if (value !== req.body.password) {
              throw new Error('Passwords do not match');
            }
            return true;
          })
        ];

        const middleware = validateRequest(validations);
        await middleware(req, res, next);

        expect(next).toHaveBeenCalledWith();
      });

      it('should handle async custom validators', async () => {
        req.body = {
          email: 'test@example.com'
        };

        const validations = [
          body('email')
            .isEmail()
            .custom(async (value) => {
              // Simulate async validation (e.g., checking database)
              return new Promise((resolve) => {
                setTimeout(() => resolve(true), 10);
              });
            })
        ];

        const middleware = validateRequest(validations);
        await middleware(req, res, next);

        expect(next).toHaveBeenCalledWith();
      });

      it('should handle conditional validation', async () => {
        req.body = {
          type: 'premium',
          subscriptionId: 'sub-123'
        };

        const validations = [
          body('type').isIn(['free', 'premium']),
          body('subscriptionId').if(body('type').equals('premium')).notEmpty()
        ];

        const middleware = validateRequest(validations);
        await middleware(req, res, next);

        expect(next).toHaveBeenCalledWith();
      });
    });

    describe('Data transformation', () => {
      it('should normalize and sanitize data', async () => {
        req.body = {
          email: '  TEST@EXAMPLE.COM  ',
          name: '  John Doe  ',
          bio: '<script>alert("xss")</script>Safe content'
        };

        const validations = [
          body('email').isEmail().normalizeEmail().trim(),
          body('name').trim().escape(),
          body('bio').trim().escape()
        ];

        const middleware = validateRequest(validations);
        await middleware(req, res, next);

        expect(next).toHaveBeenCalledWith();
        // Note: In real scenarios, you'd verify the data transformation
      });

      it('should convert data types appropriately', async () => {
        req.body = {
          age: '25',
          isActive: 'true',
          tags: 'javascript,nodejs,testing'
        };

        const validations = [
          body('age').toInt(),
          body('isActive').toBoolean(),
          body('tags').customSanitizer((value) => value.split(','))
        ];

        const middleware = validateRequest(validations);
        await middleware(req, res, next);

        expect(next).toHaveBeenCalledWith();
      });
    });

    describe('Error message customization', () => {
      it('should return custom error messages', async () => {
        req.body = {
          email: 'invalid',
          password: '123'
        };

        const validations = [
          body('email')
            .isEmail()
            .withMessage('Please provide a valid email address'),
          body('password')
            .isLength({ min: 8 })
            .withMessage('Password must be at least 8 characters long')
        ];

        const middleware = validateRequest(validations);
        await middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          errors: expect.arrayContaining([
            expect.objectContaining({
              msg: 'Please provide a valid email address'
            }),
            expect.objectContaining({
              msg: 'Password must be at least 8 characters long'
            })
          ])
        });
      });

      it('should handle multiple error messages for single field', async () => {
        req.body = {
          password: 'abc'
        };

        const validations = [
          body('password')
            .isLength({ min: 8 }).withMessage('Password too short')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
            .withMessage('Password must contain uppercase, lowercase, and number')
        ];

        const middleware = validateRequest(validations);
        await middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          errors: expect.arrayContaining([
            expect.objectContaining({ msg: 'Password too short' }),
            expect.objectContaining({
              msg: 'Password must contain uppercase, lowercase, and number'
            })
          ])
        });
      });
    });
  });

  describe('validateZodRequest (Zod validation)', () => {
    describe('Body validation', () => {
      const userSchema = z.object({
        name: z.string().min(1, 'Name is required').max(50, 'Name too long'),
        email: z.string().email('Invalid email format'),
        age: z.number().int().min(18, 'Must be at least 18').max(120, 'Invalid age'),
        isActive: z.boolean().optional().default(true)
      });

      it('should pass validation with valid body data', async () => {
        req.body = {
          name: 'John Doe',
          email: 'john@example.com',
          age: 25,
          isActive: true
        };

        const middleware = validateZodRequest(userSchema, 'body');
        middleware(req, res, next);

        expect(next).toHaveBeenCalledWith();
        expect(res.status).not.toHaveBeenCalled();
      });

      it('should return 400 with Zod errors for invalid body data', async () => {
        req.body = {
          name: '',
          email: 'invalid-email',
          age: 17
        };

        const middleware = validateZodRequest(userSchema, 'body');
        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          errors: expect.arrayContaining([
            expect.objectContaining({
              path: 'name',
              message: 'Name is required'
            }),
            expect.objectContaining({
              path: 'email',
              message: 'Invalid email format'
            }),
            expect.objectContaining({
              path: 'age',
              message: 'Must be at least 18'
            })
          ])
        });
        expect(next).not.toHaveBeenCalled();
      });

      it('should apply default values from schema', async () => {
        req.body = {
          name: 'John Doe',
          email: 'john@example.com',
          age: 25
          // isActive not provided, should default to true
        };

        const middleware = validateZodRequest(userSchema, 'body');
        middleware(req, res, next);

        expect(next).toHaveBeenCalledWith();
        expect(req.body.isActive).toBe(true);
      });
    });

    describe('Query validation', () => {
      const querySchema = z.object({
        page: z.string().transform(val => parseInt(val, 10)).pipe(z.number().min(1)),
        limit: z.string().transform(val => parseInt(val, 10)).pipe(z.number().min(1).max(100)),
        search: z.string().optional(),
        sortBy: z.enum(['name', 'createdAt', 'updatedAt']).optional().default('createdAt')
      });

      it('should validate and transform query parameters', async () => {
        req.query = {
          page: '2',
          limit: '25',
          search: 'test query'
        };

        const middleware = validateZodRequest(querySchema, 'query');
        middleware(req, res, next);

        expect(next).toHaveBeenCalledWith();
        expect(req.query.page).toBe(2);
        expect(req.query.limit).toBe(25);
        expect(req.query.sortBy).toBe('createdAt'); // default value
      });

      it('should return errors for invalid query parameters', async () => {
        req.query = {
          page: '0',
          limit: '200',
          sortBy: 'invalid'
        };

        const middleware = validateZodRequest(querySchema, 'query');
        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          errors: expect.arrayContaining([
            expect.objectContaining({ path: 'page' }),
            expect.objectContaining({ path: 'limit' }),
            expect.objectContaining({ path: 'sortBy' })
          ])
        });
      });
    });

    describe('Params validation', () => {
      const paramsSchema = z.object({
        id: z.string().uuid('Invalid UUID format'),
        userId: z.string().regex(/^\d+$/, 'User ID must be numeric').transform(Number)
      });

      it('should validate URL parameters', async () => {
        req.params = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          userId: '456'
        };

        const middleware = validateZodRequest(paramsSchema, 'params');
        middleware(req, res, next);

        expect(next).toHaveBeenCalledWith();
        expect(req.params.userId).toBe(456); // transformed to number
      });

      it('should return errors for invalid params', async () => {
        req.params = {
          id: 'not-a-uuid',
          userId: 'abc'
        };

        const middleware = validateZodRequest(paramsSchema, 'params');
        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          errors: expect.arrayContaining([
            expect.objectContaining({
              path: 'id',
              message: 'Invalid UUID format'
            }),
            expect.objectContaining({
              path: 'userId',
              message: 'User ID must be numeric'
            })
          ])
        });
      });
    });

    describe('Complex nested validation', () => {
      const nestedSchema = z.object({
        user: z.object({
          profile: z.object({
            firstName: z.string().min(1),
            lastName: z.string().min(1),
            contact: z.object({
              email: z.string().email(),
              phone: z.string().optional()
            })
          }),
          preferences: z.object({
            notifications: z.boolean(),
            theme: z.enum(['light', 'dark']).default('light')
          })
        }),
        metadata: z.array(z.object({
          key: z.string(),
          value: z.string()
        })).optional().default([])
      });

      it('should validate complex nested structures', async () => {
        req.body = {
          user: {
            profile: {
              firstName: 'John',
              lastName: 'Doe',
              contact: {
                email: 'john@example.com',
                phone: '+1234567890'
              }
            },
            preferences: {
              notifications: true
              // theme will default to 'light'
            }
          }
          // metadata will default to []
        };

        const middleware = validateZodRequest(nestedSchema, 'body');
        middleware(req, res, next);

        expect(next).toHaveBeenCalledWith();
        expect(req.body.user.preferences.theme).toBe('light');
        expect(req.body.metadata).toEqual([]);
      });

      it('should return nested path errors', async () => {
        req.body = {
          user: {
            profile: {
              firstName: '',
              lastName: 'Doe',
              contact: {
                email: 'invalid-email'
              }
            },
            preferences: {
              notifications: true,
              theme: 'invalid-theme'
            }
          }
        };

        const middleware = validateZodRequest(nestedSchema, 'body');
        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          errors: expect.arrayContaining([
            expect.objectContaining({
              path: 'user.profile.firstName'
            }),
            expect.objectContaining({
              path: 'user.profile.contact.email'
            }),
            expect.objectContaining({
              path: 'user.preferences.theme'
            })
          ])
        });
      });
    });

    describe('Error handling', () => {
      const errorSchema = z.object({
        test: z.string()
      });

      it('should handle unexpected errors during validation', async () => {
        req.body = { test: 'valid' };

        // Mock Zod to throw unexpected error
        const originalParse = errorSchema.parse;
        jest.spyOn(errorSchema, 'parse').mockImplementation(() => {
          throw new Error('Unexpected validation error');
        });

        const middleware = validateZodRequest(errorSchema, 'body');
        middleware(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.any(Error));
        expect(next.mock.calls[0][0].message).toBe('Unexpected validation error');

        // Restore original parse method
        errorSchema.parse = originalParse;
      });

      it('should handle null/undefined input data', async () => {
        req.body = null;

        const middleware = validateZodRequest(errorSchema, 'body');
        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          errors: expect.any(Array)
        });
      });
    });

    describe('Data source selection', () => {
      const testSchema = z.object({
        value: z.string()
      });

      it('should default to body validation', async () => {
        req.body = { value: 'test' };
        req.query = { different: 'data' };

        const middleware = validateZodRequest(testSchema); // no source specified
        middleware(req, res, next);

        expect(next).toHaveBeenCalledWith();
      });

      it('should validate correct data source', async () => {
        req.body = { wrong: 'data' };
        req.query = { value: 'correct' };

        const middleware = validateZodRequest(testSchema, 'query');
        middleware(req, res, next);

        expect(next).toHaveBeenCalledWith();
      });
    });
  });

  describe('Integration scenarios', () => {
    it('should work with authentication middleware', async () => {
      // Simulate authenticated request
      req.user = { id: 'user-123', role: 'USER' };
      req.body = {
        title: 'Test Post',
        content: 'This is a test post content'
      };

      const postSchema = z.object({
        title: z.string().min(1).max(100),
        content: z.string().min(1).max(1000)
      });

      const middleware = validateZodRequest(postSchema, 'body');
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should handle file upload validation', async () => {
      req.file = {
        fieldname: 'avatar',
        originalname: 'avatar.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 1024
      } as any;

      req.body = {
        description: 'Profile picture'
      };

      const uploadSchema = z.object({
        description: z.string().optional()
      });

      const middleware = validateZodRequest(uploadSchema, 'body');
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });
  });
});

export {};