# Technical Architecture Document
# AllIN Social Media Management Platform

## Version 1.0 - Next.js/Express Stack
**Date**: January 2025
**Architect**: Architecture Agent
**Status**: Architecture Phase

---

## 1. Technology Stack Overview

### Frontend Stack
- **Framework**: Next.js 14.2.18 (React 18.3.1)
- **Language**: TypeScript 5.6.3
- **Styling**:
  - Tailwind CSS 3.4.14
  - Tailwind Animate
  - @tailwindcss/forms & @tailwindcss/typography
- **UI Components**:
  - Radix UI (Dialog, Dropdown, Select, Toast, Tabs, etc.)
  - Lucide React icons & Heroicons
  - Custom shadcn/ui-style components
- **State Management**:
  - Jotai 2.10.3 (global state)
  - Recoil 0.7.7 (complex state patterns)
  - React Hook Form 7.53.2 (form state)
- **Data Fetching**: Axios 1.7.7
- **Charts/Visualization**:
  - Chart.js 4.5.0 & React-chartjs-2 5.3.0
  - Recharts 2.13.3
- **Animations**: Framer Motion 11.11.17
- **Drag & Drop**:
  - @dnd-kit/core 6.1.0
  - @dnd-kit/sortable 8.0.0
- **Forms/Validation**:
  - React Hook Form with Zod 3.23.8
  - @hookform/resolvers
- **Utilities**:
  - date-fns 3.6.0
  - clsx 2.1.1
  - class-variance-authority 0.7.1

### Backend Stack
- **Runtime**: Node.js (>=18.0.0)
- **Framework**: Express 4.21.1
- **Language**: TypeScript 5.7.2
- **ORM**: Prisma 5.22.0
- **Database**: PostgreSQL 16 (Alpine)
- **Caching**: Redis 7 (Alpine)
- **Authentication**:
  - JWT (jsonwebtoken 9.0.2)
  - bcryptjs 3.0.2
- **Validation**:
  - Zod 3.24.1
  - express-validator 7.2.0
- **Security**:
  - Helmet 8.0.0
  - CORS 2.8.5
  - express-rate-limit 7.4.1
- **File Upload**: Multer 1.4.5
- **Email**:
  - Nodemailer 6.9.17 (transport layer)
  - Mailgun (production email service)
  - MailHog (development testing)
- **Logging**: Winston 3.17.0
- **Job Queue**: Bull with Redis backend
- **WebSockets**: Socket.io 4.x

### AI/ML Services
- **OpenAI Integration**: GPT-4, DALL-E 3
- **Vector Database**: Pinecone/Weaviate for embeddings
- **Image Processing**: Sharp for optimization
- **Video Processing**: FFmpeg for transcoding

### Social Media SDKs
- **Meta**: Facebook Graph API SDK
- **Twitter/X**: Twitter API v2
- **LinkedIn**: LinkedIn API
- **TikTok**: TikTok API
- **Google**: YouTube Data API

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Services**:
  - PostgreSQL container (port 5432)
  - Redis container (port 6380)
  - MailHog for email testing (UI: 8025)
  - pgAdmin for database management (port 5050)
- **Environment**: Environment variables via .env files
- **Ports**:
  - Frontend: 3000 (dev) / 3001 (staging)
  - Backend API: 5000
  - WebSocket: 5001

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client Layer                          │
├───────────────────────────────────────────────────────────┤
│  Next.js App (SSR/SSG)  │  Mobile PWA  │  Browser Ext   │
└────────────┬──────────────────┬────────────────┬─────────┘
             │                  │                │
         ┌───▼──────────────────▼────────────────▼────┐
         │          API Gateway (Next.js API)          │
         │         Rate Limiting, Auth, Routing        │
         └──────────────────┬──────────────────────────┘
                           │
         ┌─────────────────▼──────────────────────────┐
         │          Express Backend Services           │
         ├──────────────────────────────────────────────┤
         │  • Auth Service     • Analytics Service     │
         │  • Content Service  • Publishing Service    │
         │  • Social Service   • AI Service           │
         │  • Team Service     • Integration Service  │
         └────────┬────────────────────┬──────────────┘
                  │                    │
         ┌────────▼──────┐    ┌───────▼──────────┐
         │  PostgreSQL   │    │     Redis        │
         │  (Primary DB) │    │   (Cache/Queue)  │
         └───────────────┘    └──────────────────┘
```

### 2.2 Microservices Architecture

```typescript
// Service Structure
/backend
  /src
    /services
      /auth           # Authentication & authorization
      /content        # Content creation & management
      /publishing     # Post scheduling & queue management
      /analytics      # Data aggregation & reporting
      /social         # Social platform integrations
      /ai             # AI/ML features
      /team           # Collaboration features
      /integration    # Third-party integrations
    /shared
      /middleware     # Common middleware
      /utils          # Shared utilities
      /types          # TypeScript definitions
      /validators     # Zod schemas
