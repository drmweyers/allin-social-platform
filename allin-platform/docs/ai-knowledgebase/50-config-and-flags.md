# AllIN Platform Configuration & Feature Flags

## Environment Variables

### Core Application Settings
**File**: `.env` (not tracked in git)
**Example**: `.env.example`

#### Database Configuration
```bash
# PostgreSQL Database
DATABASE_URL="postgresql://username:password@localhost:5432/allin_platform?schema=public"
DIRECT_URL="postgresql://username:password@localhost:5432/allin_platform"  # For migrations

# Redis Cache (optional but recommended)
REDIS_URL="redis://localhost:6379"
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""  # If password protected
```

#### Authentication & Security
```bash
# JWT Configuration
JWT_SECRET="your-super-secure-jwt-secret-256-bits-minimum"
JWT_EXPIRES_IN="15m"           # Access token lifetime
REFRESH_TOKEN_EXPIRES_IN="7d"  # Refresh token lifetime
SESSION_MAX_AGE="604800000"    # Session cookie max age (7 days in ms)

# Password Security
BCRYPT_ROUNDS="12"             # Password hashing rounds
PASSWORD_MIN_LENGTH="8"        # Minimum password length

# Security Headers
CORS_ORIGIN="http://localhost:3000,https://yourdomain.com"
ALLOWED_HOSTS="localhost,yourdomain.com"
```

#### External Service APIs
```bash
# AI Services
OPENAI_API_KEY="sk-..."               # OpenAI GPT-4, DALL-E
ANTHROPIC_API_KEY="sk-ant-api..."     # Claude AI
AI_RATE_LIMIT_RPM="60"                # Requests per minute
AI_DEFAULT_MODEL="gpt-4"              # Default AI model

# Social Media APIs
FACEBOOK_APP_ID="your-facebook-app-id"
FACEBOOK_APP_SECRET="your-facebook-app-secret"
INSTAGRAM_CLIENT_ID="your-instagram-client-id"
INSTAGRAM_CLIENT_SECRET="your-instagram-client-secret"
TWITTER_CLIENT_ID="your-twitter-client-id"
TWITTER_CLIENT_SECRET="your-twitter-client-secret"
LINKEDIN_CLIENT_ID="your-linkedin-client-id"
LINKEDIN_CLIENT_SECRET="your-linkedin-client-secret"

# Email Service
MAILGUN_API_KEY="key-..."
MAILGUN_DOMAIN="mg.yourdomain.com"
EMAIL_FROM="noreply@yourdomain.com"
EMAIL_FROM_NAME="AllIN Platform"
```

#### File Storage & CDN
```bash
# Cloud Storage (AWS S3, Google Cloud, etc.)
STORAGE_PROVIDER="s3"                 # s3, gcs, azure, local
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="allin-platform-media"

# CDN Configuration
CDN_URL="https://cdn.yourdomain.com"
MAX_FILE_SIZE="10485760"              # 10MB in bytes
ALLOWED_FILE_TYPES="image/jpeg,image/png,image/gif,video/mp4"
```

#### Application Settings
```bash
# Environment
NODE_ENV="development"                # development, production, test
PORT="5000"                          # Backend server port
FRONTEND_URL="http://localhost:3000"  # Frontend URL for CORS, emails

# Features
ENABLE_REGISTRATION="true"            # Allow new user registration
ENABLE_EMAIL_VERIFICATION="true"     # Require email verification
ENABLE_SOCIAL_LOGIN="false"          # OAuth login (Google, Facebook, etc.)
ENABLE_WEBHOOKS="true"               # Social platform webhooks
ENABLE_QUEUE_PROCESSING="true"       # Background job processing

# Monitoring
LOG_LEVEL="info"                     # debug, info, warn, error
ENABLE_REQUEST_LOGGING="true"        # Log all HTTP requests
SENTRY_DSN=""                        # Error tracking (optional)
```

