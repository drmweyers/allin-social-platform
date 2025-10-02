import crypto from 'crypto';

export interface InstagramConfig {
  appId?: string;
  appSecret?: string;
  accessToken?: string;
  instagramBusinessAccountId?: string;
  baseUrl?: string;
}

export interface InstagramUser {
  id: string;
  username: string;
  name?: string;
  profilePictureUrl?: string;
  accountType: 'BUSINESS' | 'MEDIA_CREATOR' | 'PERSONAL';
  mediaCount?: number;
  followersCount?: number;
  followsCount?: number;
}

export interface InstagramMedia {
  id: string;
  mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  mediaUrl: string;
  thumbnailUrl?: string;
  permalink: string;
  caption?: string;
  timestamp: string;
  username: string;
  likesCount?: number;
  commentsCount?: number;
}

export interface InstagramPostRequest {
  imageUrl: string;
  caption?: string;
  accessToken?: string;
}

export interface InstagramMediaContainer {
  id: string;
}

export interface InstagramInsights {
  impressions: number;
  reach: number;
  engagement: number;
  saves: number;
  videoViews?: number;
  websiteClicks?: number;
  profileViews?: number;
  follows?: number;
}

export interface InstagramComment {
  id: string;
  text: string;
  timestamp: string;
  username: string;
  from: {
    id: string;
    username: string;
  };
  replies?: InstagramComment[];
  likesCount?: number;
}

export interface InstagramHashtag {
  id: string;
  name: string;
}

export interface InstagramAuthResponse {
  authUrl: string;
  state: string;
}

export interface InstagramTokenResponse {
  accessToken: string;
  tokenType: string;
  expiresIn?: number;
}

export class InstagramService {
  private config: InstagramConfig;
  public baseUrl: string;

  constructor(config: InstagramConfig = {}) {
    this.config = {
      appId: process.env.INSTAGRAM_APP_ID,
      appSecret: process.env.INSTAGRAM_APP_SECRET,
      accessToken: process.env.INSTAGRAM_ACCESS_TOKEN,
      instagramBusinessAccountId: process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID,
      baseUrl: 'https://graph.facebook.com/v21.0',
      ...config,
    };
    this.baseUrl = this.config.baseUrl!;
  }