```

---

## 3. Frontend Architecture

### 3.1 Next.js Application Structure

```
/frontend
  /src
    /app                    # Next.js 14 App Router
      /(auth)              # Auth routes (login, register)
      /(dashboard)         # Protected dashboard routes
        /posts             # Content management
        /calendar          # Visual calendar
        /analytics         # Analytics dashboard
        /team              # Team management
        /settings          # User/org settings
      /api                 # API routes (BFF pattern)
    /components
      /ui                  # Radix UI + shadcn components
      /features            # Feature-specific components
      /layouts             # Layout components
    /lib
      /api                 # API client (Axios)
      /hooks               # Custom React hooks
      /stores              # Jotai/Recoil stores
      /utils               # Utility functions
    /styles
      /globals.css         # Tailwind imports
    /types                 # TypeScript definitions
```

### 3.2 State Management Strategy

```typescript
// Jotai for global state
// stores/authStore.ts
import { atom } from 'jotai';

export const userAtom = atom<User | null>(null);
export const organizationAtom = atom<Organization | null>(null);
export const selectedAccountsAtom = atom<SocialAccount[]>([]);

// Recoil for complex interdependent state
// stores/contentStore.ts
import { atom, selector } from 'recoil';

export const postsState = atom({
  key: 'posts',
  default: [],
});

export const scheduledPostsSelector = selector({
  key: 'scheduledPosts',
  get: ({ get }) => {
    const posts = get(postsState);
    return posts.filter(p => p.status === 'scheduled');
  },
});

// React Hook Form for forms
// components/PostForm.tsx
const { register, handleSubmit, control } = useForm<PostFormData>({
  resolver: zodResolver(postSchema),
});
```

### 3.3 Component Architecture

```typescript
// Feature-based component structure
// components/features/content/PostComposer.tsx
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function PostComposer({
  accounts,
  onPublish
}: PostComposerProps) {
  // Component logic
}

// Radix UI + Tailwind styling
// components/ui/button.tsx
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground',
        outline: 'border border-input bg-background',
        // ... more variants
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);
```

---

## 4. Backend Architecture

### 4.1 Express Service Structure

```typescript
// server.ts - Main Express application
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use(rateLimit(rateLimitOptions));

// Service routers
app.use('/api/auth', authRouter);
app.use('/api/content', contentRouter);
app.use('/api/publishing', publishingRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/social', socialRouter);
app.use('/api/ai', aiRouter);
app.use('/api/team', teamRouter);
```

### 4.2 Database Schema (Prisma)

```prisma
// schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String         @id @default(uuid())
  email         String         @unique
  passwordHash  String
  name          String
  role          UserRole       @default(USER)
  organizations OrganizationMember[]
  posts         Post[]
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
}

model Organization {
  id            String         @id @default(uuid())
  name          String
  plan          Plan           @default(STARTER)
  members       OrganizationMember[]
  socialAccounts SocialAccount[]
  posts         Post[]
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
}

model SocialAccount {
  id            String         @id @default(uuid())
  platform      Platform
  accountId     String
  accountName   String
  accessToken   String         @db.Text
  refreshToken  String?        @db.Text
  tokenExpiry   DateTime?
  organization  Organization   @relation(fields: [organizationId], references: [id])
  organizationId String
  posts         Post[]
  analytics     Analytics[]
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
}

model Post {
  id            String         @id @default(uuid())
  content       String         @db.Text
  mediaUrls     String[]
  platforms     Platform[]
  status        PostStatus     @default(DRAFT)
  scheduledFor  DateTime?
  publishedAt   DateTime?
  author        User           @relation(fields: [authorId], references: [id])
  authorId      String
  organization  Organization   @relation(fields: [organizationId], references: [id])
  organizationId String
  socialAccount SocialAccount  @relation(fields: [accountId], references: [id])
  accountId     String
  approvals     Approval[]
  comments      Comment[]
  analytics     PostAnalytics[]
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
}

enum UserRole {
  ADMIN
  MANAGER
  PUBLISHER
  CONTRIBUTOR
  VIEWER
}

enum Platform {
  FACEBOOK
  INSTAGRAM
  TWITTER
  LINKEDIN
  TIKTOK
  YOUTUBE
  PINTEREST
}

