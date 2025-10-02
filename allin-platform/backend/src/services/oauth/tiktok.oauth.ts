import axios from 'axios';
import { SocialPlatform } from '@prisma/client';
import { OAuthService } from '../oauth.service';
import { AppError } from '../../utils/errors';

interface TikTokTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  open_id: string;
}

interface TikTokUserProfile {
  data: {
    user: {
      open_id: string;
      union_id: string;
      avatar_url: string;
      avatar_url_100: string;
      avatar_large_url: string;
      display_name: string;
      bio_description: string;
      profile_deep_link: string;
      is_verified: boolean;
      follower_count: number;
      following_count: number;
      likes_count: number;
      video_count: number;
    };
  };
  error: {
    code: string;
    message: string;
    log_id: string;
  };
}

interface TikTokVideoListResponse {
  data: {
    videos: Array<{
      id: string;
      title: string;
      cover_image_url: string;
      share_url: string;
      video_description: string;
      duration: number;
      height: number;
      width: number;
      create_time: number;
      view_count: number;
      like_count: number;
      comment_count: number;
      share_count: number;
    }>;
    cursor: number;
    has_more: boolean;
  };
  error: {
    code: string;
    message: string;
    log_id: string;
  };
}

export class TikTokOAuthService extends OAuthService {
  private readonly apiVersion = 'v2';
  private readonly baseUrl = 'https://open.tiktokapis.com';
  private readonly authUrl = 'https://www.tiktok.com';

