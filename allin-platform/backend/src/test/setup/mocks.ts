// Comprehensive Mock Setup for AllIN Platform Testing

// OpenAI Mock
export const mockOpenAICompletion = jest.fn().mockResolvedValue({
  data: {
    choices: [
      {
        text: 'Generated content for social media post',
        message: {
          content: 'Generated content for social media post'
        }
      }
    ]
  }
});

// Email Service Mock
export const mockEmailSend = jest.fn().mockResolvedValue({
  success: true,
  messageId: 'mock-message-id-12345'
});

// Social Media Platform Mocks
export const mockFacebookAPI = {
  post: jest.fn().mockResolvedValue({ id: 'fb-post-123', success: true }),
  getProfile: jest.fn().mockResolvedValue({ id: 'fb-user-123', name: 'Test User' }),
  getMetrics: jest.fn().mockResolvedValue({ likes: 100, shares: 50, comments: 25 })
};

export const mockInstagramAPI = {
  post: jest.fn().mockResolvedValue({ id: 'ig-post-123', success: true }),
  getProfile: jest.fn().mockResolvedValue({ id: 'ig-user-123', username: 'testuser' }),
  getMetrics: jest.fn().mockResolvedValue({ likes: 200, comments: 30 })
};

export const mockTwitterAPI = {
  tweet: jest.fn().mockResolvedValue({ id: 'tw-123', success: true }),
  getProfile: jest.fn().mockResolvedValue({ id: 'tw-user-123', screen_name: 'testuser' }),
  getMetrics: jest.fn().mockResolvedValue({ retweets: 50, likes: 100 })
};

export const mockLinkedInAPI = {
  share: jest.fn().mockResolvedValue({ id: 'li-post-123', success: true }),
  getProfile: jest.fn().mockResolvedValue({ id: 'li-user-123', firstName: 'Test' }),
  getMetrics: jest.fn().mockResolvedValue({ views: 500, reactions: 75 })
};

export const mockTikTokAPI = {
  upload: jest.fn().mockResolvedValue({ id: 'tt-video-123', success: true }),
  getProfile: jest.fn().mockResolvedValue({ id: 'tt-user-123', unique_id: 'testuser' }),
  getMetrics: jest.fn().mockResolvedValue({ views: 1000, likes: 250 })
};

export const mockYouTubeAPI = {
  upload: jest.fn().mockResolvedValue({ id: 'yt-video-123', success: true }),
  getChannel: jest.fn().mockResolvedValue({ id: 'yt-channel-123', title: 'Test Channel' }),
  getMetrics: jest.fn().mockResolvedValue({ views: 5000, likes: 300, subscribers: 100 })
};

// Claude/Anthropic Mock
export const mockClaudeAPI = {
  complete: jest.fn().mockResolvedValue({
    completion: 'AI-generated response from Claude',
    usage: { prompt_tokens: 100, completion_tokens: 50 }
  })
};

// Database Mock Factory
export const createMockPrismaClient = () => ({
  user: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn()
  },
  post: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  },
  draft: {
    create: jest.fn(),
    createMany: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn()
  },
  socialAccount: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  },
  scheduledPost: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  },
  team: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  },
  teamMember: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  },
  session: {
    create: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn()
  },
  contentTemplate: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn()
  },
  verificationToken: {
    create: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn()
  },
  $transaction: jest.fn((callback) => Promise.resolve(callback()))
});

// Redis Mock
export const mockRedisClient = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  expire: jest.fn(),
  ttl: jest.fn(),
  hget: jest.fn(),
  hset: jest.fn(),
  hdel: jest.fn(),
  hgetall: jest.fn(),
  sadd: jest.fn(),
  srem: jest.fn(),
  smembers: jest.fn(),
  zadd: jest.fn(),
  zrem: jest.fn(),
  zrange: jest.fn(),
  connect: jest.fn().mockResolvedValue(undefined),
  disconnect: jest.fn().mockResolvedValue(undefined),
  on: jest.fn()
};

// JWT Mock
export const mockJWT = {
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
  verify: jest.fn().mockReturnValue({ userId: 'user-123', email: 'test@example.com' }),
  decode: jest.fn().mockReturnValue({ userId: 'user-123', email: 'test@example.com' })
};

// Bcrypt Mock
export const mockBcrypt = {
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(true)
};

// Express Request/Response Mocks
export const createMockRequest = (overrides = {}) => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  user: null,
  session: null,
  cookies: {},
  ip: '127.0.0.1',
  method: 'GET',
  url: '/',
  path: '/',
  ...overrides
});

export const createMockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  return res;
};

export const createMockNext = () => jest.fn();

