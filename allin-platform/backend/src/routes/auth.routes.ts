import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { authService } from '../services/auth.service';
import { authenticate, AuthRequest } from '../middleware/auth';
import { strictRateLimiter } from '../middleware/rateLimiter';
import { AppError } from '../utils/errors';
import { ResponseHandler } from '../utils/response';

const router = Router();

// Validation middleware
const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }
  next();
};

// Register
router.post(
  '/register',
  strictRateLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    body('name').optional().trim().isLength({ min: 2, max: 50 }),
  ],
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.register(req.body);
      ResponseHandler.created(res, result, 'Registration successful. Please check your email to verify your account.');
    } catch (error) {
      next(error);
    }
  }
);

// Login
router.post(
  '/login',
  strictRateLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
    body('rememberMe').optional().isBoolean(),
  ],
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.login(req.body);
      
      // Set cookies
      res.cookie('sessionToken', result.sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: req.body.rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000,
      });

      ResponseHandler.success(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  }
);

// Verify email
router.post(
  '/verify-email',
  [
    body('token').notEmpty().isLength({ min: 32, max: 128 }),
  ],
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.verifyEmail(req.body.token);
      ResponseHandler.success(res, result);
    } catch (error) {
      next(error);
    }
  }
);

// Refresh token
router.post(
  '/refresh',
  [
    body('refreshToken').notEmpty(),
  ],
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.refreshTokens(req.body.refreshToken);
      ResponseHandler.success(res, result, 'Tokens refreshed successfully');
    } catch (error) {
      next(error);
    }
  }
);

// Forgot password
router.post(
  '/forgot-password',
  strictRateLimiter,
  [
    body('email').isEmail().normalizeEmail(),
  ],
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.forgotPassword(req.body.email);
      ResponseHandler.success(res, result);
    } catch (error) {
      next(error);
    }
  }
);

// Reset password
router.post(
  '/reset-password',
  [
    body('token').notEmpty().isLength({ min: 32, max: 128 }),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.resetPassword(req.body.token, req.body.password);
      ResponseHandler.success(res, result);
    } catch (error) {
      next(error);
    }
  }
);

// Logout
router.post(
  '/logout',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const sessionToken = req.cookies?.sessionToken;
      if (sessionToken) {
        await authService.logout(sessionToken);
      }
      
      // Clear cookies
      res.clearCookie('sessionToken');
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');

      ResponseHandler.success(res, null, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }
);

// Get current session
router.get(
  '/session',
  async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const sessionToken = req.cookies?.sessionToken;
      if (!sessionToken) {
        return ResponseHandler.success(res, { user: null });
      }

      const user = await authService.validateSession(sessionToken);
      return ResponseHandler.success(res, { user });
    } catch (error) {
      return ResponseHandler.success(res, { user: null });
    }
  }
);

// Log endpoint (for debugging/analytics)
router.post(
  '/_log',
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      // This is a no-op endpoint for client-side logging
      ResponseHandler.success(res, { logged: true });
    } catch (error) {
      next(error);
    }
  }
);

// Get current user
router.get(
  '/me',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('User not found', 404);
      }
      const user = await authService.getMe(req.user.id);
      ResponseHandler.success(res, user);
    } catch (error) {
      next(error);
    }
  }
);

export default router;