# AllIN Platform Domain Glossary

## Core Entities & IDs

### Users & Authentication

#### User
**Model**: `User` (`users` table)
**ID Format**: `cuid()` (e.g., `ckxyz123abc`)

**Fields**:
- `email` (unique): User's email address (login identifier)
- `role`: `SUPER_ADMIN | ADMIN | USER`
- `status`: `PENDING | ACTIVE | INACTIVE | SUSPENDED`
- `emailVerified`: Timestamp when email was verified
- `lastLoginAt`: Last successful authentication

**Relationships**:
- One-to-many: Sessions, SocialAccounts, Drafts
- Many-to-many: Organizations (via OrganizationMember)

#### Session
**Model**: `Session` (`sessions` table)
**Purpose**: JWT session management with Redis backing

**Token Types**:
- `sessionToken`: HTTP-only cookie for authentication
- `refreshToken`: Long-lived token for renewal
- `accessToken`: Short-lived API access token

#### Organization
**Model**: `Organization` (`organizations` table)
**ID Format**: `cuid()`

**Member Roles**:
- `OWNER`: Full control, billing, delete organization
- `ADMIN`: User management, settings, content approval
- `EDITOR`: Create/edit/publish content
- `MEMBER`: Create drafts, limited publishing
- `VIEWER`: Read-only access

### Social Media Management

#### SocialAccount
**Model**: `SocialAccount` (`social_accounts` table)
**ID Format**: `cuid()`

**Supported Platforms**:
```typescript
enum SocialPlatform {
  FACEBOOK    // Pages, Groups, Stories, Reels
  INSTAGRAM   // Feed, Stories, Reels, IGTV
  TWITTER     // Tweets, Threads, Spaces
  LINKEDIN    // Personal, Company pages, Articles
  TIKTOK      // Videos, Stories, LIVE
  YOUTUBE     // Videos, Shorts, Community (coming soon)
  PINTEREST   // Pins, Boards, Story Pins (coming soon)
}
```

**Status Types**:
- `ACTIVE`: Functioning normally
- `INACTIVE`: Manually disabled
- `EXPIRED`: OAuth tokens expired
- `REVOKED`: User revoked permissions
- `ERROR`: Connection/API errors

**Key Fields**:
- `platformId`: ID on the social platform
- `accessToken`: Encrypted OAuth token
- `scope[]`: Granted permissions
- `followersCount`: Current follower count

#### Post
**Model**: `Post` (`posts` table)
**Content Structure**:
- `content`: Main post text (max 2000 chars)
- `hashtags[]`: Array of hashtag strings
- `mentions[]`: Array of @username mentions
- `media[]`: Related Media objects

**Status Lifecycle**:
1. `DRAFT`: Created but not scheduled
2. `SCHEDULED`: Queued for future publishing
3. `PUBLISHED`: Successfully posted to platform
4. `FAILED`: Publishing attempt failed
5. `DELETED`: Removed from platform

#### ScheduledPost
**Model**: `ScheduledPost` (`scheduled_posts` table)
**Purpose**: Queue-based scheduling system

**Schedule Types**:
- **One-time**: Specific date/time
- **Recurring**: Pattern-based repetition
- **Queue-based**: Fill predefined time slots

**Status Flow**:
1. `PENDING`: Awaiting schedule time
2. `QUEUED`: In publishing queue
3. `PUBLISHING`: Currently being posted
4. `PUBLISHED`: Successfully posted
5. `FAILED`: Publishing failed
6. `CANCELLED`: User cancelled

### Content Creation

#### Draft
**Model**: `Draft` (`drafts` table)
**Purpose**: Unpublished content storage

**AI Integration**:
- `aiGenerated`: Boolean flag for AI-created content
- `aiPrompt`: Original prompt used for generation
- `aiModel`: Model used (GPT-4, Claude, etc.)

#### ContentTemplate
**Model**: `ContentTemplate` (`content_templates` table)
**Purpose**: Reusable content patterns

**Variable System**:
- `template`: Text with placeholders like `{{companyName}}`
- `variables[]`: Array of required variable names
- `platforms[]`: Supported social platforms

