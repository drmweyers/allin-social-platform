import * as crypto from 'crypto';

export interface TwitterConfig {
  apiKey?: string;
  apiSecret?: string;
  accessToken?: string;
  accessTokenSecret?: string;
  bearerToken?: string;
  clientId?: string;
  clientSecret?: string;
  baseUrl?: string;
}

export interface TwitterUser {
  id: string;
  username: string;
  name: string;
  profileImageUrl?: string;
  description?: string;
  verified: boolean;
  publicMetrics: {
    followersCount: number;
    followingCount: number;
    tweetCount: number;
    listedCount: number;
  };
  createdAt: string;
}

export interface TwitterTweet {
  id: string;
  text: string;
  authorId: string;
  createdAt: string;
  lang?: string;
  replySettings?: 'everyone' | 'mentionedUsers' | 'following';
  publicMetrics?: {
    retweetCount: number;
    likeCount: number;
    quoteCount: number;
    replyCount: number;
    impressionCount?: number;
  };
  entities?: {
    urls?: Array<{
      start: number;
      end: number;
      url: string;
      expandedUrl: string;
      displayUrl: string;
    }>;
    hashtags?: Array<{
      start: number;
      end: number;
      tag: string;
    }>;
    mentions?: Array<{
      start: number;
      end: number;
      username: string;
      id: string;
    }>;
  };
  attachments?: {
    mediaKeys?: string[];
  };
}

export interface TwitterMedia {
  mediaKey: string;
  type: 'photo' | 'video' | 'animated_gif';
  url?: string;
  previewImageUrl?: string;
  publicMetrics?: {
    viewCount?: number;
  };
  nonPublicMetrics?: {
    playback0Count?: number;
    playback25Count?: number;
    playback50Count?: number;
    playback75Count?: number;
    playback100Count?: number;
  };
  organicMetrics?: {
    playback0Count?: number;
    playback25Count?: number;
    playback50Count?: number;
    playback75Count?: number;
    playback100Count?: number;
    viewCount?: number;
  };
}

export interface TwitterPostRequest {
  text: string;
  mediaIds?: string[];
  pollOptions?: string[];
  pollDurationMinutes?: number;
  replyTo?: string;
  quoteTweetId?: string;
  replySettings?: 'everyone' | 'mentionedUsers' | 'following';
}

export interface TwitterAuthResponse {
  authUrl: string;
  state: string;
  codeChallenge: string;
  codeVerifier: string;
}

export interface TwitterTokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  scope?: string;
  tokenType: string;
}

export interface TwitterInsights {
  impressions: number;
  engagements: number;
  engagementRate: number;
  retweets: number;
  likes: number;
  replies: number;
  quotes: number;
  profileClicks?: number;
  urlClicks?: number;
  hashtagClicks?: number;
  detailExpands?: number;
  permalinkClicks?: number;
  appOpens?: number;
  appInstalls?: number;
  follows?: number;
  emailTweet?: number;
  dialPhone?: number;
  mediaViews?: number;
  mediaEngagements?: number;
}

export interface TwitterHashtag {
  tag: string;
  tweetCount?: number;
}

export interface TwitterSpace {
  id: string;
  state: 'live' | 'scheduled' | 'ended';
  title: string;
  hostIds: string[];
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
  topic?: string;
  participantCount?: number;
  subscriberCount?: number;
  scheduledStart?: string;
}

export class TwitterService {
  private config: TwitterConfig;
  // private readonly API_VERSION = 'v2'; // Used for future version management
  private readonly BASE_URL = 'https://api.twitter.com';

