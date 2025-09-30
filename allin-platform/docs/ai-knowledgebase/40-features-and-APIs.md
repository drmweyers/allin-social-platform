# AllIN Platform Features & APIs

## Authentication & Authorization

### Authentication System
**Base Route**: `/api/auth`

#### Registration & Login
**POST /api/auth/register**
```typescript
Request: {
  email: string           // Valid email, normalized
  password: string        // Min 8 chars, complexity requirements
  name?: string          // Optional display name (2-50 chars)
}

Response: {
  success: boolean
  message: string
  data: {
    user: UserProfile
    sessionToken?: string  // Only if email pre-verified
  }
}
```

**POST /api/auth/login**
```typescript
Request: {
  email: string
  password: string
  rememberMe?: boolean   // Extends session duration
}

Response: {
  success: boolean
  data: {
    user: UserProfile
    sessionToken: string
    refreshToken: string
    expiresAt: string     // ISO timestamp
  }
}

Cookies Set:
- sessionToken (httpOnly, secure in prod)
- refreshToken (httpOnly, secure in prod)
```

#### Session Management
**POST /api/auth/refresh**
- Renews access tokens using refresh token
- **Rate Limited**: 5 requests per 15 minutes

**POST /api/auth/logout**
- Invalidates session and clears cookies
- **Requires**: Valid session token

**GET /api/auth/me**
- Returns current user profile
- **Authentication**: Required

#### Password Management
**POST /api/auth/forgot-password**
```typescript
Request: {
  email: string
}

Response: {
  success: boolean
  message: "Password reset instructions sent"
}
```
**Rate Limited**: 5 requests per 15 minutes

**POST /api/auth/reset-password**
```typescript
Request: {
  token: string          // From email link (32-128 chars)
  password: string       // New password with complexity requirements
}
```

#### Email Verification
**POST /api/auth/verify-email**
```typescript
Request: {
  token: string          // From verification email
}

Response: {
  success: boolean
  data: {
    user: UserProfile    // Updated with emailVerified timestamp
  }
}
```

### Authorization System
**Implementation**: `src/middleware/auth.ts`

#### Role-Based Access Control (RBAC)
```typescript
// Middleware usage
router.get('/admin', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), handler)

// User roles
enum UserRole {
  SUPER_ADMIN   // Platform administration
  ADMIN         // Organization management
  USER          // Standard user permissions
}

// Organization member roles
enum MemberRole {
  OWNER         // Full control
  ADMIN         // User management, billing
  EDITOR        // Content creation/publishing
  MEMBER        // Basic content creation
  VIEWER        // Read-only access
}
```

#### Permission Matrix
| Action | USER | ADMIN | SUPER_ADMIN |
|--------|------|-------|-------------|
| Create content | ✅ | ✅ | ✅ |
| Manage own social accounts | ✅ | ✅ | ✅ |
| Manage organization users | ❌ | ✅ | ✅ |
| Access analytics | ✅ | ✅ | ✅ |
| Manage billing | ❌ | ✅ | ✅ |
| Platform administration | ❌ | ❌ | ✅ |

## AI Content Generation

### AI Service API
**Base Route**: `/api/ai`
**Authentication**: Required for all endpoints

#### Content Generation
**POST /api/ai/generate-content**
```typescript
Request: {
  platform: SocialPlatform    // Required: target platform
  topic: string              // 1-500 chars: content topic
  tone?: 'professional' | 'casual' | 'friendly' | 'humorous' | 'informative'
  length?: 'short' | 'medium' | 'long'
  includeHashtags?: boolean  // Default: true
  includeEmojis?: boolean    // Default: true
  targetAudience?: string    // Audience description
  keywords?: string[]        // SEO/targeting keywords
}

Response: {
  success: boolean
  data: {
    content: string          // Generated post content
    hashtags?: string[]      // Suggested hashtags
    wordCount: number
    characterCount: number
    platformOptimized: boolean
    suggestions?: string[]   // Alternative versions
  }
  metadata: {
    model: string           // AI model used
    processingTime: number  // Generation time in ms
    tokensUsed: number     // Token consumption
  }
}
```

