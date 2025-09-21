# Sprint 0: STORY-005 - Prisma Schema and Database Setup

## Story Details
**ID**: STORY-005
**Title**: Prisma Schema and Database Setup
**Points**: 5
**Priority**: CRITICAL
**Dependencies**: STORY-002 (Docker), STORY-004 (Express Backend)

## Story Description
As a developer, I need to implement the complete Prisma schema for the AllIN platform, including all models for users, social accounts, posts, analytics, and campaigns, with proper relationships and indexes for optimal performance.

## Acceptance Criteria
- [ ] Complete Prisma schema with all required models
- [ ] Database migrations created and applied
- [ ] Seed data for development testing
- [ ] Prisma Client generated and configured
- [ ] Database connection pooling optimized
- [ ] Indexes created for performance
- [ ] Relationships properly defined
- [ ] Soft delete implementation
- [ ] Audit fields on all models
- [ ] Prisma Studio accessible

## Technical Requirements

### 1. Prisma Configuration
```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["jsonProtocol", "fullTextSearch", "fullTextIndex"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 2. User and Authentication Models
```prisma
model User {
  id                String    @id @default(cuid())
  email             String    @unique
  emailVerified     DateTime?
  name              String?
  password          String?
  image             String?
  role              UserRole  @default(USER)
  status            UserStatus @default(ACTIVE)
  
  // OAuth
  oauthProvider     String?
  oauthId           String?
  
  // Subscription
  subscription      Subscription?
  subscriptionId    String?
  
  // Relations
  organizations     OrganizationMember[]
  socialAccounts    SocialAccount[]
  posts             Post[]
  campaigns         Campaign[]
  sessions          Session[]
  apiKeys           ApiKey[]
  notifications     Notification[]
  activities        Activity[]
  
  // Audit
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  deletedAt         DateTime?
  
  @@index([email])
  @@index([status])
  @@map("users")
}

model Session {
  id            String   @id @default(cuid())
  sessionToken  String   @unique
  userId        String
  expires       DateTime
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([sessionToken])
  @@index([userId])
  @@map("sessions")
}

enum UserRole {
  SUPER_ADMIN
  ADMIN
  USER
  GUEST
}

enum UserStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
  DELETED
}
```

### 3. Organization Models
```prisma
model Organization {
  id              String    @id @default(cuid())
  name            String
  slug            String    @unique
  description     String?
  logo            String?
  website         String?
  
  // Subscription
  subscription    Subscription?
  billingEmail    String?
  
  // Relations
  members         OrganizationMember[]
  socialAccounts  SocialAccount[]
  posts           Post[]
  campaigns       Campaign[]
  templates       ContentTemplate[]
  tags            Tag[]
  
  // Settings
  settings        Json      @default("{}")
  features        String[]  @default([])
  
  // Audit
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  deletedAt       DateTime?
  
  @@index([slug])
  @@map("organizations")
}

model OrganizationMember {
  id              String    @id @default(cuid())
  userId          String
  organizationId  String
  role            MemberRole @default(MEMBER)
  permissions     String[]   @default([])
  
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  joinedAt        DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@unique([userId, organizationId])
  @@index([userId])
  @@index([organizationId])
  @@map("organization_members")
}

enum MemberRole {
  OWNER
  ADMIN
  EDITOR
  MEMBER
  VIEWER
}
```

### 4. Social Account Models
```prisma
model SocialAccount {
  id                String    @id @default(cuid())
  platform          Platform
  platformAccountId String
  username          String?
  displayName       String?
  profileImage      String?
  
  // OAuth Tokens
  accessToken       String?   @db.Text
  refreshToken      String?   @db.Text
  tokenExpiry       DateTime?
  
  // Ownership
  userId            String?
  organizationId    String?
  
  // Relations
  user              User?     @relation(fields: [userId], references: [id], onDelete: Cascade)
  organization      Organization? @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  posts             Post[]
  analytics         Analytics[]
  
  // Platform Data
  followerCount     Int       @default(0)
  followingCount    Int       @default(0)
  postCount         Int       @default(0)
  platformData      Json      @default("{}")
  
  // Status
  status            AccountStatus @default(ACTIVE)
  lastSyncAt        DateTime?
  
  // Audit
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  deletedAt         DateTime?
  
  @@unique([platform, platformAccountId])
  @@index([userId])
  @@index([organizationId])
  @@index([platform])
  @@index([status])
  @@map("social_accounts")
}