enum PostStatus {
  DRAFT
  PENDING_APPROVAL
  APPROVED
  SCHEDULED
  PUBLISHING
  PUBLISHED
  FAILED
}
```

### 4.3 Authentication Flow

```typescript
// services/auth/authService.ts
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export class AuthService {
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('Invalid credentials');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new Error('Invalid credentials');

    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '7d' }
    );

    return { accessToken, refreshToken, user };
  }
}
```

### 4.4 Publishing Queue System

```typescript
// services/publishing/queueService.ts
import Bull from 'bull';
import { prisma } from '@/lib/prisma';
import { SocialPlatformService } from './platformService';

export const publishingQueue = new Bull('publishing', {
  redis: {
    port: 6380,
    host: 'localhost',
  },
});

// Process scheduled posts
publishingQueue.process(async (job) => {
  const { postId } = job.data;

  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: { socialAccount: true },
  });

  if (!post) throw new Error('Post not found');

  const platformService = new SocialPlatformService(post.socialAccount.platform);
  const result = await platformService.publish(post);

  await prisma.post.update({
    where: { id: postId },
    data: {
      status: result.success ? 'PUBLISHED' : 'FAILED',
      publishedAt: result.success ? new Date() : null,
    },
  });

  return result;
});

// Schedule posts
export async function schedulePost(postId: string, scheduledFor: Date) {
  const delay = scheduledFor.getTime() - Date.now();

  await publishingQueue.add(
    { postId },
    {
      delay,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    }
  );
}
```

---

## 5. AI Integration Architecture

### 5.1 AI Service Structure

```typescript
// services/ai/aiService.ts
import OpenAI from 'openai';

export class AIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateContent(prompt: string, platform: Platform) {
    const completion = await this.openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: `You are a social media content creator. Generate engaging content for ${platform}.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: platformLimits[platform],
    });

    return completion.choices[0].message.content;
  }

  async generateImage(prompt: string) {
    const response = await this.openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });

    return response.data[0].url;
  }

  async analyzeOptimalTime(accountId: string) {
    // Analyze historical engagement data
    const analytics = await prisma.postAnalytics.findMany({
      where: { post: { accountId } },
      orderBy: { engagementRate: 'desc' },
      take: 100,
    });

    // Use ML model to predict best times
    return this.predictOptimalTimes(analytics);
  }
}
```

---

## 6. Real-time Features

### 6.1 WebSocket Implementation

```typescript
// services/websocket/socketService.ts
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

export function initializeWebSocket(server: HttpServer) {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
      credentials: true,
    },
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const decoded = jwt.verify(token, process.env.JWT_SECRET!);
      socket.data.userId = decoded.userId;
      next();
    } catch (err) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    // Join organization room
    socket.on('join-organization', (orgId) => {
      socket.join(`org:${orgId}`);
    });

    // Real-time collaboration
    socket.on('post-comment', async (data) => {
      const comment = await createComment(data);
      io.to(`org:${data.orgId}`).emit('new-comment', comment);
    });

    // Live analytics updates
    socket.on('subscribe-analytics', (accountId) => {
      socket.join(`analytics:${accountId}`);
    });
  });

  return io;
}
```

---

## 6.2 Email Service Configuration

### Production Email Service (Mailgun)

```typescript
// services/email/mailgunService.ts
import Mailgun from 'mailgun.js';
import formData from 'form-data';
import { EmailTemplate, EmailOptions } from '@/types/email';

export class MailgunService {
  private mg: any;
  private domain: string;

  constructor() {
    const mailgun = new Mailgun(formData);
    this.mg = mailgun.client({
      username: 'api',
      key: process.env.MAILGUN_API_KEY!,
      url: process.env.MAILGUN_EU ? 'https://api.eu.mailgun.net' : 'https://api.mailgun.net'
    });
    this.domain = process.env.MAILGUN_DOMAIN!;
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const message = {
        from: options.from || `AllIN Platform <noreply@${this.domain}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        'o:tag': options.tags,
        'o:tracking': true,
        'o:tracking-clicks': true,
        'o:tracking-opens': true,
      };

      await this.mg.messages.create(this.domain, message);
    } catch (error) {
      console.error('Mailgun send error:', error);
      throw new Error('Failed to send email');
    }
  }

  async sendBulkEmail(recipients: string[], template: EmailTemplate): Promise<void> {
    const recipientVariables = recipients.reduce((acc, email) => {
      acc[email] = { id: email };
      return acc;
    }, {} as any);

    const message = {
      from: `AllIN Platform <noreply@${this.domain}>`,
      to: recipients,
      subject: template.subject,
      html: template.html,
      'recipient-variables': JSON.stringify(recipientVariables),
      'o:tag': ['bulk', template.category],
    };

    await this.mg.messages.create(this.domain, message);
  }

  async validateEmail(email: string): Promise<boolean> {
    try {
      const result = await this.mg.validate.get(email);
      return result.is_valid && !result.is_disposable;
    } catch (error) {
      console.error('Email validation error:', error);
      return false;
    }
  }
}
```

### Email Template System

```typescript
// services/email/emailTemplates.ts
export const emailTemplates = {
  // User invitation template
  userInvitation: (data: {
    inviterName: string;
    organizationName: string;
    inviteLink: string;
  }) => ({
    subject: `${data.inviterName} invited you to join ${data.organizationName} on AllIN`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e2e8f0; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>You're Invited to AllIN!</h1>
            </div>
            <div class="content">
              <p>Hi there!</p>
              <p><strong>${data.inviterName}</strong> has invited you to join <strong>${data.organizationName}</strong> on AllIN - the all-in-one social media management platform.</p>
              <p>Click the button below to accept your invitation and get started:</p>
              <a href="${data.inviteLink}" class="button">Accept Invitation</a>
              <p>This invitation link will expire in 7 days.</p>
              <p>Best regards,<br>The AllIN Team</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `${data.inviterName} invited you to join ${data.organizationName} on AllIN. Accept your invitation: ${data.inviteLink}`,
  }),

  // Password reset template
  passwordReset: (data: { resetLink: string; name: string }) => ({
    subject: 'Reset Your AllIN Password',
    html: `...template HTML...`,
    text: `Reset your password: ${data.resetLink}`,
  }),

  // Welcome email template
  welcome: (data: { name: string; loginLink: string }) => ({
    subject: 'Welcome to AllIN!',
    html: `...template HTML...`,
    text: `Welcome ${data.name}! Get started: ${data.loginLink}`,
  }),
};
```

### Email Queue System

```typescript
// services/email/emailQueue.ts
import Bull from 'bull';
import { MailgunService } from './mailgunService';

