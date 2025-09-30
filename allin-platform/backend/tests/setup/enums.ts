// Prisma Enums for Testing
// These match the enums defined in prisma/schema.prisma

export enum Role {
  ADMIN = 'ADMIN',
  AGENCY_OWNER = 'AGENCY_OWNER',
  MANAGER = 'MANAGER',
  CREATOR = 'CREATOR',
  CLIENT = 'CLIENT',
  USER = 'USER'
}

export enum PostStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  PUBLISHED = 'PUBLISHED',
  FAILED = 'FAILED',
  ARCHIVED = 'ARCHIVED'
}

export enum SocialPlatform {
  FACEBOOK = 'FACEBOOK',
  TWITTER = 'TWITTER',
  INSTAGRAM = 'INSTAGRAM',
  LINKEDIN = 'LINKEDIN',
  YOUTUBE = 'YOUTUBE',
  TIKTOK = 'TIKTOK'
}

export enum ScheduleStatus {
  PENDING = 'PENDING',
  QUEUED = 'QUEUED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export enum RecurringPattern {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  BIWEEKLY = 'BIWEEKLY',
  MONTHLY = 'MONTHLY',
  CUSTOM = 'CUSTOM'
}

export enum TeamRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER'
}

export enum InboxMessageType {
  COMMENT = 'COMMENT',
  MENTION = 'MENTION',
  DIRECT_MESSAGE = 'DIRECT_MESSAGE',
  POST = 'POST',
  REVIEW = 'REVIEW'
}

export enum InboxMessageStatus {
  UNREAD = 'UNREAD',
  READ = 'READ',
  FLAGGED = 'FLAGGED',
  ARCHIVED = 'ARCHIVED'
}

export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  GIF = 'GIF',
  DOCUMENT = 'DOCUMENT',
  CAROUSEL = 'CAROUSEL'
}

// Export all enums as a single object for convenience
export const PrismaEnums = {
  Role,
  PostStatus,
  SocialPlatform,
  ScheduleStatus,
  RecurringPattern,
  TeamRole,
  InboxMessageType,
  InboxMessageStatus,
  MediaType
};