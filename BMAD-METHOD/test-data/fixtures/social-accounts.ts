import { SocialPlatform, AccountStatus } from '@prisma/client';

// Social platform test data
export const socialPlatforms = {
  facebook: 'FACEBOOK' as SocialPlatform,
  instagram: 'INSTAGRAM' as SocialPlatform,
  twitter: 'TWITTER' as SocialPlatform,
  linkedin: 'LINKEDIN' as SocialPlatform,
  tiktok: 'TIKTOK' as SocialPlatform,
  youtube: 'YOUTUBE' as SocialPlatform,
  pinterest: 'PINTEREST' as SocialPlatform,
  snapchat: 'SNAPCHAT' as SocialPlatform,
  reddit: 'REDDIT' as SocialPlatform,
  threads: 'THREADS' as SocialPlatform
};

// Mock OAuth tokens and credentials
export const mockTokens = {
  facebook: {
    accessToken: 'EAABwzLixnjYBOZBmZC9QzZCrQ2ZBsaKzGQ7rQ9QmZC5',
    refreshToken: 'refresh_token_facebook_123',
    expiresIn: 3600,
    tokenType: 'Bearer'
  },
  instagram: {
    accessToken: 'IGQVJYaEZBsaKzGQ7rQ9QmZC5EAABwzLixnjY',
    refreshToken: 'refresh_token_instagram_123',
    expiresIn: 3600,
    tokenType: 'Bearer'
  },
  twitter: {
    accessToken: 'twitter_access_token_123',
    refreshToken: 'twitter_refresh_token_123',
    expiresIn: 7200,
    tokenType: 'Bearer'
  },
  linkedin: {
    accessToken: 'linkedin_access_token_123',
    refreshToken: 'linkedin_refresh_token_123',
    expiresIn: 5184000,
    tokenType: 'Bearer'
  }
};

// Mock platform user data
export const mockPlatformUsers = {
  facebook: {
    platformId: '123456789',
    username: 'testuser_fb',
    displayName: 'Test User Facebook',
    profileUrl: 'https://facebook.com/testuser_fb',
    profileImage: 'https://facebook.com/testuser_fb/picture',
    followersCount: 1500,
    followingCount: 300,
    postsCount: 250
  },
  instagram: {
    platformId: '987654321',
    username: 'testuser_ig',
    displayName: 'Test User IG',
    profileUrl: 'https://instagram.com/testuser_ig',
    profileImage: 'https://instagram.com/testuser_ig/picture.jpg',
    followersCount: 2500,
    followingCount: 450,
    postsCount: 180
  },
  twitter: {
    platformId: '456789123',
    username: 'testuser_tw',
    displayName: 'Test User Twitter',
    profileUrl: 'https://twitter.com/testuser_tw',
    profileImage: 'https://twitter.com/testuser_tw/profile_image',
    followersCount: 800,
    followingCount: 1200,
    postsCount: 1500
  },
  linkedin: {
    platformId: '789123456',
    username: 'test-user-linkedin',
    displayName: 'Test User LinkedIn',
    profileUrl: 'https://linkedin.com/in/test-user-linkedin',
    profileImage: 'https://linkedin.com/in/test-user-linkedin/picture',
    followersCount: 500,
    followingCount: 800,
    postsCount: 45
  }
};