export const emailQueue = new Bull('email-queue', {
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
});

const mailgunService = new MailgunService();

emailQueue.process(async (job) => {
  const { type, data } = job.data;

  switch (type) {
    case 'invitation':
      await mailgunService.sendEmail({
        to: data.email,
        ...emailTemplates.userInvitation(data),
        tags: ['invitation', 'user-onboarding'],
      });
      break;

    case 'bulk-campaign':
      await mailgunService.sendBulkEmail(
        data.recipients,
        data.template
      );
      break;

    default:
      throw new Error(`Unknown email type: ${type}`);
  }
});

// Helper function to queue emails
export async function queueEmail(type: string, data: any, options?: any) {
  await emailQueue.add({ type, data }, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    ...options,
  });
}
```

### Development Email Service (MailHog)

```typescript
// services/email/devEmailService.ts
import nodemailer from 'nodemailer';

export class DevEmailService {
  private transporter: any;

  constructor() {
    // MailHog configuration for development
    this.transporter = nodemailer.createTransport({
      host: 'localhost',
      port: 1025, // MailHog SMTP port
      secure: false,
      ignoreTLS: true,
    });
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    await this.transporter.sendMail({
      from: options.from || 'noreply@allin.dev',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    console.log(`📧 Email sent to MailHog: ${options.to}`);
    console.log(`   View at: http://localhost:8025`);
  }
}
```

### Email Service Factory

```typescript
// services/email/emailService.ts
import { MailgunService } from './mailgunService';
import { DevEmailService } from './devEmailService';

export function getEmailService() {
  if (process.env.NODE_ENV === 'production') {
    return new MailgunService();
  }
  return new DevEmailService();
}

// Usage in controllers
export async function sendTeamInvitation(req: Request, res: Response) {
  const emailService = getEmailService();
  const { email, organizationId } = req.body;

  // Generate invitation token
  const inviteToken = generateInviteToken();
  const inviteLink = `${process.env.FRONTEND_URL}/invite/${inviteToken}`;

  // Save invitation to database
  await prisma.invitation.create({
    data: {
      email,
      organizationId,
      token: inviteToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      invitedBy: req.user.id,
    },
  });

  // Queue invitation email
  await queueEmail('invitation', {
    email,
    inviterName: req.user.name,
    organizationName: req.organization.name,
    inviteLink,
  });

  res.json({ success: true, message: 'Invitation sent' });
}
```

### Environment Configuration

```bash
# .env.production
MAILGUN_API_KEY=your-mailgun-api-key
MAILGUN_DOMAIN=mg.yourdomain.com
MAILGUN_EU=false # Set to true for EU region
MAILGUN_FROM_EMAIL=noreply@yourdomain.com
MAILGUN_WEBHOOK_KEY=webhook-signing-key

# .env.development
EMAIL_SERVICE=mailhog
MAILHOG_HOST=localhost
MAILHOG_PORT=1025
MAILHOG_UI=http://localhost:8025
```

---

## 7. MCP (Model Context Protocol) Implementation

### 7.1 MCP Server Architecture

```typescript
// services/mcp/mcpServer.ts
import { Server } from '@modelcontextprotocol/sdk';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio';

export class AllINMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server({
      name: 'allin-mcp-server',
      version: '1.0.0',
    });

    this.registerTools();
    this.registerResources();
    this.registerPrompts();
  }

