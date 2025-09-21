import { Router, Request, Response, NextFunction } from 'express';
import { SocialPlatform } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { body, param } from 'express-validator';
import { OAuthService } from '../services/oauth.service';
import { FacebookOAuthService } from '../services/oauth/facebook.oauth';
import { AppError } from '../utils/errors';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

const router = Router();

// OAuth service instances
const oauthServices: Map<SocialPlatform, OAuthService> = new Map([
  [SocialPlatform.FACEBOOK, new FacebookOAuthService()],
  // Add other platforms as implemented
]);

// Store OAuth states temporarily (in production, use Redis)
const oauthStates: Map<string, { userId: string; platform: SocialPlatform; organizationId?: string }> = new Map();

/**
 * @route   GET /api/social/accounts
 * @desc    Get all connected social accounts for the authenticated user
 * @access  Private
 */
router.get('/accounts', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const organizationId = req.query.organizationId as string | undefined;

    const accounts = await OAuthService.getUserAccounts(userId, organizationId);

    res.json({
      success: true,
      data: accounts,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/social/connect/:platform
 * @desc    Initiate OAuth connection for a social platform
 * @access  Private
 */
router.post(
  '/connect/:platform',
  authenticateToken,
  validateRequest([
    param('platform').isIn(Object.values(SocialPlatform)),
    body('organizationId').optional().isString(),
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const platform = req.params.platform as SocialPlatform;
      const userId = req.user!.id;
      const { organizationId } = req.body;

      const oauthService = oauthServices.get(platform);
      if (!oauthService) {
        throw new AppError(`OAuth service for ${platform} not implemented`, 501);
      }

      // Generate state for CSRF protection
      const state = oauthService.generateState();

      // Store state temporarily
      oauthStates.set(state, {
        userId,
        platform,
        organizationId,
      });

      // Clean up old states after 10 minutes
      setTimeout(() => {
        oauthStates.delete(state);
      }, 10 * 60 * 1000);

      // Get authorization URL
      const authUrl = oauthService.getAuthorizationUrl(state);

      res.json({
        success: true,
        authUrl,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/social/callback/:platform
 * @desc    OAuth callback handler for social platforms
 * @access  Public (but validates state)
 */
router.get(
  '/callback/:platform',
  validateRequest([
    param('platform').isIn(Object.values(SocialPlatform)),
  ]),
  async (req: Request, res: Response) => {
    try {
      const platform = req.params.platform as SocialPlatform;
      const { code, state, error } = req.query;

      // Handle OAuth errors
      if (error) {
        return res.redirect(`${process.env.FRONTEND_URL}/dashboard/accounts?error=${error}`);
      }

      if (!code || !state) {
        return res.redirect(`${process.env.FRONTEND_URL}/dashboard/accounts?error=invalid_request`);
      }

      // Validate state
      const stateData = oauthStates.get(state as string);
      if (!stateData || stateData.platform !== platform) {
        return res.redirect(`${process.env.FRONTEND_URL}/dashboard/accounts?error=invalid_state`);
      }

      // Clean up state
      oauthStates.delete(state as string);

      // Get OAuth service
      const oauthService = oauthServices.get(platform);
      if (!oauthService) {
        throw new AppError(`OAuth service for ${platform} not implemented`, 501);
      }

      // Connect the account
      await oauthService.connectAccount(
        stateData.userId,
        code as string,
        stateData.organizationId
      );

      // Redirect to success page
      res.redirect(`${process.env.FRONTEND_URL}/dashboard/accounts?success=connected&platform=${platform}`);
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/dashboard/accounts?error=connection_failed`);
    }
  }
);

/**
 * @route   DELETE /api/social/disconnect/:accountId
 * @desc    Disconnect a social account
 * @access  Private
 */
router.delete(
  '/disconnect/:accountId',
  authenticateToken,
  validateRequest([
    param('accountId').isString(),
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { accountId } = req.params;
      const userId = req.user!.id;

      // Get the account to determine platform
      const accounts = await OAuthService.getUserAccounts(userId);
      const account = accounts.find(a => a.id === accountId);

      if (!account) {
        throw new AppError('Account not found', 404);
      }

      // Get OAuth service for the platform
      const oauthService = oauthServices.get(account.platform);
      if (!oauthService) {
        throw new AppError(`OAuth service for ${account.platform} not implemented`, 501);
      }

      // Disconnect the account
      await oauthService.disconnectAccount(userId, accountId);

      res.json({
        success: true,
        message: `Successfully disconnected from ${account.platform}`,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   POST /api/social/refresh/:accountId
 * @desc    Refresh tokens for a social account
 * @access  Private
 */
router.post(
  '/refresh/:accountId',
  authenticateToken,
  validateRequest([
    param('accountId').isString(),
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { accountId } = req.params;
      const userId = req.user!.id;

      // Get the account to determine platform
      const accounts = await OAuthService.getUserAccounts(userId);
      const account = accounts.find(a => a.id === accountId);

      if (!account) {
        throw new AppError('Account not found', 404);
      }

      // Get OAuth service for the platform
      const oauthService = oauthServices.get(account.platform);
      if (!oauthService) {
        throw new AppError(`OAuth service for ${account.platform} not implemented`, 501);
      }

      // Refresh tokens
      await oauthService.refreshTokensIfNeeded(accountId);

      res.json({
        success: true,
        message: 'Tokens refreshed successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/social/accounts/:accountId/insights
 * @desc    Get insights/analytics for a social account
 * @access  Private
 */
router.get(
  '/accounts/:accountId/insights',
  authenticateToken,
  validateRequest([
    param('accountId').isString(),
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { accountId } = req.params;
      // const { since, until } = req.query; // Unused for now
      const userId = req.user!.id;

      // Get the account
      const accounts = await OAuthService.getUserAccounts(userId);
      const account = accounts.find(a => a.id === accountId);

      if (!account) {
        throw new AppError('Account not found', 404);
      }

      // For now, return mock data
      // In production, fetch real insights from platform APIs
      const insights = {
        impressions: 1234,
        reach: 890,
        engagement: 56,
        clicks: 45,
        followersGained: 12,
        followersLost: 2,
      };

      res.json({
        success: true,
        data: insights,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;