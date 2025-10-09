import { PrismaClient, SocialPlatform, AccountStatus } from '@prisma/client';
import { AppError } from '../utils/errors';
import { getOAuthStateService, OAuthStateData } from './oauth-state.service';
import { encryptOAuthToken, decryptOAuthToken } from '../utils/crypto';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}

export interface PlatformProfile {
  id: string;
  username?: string;
  displayName?: string;
  email?: string;
  profileImage?: string;
  profileUrl?: string;
  followersCount?: number;
  followingCount?: number;
}

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string[];
}

export abstract class OAuthService {
  protected platform: SocialPlatform;
  protected config: OAuthConfig;
  private _oauthStateService?: ReturnType<typeof getOAuthStateService>;

  protected get oauthStateService() {
    if (!this._oauthStateService) {
      this._oauthStateService = getOAuthStateService();
    }
    return this._oauthStateService;
  }

  constructor(platform: SocialPlatform, config: OAuthConfig) {
    this.platform = platform;
    this.config = config;
  }

  /**
   * Generate OAuth authorization URL
   */
  abstract getAuthorizationUrl(state: string): string;

  /**
   * Exchange authorization code for access tokens
   */
  abstract exchangeCodeForTokens(code: string): Promise<OAuthTokens>;

  /**
   * Refresh access token using refresh token
   * Note: Some platforms like Facebook don't use traditional refresh tokens
   */
  abstract refreshAccessToken(refreshToken: string): Promise<OAuthTokens>;

  /**
   * Get user profile from the platform
   */
  abstract getUserProfile(accessToken: string): Promise<PlatformProfile>;

  /**
   * Revoke access token
   */
  abstract revokeAccess(accessToken: string): Promise<void>;