  private registerTools() {
    // Content Management Tools
    this.server.addTool({
      name: 'create_post',
      description: 'Create a new social media post',
      inputSchema: {
        type: 'object',
        properties: {
          content: { type: 'string' },
          platforms: { type: 'array', items: { type: 'string' } },
          scheduledFor: { type: 'string', format: 'date-time' },
          mediaUrls: { type: 'array', items: { type: 'string' } }
        },
        required: ['content', 'platforms']
      },
      handler: async (args) => {
        return await this.createPost(args);
      }
    });

    // Analytics Tools
    this.server.addTool({
      name: 'get_analytics',
      description: 'Retrieve analytics for social media accounts',
      inputSchema: {
        type: 'object',
        properties: {
          accountIds: { type: 'array', items: { type: 'string' } },
          dateRange: {
            type: 'object',
            properties: {
              start: { type: 'string', format: 'date' },
              end: { type: 'string', format: 'date' }
            }
          },
          metrics: { type: 'array', items: { type: 'string' } }
        }
      },
      handler: async (args) => {
        return await this.getAnalytics(args);
      }
    });

    // Campaign Management
    this.server.addTool({
      name: 'create_campaign',
      description: 'Create a multi-platform marketing campaign',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          goals: { type: 'array', items: { type: 'string' } },
          budget: { type: 'number' },
          duration: { type: 'object' },
          targetAudience: { type: 'object' }
        },
        required: ['name', 'goals']
      },
      handler: async (args) => {
        return await this.createCampaign(args);
      }
    });
  }

  private registerResources() {
    // Expose platform data as resources
    this.server.addResource({
      uri: 'allin://accounts',
      name: 'Social Media Accounts',
      mimeType: 'application/json',
      handler: async () => {
        const accounts = await this.getSocialAccounts();
        return { contents: JSON.stringify(accounts) };
      }
    });

    this.server.addResource({
      uri: 'allin://posts/scheduled',
      name: 'Scheduled Posts',
      mimeType: 'application/json',
      handler: async () => {
        const posts = await this.getScheduledPosts();
        return { contents: JSON.stringify(posts) };
      }
    });
  }

  private registerPrompts() {
    // Pre-built prompt templates
    this.server.addPrompt({
      name: 'weekly_content_plan',
      description: 'Generate a weekly content plan',
      arguments: [
        { name: 'brandVoice', description: 'Brand voice and tone' },
        { name: 'targetAudience', description: 'Target audience description' }
      ],
      handler: async (args) => {
        return {
          prompt: `Create a weekly social media content plan for a brand with the following voice: ${args.brandVoice}.
                   Target audience: ${args.targetAudience}.
                   Include post ideas for each day, optimal posting times, and hashtag strategies.`
        };
      }
    });
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}
```

### 7.2 MCP Client Integration

```typescript
// lib/mcp/mcpClient.ts
import { Client } from '@modelcontextprotocol/sdk';

export class MCPClientManager {
  private clients: Map<string, Client> = new Map();

  async connectToLLM(llmType: 'claude' | 'openai' | 'custom', config: any) {
    const client = new Client({
      name: 'allin-client',
      version: '1.0.0',
    });

    // Configure based on LLM type
    switch (llmType) {
      case 'claude':
        await this.setupClaudeIntegration(client, config);
        break;
      case 'openai':
        await this.setupOpenAIIntegration(client, config);
        break;
      case 'custom':
        await this.setupCustomIntegration(client, config);
        break;
    }

    this.clients.set(llmType, client);
    return client;
  }

