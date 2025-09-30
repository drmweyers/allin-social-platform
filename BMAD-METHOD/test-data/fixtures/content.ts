import { PostStatus, MediaType, ScheduleStatus, RecurringPattern, CampaignStatus, SocialPlatform } from '@prisma/client';

// Test content templates
export const testContent = {
  // Text-only posts
  simpleTextPost: {
    content: 'Just testing our social media management platform! 🚀 #testing #socialmedia',
    hashtags: ['#testing', '#socialmedia', '#platform'],
    mentions: [],
    platforms: ['FACEBOOK', 'TWITTER'] as SocialPlatform[]
  },

  longTextPost: {
    content: `🌟 Exciting news! We're launching our new social media management platform that will revolutionize how businesses handle their social presence.

Key features include:
✅ Multi-platform scheduling
✅ AI-powered content suggestions
✅ Advanced analytics
✅ Team collaboration tools
✅ Automated reporting

Join the waitlist today! Link in bio 👆

#socialmedia #marketing #automation #business #startup #tech #AI #scheduling #analytics #teamwork`,
    hashtags: ['#socialmedia', '#marketing', '#automation', '#business', '#startup', '#tech', '#AI', '#scheduling', '#analytics', '#teamwork'],
    mentions: [],
    platforms: ['FACEBOOK', 'INSTAGRAM', 'LINKEDIN'] as SocialPlatform[]
  },

  // Posts with mentions
  postWithMentions: {
    content: 'Thanks to @john_doe and @jane_smith for their amazing feedback on our platform! 🙏 #grateful #feedback',
    hashtags: ['#grateful', '#feedback'],
    mentions: ['@john_doe', '@jane_smith'],
    platforms: ['TWITTER', 'LINKEDIN'] as SocialPlatform[]
  },

  // Question posts
  engagementPost: {
    content: 'What\'s your biggest challenge with social media management? 🤔\n\nA) Content creation\nB) Consistent posting\nC) Measuring ROI\nD) Team coordination\n\nComment below! 👇',
    hashtags: ['#socialmedia', '#marketing', '#engagement', '#question'],
    mentions: [],
    platforms: ['FACEBOOK', 'INSTAGRAM', 'LINKEDIN'] as SocialPlatform[]
  },

  // Platform-specific content
  twitterSpecific: {
    content: 'Quick tip: Use our bulk scheduling feature to plan your entire week in 30 minutes! 💡 #productivity #socialmedia',
    hashtags: ['#productivity', '#socialmedia', '#tip'],
    mentions: [],
    platforms: ['TWITTER'] as SocialPlatform[]
  },

  instagramSpecific: {
    content: 'Behind the scenes of our content creation process ✨\n\nSwipe to see how we turn ideas into viral posts! ➡️\n\n#BehindTheScenes #ContentCreation #SocialMedia #Process #Creative',
    hashtags: ['#BehindTheScenes', '#ContentCreation', '#SocialMedia', '#Process', '#Creative'],
    mentions: [],
    platforms: ['INSTAGRAM'] as SocialPlatform[]
  },

  linkedinSpecific: {
    content: `The social media landscape has evolved dramatically over the past decade. Here are 5 key trends shaping the industry:

1. Video-first content strategies
2. AI-powered personalization
3. Social commerce integration
4. Micro-influencer partnerships
5. Real-time engagement tools

Which trend has impacted your business the most?

#SocialMedia #DigitalMarketing #BusinessStrategy #Trends #Marketing`,
    hashtags: ['#SocialMedia', '#DigitalMarketing', '#BusinessStrategy', '#Trends', '#Marketing'],
    mentions: [],
    platforms: ['LINKEDIN'] as SocialPlatform[]
  }
};