  constructor(config: TwitterConfig = {}) {
    this.config = {
      apiKey: config.apiKey || process.env.TWITTER_API_KEY,
      apiSecret: config.apiSecret || process.env.TWITTER_API_SECRET,
      accessToken: config.accessToken || process.env.TWITTER_ACCESS_TOKEN,
      accessTokenSecret: config.accessTokenSecret || process.env.TWITTER_ACCESS_TOKEN_SECRET,
      bearerToken: config.bearerToken || process.env.TWITTER_BEARER_TOKEN,
      clientId: config.clientId || process.env.TWITTER_CLIENT_ID,
      clientSecret: config.clientSecret || process.env.TWITTER_CLIENT_SECRET,
      baseUrl: config.baseUrl || this.BASE_URL,
      ...config
    };
  }

  /**
   * Generate Twitter OAuth 2.0 authorization URL with PKCE
   */
  generateAuthUrl(redirectUri: string, scopes: string[] = ['tweet.read', 'tweet.write', 'users.read']): TwitterAuthResponse {
    const state = crypto.randomBytes(16).toString('hex');
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
    
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId || '',
      redirect_uri: redirectUri,
      scope: scopes.join(' '),
      state: state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    });

    const authUrl = `${this.config.baseUrl}/2/oauth2/authorize?${params.toString()}`;
    
    return {
      authUrl,
      state,
      codeChallenge,
      codeVerifier
    };
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string, redirectUri: string, codeVerifier: string): Promise<TwitterTokenResponse> {
    const body = new URLSearchParams({
      code: code,
      grant_type: 'authorization_code',
      client_id: this.config.clientId || '',
      redirect_uri: redirectUri,
      code_verifier: codeVerifier
    });

    try {
      const response = await fetch(`${this.config.baseUrl}/2/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64')}`
        },
        body: body.toString()
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Token exchange failed: ${data.error_description || data.error || 'Unknown error'}`);
      }

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
        scope: data.scope,
        tokenType: data.token_type
      };
    } catch (error) {
      throw new Error(`Failed to exchange code for token: ${(error as Error).message}`);
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<TwitterTokenResponse> {
    const body = new URLSearchParams({
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
      client_id: this.config.clientId || ''
    });

    try {
      const response = await fetch(`${this.config.baseUrl}/2/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64')}`
        },
        body: body.toString()
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Token refresh failed: ${data.error_description || data.error || 'Unknown error'}`);
      }

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
        scope: data.scope,
        tokenType: data.token_type
      };
    } catch (error) {
      throw new Error(`Failed to refresh access token: ${(error as Error).message}`);
    }
  }

  /**
   * Get authenticated user information
   */
  async getMe(accessToken?: string): Promise<TwitterUser> {
    const token = accessToken || this.config.accessToken;
    if (!token) {
      throw new Error('Access token is required');
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/2/users/me?user.fields=description,public_metrics,profile_image_url,verified,created_at`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Failed to get user: ${data.detail || data.title || 'Unknown error'}`);
      }

      return {
        id: data.data.id,
        username: data.data.username,
        name: data.data.name,
        profileImageUrl: data.data.profile_image_url,
        description: data.data.description,
        verified: data.data.verified || false,
        publicMetrics: {
          followersCount: data.data.public_metrics.followers_count,
          followingCount: data.data.public_metrics.following_count,
          tweetCount: data.data.public_metrics.tweet_count,
          listedCount: data.data.public_metrics.listed_count
        },
        createdAt: data.data.created_at
      };
    } catch (error) {
      throw new Error(`Failed to get user information: ${(error as Error).message}`);
    }
  }

  /**
   * Get user tweets
   */
  async getUserTweets(userId?: string, maxResults: number = 10, accessToken?: string): Promise<TwitterTweet[]> {
    const token = accessToken || this.config.accessToken;
    if (!token) {
      throw new Error('Access token is required');
    }

    // const userIdParam = userId || 'me'; // For future use
    const endpoint = userId ? `/2/users/${userId}/tweets` : '/2/users/me/tweets';

    try {
      const params = new URLSearchParams({
        max_results: maxResults.toString(),
        'tweet.fields': 'created_at,lang,public_metrics,reply_settings,entities,attachments',
        'media.fields': 'media_key,type,url,preview_image_url,public_metrics',
        'user.fields': 'username,name,profile_image_url,verified',
        expansions: 'author_id,attachments.media_keys'
      });

      const response = await fetch(`${this.config.baseUrl}${endpoint}?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Failed to get tweets: ${data.detail || data.title || 'Unknown error'}`);
      }

      return data.data?.map((tweet: any) => ({
        id: tweet.id,
        text: tweet.text,
        authorId: tweet.author_id,
        createdAt: tweet.created_at,
        lang: tweet.lang,
        replySettings: tweet.reply_settings,
        publicMetrics: tweet.public_metrics,
        entities: tweet.entities,
        attachments: tweet.attachments
      })) || [];
    } catch (error) {
      throw new Error(`Failed to get user tweets: ${(error as Error).message}`);
    }
  }

  /**
   * Create a tweet
   */
  async createTweet(postData: TwitterPostRequest, accessToken?: string): Promise<TwitterTweet> {
    const token = accessToken || this.config.accessToken;
    if (!token) {
      throw new Error('Access token is required');
    }

    const tweetData: any = {
      text: postData.text
    };

    if (postData.mediaIds && postData.mediaIds.length > 0) {
      tweetData.media = {
        media_ids: postData.mediaIds
      };
    }

    if (postData.pollOptions && postData.pollOptions.length > 0) {
      tweetData.poll = {
        options: postData.pollOptions,
        duration_minutes: postData.pollDurationMinutes || 1440 // 24 hours default
      };
    }

    if (postData.replyTo) {
      tweetData.reply = {
        in_reply_to_tweet_id: postData.replyTo
      };
    }

    if (postData.quoteTweetId) {
      tweetData.quote_tweet_id = postData.quoteTweetId;
    }

    if (postData.replySettings) {
      tweetData.reply_settings = postData.replySettings;
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/2/tweets`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tweetData)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Failed to create tweet: ${data.detail || data.title || 'Unknown error'}`);
      }

      return {
        id: data.data.id,
        text: data.data.text,
        authorId: '', // Will be filled by subsequent call if needed
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to create tweet: ${(error as Error).message}`);
    }
  }

  /**
   * Delete a tweet
   */
  async deleteTweet(tweetId: string, accessToken?: string): Promise<{ deleted: boolean }> {
    const token = accessToken || this.config.accessToken;
    if (!token) {
      throw new Error('Access token is required');
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/2/tweets/${tweetId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Failed to delete tweet: ${data.detail || data.title || 'Unknown error'}`);
      }

      return { deleted: data.data.deleted || false };
    } catch (error) {
      throw new Error(`Failed to delete tweet: ${(error as Error).message}`);
    }
  }

  /**
   * Get tweet details
   */
  async getTweetDetails(tweetId: string, accessToken?: string): Promise<TwitterTweet> {
    const token = accessToken || this.config.accessToken;
    if (!token) {
      throw new Error('Access token is required');
    }

    try {
      const params = new URLSearchParams({
        'tweet.fields': 'created_at,lang,public_metrics,reply_settings,entities,attachments',
        'media.fields': 'media_key,type,url,preview_image_url,public_metrics',
        'user.fields': 'username,name,profile_image_url,verified',
        expansions: 'author_id,attachments.media_keys'
      });

      const response = await fetch(`${this.config.baseUrl}/2/tweets/${tweetId}?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Failed to get tweet: ${data.detail || data.title || 'Unknown error'}`);
      }

      return {
        id: data.data.id,
        text: data.data.text,
        authorId: data.data.author_id,
        createdAt: data.data.created_at,
        lang: data.data.lang,
        replySettings: data.data.reply_settings,
        publicMetrics: data.data.public_metrics,
        entities: data.data.entities,
        attachments: data.data.attachments
      };
    } catch (error) {
      throw new Error(`Failed to get tweet details: ${(error as Error).message}`);
    }
  }

  /**
   * Upload media for tweets
   */
  async uploadMedia(_mediaData: Buffer, _mediaType: 'image' | 'video' | 'gif', accessToken?: string): Promise<{ mediaId: string }> {
    const token = accessToken || this.config.accessToken;
    if (!token) {
      throw new Error('Access token is required');
    }

    // Note: Twitter API v2 doesn't directly support media upload yet
    // This would need to use the v1.1 media/upload endpoint
    // For now, returning a mock implementation
    
    try {
      // This is a simplified version - real implementation would use v1.1 API
      throw new Error('Media upload requires Twitter API v1.1 - implement separately');
    } catch (error) {
      throw new Error(`Failed to upload media: ${(error as Error).message}`);
    }
  }

  /**
   * Search tweets
   */
  async searchTweets(query: string, maxResults: number = 10, accessToken?: string): Promise<TwitterTweet[]> {
    const token = accessToken || this.config.bearerToken || this.config.accessToken;
    if (!token) {
      throw new Error('Access token or Bearer token is required');
    }

    try {
      const params = new URLSearchParams({
        query: query,
        max_results: maxResults.toString(),
        'tweet.fields': 'created_at,lang,public_metrics,reply_settings,entities,attachments',
        'user.fields': 'username,name,profile_image_url,verified',
        expansions: 'author_id'
      });

      const response = await fetch(`${this.config.baseUrl}/2/tweets/search/recent?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Failed to search tweets: ${data.detail || data.title || 'Unknown error'}`);
      }

      return data.data?.map((tweet: any) => ({
        id: tweet.id,
        text: tweet.text,
        authorId: tweet.author_id,
        createdAt: tweet.created_at,
        lang: tweet.lang,
        replySettings: tweet.reply_settings,
        publicMetrics: tweet.public_metrics,
        entities: tweet.entities,
        attachments: tweet.attachments
      })) || [];
    } catch (error) {
      throw new Error(`Failed to search tweets: ${(error as Error).message}`);
    }
  }

  /**
   * Get user followers
   */
  async getFollowers(userId?: string, maxResults: number = 100, accessToken?: string): Promise<TwitterUser[]> {
    const token = accessToken || this.config.accessToken;
    if (!token) {
      throw new Error('Access token is required');
    }

    // const userIdParam = userId || 'me'; // For future use
    const endpoint = userId ? `/2/users/${userId}/followers` : '/2/users/me/followers';

    try {
      const params = new URLSearchParams({
        max_results: maxResults.toString(),
        'user.fields': 'description,public_metrics,profile_image_url,verified,created_at'
      });

      const response = await fetch(`${this.config.baseUrl}${endpoint}?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Failed to get followers: ${data.detail || data.title || 'Unknown error'}`);
      }

      return data.data?.map((user: any) => ({
        id: user.id,
        username: user.username,
        name: user.name,
        profileImageUrl: user.profile_image_url,
        description: user.description,
        verified: user.verified || false,
        publicMetrics: {
          followersCount: user.public_metrics.followers_count,
          followingCount: user.public_metrics.following_count,
          tweetCount: user.public_metrics.tweet_count,
          listedCount: user.public_metrics.listed_count
        },
        createdAt: user.created_at
      })) || [];
    } catch (error) {
      throw new Error(`Failed to get followers: ${(error as Error).message}`);
    }
  }

  /**
   * Get user following
   */
  async getFollowing(userId?: string, maxResults: number = 100, accessToken?: string): Promise<TwitterUser[]> {
    const token = accessToken || this.config.accessToken;
    if (!token) {
      throw new Error('Access token is required');
    }

    // const userIdParam = userId || 'me'; // For future use
    const endpoint = userId ? `/2/users/${userId}/following` : '/2/users/me/following';

    try {
      const params = new URLSearchParams({
        max_results: maxResults.toString(),
        'user.fields': 'description,public_metrics,profile_image_url,verified,created_at'
      });

      const response = await fetch(`${this.config.baseUrl}${endpoint}?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Failed to get following: ${data.detail || data.title || 'Unknown error'}`);
      }

      return data.data?.map((user: any) => ({
        id: user.id,
        username: user.username,
        name: user.name,
        profileImageUrl: user.profile_image_url,
        description: user.description,
        verified: user.verified || false,
        publicMetrics: {
          followersCount: user.public_metrics.followers_count,
          followingCount: user.public_metrics.following_count,
          tweetCount: user.public_metrics.tweet_count,
          listedCount: user.public_metrics.listed_count
        },
        createdAt: user.created_at
      })) || [];
    } catch (error) {
      throw new Error(`Failed to get following: ${(error as Error).message}`);
    }
  }

  /**
   * Follow a user
   */
  async followUser(targetUserId: string, accessToken?: string): Promise<{ following: boolean }> {
    const token = accessToken || this.config.accessToken;
    if (!token) {
      throw new Error('Access token is required');
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/2/users/me/following`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          target_user_id: targetUserId
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Failed to follow user: ${data.detail || data.title || 'Unknown error'}`);
      }

      return { following: data.data.following || false };
    } catch (error) {
      throw new Error(`Failed to follow user: ${(error as Error).message}`);
    }
  }

  /**
   * Unfollow a user
   */
  async unfollowUser(targetUserId: string, accessToken?: string): Promise<{ following: boolean }> {
    const token = accessToken || this.config.accessToken;
    if (!token) {
      throw new Error('Access token is required');
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/2/users/me/following/${targetUserId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Failed to unfollow user: ${data.detail || data.title || 'Unknown error'}`);
      }

      return { following: data.data.following || false };
    } catch (error) {
      throw new Error(`Failed to unfollow user: ${(error as Error).message}`);
    }
  }

  /**
   * Like a tweet
   */
  async likeTweet(tweetId: string, accessToken?: string): Promise<{ liked: boolean }> {
    const token = accessToken || this.config.accessToken;
    if (!token) {
      throw new Error('Access token is required');
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/2/users/me/likes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tweet_id: tweetId
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Failed to like tweet: ${data.detail || data.title || 'Unknown error'}`);
      }

      return { liked: data.data.liked || false };
    } catch (error) {
      throw new Error(`Failed to like tweet: ${(error as Error).message}`);
    }
  }

  /**
   * Unlike a tweet
   */
  async unlikeTweet(tweetId: string, accessToken?: string): Promise<{ liked: boolean }> {
    const token = accessToken || this.config.accessToken;
    if (!token) {
      throw new Error('Access token is required');
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/2/users/me/likes/${tweetId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Failed to unlike tweet: ${data.detail || data.title || 'Unknown error'}`);
      }

      return { liked: data.data.liked || false };
    } catch (error) {
      throw new Error(`Failed to unlike tweet: ${(error as Error).message}`);
    }
  }

  /**
   * Retweet a tweet
   */
  async retweet(tweetId: string, accessToken?: string): Promise<{ retweeted: boolean }> {
    const token = accessToken || this.config.accessToken;
    if (!token) {
      throw new Error('Access token is required');
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/2/users/me/retweets`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tweet_id: tweetId
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Failed to retweet: ${data.detail || data.title || 'Unknown error'}`);
      }

      return { retweeted: data.data.retweeted || false };
    } catch (error) {
      throw new Error(`Failed to retweet: ${(error as Error).message}`);
    }
  }

  /**
   * Unretweet a tweet
   */
  async unretweet(tweetId: string, accessToken?: string): Promise<{ retweeted: boolean }> {
    const token = accessToken || this.config.accessToken;
    if (!token) {
      throw new Error('Access token is required');
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/2/users/me/retweets/${tweetId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Failed to unretweet: ${data.detail || data.title || 'Unknown error'}`);
      }

      return { retweeted: data.data.retweeted || false };
    } catch (error) {
      throw new Error(`Failed to unretweet: ${(error as Error).message}`);
    }
  }
}

// Export singleton instance
export const twitterService = new TwitterService();