### Analytics & Performance

#### Analytics
**Model**: `Analytics` (`analytics` table)
**Granularity**: Daily metrics per social account

**Core Metrics**:
- `impressions`: Times content was displayed
- `reach`: Unique users who saw content
- `engagement`: Total interactions (likes + comments + shares)
- `clicks`: Link clicks from social media
- `followersGained/Lost`: Daily follower changes

#### OptimalPostingTime
**Model**: `OptimalPostingTime` (`optimal_posting_times` table)
**Purpose**: AI-calculated best posting times

**Calculation**:
- `dayOfWeek`: 0-6 (Sunday-Saturday)
- `hour`: 0-23 (24-hour format)
- `score`: Engagement score (0.0-1.0)
- `sampleSize`: Number of posts analyzed

## Business Logic Constraints

### User Limits by Plan

#### Starter Plan ($15/month)
- Users: 1
- Social Accounts: 5
- AI Credits: 30/month
- Posts: Unlimited
- Storage: 1GB

#### Professional Plan ($49/month)
- Users: 3
- Social Accounts: 15
- AI Credits: 500/month
- Posts: Unlimited
- Storage: 10GB
- Features: Approval workflows, analytics

#### Team Plan ($99/month)
- Users: 10
- Social Accounts: 50
- AI Credits: 2000/month
- Posts: Unlimited
- Storage: 50GB
- Features: API access, custom reports

#### Enterprise Plan (Custom)
- Users: Unlimited
- Social Accounts: Unlimited
- AI Credits: Custom
- Features: White-label, custom AI training, SLA

### Content Restrictions

#### Platform-Specific Limits
**Location**: `src/services/ai.service.ts`

**Twitter/X**:
- Text: 280 characters
- Images: 4 max per tweet
- Video: 2GB, 2:20 duration

**Instagram**:
- Caption: 2,200 characters
- Hashtags: 30 max recommended
- Video: 60 seconds (feed), 15 seconds (stories)

**LinkedIn**:
- Text: 3,000 characters
- Images: 1-4 per post
- Video: 10 minutes max

**Facebook**:
- Text: 63,206 characters
- Images: 10 max per post
- Video: 240 minutes max

#### AI Content Guidelines
- No offensive or harmful content
- Respect platform community guidelines
- Maintain brand voice consistency
- Include appropriate disclaimers for AI-generated content

## API Constraints & Rate Limits

### Internal Rate Limits
**Location**: `src/middleware/rateLimiter.ts`

**Standard Rate Limit**:
- Window: 15 minutes
- Max requests: 100 (development: 1000)
- Applies to: Most API endpoints

**Strict Rate Limit** (auth endpoints):
- Window: 15 minutes
- Max requests: 5 (development: 20)
- Applies to: Login, registration, password reset

### External API Limits

#### Social Media APIs
**Facebook/Instagram**:
- 200 calls per hour per user
- 400 calls per hour per app
- Batch operations: 50 requests per batch

**Twitter API v2**:
- Tweet creation: 300 per 15 minutes
- Tweet deletion: 300 per 15 minutes
- Tweet lookup: 900 per 15 minutes

**LinkedIn**:
- Posts: 125 per day per person
- Company updates: 25 per day
- API calls: 500 per day per app

#### AI Service Limits
**OpenAI**:
- GPT-4: 8,000 TPM (tokens per minute)
- DALL-E 3: 7 images per minute
- Rate limits vary by plan tier

**Anthropic Claude**:
- Claude-3.5-Sonnet: 4,000 TPM
- Context window: 200K tokens
- Output tokens: 8,192 max

## Validation Schemas

### Authentication
**Location**: `src/routes/auth.routes.ts:22-26`

**Registration**:
```typescript
{
  email: string (valid email, normalized)
  password: string (min 8 chars, uppercase + lowercase + number)
  name?: string (2-50 chars, trimmed)
}
```

**Login**:
```typescript
{
  email: string (valid email, normalized)
  password: string (min 1 char)
  rememberMe?: boolean
}
```

