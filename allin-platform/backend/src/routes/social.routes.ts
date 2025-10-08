import { Router, Request, Response } from 'express';
import { SocialPlatform } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { body, param } from 'express-validator';
import { OAuthService } from '../services/oauth.service';
import { FacebookOAuthService } from '../services/oauth/facebook.oauth';
import { LinkedInOAuthService } from '../services/oauth/linkedin.oauth';
import { TikTokOAuthService } from '../services/oauth/tiktok.oauth';
import { TwitterOAuthService } from '../services/oauth/twitter.oauth';
import { AppError } from '../utils/errors';
import { getOAuthStateService } from '../services/oauth-state.service';
import { logger } from '../utils/logger';

const router = Router();

// OAuth service instances
const oauthServices: Map<SocialPlatform, OAuthService> = new Map<SocialPlatform, OAuthService>([
  [SocialPlatform.FACEBOOK, new FacebookOAuthService() as OAuthService],
  [SocialPlatform.LINKEDIN, new LinkedInOAuthService() as OAuthService],
  [SocialPlatform.TIKTOK, new TikTokOAuthService() as OAuthService],
  [SocialPlatform.TWITTER, new TwitterOAuthService() as OAuthService],
  // Add other platforms as implemented
]);

// OAuth state service for CSRF protection
const oauthStateService = getOAuthStateService();

/**
 * @route   GET /api/social/accounts
 * @desc    Get all connected social accounts for the authenticated user
 * @access  Private
 */
router.get('/accounts', authenticateToken, async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const userId = req.user!.id;
    const organizationId = req.query.organizationId as string | undefined;

    const accounts = await OAuthService.getUserAccounts(userId, organizationId);

    return res.json({
      success: true,
      data: accounts,
    });
  } catch (error) {
    console.error('Error fetching social accounts:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch social accounts',
    });
  }
});

/**
 * @route   POST /api/social/connect/:platform
 * @desc    Initiate OAuth connection for a social platform
 * @access  Private
 * @security CSRF protection via state parameter stored in Redis
 */
router.post(
  '/connect/:platform',
  authenticateToken,
  validateRequest([
    param('platform').isIn(Object.values(SocialPlatform)),
    body('organizationId').optional().isString(),
  ]),
  async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
      const platform = req.params.platform as SocialPlatform;
      const userId = req.user!.id;
      const { organizationId } = req.body;

      const oauthService = oauthServices.get(platform);
      if (!oauthService) {
        logger.error('OAuth service not found', { platform });
        throw new AppError(`OAuth service for ${platform} not implemented`, 501);
      }

      // Generate and store state in Redis for CSRF protection (5 min TTL)
      let state: string;
      let authUrl: string;

      // Special handling for Twitter OAuth with PKCE
      if (platform === SocialPlatform.TWITTER) {
        const twitterService = oauthService as TwitterOAuthService;
        const { state: twitterState, codeChallenge } = await twitterService.generateStateWithPKCE(userId, organizationId);
        state = twitterState;
        authUrl = twitterService.getAuthorizationUrl(state, codeChallenge);
      } else {
        // Standard OAuth flow for other platforms
        state = await oauthService.generateStateWithStorage(userId, organizationId);
        authUrl = oauthService.getAuthorizationUrl(state);
      }

      logger.info('OAuth authorization initiated', {
        platform,
        userId,
        state: state.substring(0, 8) + '...'
      });

      return res.json({
        success: true,
        authUrl,
      });
    } catch (error) {
      logger.error('Error initiating OAuth connection', { error, platform: req.params.platform });

      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Failed to connect social account',
      });
    }
  }
);

/**
 * @route   GET /api/social/callback/:platform
 * @desc    OAuth callback handler for social platforms
 * @access  Public (validates state for CSRF protection)
 * @security Validates state parameter from Redis, prevents CSRF attacks
 */