// File Upload Mock
export const mockMulter = {
  single: jest.fn().mockReturnValue((req: any, _res: any, next: any) => {
    req.file = {
      fieldname: 'file',
      originalname: 'test.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      destination: '/uploads',
      filename: 'test-123.jpg',
      path: '/uploads/test-123.jpg',
      size: 1024
    };
    next();
  }),
  array: jest.fn().mockReturnValue((req: any, _res: any, next: any) => {
    req.files = [
      {
        fieldname: 'files',
        originalname: 'test1.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        destination: '/uploads',
        filename: 'test1-123.jpg',
        path: '/uploads/test1-123.jpg',
        size: 1024
      },
      {
        fieldname: 'files',
        originalname: 'test2.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        destination: '/uploads',
        filename: 'test2-123.jpg',
        path: '/uploads/test2-123.jpg',
        size: 2048
      }
    ];
    next();
  })
};

// WebSocket Mock
export const mockWebSocket = {
  emit: jest.fn(),
  on: jest.fn(),
  join: jest.fn(),
  leave: jest.fn(),
  to: jest.fn().mockReturnThis(),
  broadcast: {
    emit: jest.fn()
  }
};

// Test Data Factories
export const createTestUser = (overrides = {}) => ({
  id: 'user-test-123',
  email: 'test@example.com',
  name: 'Test User',
  password: 'hashed-password',
  role: 'USER',
  status: 'ACTIVE',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

export const createTestPost = (overrides = {}) => ({
  id: 'post-test-123',
  content: 'Test post content',
  platforms: ['facebook', 'twitter'],
  mediaUrls: [],
  userId: 'user-test-123',
  status: 'PUBLISHED',
  publishedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

export const createTestDraft = (overrides = {}) => ({
  id: 'draft-test-123',
  content: 'Test draft content',
  platforms: ['instagram'],
  mediaUrls: [],
  userId: 'user-test-123',
  templateId: null,
  scheduledFor: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

export const createTestSocialAccount = (overrides = {}) => ({
  id: 'social-test-123',
  platform: 'FACEBOOK',
  accountId: 'fb-account-123',
  accountName: 'Test Facebook Page',
  accessToken: 'encrypted-token',
  refreshToken: 'encrypted-refresh-token',
  userId: 'user-test-123',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

export const createTestTeam = (overrides = {}) => ({
  id: 'team-test-123',
  name: 'Test Team',
  description: 'A test team',
  createdBy: 'user-test-123',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

// Error Mock Factories
export const createValidationError = (field: string, message: string) => ({
  field,
  message,
  code: 'VALIDATION_ERROR'
});

export const createAPIError = (status: number, message: string) => ({
  status,
  message,
  timestamp: new Date().toISOString()
});

// Environment Variable Mocks
export const mockEnv = {
  NODE_ENV: 'test',
  PORT: '5000',
  DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
  REDIS_URL: 'redis://localhost:6379',
  JWT_SECRET: 'test-jwt-secret',
  SESSION_SECRET: 'test-session-secret',
  OPENAI_API_KEY: 'test-openai-key',
  CLAUDE_API_KEY: 'test-claude-key',
  FACEBOOK_APP_ID: 'test-fb-app-id',
  FACEBOOK_APP_SECRET: 'test-fb-secret',
  INSTAGRAM_CLIENT_ID: 'test-ig-client-id',
  INSTAGRAM_CLIENT_SECRET: 'test-ig-secret',
  TWITTER_API_KEY: 'test-twitter-key',
  TWITTER_API_SECRET: 'test-twitter-secret',
  LINKEDIN_CLIENT_ID: 'test-linkedin-id',
  LINKEDIN_CLIENT_SECRET: 'test-linkedin-secret',
  TIKTOK_CLIENT_KEY: 'test-tiktok-key',
  TIKTOK_CLIENT_SECRET: 'test-tiktok-secret',
  YOUTUBE_CLIENT_ID: 'test-youtube-id',
  YOUTUBE_CLIENT_SECRET: 'test-youtube-secret',
  SMTP_HOST: 'smtp.test.com',
  SMTP_PORT: '587',
  SMTP_USER: 'test@example.com',
  SMTP_PASS: 'test-password',
  FRONTEND_URL: 'http://localhost:3001',
  BACKEND_URL: 'http://localhost:5000'
};

export default {
  mockOpenAICompletion,
  mockEmailSend,
  mockFacebookAPI,
  mockInstagramAPI,
  mockTwitterAPI,
  mockLinkedInAPI,
  mockTikTokAPI,
  mockYouTubeAPI,
  mockClaudeAPI,
  createMockPrismaClient,
  mockRedisClient,
  mockJWT,
  mockBcrypt,
  createMockRequest,
  createMockResponse,
  createMockNext,
  mockMulter,
  mockWebSocket,
  createTestUser,
  createTestPost,
  createTestDraft,
  createTestSocialAccount,
  createTestTeam,
  createValidationError,
  createAPIError,
  mockEnv
};