  /**
   * Generate Instagram OAuth authorization URL
   */
  generateAuthUrl(redirectUri: string, scopes: string[] = ['instagram_basic', 'instagram_content_publish']): InstagramAuthResponse {
    const state = crypto.randomBytes(16).toString('hex');
    
    const params = new URLSearchParams({
      client_id: this.config.appId || '',
      redirect_uri: redirectUri,
      scope: scopes.join(','),
      response_type: 'code',
      state: state
    });

    const authUrl = `https://api.instagram.com/oauth/authorize?${params.toString()}`;
    
    return {
      authUrl,
      state
    };
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string, redirectUri: string): Promise<InstagramTokenResponse> {
    const body = new URLSearchParams({
      client_id: this.config.appId || '',
      client_secret: this.config.appSecret || '',
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code: code
    });

    try {
      const response = await fetch('https://api.instagram.com/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString()
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Token exchange failed: ${data.error_description || data.error || 'Unknown error'}`);
      }

      return {
        accessToken: data.access_token,
        tokenType: data.token_type || 'bearer',
        expiresIn: data.expires_in
      };
    } catch (error) {
      console.error('Instagram token exchange error:', error);
      throw error;
    }
  }

  /**
   * Exchange short-lived token for long-lived token
   */
  async exchangeForLongLivedToken(shortLivedToken: string): Promise<InstagramTokenResponse> {
    const params = new URLSearchParams({
      grant_type: 'ig_exchange_token',
      client_secret: this.config.appSecret || '',
      access_token: shortLivedToken
    });

    try {
      const response = await fetch(`${this.baseUrl}/access_token?${params.toString()}`, {
        method: 'GET'
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Long-lived token exchange failed: ${data.error?.message || 'Unknown error'}`);
      }

      return {
        accessToken: data.access_token,
        tokenType: data.token_type || 'bearer',
        expiresIn: data.expires_in
      };
    } catch (error) {
      console.error('Instagram long-lived token exchange error:', error);
      throw error;
    }
  }

  /**
   * Refresh long-lived access token
   */
  async refreshAccessToken(accessToken?: string): Promise<InstagramTokenResponse> {
    const token = accessToken || this.config.accessToken;
    
    if (!token) {
      throw new Error('Access token required for refresh');
    }

    const params = new URLSearchParams({
      grant_type: 'ig_refresh_token',
      access_token: token
    });

    try {
      const response = await fetch(`${this.baseUrl}/refresh_access_token?${params.toString()}`, {
        method: 'GET'
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Token refresh failed: ${data.error?.message || 'Unknown error'}`);
      }

      return {
        accessToken: data.access_token,
        tokenType: data.token_type || 'bearer',
        expiresIn: data.expires_in
      };
    } catch (error) {
      console.error('Instagram token refresh error:', error);
      throw error;
    }
  }

  /**
   * Get Instagram business account information
   */
  async getBusinessAccount(accessToken?: string): Promise<InstagramUser> {
    const token = accessToken || this.config.accessToken;
    const accountId = this.config.instagramBusinessAccountId;
    
    if (!token || !accountId) {
      // Return mock data for development testing
      return {
        id: '12345678901234567',
        username: 'mock_business_account',
        name: 'Mock Business Account',
        profilePictureUrl: 'https://via.placeholder.com/150',
        accountType: 'BUSINESS',
        mediaCount: 142,
        followersCount: 5234,
        followsCount: 487
      };
    }

    try {
      const params = new URLSearchParams({
        fields: 'id,username,name,profile_picture_url,account_type,media_count,followers_count,follows_count',
        access_token: token
      });

      const response = await fetch(`${this.baseUrl}/${accountId}?${params.toString()}`, {
        method: 'GET'
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Failed to get business account: ${data.error?.message || 'Unknown error'}`);
      }

      return {
        id: data.id,
        username: data.username,
        name: data.name,
        profilePictureUrl: data.profile_picture_url,
        accountType: data.account_type,
        mediaCount: data.media_count,
        followersCount: data.followers_count,
        followsCount: data.follows_count
      };
    } catch (error) {
      console.error('Instagram get business account error:', error);
      throw error;
    }
  }

  /**
   * Get user's Instagram media
   */
  async getUserMedia(userId?: string, limit: number = 25, accessToken?: string): Promise<InstagramMedia[]> {
    const token = accessToken || this.config.accessToken;
    const accountId = userId || this.config.instagramBusinessAccountId;
    
    if (!token || !accountId) {
      // Return mock data for development testing
      return [
        {
          id: '18025947908388034',
          mediaType: 'IMAGE',
          mediaUrl: 'https://scontent.cdninstagram.com/v/t51.29350-15/example.jpg',
          thumbnailUrl: 'https://scontent.cdninstagram.com/v/t51.29350-15/example.jpg',
          permalink: 'https://www.instagram.com/p/ABC123/',
          caption: 'Beautiful sunset at the beach! 🌅 #sunset #beach #travel',
          timestamp: new Date().toISOString(),
          username: 'mock_business_account',
          likesCount: 342,
          commentsCount: 28
        },
        {
          id: '18025947908388035',
          mediaType: 'VIDEO',
          mediaUrl: 'https://scontent.cdninstagram.com/v/t51.29350-15/example.mp4',
          thumbnailUrl: 'https://scontent.cdninstagram.com/v/t51.29350-15/example_thumb.jpg',
          permalink: 'https://www.instagram.com/p/DEF456/',
          caption: 'Check out this amazing product demo! 🚀 #innovation #tech',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          username: 'mock_business_account',
          likesCount: 187,
          commentsCount: 15
        },
        {
          id: '18025947908388036',
          mediaType: 'CAROUSEL_ALBUM',
          mediaUrl: 'https://scontent.cdninstagram.com/v/t51.29350-15/example2.jpg',
          thumbnailUrl: 'https://scontent.cdninstagram.com/v/t51.29350-15/example2.jpg',
          permalink: 'https://www.instagram.com/p/GHI789/',
          caption: 'Behind the scenes of our latest project! Swipe to see more 📸',
          timestamp: new Date(Date.now() - 172800000).toISOString(),
          username: 'mock_business_account',
          likesCount: 521,
          commentsCount: 42
        }
      ];
    }

    try {
      const params = new URLSearchParams({
        fields: 'id,media_type,media_url,thumbnail_url,permalink,caption,timestamp,username,like_count,comments_count,children{id,media_type,media_url,thumbnail_url}',
        limit: limit.toString(),
        access_token: token
      });

      const response = await fetch(`${this.baseUrl}/${accountId}/media?${params.toString()}`, {
        method: 'GET'
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(`Failed to get user media: ${result.error?.message || 'Unknown error'}`);
      }

      return result.data.map((item: any) => ({
        id: item.id,
        mediaType: item.media_type,
        mediaUrl: item.media_url,
        thumbnailUrl: item.thumbnail_url,
        permalink: item.permalink,
        caption: item.caption,
        timestamp: item.timestamp,
        username: item.username,
        likesCount: item.like_count,
        commentsCount: item.comments_count
      }));
    } catch (error) {
      console.error('Instagram get user media error:', error);
      throw error;
    }
  }

  /**
   * Create media container (first step of posting)
   */
  async createMediaContainer(postData: InstagramPostRequest, accessToken?: string): Promise<InstagramMediaContainer> {
    const token = accessToken || this.config.accessToken;
    const accountId = this.config.instagramBusinessAccountId;
    
    if (!token || !accountId) {
      throw new Error('Access token and Instagram Business Account ID required');
    }

    const body = new URLSearchParams({
      image_url: postData.imageUrl,
      caption: postData.caption || '',
      access_token: token
    });

    try {
      const response = await fetch(`${this.baseUrl}/${accountId}/media`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString()
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Failed to create media container: ${data.error?.message || 'Unknown error'}`);
      }

      return {
        id: data.id
      };
    } catch (error) {
      console.error('Instagram create media container error:', error);
      throw error;
    }
  }

  /**
   * Publish media container (second step of posting)
   */
  async publishMediaContainer(containerId: string, accessToken?: string): Promise<InstagramMedia> {
    const token = accessToken || this.config.accessToken;
    const accountId = this.config.instagramBusinessAccountId;
    
    if (!token || !accountId) {
      throw new Error('Access token and Instagram Business Account ID required');
    }

    const body = new URLSearchParams({
      creation_id: containerId,
      access_token: token
    });

    try {
      const response = await fetch(`${this.baseUrl}/${accountId}/media_publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString()
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Failed to publish media: ${data.error?.message || 'Unknown error'}`);
      }

      // Get the published media details
      const publishedMedia = await this.getMediaDetails(data.id, token);
      return publishedMedia;
    } catch (error) {
      console.error('Instagram publish media error:', error);
      throw error;
    }
  }

  /**
   * Get media details by ID
   */
  async getMediaDetails(mediaId: string, accessToken?: string): Promise<InstagramMedia> {
    const token = accessToken || this.config.accessToken;
    
    if (!token) {
      throw new Error('Access token required');
    }

    try {
      const params = new URLSearchParams({
        fields: 'id,media_type,media_url,thumbnail_url,permalink,caption,timestamp,username,like_count,comments_count',
        access_token: token
      });

      const response = await fetch(`${this.baseUrl}/${mediaId}?${params.toString()}`, {
        method: 'GET'
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Failed to get media details: ${data.error?.message || 'Unknown error'}`);
      }

      return {
        id: data.id,
        mediaType: data.media_type,
        mediaUrl: data.media_url,
        thumbnailUrl: data.thumbnail_url,
        permalink: data.permalink,
        caption: data.caption,
        timestamp: data.timestamp,
        username: data.username,
        likesCount: data.like_count,
        commentsCount: data.comments_count
      };
    } catch (error) {
      console.error('Instagram get media details error:', error);
      throw error;
    }
  }

  /**
   * Get account insights (analytics)
   */
  async getAccountInsights(period: 'day' | 'week' | 'days_28' = 'day', accessToken?: string): Promise<InstagramInsights> {
    const token = accessToken || this.config.accessToken;
    const accountId = this.config.instagramBusinessAccountId;
    
    if (!token || !accountId) {
      // Return mock data for development testing
      return {
        impressions: 1247,
        reach: 892,
        engagement: 156,
        saves: 23,
        videoViews: 0,
        websiteClicks: 12,
        profileViews: 45,
        follows: 8
      };
    }

    try {
      const params = new URLSearchParams({
        metric: 'impressions,reach,website_clicks,profile_views,follows,email_contacts,phone_call_clicks,text_message_clicks,get_directions_clicks',
        period: period,
        access_token: token
      });

      const response = await fetch(`${this.baseUrl}/${accountId}/insights?${params.toString()}`, {
        method: 'GET'
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(`Failed to get account insights: ${result.error?.message || 'Unknown error'}`);
      }

      const insights: InstagramInsights = {
        impressions: 0,
        reach: 0,
        engagement: 0,
        saves: 0,
        videoViews: 0,
        websiteClicks: 0,
        profileViews: 0,
        follows: 0
      };

      // Process insights data
      result.data.forEach((insight: any) => {
        switch (insight.name) {
          case 'impressions':
            insights.impressions = insight.values[0]?.value || 0;
            break;
          case 'reach':
            insights.reach = insight.values[0]?.value || 0;
            break;
          case 'website_clicks':
            insights.websiteClicks = insight.values[0]?.value || 0;
            break;
          case 'profile_views':
            insights.profileViews = insight.values[0]?.value || 0;
            break;
          case 'follows':
            insights.follows = insight.values[0]?.value || 0;
            break;
        }
      });

      return insights;
    } catch (error) {
      console.error('Instagram get account insights error:', error);
      throw error;
    }
  }

  /**
   * Get media insights
   */
  async getMediaInsights(mediaId: string, accessToken?: string): Promise<InstagramInsights> {
    const token = accessToken || this.config.accessToken;
    
    if (!token) {
      throw new Error('Access token required');
    }

    try {
      const params = new URLSearchParams({
        metric: 'impressions,reach,engagement,saves,video_views',
        access_token: token
      });

      const response = await fetch(`${this.baseUrl}/${mediaId}/insights?${params.toString()}`, {
        method: 'GET'
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(`Failed to get media insights: ${result.error?.message || 'Unknown error'}`);
      }

      const insights: InstagramInsights = {
        impressions: 0,
        reach: 0,
        engagement: 0,
        saves: 0
      };

      // Process insights data
      result.data.forEach((insight: any) => {
        switch (insight.name) {
          case 'impressions':
            insights.impressions = insight.values[0]?.value || 0;
            break;
          case 'reach':
            insights.reach = insight.values[0]?.value || 0;
            break;
          case 'engagement':
            insights.engagement = insight.values[0]?.value || 0;
            break;
          case 'saves':
            insights.saves = insight.values[0]?.value || 0;
            break;
          case 'video_views':
            insights.videoViews = insight.values[0]?.value || 0;
            break;
        }
      });

      return insights;
    } catch (error) {
      console.error('Instagram get media insights error:', error);
      throw error;
    }
  }

  /**
   * Get comments for a media post
   */
  async getMediaComments(mediaId: string, accessToken?: string): Promise<InstagramComment[]> {
    const token = accessToken || this.config.accessToken;
    
    if (!token) {
      throw new Error('Access token required');
    }

    try {
      const params = new URLSearchParams({
        fields: 'id,text,timestamp,username,from{id,username},like_count,replies{id,text,timestamp,username,from{id,username}}',
        access_token: token
      });

      const response = await fetch(`${this.baseUrl}/${mediaId}/comments?${params.toString()}`, {
        method: 'GET'
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(`Failed to get media comments: ${result.error?.message || 'Unknown error'}`);
      }

      return result.data.map((comment: any) => ({
        id: comment.id,
        text: comment.text,
        timestamp: comment.timestamp,
        username: comment.username,
        from: comment.from,
        replies: comment.replies?.data || [],
        likesCount: comment.like_count
      }));
    } catch (error) {
      console.error('Instagram get media comments error:', error);
      throw error;
    }
  }

  /**
   * Reply to a comment
   */
  async replyToComment(commentId: string, message: string, accessToken?: string): Promise<{ id: string }> {
    const token = accessToken || this.config.accessToken;
    
    if (!token) {
      throw new Error('Access token required');
    }

    const body = new URLSearchParams({
      message: message,
      access_token: token
    });

    try {
      const response = await fetch(`${this.baseUrl}/${commentId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString()
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Failed to reply to comment: ${data.error?.message || 'Unknown error'}`);
      }

      return {
        id: data.id
      };
    } catch (error) {
      console.error('Instagram reply to comment error:', error);
      throw error;
    }
  }

  /**
   * Delete a comment
   */
  async deleteComment(commentId: string, accessToken?: string): Promise<{ success: boolean }> {
    const token = accessToken || this.config.accessToken;
    
    if (!token) {
      throw new Error('Access token required');
    }

    try {
      const params = new URLSearchParams({
        access_token: token
      });

      const response = await fetch(`${this.baseUrl}/${commentId}?${params.toString()}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Failed to delete comment: ${data.error?.message || 'Unknown error'}`);
      }

      return {
        success: data.success || true
      };
    } catch (error) {
      console.error('Instagram delete comment error:', error);
      throw error;
    }
  }

  /**
   * Search hashtags
   */
  async searchHashtags(query: string, accessToken?: string): Promise<InstagramHashtag[]> {
    const token = accessToken || this.config.accessToken;
    
    if (!token) {
      throw new Error('Access token required');
    }

    try {
      const params = new URLSearchParams({
        q: query,
        fields: 'id,name',
        access_token: token
      });

      const response = await fetch(`${this.baseUrl}/ig_hashtag_search?${params.toString()}`, {
        method: 'GET'
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(`Failed to search hashtags: ${result.error?.message || 'Unknown error'}`);
      }

      return result.data.map((hashtag: any) => ({
        id: hashtag.id,
        name: hashtag.name
      }));
    } catch (error) {
      console.error('Instagram search hashtags error:', error);
      throw error;
    }
  }

  /**
   * Get hashtag insights
   */
  async getHashtagInsights(hashtagId: string, accessToken?: string): Promise<InstagramInsights> {
    const token = accessToken || this.config.accessToken;
    
    if (!token) {
      throw new Error('Access token required');
    }

    try {
      const params = new URLSearchParams({
        metric: 'impressions',
        period: 'day',
        access_token: token
      });

      const response = await fetch(`${this.baseUrl}/${hashtagId}/insights?${params.toString()}`, {
        method: 'GET'
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(`Failed to get hashtag insights: ${result.error?.message || 'Unknown error'}`);
      }

      return {
        impressions: result.data[0]?.values[0]?.value || 0,
        reach: 0,
        engagement: 0,
        saves: 0
      };
    } catch (error) {
      console.error('Instagram get hashtag insights error:', error);
      throw error;
    }
  }
}

export function createInstagramService(config?: InstagramConfig): InstagramService {
  return new InstagramService(config);
}

export default InstagramService;