  private async setupClaudeIntegration(client: Client, config: any) {
    // Claude-specific MCP setup
    // Handle authentication and connection
  }
}
```

### 7.3 MCP Configuration

```json
// mcp-config.json
{
  "servers": {
    "allin": {
      "command": "node",
      "args": ["./dist/mcp/server.js"],
      "env": {
        "ALLIN_API_KEY": "${ALLIN_API_KEY}",
        "DATABASE_URL": "${DATABASE_URL}"
      }
    }
  },
  "tools": {
    "content": ["create_post", "edit_post", "delete_post", "schedule_post"],
    "analytics": ["get_analytics", "export_report", "compare_performance"],
    "campaign": ["create_campaign", "manage_budget", "optimize_targeting"],
    "ai": ["generate_content", "generate_image", "suggest_hashtags"]
  },
  "resources": {
    "readonly": ["accounts", "analytics", "insights"],
    "readwrite": ["posts", "campaigns", "settings"]
  },
  "security": {
    "authentication": "oauth",
    "rateLimit": {
      "requests": 1000,
      "window": "1h"
    },
    "allowedOrigins": ["https://claude.ai", "claude://desktop"]
  }
}
```

---

## 8. Agentic AI System Architecture

### 8.1 Agent Framework

```typescript
// services/agents/baseAgent.ts
export abstract class BaseAgent {
  protected id: string;
  protected name: string;
  protected capabilities: string[];
  protected model: any; // LLM instance
  protected memory: VectorStore;
  protected state: AgentState;

  constructor(config: AgentConfig) {
    this.id = config.id;
    this.name = config.name;
    this.capabilities = config.capabilities;
    this.memory = new VectorStore(config.memoryConfig);
    this.state = AgentState.IDLE;
  }

  abstract async perceive(context: Context): Promise<Observation>;
  abstract async decide(observation: Observation): Promise<Decision>;
  abstract async act(decision: Decision): Promise<ActionResult>;

  async execute(context: Context): Promise<AgentResponse> {
    this.state = AgentState.ACTIVE;

    // Perception phase
    const observation = await this.perceive(context);

    // Decision phase
    const decision = await this.decide(observation);

    // Action phase
    const result = await this.act(decision);

    // Learning phase
    await this.learn(context, decision, result);

    this.state = AgentState.IDLE;
    return { decision, result };
  }

  protected async learn(context: Context, decision: Decision, result: ActionResult) {
    // Store experience in memory
    await this.memory.store({
      context,
      decision,
      result,
      timestamp: new Date(),
      success: result.success
    });

    // Update agent model if needed
    if (result.feedback) {
      await this.updateModel(result.feedback);
    }
  }
}
```

### 8.2 Specialized Agents Implementation

```typescript
// services/agents/strategyAdvisor.ts
export class StrategyAdvisorAgent extends BaseAgent {
  private analyticsService: AnalyticsService;
  private competitorMonitor: CompetitorMonitor;

  constructor(config: AgentConfig) {
    super({
      ...config,
      name: 'Strategy Advisor',
      capabilities: [
        'analyze_engagement',
        'suggest_content_strategy',
        'identify_trends',
        'competitor_analysis'
      ]
    });

    this.analyticsService = new AnalyticsService();
    this.competitorMonitor = new CompetitorMonitor();
  }

  async perceive(context: Context): Promise<Observation> {
    // Gather data from multiple sources
    const [engagement, competitors, trends] = await Promise.all([
      this.analyticsService.getEngagementMetrics(context.accountId),
      this.competitorMonitor.getCompetitorActivity(context.competitors),
      this.identifyTrends(context.industry)
    ]);

    return {
      currentPerformance: engagement,
      competitorInsights: competitors,
      marketTrends: trends,
      opportunities: this.identifyOpportunities(engagement, competitors, trends)
    };
  }

  async decide(observation: Observation): Promise<Decision> {
    // Use LLM to analyze and make strategic decisions
    const prompt = this.buildStrategicPrompt(observation);
    const response = await this.model.complete(prompt);

    return {
      strategy: response.strategy,
      tactics: response.tactics,
      priority: this.calculatePriority(response),
      timeline: response.timeline
    };
  }

  async act(decision: Decision): Promise<ActionResult> {
    const actions = [];

    // Create content calendar based on strategy
    if (decision.tactics.includes('content_calendar')) {
      actions.push(await this.createContentCalendar(decision.strategy));
    }

    // Adjust posting schedule
    if (decision.tactics.includes('optimize_schedule')) {
      actions.push(await this.optimizePostingSchedule(decision.strategy));
    }

    // Generate content ideas
    if (decision.tactics.includes('content_ideation')) {
      actions.push(await this.generateContentIdeas(decision.strategy));
    }

    return {
      success: actions.every(a => a.success),
      actions,
      metrics: await this.measureImpact(actions)
    };
  }
}
```

### 8.3 Agent Orchestration System

```typescript
// services/agents/orchestrator.ts
export class AgentOrchestrator {
  private agents: Map<string, BaseAgent>;
  private eventBus: EventEmitter;
  private taskQueue: PriorityQueue<AgentTask>;

  constructor() {
    this.agents = new Map();
    this.eventBus = new EventEmitter();
    this.taskQueue = new PriorityQueue();

    this.initializeAgents();
    this.setupEventHandlers();
  }