// Test social account fixtures
export const testSocialAccounts = {
  activeFacebookAccount: {
    platform: socialPlatforms.facebook,
    platformId: mockPlatformUsers.facebook.platformId,
    username: mockPlatformUsers.facebook.username,
    displayName: mockPlatformUsers.facebook.displayName,
    profileUrl: mockPlatformUsers.facebook.profileUrl,
    profileImage: mockPlatformUsers.facebook.profileImage,
    accessToken: mockTokens.facebook.accessToken,
    refreshToken: mockTokens.facebook.refreshToken,
    tokenExpiry: new Date(Date.now() + 3600 * 1000), // 1 hour from now
    scope: ['pages_manage_posts', 'pages_read_engagement', 'pages_manage_metadata'],
    platformData: {
      permissions: ['pages_manage_posts', 'pages_read_engagement'],
      pageId: 'facebook_page_123',
      pageName: 'Test Business Page'
    },
    followersCount: mockPlatformUsers.facebook.followersCount,
    followingCount: mockPlatformUsers.facebook.followingCount,
    postsCount: mockPlatformUsers.facebook.postsCount,
    status: 'ACTIVE' as AccountStatus,
    lastSyncAt: new Date()
  },

  activeInstagramAccount: {
    platform: socialPlatforms.instagram,
    platformId: mockPlatformUsers.instagram.platformId,
    username: mockPlatformUsers.instagram.username,
    displayName: mockPlatformUsers.instagram.displayName,
    profileUrl: mockPlatformUsers.instagram.profileUrl,
    profileImage: mockPlatformUsers.instagram.profileImage,
    accessToken: mockTokens.instagram.accessToken,
    refreshToken: mockTokens.instagram.refreshToken,
    tokenExpiry: new Date(Date.now() + 3600 * 1000),
    scope: ['instagram_basic', 'instagram_content_publish', 'pages_read_engagement'],
    platformData: {
      accountType: 'BUSINESS',
      businessCategory: 'Social Media Marketing'
    },
    followersCount: mockPlatformUsers.instagram.followersCount,
    followingCount: mockPlatformUsers.instagram.followingCount,
    postsCount: mockPlatformUsers.instagram.postsCount,
    status: 'ACTIVE' as AccountStatus,
    lastSyncAt: new Date()
  },

  expiredTwitterAccount: {
    platform: socialPlatforms.twitter,
    platformId: mockPlatformUsers.twitter.platformId,
    username: mockPlatformUsers.twitter.username,
    displayName: mockPlatformUsers.twitter.displayName,
    profileUrl: mockPlatformUsers.twitter.profileUrl,
    profileImage: mockPlatformUsers.twitter.profileImage,
    accessToken: mockTokens.twitter.accessToken,
    refreshToken: mockTokens.twitter.refreshToken,
    tokenExpiry: new Date(Date.now() - 3600 * 1000), // Expired 1 hour ago
    scope: ['tweet.read', 'tweet.write', 'users.read'],
    platformData: {
      verified: false,
      protected: false
    },
    followersCount: mockPlatformUsers.twitter.followersCount,
    followingCount: mockPlatformUsers.twitter.followingCount,
    postsCount: mockPlatformUsers.twitter.postsCount,
    status: 'EXPIRED' as AccountStatus,
    lastSyncAt: new Date(Date.now() - 7200 * 1000) // 2 hours ago
  },

  revokedLinkedInAccount: {
    platform: socialPlatforms.linkedin,
    platformId: mockPlatformUsers.linkedin.platformId,
    username: mockPlatformUsers.linkedin.username,
    displayName: mockPlatformUsers.linkedin.displayName,
    profileUrl: mockPlatformUsers.linkedin.profileUrl,
    profileImage: mockPlatformUsers.linkedin.profileImage,
    accessToken: 'revoked_token',
    refreshToken: 'revoked_refresh',
    tokenExpiry: new Date(Date.now() + 5184000 * 1000), // Future date
    scope: ['r_liteprofile', 'w_member_social'],
    platformData: {
      industry: 'Marketing and Advertising',
      companySize: '11-50'
    },
    followersCount: mockPlatformUsers.linkedin.followersCount,
    followingCount: mockPlatformUsers.linkedin.followingCount,
    postsCount: mockPlatformUsers.linkedin.postsCount,
    status: 'REVOKED' as AccountStatus,
    lastSyncAt: new Date(Date.now() - 86400 * 1000) // 1 day ago
  },

  errorAccount: {
    platform: socialPlatforms.tiktok,
    platformId: '999888777',
    username: 'error_account',
    displayName: 'Error Account',
    profileUrl: 'https://tiktok.com/@error_account',
    profileImage: null,
    accessToken: 'error_token',
    refreshToken: null,
    tokenExpiry: null,
    scope: [],
    platformData: {},
    followersCount: 0,
    followingCount: 0,
    postsCount: 0,
    status: 'ERROR' as AccountStatus,
    lastSyncAt: null
  }
};