  constructor() {
    super(SocialPlatform.TIKTOK, {
      clientId: process.env.TIKTOK_CLIENT_KEY || '',
      clientSecret: process.env.TIKTOK_CLIENT_SECRET || '',
      redirectUri: process.env.TIKTOK_REDIRECT_URI || 'http://localhost:3001/api/social/callback/tiktok',
      scope: [
        'user.info.basic',
        'user.info.profile',
        'user.info.stats',
        'video.list',
        'video.upload',
        'video.publish',
      ],
    });
  }

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_key: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: this.config.scope.join(','),
      state,
    });

    return `${this.authUrl}/v2/auth/authorize/?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string) {
    try {
      const response = await axios.post<TikTokTokenResponse>(
        `${this.baseUrl}/${this.apiVersion}/oauth/token/`,
        {
          client_key: this.config.clientId,
          client_secret: this.config.clientSecret,
          code,
          grant_type: 'authorization_code',
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
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in || 86400, // 24 hours default
        openId: response.data.open_id,
      };
    } catch (error) {
      console.error('TikTok token exchange error:', error);
      throw new AppError('Failed to exchange code for tokens', 400);
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }> {
    try {
      const response = await axios.post<TikTokTokenResponse>(
        `${this.baseUrl}/${this.apiVersion}/oauth/token/`,
        {
          client_key: this.config.clientId,
          client_secret: this.config.clientSecret,
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in,
      };
    } catch (error) {
      console.error('TikTok token refresh error:', error);
      throw new AppError('Failed to refresh access token', 401);
    }
  }

  async getUserProfile(accessToken: string) {
    try {
      // Get user profile information
      const profileResponse = await axios.post<TikTokUserProfile>(
        `${this.baseUrl}/${this.apiVersion}/user/info/`,
        {
          fields: [
            'open_id',
            'union_id',
            'avatar_url',
            'avatar_url_100',
            'avatar_large_url',
            'display_name',
            'bio_description',
            'profile_deep_link',
            'is_verified',
            'follower_count',
            'following_count',
            'likes_count',
            'video_count',
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (profileResponse.data.error && profileResponse.data.error.code) {
        throw new AppError(`TikTok API Error: ${profileResponse.data.error.message}`, 400);
      }

      const user = profileResponse.data.data.user;

      return {
        id: user.open_id,
        displayName: user.display_name,
        email: undefined, // TikTok doesn't provide email in basic scope
        profileImage: user.avatar_url_100 || user.avatar_url,
        profileUrl: user.profile_deep_link,
        platformData: {
          unionId: user.union_id,
          avatarLargeUrl: user.avatar_large_url,
          bioDescription: user.bio_description,
          isVerified: user.is_verified,
          followerCount: user.follower_count,
          followingCount: user.following_count,
          likesCount: user.likes_count,
          videoCount: user.video_count,
        },
      };
    } catch (error) {
      console.error('TikTok profile fetch error:', error);
      throw new AppError('Failed to fetch user profile', 400);
    }
  }

  async revokeAccess(accessToken: string) {
    try {
      await axios.post(
        `${this.baseUrl}/${this.apiVersion}/oauth/revoke/`,
        {
          client_key: this.config.clientId,
          client_secret: this.config.clientSecret,
          token: accessToken,
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
    } catch (error) {
      console.error('TikTok revoke access error:', error);
      // Don't throw error as the user might have already revoked access
    }
  }

  /**
   * Get analytics/insights for a TikTok account
   */
  async getInsights(accessToken: string, _accountId: string, _since?: Date, _until?: Date) {
    try {
      // TikTok provides analytics through the Research API (requires special approval)
      // For basic users, we can only get video statistics
      
      const params: any = {
        max_count: 20,
      };

      // Get user's video list to calculate aggregate stats
      const response = await axios.post<TikTokVideoListResponse>(
        `${this.baseUrl}/${this.apiVersion}/video/list/`,
        {
          fields: [
            'id',
            'title',
            'cover_image_url',
            'share_url',
            'video_description',
            'duration',
            'height',
            'width',
            'create_time',
            'view_count',
            'like_count',
            'comment_count',
            'share_count',
          ],
          ...params,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.error?.code) {
        throw new AppError(`TikTok API Error: ${response.data.error.message}`, 400);
      }

      const videos = response.data.data.videos || [];
      
      // Calculate aggregate metrics
      const totalViews = videos.reduce((sum, video) => sum + (video.view_count || 0), 0);
      const totalLikes = videos.reduce((sum, video) => sum + (video.like_count || 0), 0);
      const totalComments = videos.reduce((sum, video) => sum + (video.comment_count || 0), 0);
      const totalShares = videos.reduce((sum, video) => sum + (video.share_count || 0), 0);

      return {
        totalVideos: videos.length,
        totalViews,
        totalLikes,
        totalComments,
        totalShares,
        averageViews: videos.length > 0 ? Math.round(totalViews / videos.length) : 0,
        averageLikes: videos.length > 0 ? Math.round(totalLikes / videos.length) : 0,
        engagementRate: totalViews > 0 ? ((totalLikes + totalComments + totalShares) / totalViews * 100).toFixed(2) : '0.00',
        videos: videos.slice(0, 5), // Return top 5 recent videos
      };
    } catch (error) {
      console.error('TikTok insights fetch error:', error);
      throw new AppError('Failed to fetch insights', 400);
    }
  }

  /**
   * Upload and publish a video to TikTok
   * Note: This is a simplified implementation. Full video upload requires multiple steps:
   * 1. Initialize upload session
   * 2. Upload video file
   * 3. Publish the video
   */
  async publishPost(
    _accessToken: string,
    _accountId: string,
    content: string,
    mediaUrls?: string[]
  ) {
    try {
      // TikTok video publishing requires video files, not just text
      if (!mediaUrls || mediaUrls.length === 0) {
        throw new AppError('TikTok requires video content to publish', 400);
      }

      // This is a placeholder implementation
      // In production, you would:
      // 1. Download the video from mediaUrls[0]
      // 2. Initialize upload session
      // 3. Upload video chunks
      // 4. Publish the video

      const postData = {
        post_info: {
          title: content.substring(0, 150), // TikTok title limit
          privacy_level: 'MUTUAL_FOLLOW_FRIENDS', // or 'PUBLIC_TO_EVERYONE'
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
          video_cover_timestamp_ms: 1000,
        },
        source_info: {
          source: 'PULL_FROM_URL',
          video_url: mediaUrls[0],
        },
      };

      // This would be the actual API call for video publishing
      // For now, we'll return a mock response
      console.log('TikTok publish post data:', postData);

      return {
        id: `tiktok_${Date.now()}`,
        url: `https://tiktok.com/@username/video/${Date.now()}`,
        status: 'pending', // TikTok videos may require review
      };
    } catch (error) {
      console.error('TikTok post publish error:', error);
      throw new AppError('Failed to publish video', 400);
    }
  }

  /**
   * Get video details by video ID
   */
  async getVideoDetails(accessToken: string, videoId: string) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/${this.apiVersion}/video/query/`,
        {
          fields: [
            'id',
            'title',
            'cover_image_url',
            'share_url',
            'video_description',
            'duration',
            'height',
            'width',
            'create_time',
            'view_count',
            'like_count',
            'comment_count',
            'share_count',
          ],
          filters: {
            video_ids: [videoId],
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('TikTok video details fetch error:', error);
      throw new AppError('Failed to fetch video details', 400);
    }
  }
}