router.get(
  '/callback/:platform',
  validateRequest([
    param('platform').isIn(Object.values(SocialPlatform)),
  ]),
  async (req: Request, res: Response): Promise<void> => {
    const platform = req.params.platform as SocialPlatform;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';

    try {
      const { code, state, error, error_description } = req.query;

      // Handle OAuth provider errors
      if (error) {
        logger.warn('OAuth provider error', {
          platform,
          error,
          error_description
        });
        return res.redirect(`${frontendUrl}/dashboard/accounts?error=${error}&description=${error_description || ''}`);
      }

      // Validate required parameters
      if (!code || !state) {
        logger.warn('Missing OAuth callback parameters', {
          platform,
          hasCode: !!code,
          hasState: !!state
        });
        return res.redirect(`${frontendUrl}/dashboard/accounts?error=invalid_request&message=missing_parameters`);
      }

      // Get OAuth service
      const oauthService = oauthServices.get(platform);
      if (!oauthService) {
        logger.error('OAuth service not found in callback', { platform });
        return res.redirect(`${frontendUrl}/dashboard/accounts?error=service_unavailable`);
      }

      // Validate state and retrieve stored data (CSRF protection)
      // This will throw AppError if state is invalid, expired, or platform mismatch
      let stateData;
      try {
        stateData = await oauthService.validateState(state as string);
      } catch (stateError) {
        logger.error('OAuth state validation failed - possible CSRF attack', {
          platform,
          state: (state as string).substring(0, 8) + '...',
          error: stateError instanceof Error ? stateError.message : 'Unknown error'
        });

        // Specific error messages for different validation failures
        if (stateError instanceof AppError) {
          if (stateError.message.includes('platform mismatch')) {
            return res.redirect(`${frontendUrl}/dashboard/accounts?error=csrf_detected&message=platform_mismatch`);
          } else if (stateError.message.includes('expired')) {
            return res.redirect(`${frontendUrl}/dashboard/accounts?error=session_expired&message=state_expired`);
          }
        }

        return res.redirect(`${frontendUrl}/dashboard/accounts?error=invalid_state&message=csrf_protection`);
      }

      // State validated successfully - proceed with OAuth flow
      logger.info('OAuth state validated successfully', {
        platform,
        userId: stateData.userId,
        state: (state as string).substring(0, 8) + '...'
      });

      // Connect the account
      // Special handling for Twitter OAuth with PKCE
      if (platform === SocialPlatform.TWITTER) {
        const twitterService = oauthService as TwitterOAuthService;

        if (!stateData.codeVerifier) {
          logger.error('Twitter OAuth missing code verifier in state');
          return res.redirect(`${frontendUrl}/dashboard/accounts?error=invalid_state&message=missing_pkce`);
        }

        await twitterService.connectAccountWithPKCE(
          stateData.userId,
          code as string,
          stateData.organizationId,
          stateData.codeVerifier
        );
      } else {
        // Standard OAuth flow for other platforms
        await oauthService.connectAccount(
          stateData.userId,
          code as string,
          stateData.organizationId
        );
      }

      logger.info('OAuth account connected successfully', {
        platform,
        userId: stateData.userId
      });

      // Redirect to success page
      res.redirect(`${frontendUrl}/dashboard/accounts?success=connected&platform=${platform}`);
    } catch (error) {
      logger.error('OAuth callback error', {
        platform,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });

      // Provide specific error messages for debugging
      if (error instanceof AppError) {
        return res.redirect(`${frontendUrl}/dashboard/accounts?error=connection_failed&message=${encodeURIComponent(error.message)}`);
      }

      res.redirect(`${frontendUrl}/dashboard/accounts?error=connection_failed&message=unexpected_error`);
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
  async (req: AuthRequest, res: Response): Promise<Response> => {
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

      return res.json({
        success: true,
        message: `Successfully disconnected from ${account.platform}`,
      });
    } catch (error) {
      console.error('Error connecting social account:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to connect social account',
      });
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
  async (req: AuthRequest, res: Response): Promise<Response> => {
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

      return res.json({
        success: true,
        message: 'Tokens refreshed successfully',
      });
    } catch (error) {
      console.error('Error connecting social account:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to connect social account',
      });
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
  async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
      const { accountId } = req.params;
      const userId = req.user!.id;
      // Future: Add query params for date range filtering
      // const { since, until } = req.query;

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

      return res.json({
        success: true,
        data: insights,
      });
    } catch (error) {
      console.error('Error connecting social account:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to connect social account',
      });
    }
  }
);

export default router;