enum Platform {
  TWITTER
  FACEBOOK
  INSTAGRAM
  LINKEDIN
  YOUTUBE
  TIKTOK
  PINTEREST
  THREADS
}

enum AccountStatus {
  ACTIVE
  INACTIVE
  EXPIRED
  REVOKED
  ERROR
}
```

### 5. Content and Post Models
```prisma
model Post {
  id              String    @id @default(cuid())
  
  // Content
  content         String    @db.Text
  mediaUrls       String[]  @default([])
  hashtags        String[]  @default([])
  mentions        String[]  @default([])
  
  // Scheduling
  scheduledAt     DateTime?
  publishedAt     DateTime?
  status          PostStatus @default(DRAFT)
  
  // Platform-specific
  platformData    Json[]    @default([])
  platforms       Platform[] @default([])
  
  // Ownership
  userId          String
  organizationId  String?
  socialAccountId String?
  campaignId      String?
  
  // Relations
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  organization    Organization? @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  socialAccount   SocialAccount? @relation(fields: [socialAccountId], references: [id], onDelete: SetNull)
  campaign        Campaign? @relation(fields: [campaignId], references: [id], onDelete: SetNull)
  analytics       Analytics[]
  tags            Tag[]     @relation("PostTags")
  
  // Performance
  impressions     Int       @default(0)
  engagements     Int       @default(0)
  clicks          Int       @default(0)
  shares          Int       @default(0)
  
  // AI Generated
  aiGenerated     Boolean   @default(false)
  aiModel         String?
  aiPrompt        String?   @db.Text
  
  // Audit
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  deletedAt       DateTime?
  
  @@index([userId])
  @@index([organizationId])
  @@index([socialAccountId])
  @@index([campaignId])
  @@index([status])
  @@index([scheduledAt])
  @@index([publishedAt])
  @@map("posts")
}

enum PostStatus {
  DRAFT
  SCHEDULED
  PUBLISHING
  PUBLISHED
  FAILED
  DELETED
}
```

### 6. Campaign Models
```prisma
model Campaign {
  id              String    @id @default(cuid())
  name            String
  description     String?   @db.Text
  
  // Timeline
  startDate       DateTime
  endDate         DateTime?
  status          CampaignStatus @default(DRAFT)
  
  // Goals
  goals           Json      @default("{}")
  targetMetrics   Json      @default("{}")
  
  // Ownership
  userId          String
  organizationId  String?
  
  // Relations
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  organization    Organization? @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  posts           Post[]
  analytics       CampaignAnalytics[]
  tags            Tag[]     @relation("CampaignTags")
  
  // Budget
  budget          Decimal?  @db.Money
  spentAmount     Decimal   @default(0) @db.Money
  
  // Audit
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  deletedAt       DateTime?
  
  @@index([userId])
  @@index([organizationId])
  @@index([status])
  @@index([startDate])
  @@map("campaigns")
}

enum CampaignStatus {
  DRAFT
  PLANNED
  ACTIVE
  PAUSED
  COMPLETED
  ARCHIVED
}
```

### 7. Analytics Models
```prisma
model Analytics {
  id              String    @id @default(cuid())
  
  // Metrics
  impressions     Int       @default(0)
  reach           Int       @default(0)
  engagements     Int       @default(0)
  clicks          Int       @default(0)
  shares          Int       @default(0)
  saves           Int       @default(0)
  comments        Int       @default(0)
  likes           Int       @default(0)
  
  // Rates
  engagementRate  Float     @default(0)
  clickRate       Float     @default(0)
  shareRate       Float     @default(0)
  
  // Relations
  postId          String?
  socialAccountId String?
  
  post            Post?     @relation(fields: [postId], references: [id], onDelete: Cascade)
  socialAccount   SocialAccount? @relation(fields: [socialAccountId], references: [id], onDelete: Cascade)
  
  // Time period
  periodStart     DateTime
  periodEnd       DateTime
  granularity     AnalyticsGranularity @default(DAILY)
  
  // Raw data
  rawData         Json      @default("{}")
  
  // Audit
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([postId])
  @@index([socialAccountId])
  @@index([periodStart, periodEnd])
  @@map("analytics")
}

