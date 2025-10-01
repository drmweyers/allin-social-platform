export interface Message {
  id: string;
  platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin';
  type: 'message' | 'comment' | 'mention' | 'review';
  from: {
    name: string;
    username: string;
    avatar: string;
  };
  content: string;
  timestamp: string;
  isRead: boolean;
  isStarred: boolean;
  engagement?: {
    likes: number;
    replies: number;
    shares: number;
  };
  postContext?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'unread' | 'read' | 'replied' | 'archived';
  userId?: string;
}

export interface InboxStats {
  total: number;
  unread: number;
  starred: number;
  highPriority: number;
  byPlatform: {
    facebook: number;
    instagram: number;
    twitter: number;
    linkedin: number;
  };
  byType: {
    message: number;
    comment: number;
    mention: number;
    review: number;
  };
}

export interface InboxApiResponse {
  success: boolean;
  data: {
    messages: Message[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
    totals: {
      total: number;
      unread: number;
      starred: number;
      highPriority: number;
    };
  };
  message?: string;
}

export interface MessageUpdateRequest {
  status?: 'unread' | 'read' | 'replied' | 'archived';
  isStarred?: boolean;
  priority?: 'low' | 'medium' | 'high';
}

export interface BulkUpdateRequest {
  messageIds: string[];
  updates: MessageUpdateRequest;
}

export interface ReplyRequest {
  content: string;
  messageId: string;
}

export interface MessageFilters {
  platform?: 'facebook' | 'instagram' | 'twitter' | 'linkedin';
  type?: 'message' | 'comment' | 'mention' | 'review';
  status?: 'unread' | 'read' | 'replied' | 'archived';
  priority?: 'low' | 'medium' | 'high';
  search?: string;
  limit?: number;
  offset?: number;
}

export interface InboxError {
  success: false;
  error: string;
  message?: string;
}