import axios from 'axios';
import { SocialPlatform } from '@prisma/client';
import { OAuthService } from '../oauth.service';
import { AppError } from '../../utils/errors';

interface FacebookTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

interface FacebookUserProfile {
  id: string;
  name?: string;
  email?: string;
  picture?: {
    data?: {
      url?: string;
    };
  };
}

interface FacebookPageData {
  data: Array<{
    id: string;
    name: string;
    access_token: string;
    category: string;
    followers_count?: number;
  }>;
}

export class FacebookOAuthService extends OAuthService {
  private readonly apiVersion = 'v18.0';
  private readonly baseUrl = 'https://graph.facebook.com';
  private readonly authUrl = 'https://www.facebook.com';

  constructor() {
    super(SocialPlatform.FACEBOOK, {
      clientId: process.env.FACEBOOK_APP_ID || '',
      clientSecret: process.env.FACEBOOK_APP_SECRET || '',
      redirectUri: process.env.FACEBOOK_REDIRECT_URI || 'http://localhost:3001/api/social/callback/facebook',
      scope: [
        'email',
        'public_profile',
        'pages_show_list',
        'pages_read_engagement',
        'pages_manage_posts',
        'pages_manage_engagement',
        'instagram_basic',
        'instagram_content_publish',
      ],
    });
  }

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      state,
      scope: this.config.scope.join(','),
      response_type: 'code',
      auth_type: 'rerequest',
      display: 'popup',
    });

    return `${this.authUrl}/${this.apiVersion}/dialog/oauth?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string) {
    try {
      const params = new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        redirect_uri: this.config.redirectUri,
        code,
      });

      const response = await axios.get<FacebookTokenResponse>(
        `${this.baseUrl}/${this.apiVersion}/oauth/access_token?${params.toString()}`
      );

      const { access_token } = response.data;
      // Note: Using long-lived token instead of short-lived one

      // Exchange short-lived token for long-lived token
      const longLivedResponse = await axios.get<FacebookTokenResponse>(
        `${this.baseUrl}/${this.apiVersion}/oauth/access_token`, {
          params: {
            grant_type: 'fb_exchange_token',
            client_id: this.config.clientId,
            client_secret: this.config.clientSecret,
            fb_exchange_token: access_token,
          },
        }
      );

      return {
        accessToken: longLivedResponse.data.access_token,
        expiresIn: longLivedResponse.data.expires_in || 5184000, // 60 days default
      };
    } catch (error) {
      console.error('Facebook token exchange error:', error);
      throw new AppError('Failed to exchange code for tokens', 400);
    }
  }

  async refreshAccessToken(_refreshToken: string): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }> {
    // Facebook doesn't use refresh tokens in the traditional sense
    // Long-lived tokens last 60 days and need to be refreshed before expiry
    // For now, we'll throw an error requiring re-authentication
    throw new AppError('Facebook token refresh requires re-authentication', 401);
  }

  async getUserProfile(accessToken: string) {
    try {
      // Get user profile
      const userResponse = await axios.get<FacebookUserProfile>(
        `${this.baseUrl}/${this.apiVersion}/me`, {
          params: {
            fields: 'id,name,email,picture.type(large)',
            access_token: accessToken,
          },
        }
      );

      const user = userResponse.data;

      // Get pages managed by the user
      const pagesResponse = await axios.get<FacebookPageData>(
        `${this.baseUrl}/${this.apiVersion}/me/accounts`, {
          params: {
            fields: 'id,name,access_token,category,followers_count',
            access_token: accessToken,
          },
        }
      );

      // For now, we'll use the user's personal profile
      // In a full implementation, you'd allow selecting which page to connect
      return {
        id: user.id,
        displayName: user.name,
        email: user.email,
        profileImage: user.picture?.data?.url,
        profileUrl: `https://facebook.com/${user.id}`,
        // Store pages data for later use
        platformData: {
          pages: pagesResponse.data.data,
        },
      };
    } catch (error) {
      console.error('Facebook profile fetch error:', error);
      throw new AppError('Failed to fetch user profile', 400);
    }
  }

  async revokeAccess(accessToken: string) {
    try {
      await axios.delete(
        `${this.baseUrl}/${this.apiVersion}/me/permissions`, {
          params: {
            access_token: accessToken,
          },
        }
      );
    } catch (error) {
      console.error('Facebook revoke access error:', error);
      // Don't throw error as the user might have already revoked access
    }
  }

  /**
   * Get insights for a connected account
   */
  async getInsights(accessToken: string, accountId: string, since?: Date, until?: Date) {
    try {
      const params: any = {
        metric: 'page_impressions,page_engaged_users,page_fans',
        period: 'day',
        access_token: accessToken,
      };

      if (since) {
        params.since = Math.floor(since.getTime() / 1000);
      }
      if (until) {
        params.until = Math.floor(until.getTime() / 1000);
      }

      const response = await axios.get(
        `${this.baseUrl}/${this.apiVersion}/${accountId}/insights`, {
          params,
        }
      );

      return response.data;
    } catch (error) {
      console.error('Facebook insights fetch error:', error);
      throw new AppError('Failed to fetch insights', 400);
    }
  }

  /**
   * Publish a post to Facebook
   */
  async publishPost(
    accessToken: string,
    pageId: string,
    content: string,
    mediaUrls?: string[]
  ) {
    try {
      const params: any = {
        message: content,
        access_token: accessToken,
      };

      // Handle media attachments
      if (mediaUrls && mediaUrls.length > 0) {
        // For simplicity, using the first media URL
        // In production, you'd handle multiple media properly
        params.link = mediaUrls[0];
      }

      const response = await axios.post(
        `${this.baseUrl}/${this.apiVersion}/${pageId}/feed`,
        params
      );

      return {
        id: response.data.id,
        url: `https://facebook.com/${response.data.id}`,
      };
    } catch (error) {
      console.error('Facebook post publish error:', error);
      throw new AppError('Failed to publish post', 400);
    }
  }
}