### Database Configuration
**Connection Settings**: `prisma/schema.prisma`

#### Primary Database
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")  // For migrations and schema introspection
}
```

#### Connection Pool Settings
```typescript
// src/lib/prisma.ts
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})
```

## Feature Flags

### User Management Features
**Location**: `src/config/features.ts`

#### Registration & Authentication
```typescript
const AUTH_FEATURES = {
  ENABLE_REGISTRATION: process.env.ENABLE_REGISTRATION === 'true',
  REQUIRE_EMAIL_VERIFICATION: process.env.ENABLE_EMAIL_VERIFICATION === 'true',
  ENABLE_SOCIAL_LOGIN: process.env.ENABLE_SOCIAL_LOGIN === 'true',
  ENABLE_MFA: process.env.ENABLE_MFA === 'true',  // Multi-factor authentication
  PASSWORD_COMPLEXITY_ENABLED: true,
  SESSION_DURATION_HOURS: parseInt(process.env.SESSION_DURATION_HOURS || '168'), // 7 days
}
```

#### User Role Features
```typescript
const ROLE_FEATURES = {
  // Super Admin features
  PLATFORM_ANALYTICS: ['SUPER_ADMIN'],
  USER_MANAGEMENT: ['SUPER_ADMIN', 'ADMIN'],
  BILLING_MANAGEMENT: ['SUPER_ADMIN', 'ADMIN'],

  // Organization features
  TEAM_COLLABORATION: ['ADMIN', 'EDITOR', 'MEMBER'],
  APPROVAL_WORKFLOWS: ['ADMIN', 'EDITOR'],
  WHITE_LABEL_REPORTS: ['ADMIN'],

  // Content features
  AI_CONTENT_GENERATION: ['USER', 'ADMIN', 'EDITOR', 'MEMBER'],
  BULK_SCHEDULING: ['ADMIN', 'EDITOR'],
  ADVANCED_ANALYTICS: ['ADMIN', 'EDITOR'],
}
```

### Platform Features
**Configuration**: Environment-based feature toggles

#### Social Media Platforms
```typescript
const PLATFORM_FEATURES = {
  FACEBOOK: {
    enabled: process.env.ENABLE_FACEBOOK === 'true',
    features: ['POSTS', 'STORIES', 'REELS', 'PAGES'],
    rateLimits: {
      postsPerHour: 200,
      apiCallsPerHour: 400,
    }
  },
  INSTAGRAM: {
    enabled: process.env.ENABLE_INSTAGRAM === 'true',
    features: ['POSTS', 'STORIES', 'REELS', 'IGTV'],
    rateLimits: {
      postsPerDay: 25,
      storiesPerDay: 100,
    }
  },
  TWITTER: {
    enabled: process.env.ENABLE_TWITTER === 'true',
    features: ['TWEETS', 'THREADS', 'SPACES'],
    rateLimits: {
      tweetsPerHour: 100,
      apiCallsPer15Min: 300,
    }
  },
  LINKEDIN: {
    enabled: process.env.ENABLE_LINKEDIN === 'true',
    features: ['POSTS', 'ARTICLES', 'COMPANY_PAGES'],
    rateLimits: {
      postsPerDay: 125,
      companyPostsPerDay: 25,
    }
  },
  TIKTOK: {
    enabled: process.env.ENABLE_TIKTOK === 'true',
    features: ['VIDEOS', 'STORIES'],
    rateLimits: {
      videosPerDay: 10,
    }
  }
}
```

#### AI Features
```typescript
const AI_FEATURES = {
  CONTENT_GENERATION: {
    enabled: process.env.ENABLE_AI_CONTENT === 'true',
    providers: ['OPENAI', 'ANTHROPIC'],
    models: {
      OPENAI: ['gpt-4', 'gpt-3.5-turbo'],
      ANTHROPIC: ['claude-3-sonnet', 'claude-3-haiku'],
    },
    rateLimits: {
      requestsPerMinute: parseInt(process.env.AI_RATE_LIMIT_RPM || '60'),
      creditsPerMonth: {
        STARTER: 30,
        PROFESSIONAL: 500,
        TEAM: 2000,
        ENTERPRISE: -1, // Unlimited
      }
    }
  },
  IMAGE_GENERATION: {
    enabled: process.env.ENABLE_AI_IMAGES === 'true',
    provider: 'OPENAI', // DALL-E 3
    maxImagesPerDay: {
      STARTER: 5,
      PROFESSIONAL: 50,
      TEAM: 200,
      ENTERPRISE: -1,
    }
  },
  HASHTAG_ANALYSIS: {
    enabled: process.env.ENABLE_HASHTAG_AI === 'true',
    trendsRefreshHours: 6,
    maxHashtagsPerRequest: 30,
  }
}
```

### Content Management Features
```typescript
const CONTENT_FEATURES = {
  SCHEDULING: {
    enabled: true,
    queueBasedScheduling: process.env.ENABLE_QUEUE_SCHEDULING === 'true',
    recurringPosts: process.env.ENABLE_RECURRING_POSTS === 'true',
    optimalTimeSuggestions: process.env.ENABLE_OPTIMAL_TIMES === 'true',
    bulkScheduling: true,
    campaignManagement: process.env.ENABLE_CAMPAIGNS === 'true',
  },
  MEDIA_MANAGEMENT: {
    enabled: true,
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
    allowedTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || ['image/jpeg', 'image/png'],
    cloudStorage: process.env.STORAGE_PROVIDER || 'local',
    cdnEnabled: !!process.env.CDN_URL,
  },
  COLLABORATION: {
    enabled: process.env.ENABLE_COLLABORATION === 'true',
    approvalWorkflows: process.env.ENABLE_APPROVALS === 'true',
    teamComments: true,
    versionHistory: process.env.ENABLE_VERSION_HISTORY === 'true',
    realTimeEditing: process.env.ENABLE_REALTIME_EDITING === 'true',
  }
}
```

### Analytics & Reporting Features
```typescript
const ANALYTICS_FEATURES = {
  BASIC_ANALYTICS: {
    enabled: true,
    metricsRetentionDays: parseInt(process.env.METRICS_RETENTION_DAYS || '365'),
    realTimeUpdates: process.env.ENABLE_REALTIME_ANALYTICS === 'true',
  },
  ADVANCED_ANALYTICS: {
    enabled: process.env.ENABLE_ADVANCED_ANALYTICS === 'true',
    competitorAnalysis: process.env.ENABLE_COMPETITOR_ANALYSIS === 'true',
    sentimentAnalysis: process.env.ENABLE_SENTIMENT_ANALYSIS === 'true',
    predictiveAnalytics: process.env.ENABLE_PREDICTIVE_ANALYTICS === 'true',
  },
  CUSTOM_REPORTS: {
    enabled: process.env.ENABLE_CUSTOM_REPORTS === 'true',
    scheduledReports: process.env.ENABLE_SCHEDULED_REPORTS === 'true',
    whiteLabelReports: process.env.ENABLE_WHITE_LABEL === 'true',
    exportFormats: ['PDF', 'EXCEL', 'CSV'],
  }
}
```

## Plan-Based Feature Access

### Subscription Tiers
**Location**: `src/config/plans.ts`

#### Starter Plan ($15/month)
```typescript
const STARTER_PLAN = {
  id: 'starter',
  name: 'Starter',
  price: 15,
  features: {
    users: 1,
    socialAccounts: 5,
    postsPerMonth: -1, // Unlimited
    aiCreditsPerMonth: 30,
    storageGB: 1,
    analytics: 'basic',
    support: 'email',
    features: [
      'BASIC_SCHEDULING',
      'BASIC_ANALYTICS',
      'AI_CONTENT_GENERATION',
      'EMAIL_SUPPORT',
    ],
    disabled: [
      'TEAM_COLLABORATION',
      'APPROVAL_WORKFLOWS',
      'CUSTOM_REPORTS',
      'API_ACCESS',
      'WHITE_LABEL',
    ]
  }
}
```

#### Professional Plan ($49/month)
```typescript
const PROFESSIONAL_PLAN = {
  id: 'professional',
  name: 'Professional',
  price: 49,
  features: {
    users: 3,
    socialAccounts: 15,
    postsPerMonth: -1,
    aiCreditsPerMonth: 500,
    storageGB: 10,
    analytics: 'advanced',
    support: 'priority_email',
    features: [
      'BASIC_SCHEDULING',
      'QUEUE_SCHEDULING',
      'BASIC_ANALYTICS',
      'ADVANCED_ANALYTICS',
      'AI_CONTENT_GENERATION',
      'APPROVAL_WORKFLOWS',
      'TEAM_COLLABORATION',
      'PRIORITY_SUPPORT',
    ],
    disabled: [
      'API_ACCESS',
      'WHITE_LABEL',
      'CUSTOM_AI_TRAINING',
    ]
  }
}
```

#### Team Plan ($99/month)
```typescript
const TEAM_PLAN = {
  id: 'team',
  name: 'Team',
  price: 99,
  features: {
    users: 10,
    socialAccounts: 50,
    postsPerMonth: -1,
    aiCreditsPerMonth: 2000,
    storageGB: 50,
    analytics: 'advanced',
    support: 'phone',
    features: [
      'ALL_SCHEDULING_FEATURES',
      'ADVANCED_ANALYTICS',
      'AI_CONTENT_GENERATION',
      'APPROVAL_WORKFLOWS',
      'TEAM_COLLABORATION',
      'CUSTOM_REPORTS',
      'API_ACCESS',
      'PHONE_SUPPORT',
    ],
    disabled: [
      'WHITE_LABEL',
      'CUSTOM_AI_TRAINING',
      'SLA_GUARANTEE',
    ]
  }
}
```

#### Enterprise Plan (Custom)
```typescript
const ENTERPRISE_PLAN = {
  id: 'enterprise',
  name: 'Enterprise',
  price: 'custom',
  features: {
    users: -1, // Unlimited
    socialAccounts: -1,
    postsPerMonth: -1,
    aiCreditsPerMonth: -1,
    storageGB: -1,
    analytics: 'enterprise',
    support: 'dedicated',
    features: [
      'ALL_FEATURES',
      'WHITE_LABEL',
      'CUSTOM_AI_TRAINING',
      'SLA_GUARANTEE',
      'DEDICATED_SUPPORT',
      'ON_PREMISE_DEPLOYMENT',
      'CUSTOM_INTEGRATIONS',
    ],
    disabled: []
  }
}
```

### Feature Access Control
**Implementation**: `src/middleware/planAccess.ts`

```typescript
// Middleware to check plan-based feature access
export const requireFeature = (featureName: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user
    const userPlan = await getUserPlan(user.id)

    if (!userPlan.features.includes(featureName)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FEATURE_NOT_AVAILABLE',
          message: `This feature requires ${getRequiredPlan(featureName)} plan or higher`,
          feature: featureName,
          currentPlan: userPlan.id,
          upgradeUrl: `/upgrade?feature=${featureName}`
        }
      })
    }

    next()
  }
}
```

### Usage Limits Enforcement
**Location**: `src/services/usage.service.ts`

#### Monthly Limits
```typescript
interface UsageLimits {
  aiCredits: number
  socialAccounts: number
  teamMembers: number
  storageBytes: number
  apiCalls: number
  customReports: number
}

