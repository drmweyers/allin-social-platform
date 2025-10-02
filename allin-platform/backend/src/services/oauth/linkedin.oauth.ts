import axios from 'axios';
import { SocialPlatform } from '@prisma/client';
import { OAuthService } from '../oauth.service';
import { AppError } from '../../utils/errors';

interface LinkedInTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

interface LinkedInUserProfile {
  sub: string;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  email?: string;
  email_verified?: boolean;
  locale?: {
    country?: string;
    language?: string;
  };
}

interface LinkedInOrganizationProfile {
  elements: Array<{
    organization: string;
    organizationalTarget: string;
    role: string;
    state: string;
  }>;
}

interface LinkedInCompanyProfile {
  id: number;
  name: string;
  description?: string;
  logo?: {
    originalImageUrl?: string;
  };
  website?: string;
  followerCount?: number;
}

export class LinkedInOAuthService extends OAuthService {
  private readonly apiVersion = 'v2';
  private readonly baseUrl = 'https://api.linkedin.com';
  private readonly authUrl = 'https://www.linkedin.com';

  constructor() {
    super(SocialPlatform.LINKEDIN, {
      clientId: process.env.LINKEDIN_CLIENT_ID || '',
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
      redirectUri: process.env.LINKEDIN_REDIRECT_URI || 'http://localhost:3001/api/social/callback/linkedin',
      scope: [
        'openid',
        'profile',
        'email',
        'w_member_social',
        'w_organization_social',
        'r_organization_social',
        'rw_organization_admin',
      ],
    });
  }

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      state,
      scope: this.config.scope.join(' '),
    });

    return `${this.authUrl}/oauth/v2/authorization?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string) {
    try {
      const response = await axios.post<LinkedInTokenResponse>(
        `${this.authUrl}/oauth/v2/accessToken`,
        {
          grant_type: 'authorization_code',
          code,
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          redirect_uri: this.config.redirectUri,
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return {
        accessToken: response.data.access_token,
        expiresIn: response.data.expires_in || 5184000, // 60 days default
      };
    } catch (error) {
      console.error('LinkedIn token exchange error:', error);
      throw new AppError('Failed to exchange code for tokens', 400);
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }> {
    try {
      const response = await axios.post<LinkedInTokenResponse>(
        `${this.authUrl}/oauth/v2/accessToken`,
        {
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return {
        accessToken: response.data.access_token,
        expiresIn: response.data.expires_in,
      };
    } catch (error) {
      console.error('LinkedIn token refresh error:', error);
      throw new AppError('Failed to refresh access token', 401);
    }
  }

  async getUserProfile(accessToken: string) {
    try {
      // Get user profile
      const profileResponse = await axios.get<LinkedInUserProfile>(
        `${this.baseUrl}/${this.apiVersion}/userinfo`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const profile = profileResponse.data;

      // Get organizations/companies managed by the user
      let organizationsData: Array<{
        organization: string;
        organizationalTarget: string;
        role: string;
        state: string;
      }> = [];
      
      try {
        const orgsResponse = await axios.get<LinkedInOrganizationProfile>(
          `${this.baseUrl}/${this.apiVersion}/organizationAcls`,
          {
            params: {
              q: 'roleAssignee',
              projection: '(elements*(organization,organizationalTarget,role,state))',
            },
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        organizationsData = orgsResponse.data.elements || [];
      } catch (orgError) {
        console.warn('Could not fetch organization data:', orgError);
        // Continue without organization data
      }

      return {
        id: profile.sub,
        displayName: profile.name,
        email: profile.email,
        profileImage: profile.picture,
        profileUrl: `https://linkedin.com/in/${profile.sub}`,
        platformData: {
          firstName: profile.given_name,
          lastName: profile.family_name,
          locale: profile.locale,
          emailVerified: profile.email_verified,
          organizations: organizationsData,
        },
      };
    } catch (error) {
      console.error('LinkedIn profile fetch error:', error);
      throw new AppError('Failed to fetch user profile', 400);
    }
  }

  async revokeAccess(accessToken: string) {
    try {
      await axios.post(
        `${this.authUrl}/oauth/v2/revoke`,
        {
          token: accessToken,
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
    } catch (error) {
      console.error('LinkedIn revoke access error:', error);
      // Don't throw error as the user might have already revoked access
    }
  }

  /**
   * Get analytics for a connected LinkedIn account
   */
  async getInsights(accessToken: string, accountId: string, since?: Date, until?: Date) {
    try {
      // LinkedIn uses different analytics endpoints for personal profiles vs company pages
      const params: any = {
        q: 'statistics',
        timeGranularity: 'DAY',
      };

      if (since) {
        params.timeRange = `(start:(year:${since.getFullYear()},month:${since.getMonth() + 1},day:${since.getDate()}))`;
      }

      if (until) {
        const endParams = `(end:(year:${until.getFullYear()},month:${until.getMonth() + 1},day:${until.getDate()}))`;
        params.timeRange = params.timeRange ? 
          params.timeRange.replace('))', `,${endParams.slice(1)}`) : 
          endParams;
      }

      // For organization analytics
      const response = await axios.get(
        `${this.baseUrl}/${this.apiVersion}/organizationalEntityStatistics`,
        {
          params: {
            q: 'statistics',
            organizationalEntity: `urn:li:organization:${accountId}`,
            ...params,
          },
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('LinkedIn insights fetch error:', error);
      throw new AppError('Failed to fetch insights', 400);
    }
  }

  /**
   * Publish a post to LinkedIn
   */
  async publishPost(
    accessToken: string,
    accountId: string,
    content: string,
    mediaUrls?: string[]
  ) {
    try {
      // Determine if posting as person or organization
      const isOrganization = accountId.startsWith('urn:li:organization:');
      const author = isOrganization ? accountId : `urn:li:person:${accountId}`;

      const postData: any = {
        author,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: content,
            },
            shareMediaCategory: mediaUrls && mediaUrls.length > 0 ? 'IMAGE' : 'NONE',
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      };

      // Handle media attachments
      if (mediaUrls && mediaUrls.length > 0) {
        // For simplicity, using the first media URL
        // In production, you'd properly upload media to LinkedIn first
        postData.specificContent['com.linkedin.ugc.ShareContent'].media = [
          {
            status: 'READY',
            description: {
              text: 'Media attachment',
            },
            media: mediaUrls[0], // This would be a LinkedIn asset URN in production
            title: {
              text: 'Media',
            },
          },
        ];
      }

      const response = await axios.post(
        `${this.baseUrl}/${this.apiVersion}/ugcPosts`,
        postData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0',
          },
        }
      );

      const postId = response.headers['x-restli-id'];
      return {
        id: postId,
        url: `https://linkedin.com/feed/update/${postId}`,
      };
    } catch (error) {
      console.error('LinkedIn post publish error:', error);
      throw new AppError('Failed to publish post', 400);
    }
  }

  /**
   * Get company/organization profile data
   */
  async getCompanyProfile(accessToken: string, companyId: string) {
    try {
      const response = await axios.get<LinkedInCompanyProfile>(
        `${this.baseUrl}/${this.apiVersion}/organizations/${companyId}`,
        {
          params: {
            projection: '(id,name,description,logo,website,followerCount)',
          },
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('LinkedIn company profile fetch error:', error);
      throw new AppError('Failed to fetch company profile', 400);
    }
  }
}