// Test media fixtures
export const testMedia = {
  singleImage: {
    url: 'https://example.com/images/test-image.jpg',
    thumbnailUrl: 'https://example.com/images/test-image-thumb.jpg',
    type: 'IMAGE' as MediaType,
    mimeType: 'image/jpeg',
    size: 1024000, // 1MB
    width: 1080,
    height: 1080,
    title: 'Test Image',
    description: 'A test image for social media',
    altText: 'Test image showing social media platform interface'
  },

  multipleImages: [
    {
      url: 'https://example.com/images/carousel-1.jpg',
      thumbnailUrl: 'https://example.com/images/carousel-1-thumb.jpg',
      type: 'IMAGE' as MediaType,
      mimeType: 'image/jpeg',
      size: 850000,
      width: 1080,
      height: 1080,
      title: 'Carousel Image 1',
      altText: 'First image in carousel showing feature overview'
    },
    {
      url: 'https://example.com/images/carousel-2.jpg',
      thumbnailUrl: 'https://example.com/images/carousel-2-thumb.jpg',
      type: 'IMAGE' as MediaType,
      mimeType: 'image/jpeg',
      size: 920000,
      width: 1080,
      height: 1080,
      title: 'Carousel Image 2',
      altText: 'Second image showing analytics dashboard'
    },
    {
      url: 'https://example.com/images/carousel-3.jpg',
      thumbnailUrl: 'https://example.com/images/carousel-3-thumb.jpg',
      type: 'IMAGE' as MediaType,
      mimeType: 'image/jpeg',
      size: 780000,
      width: 1080,
      height: 1080,
      title: 'Carousel Image 3',
      altText: 'Third image showing team collaboration features'
    }
  ],

  video: {
    url: 'https://example.com/videos/demo-video.mp4',
    thumbnailUrl: 'https://example.com/videos/demo-video-thumb.jpg',
    type: 'VIDEO' as MediaType,
    mimeType: 'video/mp4',
    size: 15728640, // 15MB
    width: 1920,
    height: 1080,
    duration: 120, // 2 minutes
    title: 'Platform Demo Video',
    description: 'Comprehensive demo of our social media platform features',
    altText: 'Video demonstration of social media management platform'
  },

  gif: {
    url: 'https://example.com/gifs/animated-demo.gif',
    type: 'GIF' as MediaType,
    mimeType: 'image/gif',
    size: 2048000, // 2MB
    width: 640,
    height: 480,
    title: 'Animated Feature Demo',
    description: 'Short animated demonstration of key features'
  }
};

// Test post fixtures
export const testPosts = {
  draftPost: {
    content: testContent.simpleTextPost.content,
    media: [],
    hashtags: testContent.simpleTextPost.hashtags,
    mentions: testContent.simpleTextPost.mentions,
    status: 'DRAFT' as PostStatus,
    likes: 0,
    comments: 0,
    shares: 0,
    views: 0
  },

  scheduledPost: {
    content: testContent.engagementPost.content,
    media: [testMedia.singleImage],
    hashtags: testContent.engagementPost.hashtags,
    mentions: testContent.engagementPost.mentions,
    status: 'SCHEDULED' as PostStatus,
    likes: 0,
    comments: 0,
    shares: 0,
    views: 0
  },

  publishedPost: {
    content: testContent.postWithMentions.content,
    media: [],
    hashtags: testContent.postWithMentions.hashtags,
    mentions: testContent.postWithMentions.mentions,
    status: 'PUBLISHED' as PostStatus,
    platformPostId: 'platform_post_12345',
    publishedAt: new Date(Date.now() - 3600000), // 1 hour ago
    likes: 45,
    comments: 8,
    shares: 12,
    views: 500
  },

  failedPost: {
    content: testContent.twitterSpecific.content,
    media: [],
    hashtags: testContent.twitterSpecific.hashtags,
    mentions: testContent.twitterSpecific.mentions,
    status: 'FAILED' as PostStatus,
    likes: 0,
    comments: 0,
    shares: 0,
    views: 0
  },

  videoPost: {
    content: 'Check out this amazing demo of our platform! 🎥 #demo #video',
    media: [testMedia.video],
    hashtags: ['#demo', '#video', '#platform'],
    mentions: [],
    status: 'PUBLISHED' as PostStatus,
    platformPostId: 'platform_video_67890',
    publishedAt: new Date(Date.now() - 7200000), // 2 hours ago
    likes: 128,
    comments: 23,
    shares: 45,
    views: 2500
  }
};