// OAuth callback test data
export const oauthCallbackData = {
  facebook: {
    validCallback: {
      code: 'facebook_auth_code_123',
      state: 'csrf_state_token_123'
    },
    errorCallback: {
      error: 'access_denied',
      error_description: 'User cancelled authorization'
    },
    invalidState: {
      code: 'facebook_auth_code_123',
      state: 'invalid_state_token'
    }
  },

  instagram: {
    validCallback: {
      code: 'instagram_auth_code_456',
      state: 'csrf_state_token_456'
    },
    errorCallback: {
      error: 'access_denied',
      error_reason: 'user_denied',
      error_description: 'The user denied your request.'
    }
  },

  twitter: {
    validCallback: {
      code: 'twitter_auth_code_789',
      state: 'csrf_state_token_789'
    },
    errorCallback: {
      error: 'access_denied',
      error_description: 'The user denied the request'
    }
  }
};

// Mock API responses from social platforms
export const mockApiResponses = {
  facebook: {
    tokenExchange: {
      access_token: mockTokens.facebook.accessToken,
      token_type: 'bearer',
      expires_in: 3600
    },
    userProfile: {
      id: mockPlatformUsers.facebook.platformId,
      name: mockPlatformUsers.facebook.displayName,
      picture: { data: { url: mockPlatformUsers.facebook.profileImage } }
    },
    pageInsights: {
      impressions: 15000,
      reach: 12000,
      engagement: 450,
      clicks: 230
    }
  },

  instagram: {
    tokenExchange: {
      access_token: mockTokens.instagram.accessToken,
      token_type: 'bearer',
      expires_in: 3600
    },
    userProfile: {
      id: mockPlatformUsers.instagram.platformId,
      username: mockPlatformUsers.instagram.username,
      account_type: 'BUSINESS',
      media_count: mockPlatformUsers.instagram.postsCount
    },
    insights: {
      impressions: 8500,
      reach: 7200,
      profile_views: 320,
      website_clicks: 45
    }
  },

  twitter: {
    tokenExchange: {
      access_token: mockTokens.twitter.accessToken,
      refresh_token: mockTokens.twitter.refreshToken,
      token_type: 'bearer',
      expires_in: 7200
    },
    userProfile: {
      data: {
        id: mockPlatformUsers.twitter.platformId,
        username: mockPlatformUsers.twitter.username,
        name: mockPlatformUsers.twitter.displayName,
        public_metrics: {
          followers_count: mockPlatformUsers.twitter.followersCount,
          following_count: mockPlatformUsers.twitter.followingCount,
          tweet_count: mockPlatformUsers.twitter.postsCount
        }
      }
    }
  }
};

// Helper functions
export const createTestSocialAccount = (
  userId: string,
  platform: SocialPlatform,
  overrides: Partial<any> = {}
) => ({
  ...testSocialAccounts.activeFacebookAccount,
  ...mockPlatformUsers[platform.toLowerCase() as keyof typeof mockPlatformUsers],
  platform,
  userId,
  ...overrides,
  id: `social_${platform.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  connectedAt: new Date(),
  updatedAt: new Date()
});

export const createMockOAuthState = (
  userId: string,
  platform: SocialPlatform,
  organizationId?: string
) => ({
  state: `oauth_state_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  userId,
  platform,
  organizationId,
  createdAt: new Date(),
  expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
});

// Test data for social media insights
export const mockInsightsData = {
  daily: [
    { date: '2024-01-01', impressions: 1200, reach: 1000, engagement: 45, clicks: 23 },
    { date: '2024-01-02', impressions: 1350, reach: 1100, engagement: 52, clicks: 28 },
    { date: '2024-01-03', impressions: 980, reach: 850, engagement: 38, clicks: 19 },
    { date: '2024-01-04', impressions: 1450, reach: 1250, engagement: 67, clicks: 34 },
    { date: '2024-01-05', impressions: 1600, reach: 1400, engagement: 78, clicks: 41 }
  ],
  weekly: {
    totalImpressions: 6580,
    totalReach: 5600,
    totalEngagement: 280,
    totalClicks: 145,
    averageEngagementRate: 4.26,
    growthRate: 12.5
  },
  monthly: {
    totalImpressions: 28000,
    totalReach: 24500,
    totalEngagement: 1200,
    totalClicks: 620,
    followerGrowth: 150,
    topPerformingPost: 'post_123456',
    engagementRate: 4.9
  }
};