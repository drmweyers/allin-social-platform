import { useState, useEffect, useCallback } from 'react';
import { Message, InboxStats, MessageFilters, MessageUpdateRequest, BulkUpdateRequest, ReplyRequest } from '@/types/inbox';

export const useInbox = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [stats, setStats] = useState<InboxStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50,
    offset: 0,
    hasMore: false,
  });

  const fetchMessages = useCallback(async (filters: MessageFilters = {}) => {
    try {
      setLoading(true);
      setError(null);

      const searchParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/inbox/messages?${searchParams}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch messages');
      }

      setMessages(data.data.messages);
      setPagination(data.data.pagination);
      
      return data.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/inbox/stats');
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch stats');
      }

      setStats(data.data);
      return data.data;
    } catch (err) {
      console.error('Error fetching inbox stats:', err);
      return null;
    }
  }, []);

  const updateMessage = useCallback(async (messageId: string, updates: MessageUpdateRequest) => {
    try {
      const response = await fetch(`/api/inbox/messages/${messageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update message');
      }

      // Update local state
      setMessages(prev => prev.map(msg =>
        msg.id === messageId ? { ...msg, ...updates } : msg
      ));

      // Refresh stats
      fetchStats();

      return data.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw err;
    }
  }, [fetchStats]);

  const bulkUpdateMessages = useCallback(async (request: BulkUpdateRequest) => {
    try {
      const response = await fetch('/api/inbox/messages/bulk-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to bulk update messages');
      }

      // Update local state
      setMessages(prev => prev.map(msg =>
        request.messageIds.includes(msg.id) ? { ...msg, ...request.updates } : msg
      ));

      // Refresh stats
      fetchStats();

      return data.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw err;
    }
  }, [fetchStats]);

  const replyToMessage = useCallback(async (messageId: string, content: string) => {
    try {
      const response = await fetch(`/api/inbox/messages/${messageId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content, messageId }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to send reply');
      }

      // Update message status to replied
      setMessages(prev => prev.map(msg =>
        msg.id === messageId ? { ...msg, status: 'replied' as const, isRead: true } : msg
      ));

      // Refresh stats
      fetchStats();

      return data.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw err;
    }
  }, [fetchStats]);

  const markAsRead = useCallback((messageId: string) => {
    return updateMessage(messageId, { status: 'read' });
  }, [updateMessage]);

  const markAsUnread = useCallback((messageId: string) => {
    return updateMessage(messageId, { status: 'unread' });
  }, [updateMessage]);

  const toggleStar = useCallback((messageId: string, isStarred: boolean) => {
    return updateMessage(messageId, { isStarred });
  }, [updateMessage]);

  const archiveMessage = useCallback((messageId: string) => {
    return updateMessage(messageId, { status: 'archived' });
  }, [updateMessage]);

  const refreshData = useCallback(async () => {
    await Promise.all([fetchMessages(), fetchStats()]);
  }, [fetchMessages, fetchStats]);

  // Initial load
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  return {
    messages,
    stats,
    loading,
    error,
    pagination,
    fetchMessages,
    fetchStats,
    updateMessage,
    bulkUpdateMessages,
    replyToMessage,
    markAsRead,
    markAsUnread,
    toggleStar,
    archiveMessage,
    refreshData,
  };
};