// Test draft fixtures
export const testDrafts = {
  simpleDraft: {
    title: 'Product Launch Announcement',
    content: testContent.longTextPost.content,
    platforms: testContent.longTextPost.platforms,
    mediaUrls: ['https://example.com/images/product-launch.jpg'],
    hashtags: testContent.longTextPost.hashtags,
    aiGenerated: false,
    scheduledFor: null
  },

  aiGeneratedDraft: {
    title: 'AI-Generated Social Post',
    content: 'Discover the future of social media management with our AI-powered platform! 🤖 #AI #automation #socialmedia',
    platforms: ['FACEBOOK', 'INSTAGRAM', 'TWITTER'] as SocialPlatform[],
    mediaUrls: [],
    hashtags: ['#AI', '#automation', '#socialmedia'],
    aiGenerated: true,
    aiPrompt: 'Create an engaging social media post about AI-powered social media management',
    aiModel: 'claude-3.5-sonnet',
    scheduledFor: new Date(Date.now() + 86400000) // 24 hours from now
  },

  scheduledDraft: {
    title: 'Weekly Tips Post',
    content: testContent.twitterSpecific.content,
    platforms: testContent.twitterSpecific.platforms,
    mediaUrls: [],
    hashtags: testContent.twitterSpecific.hashtags,
    aiGenerated: false,
    scheduledFor: new Date(Date.now() + 3600000) // 1 hour from now
  }
};

// Test content template fixtures
export const testTemplates = {
  promotionalTemplate: {
    name: 'Product Promotion Template',
    description: 'Template for promoting products or features',
    category: 'promotion',
    template: '🚀 Introducing {PRODUCT_NAME}!\n\n{PRODUCT_DESCRIPTION}\n\n✨ Key benefits:\n{BENEFITS_LIST}\n\n{CALL_TO_ACTION} {LINK}\n\n{HASHTAGS}',
    variables: ['PRODUCT_NAME', 'PRODUCT_DESCRIPTION', 'BENEFITS_LIST', 'CALL_TO_ACTION', 'LINK', 'HASHTAGS'],
    platforms: ['FACEBOOK', 'INSTAGRAM', 'LINKEDIN'] as SocialPlatform[],
    isPublic: true,
    usageCount: 25
  },

  tipTemplate: {
    name: 'Quick Tip Template',
    description: 'Template for sharing tips and advice',
    category: 'educational',
    template: '💡 Quick Tip: {TIP_CONTENT}\n\n{EXPLANATION}\n\n👍 Like if this helped you!\n\n{HASHTAGS}',
    variables: ['TIP_CONTENT', 'EXPLANATION', 'HASHTAGS'],
    platforms: ['TWITTER', 'LINKEDIN', 'FACEBOOK'] as SocialPlatform[],
    isPublic: true,
    usageCount: 18
  },

  questionTemplate: {
    name: 'Engagement Question Template',
    description: 'Template for asking engaging questions',
    category: 'engagement',
    template: '{QUESTION} 🤔\n\n{OPTIONS}\n\n{CALL_TO_ACTION}\n\n{HASHTAGS}',
    variables: ['QUESTION', 'OPTIONS', 'CALL_TO_ACTION', 'HASHTAGS'],
    platforms: ['FACEBOOK', 'INSTAGRAM', 'LINKEDIN'] as SocialPlatform[],
    isPublic: false,
    usageCount: 12
  }
};

// Test scheduling fixtures
export const testScheduling = {
  immediateSchedule: {
    scheduledFor: new Date(),
    timezone: 'UTC',
    status: 'PENDING' as ScheduleStatus,
    publishAttempts: 0,
    isOptimalTime: false,
    suggestedBy: 'USER'
  },

  futureSchedule: {
    scheduledFor: new Date(Date.now() + 86400000), // 24 hours from now
    timezone: 'America/New_York',
    status: 'PENDING' as ScheduleStatus,
    publishAttempts: 0,
    isOptimalTime: true,
    suggestedBy: 'AI'
  },

  recurringSchedule: {
    scheduledFor: new Date(Date.now() + 3600000), // 1 hour from now
    timezone: 'UTC',
    isRecurring: true,
    recurringPattern: 'WEEKLY' as RecurringPattern,
    recurringEndDate: new Date(Date.now() + 30 * 86400000), // 30 days from now
    status: 'PENDING' as ScheduleStatus,
    publishAttempts: 0,
    isOptimalTime: true,
    suggestedBy: 'SYSTEM'
  },

  failedSchedule: {
    scheduledFor: new Date(Date.now() - 3600000), // 1 hour ago
    timezone: 'UTC',
    status: 'FAILED' as ScheduleStatus,
    publishAttempts: 3,
    lastError: 'Token expired: Please reconnect your social account',
    isOptimalTime: false,
    suggestedBy: 'USER'
  }
};