// Check usage against plan limits
export async function checkUsageLimit(
  userId: string,
  limitType: keyof UsageLimits,
  increment: number = 1
): Promise<boolean> {
  const userPlan = await getUserPlan(userId)
  const currentUsage = await getCurrentUsage(userId)
  const planLimit = userPlan.limits[limitType]

  if (planLimit === -1) return true // Unlimited

  return (currentUsage[limitType] + increment) <= planLimit
}
```

## Regional & Compliance Settings

### GDPR Compliance (EU)
```typescript
const GDPR_CONFIG = {
  enabled: process.env.GDPR_COMPLIANCE === 'true',
  cookieConsent: true,
  dataRetentionDays: parseInt(process.env.GDPR_RETENTION_DAYS || '1095'), // 3 years
  rightToErasure: true,
  dataPortability: true,
  consentTracking: true,
}
```

### CCPA Compliance (California)
```typescript
const CCPA_CONFIG = {
  enabled: process.env.CCPA_COMPLIANCE === 'true',
  optOutOfSale: true,
  dataDisclosure: true,
  dataCategory: 'business_contact_info',
}
```

### Security Settings
```typescript
const SECURITY_CONFIG = {
  // Rate limiting
  rateLimiting: {
    enabled: process.env.ENABLE_RATE_LIMITING !== 'false',
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX || '100'),
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true,
    optionsSuccessStatus: 200,
  },

  // Security headers
  security: {
    helmet: true,
    hsts: process.env.NODE_ENV === 'production',
    noSniff: true,
    frameguard: 'deny',
    xssFilter: true,
  },

  // Encryption
  encryption: {
    algorithm: 'aes-256-gcm',
    keyDerivation: 'pbkdf2',
    saltLength: 32,
    ivLength: 12,
  }
}
```

## Development vs Production Configuration

### Development Settings
```bash
# .env.development
NODE_ENV="development"
LOG_LEVEL="debug"
ENABLE_REQUEST_LOGGING="true"
BCRYPT_ROUNDS="4"  # Faster for development
RATE_LIMIT_MAX="1000"  # More permissive
JWT_EXPIRES_IN="24h"  # Longer for development
ENABLE_HOT_RELOAD="true"
SKIP_EMAIL_VERIFICATION="true"  # For testing
```

### Production Settings
```bash
# .env.production
NODE_ENV="production"
LOG_LEVEL="info"
ENABLE_REQUEST_LOGGING="false"
BCRYPT_ROUNDS="12"  # Secure for production
RATE_LIMIT_MAX="100"  # Strict limits
JWT_EXPIRES_IN="15m"  # Short-lived tokens
ENABLE_SECURITY_HEADERS="true"
FORCE_HTTPS="true"
TRUST_PROXY="true"  # Behind load balancer
```

### Test Settings
```bash
# .env.test
NODE_ENV="test"
DATABASE_URL="postgresql://test:test@localhost:5432/allin_test"
LOG_LEVEL="error"  # Minimal logging in tests
SKIP_EMAIL_VERIFICATION="true"
DISABLE_RATE_LIMITING="true"
JWT_SECRET="test-secret"
BCRYPT_ROUNDS="1"  # Fastest for tests
```

## Monitoring & Observability Settings

### Application Monitoring
```typescript
const MONITORING_CONFIG = {
  // Performance monitoring
  apm: {
    enabled: process.env.ENABLE_APM === 'true',
    serviceName: 'allin-platform-backend',
    environment: process.env.NODE_ENV,
  },

  // Error tracking
  errorTracking: {
    enabled: !!process.env.SENTRY_DSN,
    dsn: process.env.SENTRY_DSN,
    sampleRate: parseFloat(process.env.SENTRY_SAMPLE_RATE || '0.1'),
  },

  // Metrics collection
  metrics: {
    enabled: process.env.ENABLE_METRICS === 'true',
    interval: parseInt(process.env.METRICS_INTERVAL || '60000'), // 1 minute
  },

  // Health checks
  healthChecks: {
    database: true,
    redis: process.env.REDIS_URL ? true : false,
    externalApis: process.env.ENABLE_HEALTH_CHECKS === 'true',
  }
}
```