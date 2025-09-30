// Shared types for AI chat functionality

export enum MessageRole {
  USER = 'USER',
  ASSISTANT = 'ASSISTANT',
  SYSTEM = 'SYSTEM'
}

export interface Message {
  id: string;
  content: string;
  role: MessageRole;
  suggestedActions?: string[];
  confidenceScore?: number;
  responseTime?: number;
  createdAt: Date;
  isHelpful?: boolean;
}

export interface Conversation {
  id: string;
  title?: string;
  topic?: string;
  currentPage?: string;
  featureContext?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt: Date;
  messages: Message[];
}

export interface CreateConversationRequest {
  title?: string;
  currentPage?: string;
  featureContext?: string;
  initialMessage?: string;
  organizationId?: string;
}

export interface SendMessageRequest {
  message: string;
  currentPage?: string;
  featureContext?: string;
}

export interface ChatResponse {
  id: string;
  content: string;
  role: MessageRole;
  suggestedActions?: string[];
  confidenceScore?: number;
  responseTime?: number;
  createdAt: Date;
}

export interface QuickQuestionsResponse {
  questions: string[];
}

export interface ConversationAnalytics {
  totalConversations: number;
  totalMessages: number;
  avgResponseTime: number;
  helpfulnessRate: number;
}