enum AnalyticsGranularity {
  HOURLY
  DAILY
  WEEKLY
  MONTHLY
  YEARLY
}
```

### 8. Subscription Models
```prisma
model Subscription {
  id              String    @id @default(cuid())
  
  // Plan
  plan            SubscriptionPlan @default(FREE)
  status          SubscriptionStatus @default(ACTIVE)
  
  // Billing
  stripeCustomerId String?  @unique
  stripeSubscriptionId String? @unique
  stripePriceId   String?
  
  // Limits
  postsLimit      Int       @default(10)
  accountsLimit   Int       @default(3)
  usersLimit      Int       @default(1)
  
  // Period
  currentPeriodStart DateTime
  currentPeriodEnd DateTime
  cancelAt        DateTime?
  canceledAt      DateTime?
  
  // Relations
  userId          String?   @unique
  organizationId  String?   @unique
  
  user            User?     @relation(fields: [userId], references: [id], onDelete: Cascade)
  organization    Organization? @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  // Audit
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([status])
  @@index([plan])
  @@map("subscriptions")
}

enum SubscriptionPlan {
  FREE
  STARTER
  PROFESSIONAL
  BUSINESS
  ENTERPRISE
}

enum SubscriptionStatus {
  ACTIVE
  PAST_DUE
  CANCELED
  INCOMPLETE
  TRIALING
}
```

### 9. Additional Models
```prisma
model ContentTemplate {
  id              String    @id @default(cuid())
  name            String
  description     String?
  content         String    @db.Text
  variables       Json      @default("[]")
  category        String?
  
  organizationId  String?
  organization    Organization? @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  isPublic        Boolean   @default(false)
  usageCount      Int       @default(0)
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([organizationId])
  @@index([category])
  @@index([isPublic])
  @@map("content_templates")
}

model Tag {
  id              String    @id @default(cuid())
  name            String
  color           String?
  
  organizationId  String?
  organization    Organization? @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  posts           Post[]    @relation("PostTags")
  campaigns       Campaign[] @relation("CampaignTags")
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@unique([name, organizationId])
  @@index([organizationId])
  @@map("tags")
}

model ApiKey {
  id              String    @id @default(cuid())
  name            String
  key             String    @unique
  lastUsedAt      DateTime?
  expiresAt       DateTime?
  
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  permissions     String[]  @default([])
  rateLimit       Int       @default(1000)
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  revokedAt       DateTime?
  
  @@index([key])
  @@index([userId])
  @@map("api_keys")
}

model Notification {
  id              String    @id @default(cuid())
  type            String
  title           String
  message         String    @db.Text
  data            Json      @default("{}")
  
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  isRead          Boolean   @default(false)
  readAt          DateTime?
  
  createdAt       DateTime  @default(now())
  
  @@index([userId])
  @@index([isRead])
  @@map("notifications")
}

model Activity {
  id              String    @id @default(cuid())
  type            String
  action          String
  entityType      String?
  entityId        String?
  metadata        Json      @default("{}")
  
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  ipAddress       String?
  userAgent       String?
  
  createdAt       DateTime  @default(now())
  
  @@index([userId])
  @@index([type])
  @@index([entityType, entityId])
  @@map("activities")
}

