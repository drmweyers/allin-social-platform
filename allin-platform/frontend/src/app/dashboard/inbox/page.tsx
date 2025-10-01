'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Archive,
  CheckSquare,
  MessageCircle,
  AlertTriangle,
  RefreshCw,
  Loader2,
} from 'lucide-react';

// Import our custom components and types
import { MessageCard } from '@/components/inbox/MessageCard';
import { MessageDetailPanel } from '@/components/inbox/MessageDetailPanel';
import { InboxFilters } from '@/components/inbox/InboxFilters';
import { useInbox } from '@/hooks/useInbox';
import { Message, MessageFilters } from '@/types/inbox';
import { useToast } from '@/hooks/use-toast';

export default function InboxPage() {
  const { toast } = useToast();
  const {
    messages,
    stats,
    loading,
    error,
    pagination,
    fetchMessages,
    markAsRead,
    toggleStar,
    archiveMessage,
    replyToMessage,
    bulkUpdateMessages,
    refreshData,
  } = useInbox();

  // Local state for UI
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [filters, setFilters] = useState<MessageFilters>({
    limit: 50,
    offset: 0,
  });

  // Filter messages based on active tab and search
  const filteredMessages = useMemo(() => {
    let filtered = messages;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(message =>
        message.content.toLowerCase().includes(query) ||
        message.from.name.toLowerCase().includes(query) ||
        message.from.username.toLowerCase().includes(query) ||
        (message.postContext && message.postContext.toLowerCase().includes(query))
      );
    }

    // Apply tab filter
    switch (activeTab) {
      case 'unread':
        filtered = filtered.filter(msg => msg.status === 'unread');
        break;
      case 'starred':
        filtered = filtered.filter(msg => msg.isStarred);
        break;
      case 'high-priority':
        filtered = filtered.filter(msg => msg.priority === 'high');
        break;
      default:
        // 'all' - no additional filtering
        break;
    }

    return filtered;
  }, [messages, searchQuery, activeTab]);

  // Handle search and filters
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleFiltersChange = async (newFilters: Partial<MessageFilters>) => {
    const updatedFilters = { ...filters, ...newFilters, offset: 0 };
    setFilters(updatedFilters);
    await fetchMessages(updatedFilters);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  // Message actions
  const handleMessageSelect = (message: Message) => {
    setSelectedMessage(message);
    if (!message.isRead) {
      handleMarkAsRead(message.id);
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    try {
      await markAsRead(messageId);
      toast({
        title: "Message marked as read",
        description: "The message has been marked as read.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark message as read.",
        variant: "destructive",
      });
    }
  };

  const handleToggleStar = async (messageId: string, isStarred: boolean) => {
    try {
      await toggleStar(messageId, isStarred);
      toast({
        title: isStarred ? "Message starred" : "Star removed",
        description: isStarred 
          ? "The message has been added to your starred items." 
          : "The message has been removed from starred items.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update message.",
        variant: "destructive",
      });
    }
  };

  const handleArchive = async (messageId: string) => {
    try {
      await archiveMessage(messageId);
      toast({
        title: "Message archived",
        description: "The message has been archived.",
      });
      // Clear selection if archived message was selected
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(null);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to archive message.",
        variant: "destructive",
      });
    }
  };

  const handleReply = async (messageId: string, content: string) => {
    try {
      await replyToMessage(messageId, content);
      toast({
        title: "Reply sent",
        description: "Your reply has been sent successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send reply.",
        variant: "destructive",
      });
      throw error; // Re-throw to handle in component
    }
  };

  // Bulk actions
  const handleBulkArchive = async () => {
    if (selectedMessages.length === 0) return;

    try {
      await bulkUpdateMessages({
        messageIds: selectedMessages,
        updates: { status: 'archived' }
      });
      toast({
        title: "Messages archived",
        description: `${selectedMessages.length} messages have been archived.`,
      });
      setSelectedMessages([]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to archive messages.",
        variant: "destructive",
      });
    }
  };

  const handleBulkMarkAsRead = async () => {
    if (selectedMessages.length === 0) return;

    try {
      await bulkUpdateMessages({
        messageIds: selectedMessages,
        updates: { status: 'read' }
      });
      toast({
        title: "Messages marked as read",
        description: `${selectedMessages.length} messages have been marked as read.`,
      });
      setSelectedMessages([]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark messages as read.",
        variant: "destructive",
      });
    }
  };

  // Handle message selection for bulk actions
  const toggleMessageSelection = (messageId: string) => {
    setSelectedMessages(prev => 
      prev.includes(messageId)
        ? prev.filter(id => id !== messageId)
        : [...prev, messageId]
    );
  };

  const selectAllMessages = () => {
    setSelectedMessages(filteredMessages.map(msg => msg.id));
  };

  const clearSelection = () => {
    setSelectedMessages([]);
  };

  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Inbox</h1>
          <p className="text-muted-foreground">
            Manage all your social media messages, comments, and mentions in one place
          </p>
        </div>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error}. Please try refreshing the page.
          </AlertDescription>
        </Alert>
        <div className="flex justify-center">
          <Button onClick={refreshData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Inbox</h1>
          <p className="text-muted-foreground">
            Manage all your social media messages, comments, and mentions in one place
          </p>
        </div>
        <div className="flex space-x-2">
          {selectedMessages.length > 0 && (
            <>
              <Button variant="outline" onClick={handleBulkMarkAsRead}>
                <CheckSquare className="h-4 w-4 mr-2" />
                Mark as Read ({selectedMessages.length})
              </Button>
              <Button variant="outline" onClick={handleBulkArchive}>
                <Archive className="h-4 w-4 mr-2" />
                Archive ({selectedMessages.length})
              </Button>
              <Button variant="outline" onClick={clearSelection}>
                Clear Selection
              </Button>
            </>
          )}
          {selectedMessages.length === 0 && (
            <Button variant="outline" onClick={selectAllMessages} disabled={filteredMessages.length === 0}>
              Select All
            </Button>
          )}
        </div>
      </div>

      {/* Filters and Search */}
      <InboxFilters
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        stats={stats}
        onRefresh={refreshData}
        loading={loading}
      />

      {/* Loading State */}
      {loading && !messages.length && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading messages...</span>
          </div>
        </div>
      )}

      {/* Messages Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages List */}
        <div className="lg:col-span-2 space-y-4">
          {!loading && filteredMessages.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No messages found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || filters.platform || filters.type || filters.priority
                    ? "Try adjusting your filters or search criteria."
                    : "You don't have any messages yet. When you receive messages, mentions, or comments, they'll appear here."}
                </p>
                {(searchQuery || filters.platform || filters.type || filters.priority) && (
                  <Button variant="outline" onClick={() => {
                    setSearchQuery('');
                    setFilters({ limit: 50, offset: 0 });
                    setActiveTab('all');
                    fetchMessages({ limit: 50, offset: 0 });
                  }}>
                    Clear all filters
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredMessages.map((message) => (
              <MessageCard
                key={message.id}
                message={message}
                isSelected={selectedMessage?.id === message.id}
                onClick={handleMessageSelect}
                onToggleStar={handleToggleStar}
                onMarkAsRead={handleMarkAsRead}
              />
            ))
          )}

          {/* Load More Button */}
          {pagination.hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  const newFilters = { ...filters, offset: pagination.offset + pagination.limit };
                  setFilters(newFilters);
                  fetchMessages(newFilters);
                }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More Messages'
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Message Detail Panel */}
        <div className="space-y-4">
          <MessageDetailPanel
            message={selectedMessage}
            onReply={handleReply}
            onMarkAsRead={handleMarkAsRead}
            onToggleStar={handleToggleStar}
            onArchive={handleArchive}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}