// Test campaign fixtures
export const testCampaigns = {
  activeCampaign: {
    name: 'Product Launch Campaign',
    description: 'Multi-platform campaign for new product launch',
    startDate: new Date(),
    endDate: new Date(Date.now() + 14 * 86400000), // 14 days from now
    status: 'ACTIVE' as CampaignStatus
  },

  scheduledCampaign: {
    name: 'Holiday Marketing Campaign',
    description: 'Seasonal marketing campaign for holidays',
    startDate: new Date(Date.now() + 7 * 86400000), // 7 days from now
    endDate: new Date(Date.now() + 21 * 86400000), // 21 days from now
    status: 'SCHEDULED' as CampaignStatus
  },

  completedCampaign: {
    name: 'Summer Sale Campaign',
    description: 'Completed summer sale promotional campaign',
    startDate: new Date(Date.now() - 21 * 86400000), // 21 days ago
    endDate: new Date(Date.now() - 7 * 86400000), // 7 days ago
    status: 'COMPLETED' as CampaignStatus
  }
};

// Helper functions
export const createTestPost = (
  userId: string,
  socialAccountId: string,
  overrides: Partial<any> = {}
) => ({
  ...testPosts.draftPost,
  userId,
  socialAccountId,
  ...overrides,
  id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  createdAt: new Date(),
  updatedAt: new Date()
});

export const createTestDraft = (
  userId: string,
  overrides: Partial<any> = {}
) => ({
  ...testDrafts.simpleDraft,
  userId,
  ...overrides,
  id: `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  createdAt: new Date(),
  updatedAt: new Date()
});

export const createTestTemplate = (
  userId: string,
  overrides: Partial<any> = {}
) => ({
  ...testTemplates.promotionalTemplate,
  userId,
  ...overrides,
  id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  createdAt: new Date(),
  updatedAt: new Date()
});

export const createTestScheduledPost = (
  postId: string,
  socialAccountId: string,
  userId: string,
  overrides: Partial<any> = {}
) => ({
  ...testScheduling.futureSchedule,
  postId,
  socialAccountId,
  userId,
  ...overrides,
  id: `scheduled_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  createdAt: new Date(),
  updatedAt: new Date()
});

// Content validation patterns
export const contentValidation = {
  maxContentLength: {
    TWITTER: 280,
    FACEBOOK: 63206,
    INSTAGRAM: 2200,
    LINKEDIN: 1300,
    TIKTOK: 150,
    YOUTUBE: 5000,
    PINTEREST: 500,
    SNAPCHAT: 250,
    REDDIT: 40000,
    THREADS: 500
  },
  hashtagLimits: {
    TWITTER: 2,
    FACEBOOK: 2,
    INSTAGRAM: 30,
    LINKEDIN: 3,
    TIKTOK: 4,
    YOUTUBE: 15,
    PINTEREST: 20,
    SNAPCHAT: 0,
    REDDIT: 0,
    THREADS: 5
  },
  mediaLimits: {
    TWITTER: { images: 4, videos: 1 },
    FACEBOOK: { images: 10, videos: 1 },
    INSTAGRAM: { images: 10, videos: 1 },
    LINKEDIN: { images: 9, videos: 1 },
    TIKTOK: { images: 0, videos: 1 },
    YOUTUBE: { images: 1, videos: 1 },
    PINTEREST: { images: 1, videos: 1 },
    SNAPCHAT: { images: 1, videos: 1 },
    REDDIT: { images: 20, videos: 1 },
    THREADS: { images: 10, videos: 1 }
  }
};