  private initializeAgents() {
    // Initialize all agent types
    this.agents.set('strategy', new StrategyAdvisorAgent({}));
    this.agents.set('content', new ContentCreationAgent({}));
    this.agents.set('engagement', new EngagementManagerAgent({}));
    this.agents.set('performance', new PerformanceOptimizerAgent({}));
    this.agents.set('workflow', new WorkflowAutomationAgent({}));
  }

  async delegateTask(task: Task): Promise<TaskResult> {
    // Determine which agent(s) should handle the task
    const suitableAgents = this.selectAgents(task);

    // Check if multiple agents need to collaborate
    if (suitableAgents.length > 1) {
      return await this.coordinateAgents(suitableAgents, task);
    }

    // Single agent execution
    const agent = suitableAgents[0];
    return await agent.execute(task.context);
  }

  private async coordinateAgents(agents: BaseAgent[], task: Task): Promise<TaskResult> {
    // Create execution plan
    const plan = this.createExecutionPlan(agents, task);

    // Execute plan with inter-agent communication
    const results = [];
    for (const step of plan.steps) {
      const stepResult = await this.executeStep(step, results);
      results.push(stepResult);

      // Share results with other agents
      this.broadcastResult(step.agentId, stepResult);
    }

    return this.aggregateResults(results);
  }

  private broadcastResult(agentId: string, result: any) {
    this.eventBus.emit('agent:result', {
      agentId,
      result,
      timestamp: new Date()
    });
  }
}
```

### 8.4 Agent Learning and Memory System

```typescript
// services/agents/memory.ts
import { Pinecone } from '@pinecone-database/pinecone';

export class AgentMemorySystem {
  private pinecone: Pinecone;
  private namespace: string;

  constructor(config: MemoryConfig) {
    this.pinecone = new Pinecone({
      apiKey: config.pineconeApiKey,
      environment: config.environment
    });
    this.namespace = config.namespace;
  }

  async store(experience: Experience) {
    // Convert experience to embeddings
    const embedding = await this.createEmbedding(experience);

    // Store in vector database
    await this.pinecone.upsert({
      namespace: this.namespace,
      vectors: [{
        id: experience.id,
        values: embedding,
        metadata: {
          agentId: experience.agentId,
          timestamp: experience.timestamp,
          success: experience.success,
          context: JSON.stringify(experience.context),
          decision: JSON.stringify(experience.decision),
          result: JSON.stringify(experience.result)
        }
      }]
    });
  }

  async recall(query: string, k: number = 5): Promise<Experience[]> {
    // Create query embedding
    const queryEmbedding = await this.createEmbedding({ query });

    // Search similar experiences
    const results = await this.pinecone.query({
      namespace: this.namespace,
      vector: queryEmbedding,
      topK: k,
      includeMetadata: true
    });

    return results.matches.map(match => ({
      id: match.id,
      similarity: match.score,
      ...JSON.parse(match.metadata)
    }));
  }

  async consolidate() {
    // Periodic memory consolidation
    // Remove redundant memories, strengthen important patterns
  }
}
```

---

## 9. Performance Optimization

### 7.1 Caching Strategy

```typescript
// lib/cache/cacheService.ts
import Redis from 'ioredis';

export class CacheService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis({
      port: 6380,
      host: 'localhost',
    });
  }

  async get<T>(key: string): Promise<T | null> {
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async set(key: string, value: any, ttl?: number) {
    const data = JSON.stringify(value);
    if (ttl) {
      await this.redis.setex(key, ttl, data);
    } else {
      await this.redis.set(key, data);
    }
  }

  async invalidate(pattern: string) {
    const keys = await this.redis.keys(pattern);
    if (keys.length) {
      await this.redis.del(...keys);
    }
  }
}

// Usage in API
app.get('/api/analytics/:accountId', async (req, res) => {
  const cacheKey = `analytics:${req.params.accountId}`;

  // Check cache first
  const cached = await cache.get(cacheKey);
  if (cached) return res.json(cached);

  // Fetch from database
  const data = await fetchAnalytics(req.params.accountId);

  // Cache for 5 minutes
  await cache.set(cacheKey, data, 300);

  res.json(data);
});
```

### 7.2 Database Optimization

```typescript
// Prisma query optimization
const posts = await prisma.post.findMany({
  where: {
    organizationId,
    status: 'SCHEDULED',
    scheduledFor: {
      gte: startDate,
      lte: endDate,
    },
  },
  include: {
    author: {
      select: {
        id: true,
        name: true,
        email: true,
      },
    },
    socialAccount: {
      select: {
        id: true,
        platform: true,
        accountName: true,
      },
    },
    _count: {
      select: {
        comments: true,
        approvals: true,
      },
    },
  },
  orderBy: {
    scheduledFor: 'asc',
  },
  take: 50, // Pagination
  skip: (page - 1) * 50,
});
```

---

## 8. Security Implementation

### 8.1 API Security

```typescript
// middleware/security.ts
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