**Platform Optimizations**:
- **Twitter**: 280 char limit, trending hashtags
- **Instagram**: Visual focus, 30 hashtag limit
- **LinkedIn**: Professional tone, industry keywords
- **Facebook**: Engagement-focused, community feel
- **TikTok**: Trending sounds, youth language

#### Hashtag Generation
**POST /api/ai/generate-hashtags**
```typescript
Request: {
  content: string          // Content to analyze (1-2000 chars)
  platform: string        // Target platform
  count?: number          // Number of hashtags (1-30, default: 5)
}

Response: {
  success: boolean
  data: {
    hashtags: string[]     // Generated hashtags
    trending: string[]     // Currently trending hashtags
    niche: string[]       // Industry-specific hashtags
    general: string[]     // Broad appeal hashtags
  }
}
```

#### Content Improvement
**POST /api/ai/improve-content**
```typescript
Request: {
  content: string          // Original content
  platform: string        // Target platform
  goal: string            // Improvement goal (engagement, reach, etc.)
}

Response: {
  success: boolean
  data: {
    improvedContent: string
    changes: {
      type: string         // Type of change made
      reason: string       // Explanation
      before: string       // Original text
      after: string        // Improved text
    }[]
    scores: {
      engagement: number   // Predicted engagement score
      readability: number  // Readability score
      sentiment: number    // Sentiment analysis
    }
  }
}
```

#### Content Analysis
**POST /api/ai/analyze-content**
```typescript
Request: {
  content: string
  platform: string
}

Response: {
  success: boolean
  data: {
    sentiment: {
      score: number        // -1 to 1 (negative to positive)
      label: string        // 'positive', 'negative', 'neutral'
      confidence: number   // 0-1
    }
    engagement: {
      predictedScore: number
      factors: string[]    // Contributing factors
    }
    compliance: {
      platformCompliant: boolean
      issues: string[]     // Policy violations found
      warnings: string[]   // Potential issues
    }
    readability: {
      score: number        // Flesch reading ease
      grade: string        // Grade level
    }
    hashtags: {
      suggested: string[]
      trending: string[]
    }
  }
}
```

### Template System
**Base Route**: `/api/ai/templates`

#### Get Templates
**GET /api/ai/templates**
```typescript
Query: {
  platform?: string       // Filter by platform
  category?: string       // Filter by category
  search?: string         // Search template names/descriptions
}

Response: {
  success: boolean
  data: ContentTemplate[]
}
```

#### Apply Template
**POST /api/ai/apply-template**
```typescript
Request: {
  templateId: string
  variables: Record<string, string>  // Variable substitutions
}

Response: {
  success: boolean
  data: {
    content: string        // Generated content with variables filled
    preview: string        // Formatted preview
    platforms: SocialPlatform[]
  }
}
```

## Social Media Management

### Social Account Management
**Base Route**: `/api/social/accounts`

#### Connect Social Account
**POST /api/social/accounts/connect**
```typescript
Request: {
  platform: SocialPlatform
  authCode?: string        // OAuth authorization code
  scope?: string[]         // Requested permissions
}

Response: {
  success: boolean
  data: {
    authUrl?: string       // OAuth URL for user authorization
    account?: SocialAccount // If connection completed
  }
}
```

#### List Connected Accounts
**GET /api/social/accounts**
```typescript
Response: {
  success: boolean
  data: {
    accounts: SocialAccount[]
  }
}

SocialAccount: {
  id: string
  platform: SocialPlatform
  username: string
  displayName: string
  profileImage: string
  followersCount: number
  status: AccountStatus    // ACTIVE, EXPIRED, ERROR, etc.
  permissions: string[]    // Granted OAuth scopes
  lastSyncAt: string      // Last successful API call
}
```

#### Account Management
**PUT /api/social/accounts/:id**
- Update account settings
- Refresh OAuth tokens
- Sync latest platform data

**DELETE /api/social/accounts/:id**
- Disconnect social account
- Clean up scheduled posts
- Preserve historical data

### Content Publishing
**Base Route**: `/api/social/posts`

#### Create & Publish Post
**POST /api/social/posts**
```typescript
Request: {
  content: string
  platforms: SocialPlatform[]  // Target platforms
  mediaUrls?: string[]         // Uploaded media URLs
  publishImmediately?: boolean // Default: false
  scheduledFor?: string        // ISO datetime
  campaignId?: string         // Optional campaign association
}

Response: {
  success: boolean
  data: {
    posts: {
      platform: SocialPlatform
      postId: string           // Internal post ID
      platformPostId?: string  // Platform's post ID (if published)
      status: PostStatus
      scheduledFor?: string
      url?: string            // Link to live post
    }[]
  }
}
```

