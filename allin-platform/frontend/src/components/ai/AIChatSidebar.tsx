'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MessageSquare,
  Send,
  X,
  ChevronLeft,
  ChevronRight,
  Bot,
  Sparkles,
  HelpCircle,
  RefreshCw,
  Settings,
  History,
  Plus,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';
import { MessageRole, Message, Conversation } from '@/types/ai';
import useAIChat from '@/hooks/useAIChat';

export interface AIChatSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

export const AIChatSidebar: React.FC<AIChatSidebarProps> = ({
  isOpen,
  onToggle,
  className,
}) => {
  const pathname = usePathname();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // AI Chat Hook
  const {
    isLoading: apiLoading,
    error: apiError,
    createConversation,
    getConversations,
    getConversation,
    sendMessage: sendMessageAPI,
    submitMessageFeedback,
    getQuickQuestions,
    clearError,
  } = useAIChat();

  // State
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [quickQuestions, setQuickQuestions] = useState<string[]>([]);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Load quick questions based on current page
  useEffect(() => {
    loadQuickQuestions();
  }, [pathname]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [currentConversation?.messages, isTyping, scrollToBottom]);

  // Load conversations on mount
  useEffect(() => {
    if (isOpen) {
      loadConversations();
    }
  }, [isOpen]);

  const loadQuickQuestions = async () => {
    try {
      const page = pathname.split('/').pop() || 'dashboard';
      const response = await getQuickQuestions(page);
      setQuickQuestions(response.questions);
    } catch (error) {
      console.error('Failed to load quick questions:', error);
    }
  };

  const loadConversations = async () => {
    try {
      const conversationsData = await getConversations();
      setConversations(conversationsData);

      // Load most recent conversation if no current conversation
      if (!currentConversation && conversationsData.length > 0) {
        loadConversation(conversationsData[0].id);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const loadConversation = async (conversationId: string) => {
    try {
      const conversation = await getConversation(conversationId);
      setCurrentConversation(conversation);
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const startNewConversation = async (initialMessage?: string) => {
    try {
      const page = pathname.split('/').pop() || 'dashboard';
      const featureContext = getFeatureContext(pathname);

      const conversation = await createConversation({
        currentPage: page,
        featureContext,
        initialMessage,
      });

      setCurrentConversation(conversation);
      setConversations(prev => [conversation, ...prev]);

      // If there was an initial message, send it
      if (initialMessage) {
        await sendMessage(initialMessage, conversation.id);
      }
    } catch (error) {
      console.error('Failed to start new conversation:', error);
    }
  };

  const sendMessage = async (messageText?: string, conversationId?: string) => {
    const textToSend = messageText || message.trim();
    const convId = conversationId || currentConversation?.id;

    if (!textToSend || !convId) return;

    try {
      setIsTyping(true);
      setMessage('');

      const page = pathname.split('/').pop() || 'dashboard';
      const featureContext = getFeatureContext(pathname);

      await sendMessageAPI(convId, {
        message: textToSend,
        currentPage: page,
        featureContext,
      });

      // Reload conversation to get updated messages
      await loadConversation(convId);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickQuestion = async (question: string) => {
    if (!currentConversation) {
      await startNewConversation(question);
    } else {
      await sendMessage(question);
    }
  };

  const handleMessageFeedback = async (messageId: string, helpful: boolean, feedback?: string) => {
    try {
      await submitMessageFeedback(messageId, helpful, feedback);

      // Reload conversation to update feedback status
      if (currentConversation) {
        await loadConversation(currentConversation.id);
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  const handleActionClick = (action: string) => {
    setMessage(action);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getFeatureContext = (path: string): string => {
    if (path.includes('/create')) return 'content-creation';
    if (path.includes('/analytics')) return 'analytics';
    if (path.includes('/calendar')) return 'scheduling';
    if (path.includes('/team')) return 'team-management';
    if (path.includes('/settings')) return 'settings';
    return 'general';
  };

  const getCurrentPageTitle = (): string => {
    const page = pathname.split('/').pop() || 'dashboard';
    const titles: Record<string, string> = {
      dashboard: 'Dashboard',
      create: 'Create Post',
      analytics: 'Analytics',
      calendar: 'Calendar',
      team: 'Team',
      settings: 'Settings',
      accounts: 'Accounts',
      inbox: 'Inbox',
      media: 'Media Library',
    };
    return titles[page] || 'Dashboard';
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed top-0 right-0 h-full bg-background border-l border-border z-50 flex flex-col transition-all duration-300',
          isOpen ? 'w-96' : 'w-0 lg:w-12',
          'lg:relative lg:top-auto lg:right-auto',
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          {isOpen ? (
            <>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">AI Assistant</h3>
                  <p className="text-xs text-muted-foreground">{getCurrentPageTitle()}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHistory(!showHistory)}
                  className="h-8 w-8 p-0"
                >
                  <History className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggle}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="h-8 w-8 p-0 mx-auto"
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
          )}
        </div>

        {isOpen && (
          <>
            {/* Conversation History */}
            {showHistory && (
              <div className="border-b p-4 max-h-48 overflow-y-auto">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-sm">Recent Conversations</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startNewConversation()}
                    className="h-7 px-2"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    New
                  </Button>
                </div>
                <div className="space-y-2">
                  {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => {
                        loadConversation(conv.id);
                        setShowHistory(false);
                      }}
                      className={cn(
                        'w-full text-left p-2 rounded-md text-sm hover:bg-accent',
                        currentConversation?.id === conv.id && 'bg-accent'
                      )}
                    >
                      <div className="font-medium truncate">
                        {conv.title || conv.topic || 'New conversation'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(conv.lastMessageAt).toLocaleDateString()}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            <ScrollArea className="flex-1">
              <div className="min-h-full">
                {apiLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : currentConversation?.messages.length ? (
                  <div>
                    {currentConversation.messages.map((msg) => (
                      <ChatMessage
                        key={msg.id}
                        {...msg}
                        onFeedback={handleMessageFeedback}
                        onActionClick={handleActionClick}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="font-semibold mb-2">Welcome to AI Assistant!</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      I'm here to help you with social media marketing, content creation, and using the AllIN platform.
                    </p>

                    {/* Quick questions */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-left">Quick questions:</p>
                      {quickQuestions.slice(0, 3).map((question, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          className="w-full text-left h-auto p-3 whitespace-normal"
                          onClick={() => handleQuickQuestion(question)}
                        >
                          <HelpCircle className="h-3 w-3 mr-2 flex-shrink-0" />
                          {question}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {isTyping && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="border-t p-4">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything about social media marketing..."
                    className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary max-h-32"
                    rows={2}
                    disabled={isTyping}
                  />
                </div>
                <Button
                  onClick={() => sendMessage()}
                  disabled={!message.trim() || isTyping}
                  size="sm"
                  className="h-auto px-3"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              {/* Start new conversation */}
              {currentConversation && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => startNewConversation()}
                  className="w-full mt-2 h-7"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Start new conversation
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default AIChatSidebar;