import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { ZodSchema, ZodError } from 'zod';

// Express-validator version
export const validateRequest = (validations: ValidationChain[]) => {
  // @ts-ignore - TS7030: Middleware functions can return early or call next()
  return async (req: Request, res: Response, next: NextFunction) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    next();
  };
};

// Zod validation middleware
export const validateZodRequest = (schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') => {
  // @ts-ignore - TS7030: Middleware functions can return early or call next()
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = source === 'body' ? req.body : source === 'query' ? req.query : req.params;
      const result = schema.parse(data);

      if (source === 'body') {
        req.body = result;
      } else if (source === 'query') {
        req.query = result;
      } else {
        req.params = result;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          errors: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
};