### Content Creation
**Location**: `src/routes/ai.routes.ts:24-30`

**AI Content Generation**:
```typescript
{
  platform: SocialPlatform
  topic: string (1-500 chars)
  tone?: 'professional' | 'casual' | 'friendly' | 'humorous' | 'informative'
  length?: 'short' | 'medium' | 'long'
  includeHashtags?: boolean
  includeEmojis?: boolean
  targetAudience?: string
  keywords?: string[]
}
```

### Scheduling
**Location**: `src/routes/schedule.routes.ts`

**Schedule Post**:
```typescript
{
  content: string (1-2000 chars)
  platforms: SocialPlatform[] (min 1)
  mediaUrls?: string[]
  scheduledFor?: ISO8601 datetime
  queueId?: string (cuid)
  isRecurring?: boolean
  recurringPattern?: RecurringPattern
}
```

## Enum Definitions

### User Management
```typescript
enum UserRole {
  SUPER_ADMIN  // Platform administration
  ADMIN        // Organization management
  USER         // Standard user
}

enum UserStatus {
  PENDING      // Email not verified
  ACTIVE       // Fully activated
  INACTIVE     // Temporarily disabled
  SUSPENDED    // Banned/suspended
}

enum MemberRole {
  OWNER        // Organization owner
  ADMIN        // Full management access
  EDITOR       // Content creation/editing
  MEMBER       // Basic member
  VIEWER       // Read-only access
}
```

### Content & Publishing
```typescript
enum PostStatus {
  DRAFT        // Not published
  SCHEDULED    // Queued for publishing
  PUBLISHED    // Live on platform
  FAILED       // Publishing failed
  DELETED      // Removed from platform
}

enum ScheduleStatus {
  PENDING      // Awaiting schedule time
  QUEUED       // In publishing queue
  PUBLISHING   // Currently posting
  PUBLISHED    // Successfully posted
  FAILED       // Publishing failed
  CANCELLED    // User cancelled
}

enum RecurringPattern {
  DAILY        // Every day
  WEEKLY       // Every week
  BIWEEKLY     // Every 2 weeks
  MONTHLY      // Every month
  CUSTOM       // User-defined pattern
}
```

### Media Types
```typescript
enum MediaType {
  IMAGE        // JPEG, PNG, GIF images
  VIDEO        // MP4, MOV videos
  GIF          // Animated GIFs
  AUDIO        // MP3, WAV audio files
  DOCUMENT     // PDFs, docs (limited platforms)
}
```

## Common ID Patterns

### Prisma CUID Format
- **Pattern**: 25-character alphanumeric string
- **Example**: `ckxyz123abc456def789ghi`
- **Use**: All internal entity IDs

### Platform-Specific IDs
- **Facebook**: Numeric string (e.g., `1234567890123456`)
- **Instagram**: Numeric string (e.g., `2834729573493`)
- **Twitter**: Numeric string (e.g., `1234567890123456789`)
- **LinkedIn**: URN format (e.g., `urn:li:person:abc123`)

### Token Formats
- **JWT**: Standard JWT format with header.payload.signature
- **Session**: 32-128 character random string
- **Verification**: 32-128 character random string

## Error Codes & Messages

### Authentication Errors
- `AUTH_001`: Invalid credentials
- `AUTH_002`: Account not verified
- `AUTH_003`: Account suspended
- `AUTH_004`: Token expired
- `AUTH_005`: Insufficient permissions

### Content Errors
- `CONTENT_001`: Content too long for platform
- `CONTENT_002`: Invalid media format
- `CONTENT_003`: Prohibited content detected
- `CONTENT_004`: Duplicate content

### Social Platform Errors
- `SOCIAL_001`: Platform connection expired
- `SOCIAL_002`: Insufficient platform permissions
- `SOCIAL_003`: Platform rate limit exceeded
- `SOCIAL_004`: Platform API error

### System Errors
- `SYS_001`: Database connection error
- `SYS_002`: External service unavailable
- `SYS_003`: File upload failed
- `SYS_004`: Queue processing error