  /**
   * Generate a secure state parameter for OAuth flow
   * @deprecated Use generateStateWithStorage() instead for CSRF protection
   */
  generateState(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Generate and store OAuth state with CSRF protection
   * @param userId - User ID initiating OAuth
   * @param organizationId - Optional organization ID
   * @returns Promise<string> - Generated state parameter
   */
  async generateStateWithStorage(userId: string, organizationId?: string): Promise<string> {
    return await this.oauthStateService.generateAuthorizationState(
      userId,
      this.platform,
      organizationId
    );
  }

  /**
   * Validate OAuth state parameter and retrieve stored data
   * @param state - State parameter from OAuth callback
   * @returns Promise<OAuthStateData> - Stored state data
   * @throws AppError if state is invalid or expired
   */
  async validateState(state: string): Promise<OAuthStateData> {
    return await this.oauthStateService.validateAndRetrieveState(state, this.platform);
  }

  /**
   * Encrypt sensitive data (tokens) before storing
   * Uses centralized crypto utility with proper validation
   */
  protected encryptToken(token: string): string {
    return encryptOAuthToken(token);
  }

  /**
   * Decrypt tokens when retrieving from database
   * Uses centralized crypto utility with proper validation
   */
  protected decryptToken(encryptedToken: string): string {
    return decryptOAuthToken(encryptedToken);
  }

  /**
   * Connect a social account for a user
   */
  async connectAccount(
    userId: string,
    code: string,
    organizationId?: string
  ) {
    try {
      // Exchange code for tokens
      const tokens = await this.exchangeCodeForTokens(code);

      // Get user profile from platform
      const profile = await this.getUserProfile(tokens.accessToken);

      // Check if account already exists
      const existingAccount = await prisma.socialAccount.findUnique({
        where: {
          userId_platform_platformId: {
            userId,
            platform: this.platform,
            platformId: profile.id,
          },
        },
      });

      if (existingAccount) {
        // Update existing account
        return await prisma.socialAccount.update({
          where: { id: existingAccount.id },
          data: {
            accessToken: this.encryptToken(tokens.accessToken),
            refreshToken: tokens.refreshToken ? this.encryptToken(tokens.refreshToken) : null,
            tokenExpiry: tokens.expiresIn
              ? new Date(Date.now() + tokens.expiresIn * 1000)
              : null,
            username: profile.username,
            displayName: profile.displayName,
            profileImage: profile.profileImage,
            profileUrl: profile.profileUrl,
            followersCount: profile.followersCount || 0,
            followingCount: profile.followingCount || 0,
            status: AccountStatus.ACTIVE,
            lastSyncAt: new Date(),
          },
        });
      } else {
        // Create new account
        return await prisma.socialAccount.create({
          data: {
            userId,
            organizationId,
            platform: this.platform,
            platformId: profile.id,
            username: profile.username,
            displayName: profile.displayName,
            profileImage: profile.profileImage,
            profileUrl: profile.profileUrl,
            accessToken: this.encryptToken(tokens.accessToken),
            refreshToken: tokens.refreshToken ? this.encryptToken(tokens.refreshToken) : null,
            tokenExpiry: tokens.expiresIn
              ? new Date(Date.now() + tokens.expiresIn * 1000)
              : null,
            scope: this.config.scope,
            followersCount: profile.followersCount || 0,
            followingCount: profile.followingCount || 0,
            status: AccountStatus.ACTIVE,
            lastSyncAt: new Date(),
          },
        });
      }
    } catch (error) {
      console.error(`Error connecting ${this.platform} account:`, error);
      throw new AppError(`Failed to connect ${this.platform} account`, 500);
    }
  }

  /**
   * Disconnect a social account
   */
  async disconnectAccount(userId: string, accountId: string) {
    try {
      const account = await prisma.socialAccount.findFirst({
        where: {
          id: accountId,
          userId,
        },
      });

      if (!account) {
        throw new AppError('Account not found', 404);
      }

      // Revoke access on the platform
      try {
        const accessToken = this.decryptToken(account.accessToken);
        await this.revokeAccess(accessToken);
      } catch (error) {
        console.error('Error revoking access:', error);
        // Continue with deletion even if revocation fails
      }

      // Delete the account from database
      await prisma.socialAccount.delete({
        where: { id: accountId },
      });

      return { success: true };
    } catch (error) {
      console.error(`Error disconnecting ${this.platform} account:`, error);
      throw error;
    }
  }

  /**
   * Refresh tokens if expired
   */
  async refreshTokensIfNeeded(accountId: string) {
    const account = await prisma.socialAccount.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new AppError('Account not found', 404);
    }

    // Check if token is expired
    if (account.tokenExpiry && account.tokenExpiry < new Date()) {
      if (!account.refreshToken) {
        throw new AppError('No refresh token available', 401);
      }

      try {
        const refreshToken = this.decryptToken(account.refreshToken);
        const tokens = await this.refreshAccessToken(refreshToken);

        // Update tokens in database
        await prisma.socialAccount.update({
          where: { id: accountId },
          data: {
            accessToken: this.encryptToken(tokens.accessToken),
            refreshToken: tokens.refreshToken ? this.encryptToken(tokens.refreshToken) : account.refreshToken,
            tokenExpiry: tokens.expiresIn
              ? new Date(Date.now() + tokens.expiresIn * 1000)
              : null,
            status: AccountStatus.ACTIVE,
          },
        });

        return tokens;
      } catch (error) {
        // Mark account as having token issues
        await prisma.socialAccount.update({
          where: { id: accountId },
          data: {
            status: AccountStatus.EXPIRED,
          },
        });
        throw error;
      }
    }

    // Return existing tokens
    return {
      accessToken: this.decryptToken(account.accessToken),
      refreshToken: account.refreshToken ? this.decryptToken(account.refreshToken) : undefined,
    };
  }

  /**
   * Get all connected accounts for a user
   */
  static async getUserAccounts(userId: string, organizationId?: string) {
    const where = organizationId
      ? { userId, organizationId }
      : { userId };

    const accounts = await prisma.socialAccount.findMany({
      where,
      select: {
        id: true,
        platform: true,
        username: true,
        displayName: true,
        profileImage: true,
        profileUrl: true,
        followersCount: true,
        followingCount: true,
        postsCount: true,
        status: true,
        scope: true,
        lastSyncAt: true,
        connectedAt: true,
      },
      orderBy: {
        connectedAt: 'desc',
      },
    });

    return accounts;
  }
}