// Rate limiting per endpoint
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many login attempts',
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  keyGenerator: (req) => req.user?.id || req.ip,
});

// Input validation
import { z } from 'zod';

export const postSchema = z.object({
  content: z.string().min(1).max(5000),
  platforms: z.array(z.enum(['FACEBOOK', 'INSTAGRAM', 'TWITTER'])),
  scheduledFor: z.string().datetime().optional(),
  mediaUrls: z.array(z.string().url()).max(10).optional(),
});

// Middleware usage
app.post('/api/posts',
  authenticate,
  validateBody(postSchema),
  async (req, res) => {
    // Handler logic
  }
);
```

### 8.2 Data Encryption

```typescript
// lib/encryption/encryptionService.ts
import crypto from 'crypto';

export class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private key: Buffer;

  constructor() {
    this.key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');
  }

  encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }

  decrypt(encryptedData: string): string {
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
```

---

## 9. Testing Strategy

### 9.1 Unit Testing

```typescript
// __tests__/services/auth.test.ts
import { AuthService } from '@/services/auth/authService';
import { prismaMock } from '@/tests/prisma-mock';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
  });

  describe('login', () => {
    it('should return tokens for valid credentials', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        passwordHash: await bcrypt.hash('password', 10),
      };

      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const result = await authService.login('test@example.com', 'password');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user).toEqual(mockUser);
    });
  });
});
```

### 9.2 Integration Testing

```typescript
// __tests__/api/posts.test.ts
import request from 'supertest';
import app from '@/app';

describe('Posts API', () => {
  it('should create a new post', async () => {
    const response = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        content: 'Test post',
        platforms: ['TWITTER'],
        scheduledFor: '2024-12-31T10:00:00Z',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.status).toBe('SCHEDULED');
  });
});
```

### 9.3 E2E Testing

```typescript
// e2e/post-creation.spec.ts
import { test, expect } from '@playwright/test';

test('create and schedule a post', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');

  // Navigate to composer
  await page.goto('/dashboard/posts/new');

  // Create post
  await page.fill('[data-testid="post-content"]', 'Test post content');
  await page.click('[data-testid="platform-twitter"]');
  await page.click('[data-testid="schedule-button"]');

  // Select date/time
  await page.fill('[data-testid="schedule-date"]', '2024-12-31');
  await page.fill('[data-testid="schedule-time"]', '10:00');

  // Submit
  await page.click('[data-testid="publish-button"]');

  // Verify success
  await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
});
```

---

## 10. Deployment Architecture

### 10.1 Docker Configuration

```dockerfile
# Dockerfile.frontend
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
RUN npm ci --production
EXPOSE 3000
CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:5000
    depends_on:
      - backend

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/allin
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=allin
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6380:6379"
    volumes:
      - redis_data:/data

  mailhog:
    image: mailhog/mailhog
    ports:
      - "8025:8025"
      - "1025:1025"

  pgadmin:
    image: dpage/pgadmin4
    environment:
      - PGADMIN_DEFAULT_EMAIL=admin@example.com
      - PGADMIN_DEFAULT_PASSWORD=admin
    ports:
      - "5050:80"

volumes:
  postgres_data:
  redis_data:
```

---

## 11. Monitoring & Observability

### 11.1 Logging Strategy

```typescript
// lib/logger/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'allin-backend' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

// Usage
logger.info('Post scheduled', {
  postId: post.id,
  userId: user.id,
  scheduledFor: post.scheduledFor,
});
```

### 11.2 Performance Monitoring

```typescript
// middleware/monitoring.ts
export function performanceMonitoring(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;

    logger.info('Request processed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      userAgent: req.get('user-agent'),
    });

    // Send to metrics service
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        path: req.path,
        duration,
      });
    }
  });

  next();
}
```

---

## 12. Scalability Considerations

### 12.1 Horizontal Scaling

- **Load Balancing**: Use NGINX or AWS ALB for distributing traffic
- **Session Management**: Store sessions in Redis for stateless servers
- **Database Pooling**: Use PgBouncer for connection pooling
- **Microservices**: Split services as load increases

### 12.2 Performance Targets

- **API Response Time**: <200ms for 95th percentile
- **Page Load Time**: <2s for initial load
- **Concurrent Users**: Support 10,000 concurrent users
- **Posts per Second**: Process 100 posts/second
- **Uptime**: 99.9% availability

---

## Document History
- v1.0 - Initial architecture with Next.js/Express stack

## Approval
**Architect**: Architecture Agent
**Status**: Ready for Implementation