model CampaignAnalytics {
  id              String    @id @default(cuid())
  campaignId      String
  campaign        Campaign  @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  
  // Aggregated metrics
  totalPosts      Int       @default(0)
  totalImpressions Int      @default(0)
  totalEngagements Int      @default(0)
  totalClicks     Int       @default(0)
  totalConversions Int      @default(0)
  
  // ROI metrics
  roi             Float     @default(0)
  costPerClick    Float     @default(0)
  costPerEngagement Float   @default(0)
  
  // Period
  periodStart     DateTime
  periodEnd       DateTime
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([campaignId])
  @@index([periodStart, periodEnd])
  @@map("campaign_analytics")
}
```

## Implementation Tasks

### Task 1: Install Prisma Dependencies
```bash
# Install Prisma packages
npm install prisma @prisma/client --save-exact

# Install development dependencies
npm install --save-dev @types/node prisma-dbml-generator
```

### Task 2: Initialize Prisma
```bash
# Initialize Prisma with PostgreSQL
npx prisma init --datasource-provider postgresql

# Update .env file with database connection
echo "DATABASE_URL=\"postgresql://postgres:postgres@localhost:5432/allin?schema=public\"" >> .env
```

### Task 3: Create Migration Scripts
```bash
# Create initial migration
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate
```

### Task 4: Create Seed Data
```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Clean database
  await prisma.activity.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.analytics.deleteMany();
  await prisma.post.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.socialAccount.deleteMany();
  await prisma.organizationMember.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.session.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.user.deleteMany();

  // Create test users
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@allin.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN',
      emailVerified: new Date(),
    },
  });

  const testUser = await prisma.user.create({
    data: {
      email: 'test@allin.com',
      name: 'Test User',
      password: hashedPassword,
      role: 'USER',
      emailVerified: new Date(),
    },
  });

  // Create organization
  const organization = await prisma.organization.create({
    data: {
      name: 'Test Organization',
      slug: 'test-org',
      description: 'A test organization for development',
      members: {
        create: [
          {
            userId: adminUser.id,
            role: 'OWNER',
            permissions: ['*'],
          },
          {
            userId: testUser.id,
            role: 'MEMBER',
            permissions: ['read', 'write'],
          },
        ],
      },
    },
  });

  // Create subscriptions
  await prisma.subscription.create({
    data: {
      userId: adminUser.id,
      plan: 'PROFESSIONAL',
      status: 'ACTIVE',
      postsLimit: 1000,
      accountsLimit: 20,
      usersLimit: 10,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  // Create social accounts
  const twitterAccount = await prisma.socialAccount.create({
    data: {
      platform: 'TWITTER',
      platformAccountId: 'test_twitter_123',
      username: 'testuser',
      displayName: 'Test User',
      userId: testUser.id,
      organizationId: organization.id,
      status: 'ACTIVE',
      followerCount: 1000,
      followingCount: 500,
    },
  });

  const linkedinAccount = await prisma.socialAccount.create({
    data: {
      platform: 'LINKEDIN',
      platformAccountId: 'test_linkedin_456',
      username: 'test-user-linkedin',
      displayName: 'Test User Professional',
      userId: testUser.id,
      organizationId: organization.id,
      status: 'ACTIVE',
      followerCount: 500,
      followingCount: 200,
    },
  });

  // Create test campaign
  const campaign = await prisma.campaign.create({
    data: {
      name: 'Summer Campaign 2024',
      description: 'Test summer marketing campaign',
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      status: 'ACTIVE',
      userId: testUser.id,
      organizationId: organization.id,
      goals: {
        impressions: 10000,
        engagements: 500,
        clicks: 100,
      },
    },
  });

  // Create test posts
  const scheduledPost = await prisma.post.create({
    data: {
      content: 'This is a scheduled post for testing #test #development',
      hashtags: ['test', 'development'],
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: 'SCHEDULED',
      platforms: ['TWITTER', 'LINKEDIN'],
      userId: testUser.id,
      organizationId: organization.id,
      socialAccountId: twitterAccount.id,
      campaignId: campaign.id,
    },
  });

  const publishedPost = await prisma.post.create({
    data: {
      content: 'This post has been published! Check out our new features.',
      publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      status: 'PUBLISHED',
      platforms: ['TWITTER'],
      userId: testUser.id,
      organizationId: organization.id,
      socialAccountId: twitterAccount.id,
      impressions: 5000,
      engagements: 250,
      clicks: 50,
    },
  });

  // Create analytics for published post
  await prisma.analytics.create({
    data: {
      postId: publishedPost.id,
      socialAccountId: twitterAccount.id,
      impressions: 5000,
      reach: 4500,
      engagements: 250,
      clicks: 50,
      shares: 20,
      likes: 200,
      comments: 30,
      engagementRate: 5.0,
      clickRate: 1.0,
      shareRate: 0.4,
      periodStart: new Date(Date.now() - 24 * 60 * 60 * 1000),
      periodEnd: new Date(),
      granularity: 'DAILY',
    },
  });

  // Create content templates
  await prisma.contentTemplate.create({
    data: {
      name: 'Product Launch',
      description: 'Template for product launch announcements',
      content: '🚀 Exciting news! We\'re launching {product_name}! {description} Learn more: {link}',
      variables: [
        { name: 'product_name', type: 'text', required: true },
        { name: 'description', type: 'text', required: true },
        { name: 'link', type: 'url', required: true },
      ],
      category: 'marketing',
      organizationId: organization.id,
      isPublic: false,
    },
  });

  // Create tags
  await prisma.tag.createMany({
    data: [
      { name: 'marketing', color: '#FF6B6B', organizationId: organization.id },
      { name: 'announcement', color: '#4ECDC4', organizationId: organization.id },
      { name: 'product', color: '#45B7D1', organizationId: organization.id },
    ],
  });

  // Create notifications
  await prisma.notification.createMany({
    data: [
      {
        type: 'POST_PUBLISHED',
        title: 'Post Published Successfully',
        message: 'Your post has been published to Twitter',
        userId: testUser.id,
        data: { postId: publishedPost.id },
      },
      {
        type: 'CAMPAIGN_STARTED',
        title: 'Campaign Started',
        message: 'Summer Campaign 2024 is now active',
        userId: testUser.id,
        data: { campaignId: campaign.id },
      },
    ],
  });

  console.log('✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### Task 5: Create Prisma Client Singleton
```typescript
// backend/src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
  });
};

const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

export default prisma;
```

### Task 6: Add Database Utilities
```typescript
// backend/src/utils/database.ts
import prisma from '../lib/prisma';

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

export async function runMigrations() {
  try {
    const { execSync } = require('child_process');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    console.log('✅ Migrations applied successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

export async function seedDatabase() {
  try {
    const { execSync } = require('child_process');
    execSync('npx prisma db seed', { stdio: 'inherit' });
    console.log('✅ Database seeded successfully');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}
```

### Task 7: Update Package.json Scripts
```json
{
  "scripts": {
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:migrate:prod": "prisma migrate deploy",
    "db:seed": "prisma db seed",
    "db:reset": "prisma migrate reset",
    "db:studio": "prisma studio",
    "db:format": "prisma format",
    "db:validate": "prisma validate"
  },
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

## Testing Checklist
- [ ] Run `npm run db:migrate` to create database
- [ ] Run `npm run db:seed` to populate test data
- [ ] Open Prisma Studio with `npm run db:studio`
- [ ] Verify all tables are created
- [ ] Test database connection from Express
- [ ] Verify relationships work correctly
- [ ] Test soft delete functionality
- [ ] Check indexes are created
- [ ] Validate query performance
- [ ] Test connection pooling

## Success Criteria
- Database migrations run without errors
- All models are properly created
- Relationships are correctly defined
- Seed data is successfully inserted
- Prisma Studio shows all tables
- Database queries work from Express
- Indexes improve query performance
- Connection pooling handles multiple requests
- Soft delete preserves data integrity
- Audit fields track changes

## Next Steps
After completing this story:
1. Begin implementing authentication services
2. Create API endpoints for each model
3. Implement caching with Redis
4. Add database backup procedures
5. Set up monitoring and alerting