#### Schedule Management
**GET /api/social/scheduled**
```typescript
Query: {
  from?: string              // Date range start
  to?: string               // Date range end
  platform?: SocialPlatform
  status?: ScheduleStatus
}

Response: {
  success: boolean
  data: {
    scheduledPosts: ScheduledPost[]
    totalCount: number
  }
}
```

**PUT /api/social/scheduled/:id**
- Reschedule post
- Update content before publishing
- Cancel scheduled post

### Queue Management
**Base Route**: `/api/social/queues`

#### Create Posting Queue
**POST /api/social/queues**
```typescript
Request: {
  name: string
  description?: string
  timezone: string           // IANA timezone
  timeSlots: {
    dayOfWeek: number       // 0-6 (Sunday-Saturday)
    time: string           // HH:MM format
  }[]
  platforms: SocialPlatform[]
}

Response: {
  success: boolean
  data: {
    queue: PostingQueue
  }
}
```

#### Add Content to Queue
**POST /api/social/queues/:id/add**
```typescript
Request: {
  content: string
  mediaUrls?: string[]
  position?: number          // Queue position (auto-assign if omitted)
}
```

## Analytics & Reporting

### Analytics API
**Base Route**: `/api/analytics`

#### Performance Metrics
**GET /api/analytics/overview**
```typescript
Query: {
  from: string              // ISO date
  to: string               // ISO date
  platforms?: string[]     // Filter platforms
  granularity?: 'daily' | 'weekly' | 'monthly'
}

Response: {
  success: boolean
  data: {
    summary: {
      totalPosts: number
      totalEngagement: number
      averageEngagementRate: number
      followerGrowth: number
      topPerformingPlatform: string
    }
    metrics: {
      date: string
      platform: SocialPlatform
      posts: number
      impressions: number
      reach: number
      engagement: number
      clicks: number
      engagementRate: number
    }[]
    trends: {
      metric: string
      change: number         // Percentage change
      direction: 'up' | 'down' | 'stable'
    }[]
  }
}
```

#### Post Performance
**GET /api/analytics/posts**
```typescript
Query: {
  from?: string
  to?: string
  platform?: SocialPlatform
  sortBy?: 'engagement' | 'reach' | 'date'
  limit?: number
}

Response: {
  success: boolean
  data: {
    posts: {
      id: string
      content: string
      platform: SocialPlatform
      publishedAt: string
      metrics: {
        likes: number
        comments: number
        shares: number
        views: number
        engagementRate: number
      }
      url?: string
    }[]
  }
}
```

#### Audience Insights
**GET /api/analytics/audience**
```typescript
Response: {
  success: boolean
  data: {
    demographics: {
      ageGroups: { range: string, percentage: number }[]
      genders: { type: string, percentage: number }[]
      locations: { country: string, percentage: number }[]
    }
    activity: {
      hourly: { hour: number, activity: number }[]
      daily: { day: string, activity: number }[]
    }
    growth: {
      followers: { date: string, count: number }[]
      engagement: { date: string, rate: number }[]
    }
  }
}
```

### Custom Reports
**Base Route**: `/api/analytics/reports`

#### Generate Report
**POST /api/analytics/reports**
```typescript
Request: {
  name: string
  type: 'performance' | 'engagement' | 'growth' | 'custom'
  dateRange: {
    from: string
    to: string
  }
  platforms: SocialPlatform[]
  metrics: string[]          // Metrics to include
  format: 'pdf' | 'excel' | 'json'
  branding?: {              // White-label options
    logo?: string
    colors?: string[]
    companyName?: string
  }
}

Response: {
  success: boolean
  data: {
    reportId: string
    downloadUrl: string
    expiresAt: string
  }
}
```

## Team Collaboration

### Organization Management
**Base Route**: `/api/organizations`

#### Create Organization
**POST /api/organizations**
```typescript
Request: {
  name: string
  slug: string              // URL-friendly identifier
  description?: string
}

Response: {
  success: boolean
  data: {
    organization: Organization
    membership: OrganizationMember  // Creator's membership
  }
}
```

