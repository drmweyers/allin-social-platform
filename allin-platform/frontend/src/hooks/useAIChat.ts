'use client';

import { useState, useCallback } from 'react';
import {
  Conversation,
  Message,
  CreateConversationRequest,
  SendMessageRequest,
  ChatResponse,
  QuickQuestionsResponse,
  ConversationAnalytics
} from '@/types/ai';

export const useAIChat = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiCall = useCallback(async (url: string, options: RequestInit = {}) => {
    try {
      setError(null);
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'API call failed');
      }

      return data.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const createConversation = useCallback(async (request: CreateConversationRequest): Promise<Conversation> => {
    setIsLoading(true);
    try {
      const conversation = await apiCall('/api/ai-chat/conversations', {
        method: 'POST',
        body: JSON.stringify(request),
      });
      return conversation;
    } finally {
      setIsLoading(false);
    }
  }, [apiCall]);

  const getConversations = useCallback(async (limit?: number): Promise<Conversation[]> => {
    setIsLoading(true);
    try {
      const url = limit ? `/api/ai-chat/conversations?limit=${limit}` : '/api/ai-chat/conversations';
      const conversations = await apiCall(url);
      return conversations;
    } finally {
      setIsLoading(false);
    }
  }, [apiCall]);

  const getConversation = useCallback(async (conversationId: string): Promise<Conversation> => {
    setIsLoading(true);
    try {
      const conversation = await apiCall(`/api/ai-chat/conversations/${conversationId}`);
      return conversation;
    } finally {
      setIsLoading(false);
    }
  }, [apiCall]);

  const sendMessage = useCallback(async (
    conversationId: string,
    request: SendMessageRequest
  ): Promise<ChatResponse> => {
    setIsLoading(true);
    try {
      const response = await apiCall(`/api/ai-chat/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify(request),
      });
      return response;
    } finally {
      setIsLoading(false);
    }
  }, [apiCall]);

  const submitMessageFeedback = useCallback(async (
    messageId: string,
    helpful: boolean,
    feedback?: string
  ): Promise<Message> => {
    const response = await apiCall(`/api/ai-chat/messages/${messageId}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ helpful, feedback }),
    });
    return response;
  }, [apiCall]);

  const archiveConversation = useCallback(async (conversationId: string): Promise<Conversation> => {
    const conversation = await apiCall(`/api/ai-chat/conversations/${conversationId}`, {
      method: 'DELETE',
    });
    return conversation;
  }, [apiCall]);

  const getQuickQuestions = useCallback(async (
    page?: string,
    context?: string
  ): Promise<QuickQuestionsResponse> => {
    const params = new URLSearchParams();
    if (page) params.append('page', page);
    if (context) params.append('context', context);

    const url = `/api/ai-chat/quick-questions?${params.toString()}`;
    const response = await apiCall(url);
    return response;
  }, [apiCall]);

  const getAnalytics = useCallback(async (): Promise<ConversationAnalytics> => {
    const analytics = await apiCall('/api/ai-chat/analytics');
    return analytics;
  }, [apiCall]);

  return {
    // State
    isLoading,
    error,

    // Actions
    createConversation,
    getConversations,
    getConversation,
    sendMessage,
    submitMessageFeedback,
    archiveConversation,
    getQuickQuestions,
    getAnalytics,

    // Utilities
    clearError: () => setError(null),
  };
};

export default useAIChat;