import { SocialPlatform } from '@prisma/client';
import { OAuthService } from '../oauth.service';
import type { OAuthConfig, OAuthTokens, PlatformProfile } from '../oauth.service';
import { AppError } from '../../utils/errors';
import crypto from 'crypto';

interface TwitterTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
}

interface TwitterUserResponse {
  data: {
    id: string;
    name: string;
    username: string;
    profile_image_url?: string;
    public_metrics?: {
      followers_count: number;
      following_count: number;
      tweet_count: number;
    };
  };
}

export class TwitterOAuthService extends OAuthService {
  constructor() {
    const config: OAuthConfig = {
      clientId: process.env.TWITTER_CLIENT_ID || '',
      clientSecret: process.env.TWITTER_CLIENT_SECRET || '',
      redirectUri: process.env.TWITTER_REDIRECT_URI || 'http://localhost:3000/api/social/callback/twitter',
      scope: ['tweet.read', 'tweet.write', 'users.read', 'follows.read', 'follows.write', 'like.read', 'like.write']
    };

    super(SocialPlatform.TWITTER, config);
  }

  /**
   * Generate PKCE challenge for OAuth 2.0 with PKCE
   */
  private generatePKCE(): { codeVerifier: string; codeChallenge: string } {
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
    return { codeVerifier, codeChallenge };
  }

  /**
   * Override state generation to include PKCE code verifier
   * Returns both state and code verifier for immediate URL generation
   * @param userId - User ID initiating OAuth
   * @param organizationId - Optional organization ID
   * @returns Promise<{ state: string, codeVerifier: string, codeChallenge: string }>
   */
  async generateStateWithPKCE(userId: string, organizationId?: string): Promise<{
    state: string;
    codeVerifier: string;
    codeChallenge: string;
  }> {
    // Generate PKCE for Twitter OAuth 2.0
    const { codeVerifier, codeChallenge } = this.generatePKCE();

    // Store state with code verifier in Redis
    const state = await this.oauthStateService.generateAuthorizationState(
      userId,
      this.platform,
      organizationId,
      codeVerifier // Store code verifier for callback
    );

    return { state, codeVerifier, codeChallenge };
  }

  /**
   * Generate OAuth authorization URL with PKCE
   * For Twitter, use the version that accepts state and code challenge
   */
  getAuthorizationUrl(state: string, codeChallenge?: string): string {
    if (!this.config.clientId) {
      throw new AppError('Twitter Client ID not configured', 500);
    }

    if (!codeChallenge) {
      throw new AppError('Twitter OAuth requires PKCE code challenge', 400);
    }

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scope.join(' '),
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    });

    return `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access tokens
   * Override to handle PKCE code verifier from state
   */
  async exchangeCodeForTokens(code: string): Promise<OAuthTokens> {
    try {
      // Note: Code verifier should be passed via connectAccount method
      // which retrieves it from the validated state
      throw new AppError('Use connectAccountWithState for Twitter OAuth', 500);
    } catch (error) {
      console.error('Twitter token exchange error:', error);
      throw error;
    }
  }

  /**
   * Exchange authorization code for access tokens with PKCE
   * @param code - Authorization code from OAuth callback
   * @param codeVerifier - PKCE code verifier from state
   */
  async exchangeCodeForTokensWithPKCE(code: string, codeVerifier: string): Promise<OAuthTokens> {
    try {
      const tokenUrl = 'https://api.twitter.com/2/oauth2/token';

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64')}`
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: this.config.redirectUri,
          code_verifier: codeVerifier
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new AppError(`Twitter token exchange failed: ${errorText}`, response.status);
      }

      const data = await response.json() as TwitterTokenResponse;

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in
      };
    } catch (error) {
      console.error('Twitter token exchange error:', error);
      throw new AppError('Failed to exchange Twitter authorization code', 500);
    }
  }

  /**
   * Connect a social account using validated state data (includes PKCE)
   * @param userId - User ID
   * @param code - Authorization code
   * @param organizationId - Optional organization ID
   * @param codeVerifier - PKCE code verifier from validated state
   */
  async connectAccountWithPKCE(
    userId: string,
    code: string,
    organizationId: string | undefined,
    codeVerifier: string
  ) {
    try {
      // Exchange code for tokens using PKCE
      const tokens = await this.exchangeCodeForTokensWithPKCE(code, codeVerifier);

      // Get user profile from platform
      const profile = await this.getUserProfile(tokens.accessToken);

      // Use parent class logic to store account
      const prisma = new (await import('@prisma/client')).PrismaClient();

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
            status: 'ACTIVE' as const,
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
            status: 'ACTIVE' as const,
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
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<OAuthTokens> {
    try {
      const tokenUrl = 'https://api.twitter.com/2/oauth2/token';
      
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64')}`
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new AppError(`Twitter token refresh failed: ${errorText}`, response.status);
      }

      const data = await response.json() as TwitterTokenResponse;

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in
      };
    } catch (error) {
      console.error('Twitter token refresh error:', error);
      throw new AppError('Failed to refresh Twitter token', 500);
    }
  }

  /**
   * Get user profile from Twitter
   */
  async getUserProfile(accessToken: string): Promise<PlatformProfile> {
    try {
      const response = await fetch('https://api.twitter.com/2/users/me?user.fields=public_metrics,profile_image_url', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new AppError(`Twitter profile fetch failed: ${errorText}`, response.status);
      }

      const data = await response.json() as TwitterUserResponse;
      const user = data.data;

      return {
        id: user.id,
        username: user.username,
        displayName: user.name,
        profileImage: user.profile_image_url,
        profileUrl: `https://twitter.com/${user.username}`,
        followersCount: user.public_metrics?.followers_count || 0,
        followingCount: user.public_metrics?.following_count || 0
      };
    } catch (error) {
      console.error('Twitter profile fetch error:', error);
      throw new AppError('Failed to fetch Twitter profile', 500);
    }
  }

  /**
   * Revoke access token
   */
  async revokeAccess(accessToken: string): Promise<void> {
    try {
      const response = await fetch('https://api.twitter.com/2/oauth2/revoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64')}`
        },
        body: new URLSearchParams({
          token: accessToken,
          token_type_hint: 'access_token'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Twitter token revocation failed:', errorText);
        // Don't throw error as revocation might fail but we still want to disconnect
      }
    } catch (error) {
      console.error('Twitter token revocation error:', error);
      // Don't throw error as revocation might fail but we still want to disconnect
    }
  }

  /**
   * Get current code verifier for PKCE flow
   */
  getCurrentCodeVerifier(): string {
    return this.codeVerifier;
  }

  /**
   * Get current code challenge for PKCE flow
   */
  getCurrentCodeChallenge(): string {
    return this.codeChallenge;
  }
}