#### Invite Team Members
**POST /api/organizations/:id/invite**
```typescript
Request: {
  email: string
  role: MemberRole
  message?: string          // Custom invitation message
}

Response: {
  success: boolean
  data: {
    invitation: Invitation
  }
}
```

### Workflow Management
**Base Route**: `/api/workflows`

#### Approval Workflows
**POST /api/workflows/submit-for-approval**
```typescript
Request: {
  postId: string
  approvers: string[]       // User IDs
  deadline?: string         // Approval deadline
  notes?: string           // Submission notes
}
```

**POST /api/workflows/approve**
```typescript
Request: {
  postId: string
  approved: boolean
  feedback?: string
}
```

## Rate Limiting & Quotas

### API Rate Limits
**Implementation**: `src/middleware/rateLimiter.ts`

#### Standard Rate Limiting
- **Window**: 15 minutes
- **Limit**: 100 requests (1000 in development)
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

#### Strict Rate Limiting (Auth endpoints)
- **Window**: 15 minutes
- **Limit**: 5 requests (20 in development)
- **Applies to**: Login, registration, password reset

#### AI Content Generation
- **Limit**: Based on plan tier
- **Tracking**: Per-user credit system
- **Overage**: Graceful degradation or upgrade prompts

### Platform API Quotas
**Management**: Automatic quota monitoring and user notification

#### Facebook/Instagram
- **Posts per hour**: 200 per user
- **API calls**: 400 per hour per app
- **Batch operations**: 50 requests per batch

#### Twitter API v2
- **Tweet creation**: 300 per 15 minutes
- **Tweet deletion**: 300 per 15 minutes
- **Rate limit headers**: Monitored and cached

#### LinkedIn
- **Posts per day**: 125 per person
- **Company updates**: 25 per day
- **API rate limits**: Tracked per application

## Error Handling

### Standard Error Format
```typescript
{
  success: false
  error: {
    code: string            // Error code (e.g., 'AUTH_001')
    message: string         // User-friendly message
    details?: any          // Additional error context
    field?: string         // Field name for validation errors
  }
  timestamp: string         // ISO timestamp
  requestId: string        // Trace ID for support
}
```

### Common Error Codes
- **AUTH_001**: Invalid credentials
- **AUTH_002**: Account not verified
- **AUTH_003**: Insufficient permissions
- **CONTENT_001**: Content violates platform guidelines
- **SOCIAL_001**: Social account connection expired
- **RATE_001**: Rate limit exceeded
- **SYS_001**: Internal server error

### Validation Errors
```typescript
{
  success: false
  error: {
    code: 'VALIDATION_ERROR'
    message: 'Validation failed'
    details: {
      field: string
      message: string
      value: any
    }[]
  }
}
```

## Webhooks & Real-time Updates

### Webhook Endpoints
**Base Route**: `/api/webhooks`

#### Social Platform Webhooks
**POST /api/webhooks/facebook**
- Handle Facebook webhook events
- Verify webhook signature
- Process page mentions, comments

**POST /api/webhooks/instagram**
- Instagram Business API events
- Story mentions, hashtag monitoring

### WebSocket Events
**Connection**: `/ws` (when WebSocket support is implemented)

#### Event Types
- `post_published`: Post successfully published
- `post_failed`: Publishing failed
- `engagement_update`: Real-time engagement updates
- `queue_update`: Posting queue changes
- `account_status`: Social account status changes

## Security Features

### Authentication Security
- **Password Requirements**: 8+ chars, mixed case, numbers
- **Session Management**: Redis-backed with configurable TTL
- **Token Security**: JWT with secure signing, automatic rotation
- **Rate Limiting**: Prevent brute force attacks

### Data Protection
- **Encryption**: Sensitive data encrypted at rest
- **OAuth Security**: Secure token storage with encryption
- **Input Validation**: Comprehensive validation on all endpoints
- **SQL Injection**: Prisma ORM prevents SQL injection
- **XSS Protection**: Content sanitization

### Compliance Features
- **GDPR**: User data export/deletion capabilities
- **CCPA**: California privacy compliance
- **Audit Logs**: Complete action tracking
- **Data Retention**: Configurable retention policies