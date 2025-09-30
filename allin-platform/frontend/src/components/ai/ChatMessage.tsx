'use client';

import React, { useState } from 'react';
import { MessageRole } from '@/types/ai';
import { Button } from '@/components/ui/button';
import {
  ThumbsUp,
  ThumbsDown,
  Copy,
  User,
  Bot,
  CheckCircle,
  XCircle,
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ChatMessageProps {
  id: string;
  content: string;
  role: MessageRole;
  suggestedActions?: string[];
  confidenceScore?: number;
  responseTime?: number;
  createdAt: Date;
  isHelpful?: boolean;
  onFeedback?: (messageId: string, helpful: boolean, feedback?: string) => void;
  onActionClick?: (action: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  id,
  content,
  role,
  suggestedActions = [],
  confidenceScore,
  responseTime,
  createdAt,
  isHelpful,
  onFeedback,
  onActionClick,
}) => {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [copied, setCopied] = useState(false);

  const isUser = role === MessageRole.USER;
  const isAssistant = role === MessageRole.ASSISTANT;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const handleFeedback = (helpful: boolean) => {
    if (onFeedback) {
      onFeedback(id, helpful, feedback);
      setShowFeedback(false);
      setFeedback('');
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className={cn(
      'flex gap-3 p-4',
      isUser ? 'justify-end' : 'justify-start'
    )}>
      {/* Avatar */}
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
          <Bot className="h-4 w-4 text-white" />
        </div>
      )}

      {/* Message content */}
      <div className={cn(
        'max-w-[80%] space-y-2',
        isUser ? 'order-2' : 'order-1'
      )}>
        {/* Message bubble */}
        <div className={cn(
          'rounded-lg px-4 py-3 text-sm',
          isUser
            ? 'bg-primary text-primary-foreground ml-auto'
            : 'bg-muted text-foreground'
        )}>
          {/* Content */}
          <div className="whitespace-pre-wrap">{content}</div>

          {/* Assistant metadata */}
          {isAssistant && (
            <div className="mt-2 pt-2 border-t border-border/30 text-xs text-muted-foreground space-y-1">
              <div className="flex items-center justify-between">
                <span>{formatTime(createdAt)}</span>
                {responseTime && (
                  <span>{responseTime}ms</span>
                )}
              </div>
              {confidenceScore && (
                <div className="flex items-center gap-1">
                  <span>Confidence:</span>
                  <div className="flex items-center gap-1">
                    <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 transition-all duration-300"
                        style={{ width: `${confidenceScore * 100}%` }}
                      />
                    </div>
                    <span>{Math.round(confidenceScore * 100)}%</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Suggested actions */}
        {isAssistant && suggestedActions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">Suggested actions:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => onActionClick?.(action)}
                >
                  {action}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Message actions */}
        {isAssistant && (
          <div className="flex items-center gap-2">
            {/* Copy button */}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              onClick={handleCopy}
            >
              {copied ? (
                <CheckCircle className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
              <span className="ml-1 text-xs">
                {copied ? 'Copied!' : 'Copy'}
              </span>
            </Button>

            {/* Feedback buttons */}
            {isHelpful === undefined && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => handleFeedback(true)}
                >
                  <ThumbsUp className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => setShowFeedback(true)}
                >
                  <ThumbsDown className="h-3 w-3" />
                </Button>
              </>
            )}

            {/* Feedback status */}
            {isHelpful !== undefined && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {isHelpful ? (
                  <>
                    <ThumbsUp className="h-3 w-3 text-green-500" />
                    <span>Helpful</span>
                  </>
                ) : (
                  <>
                    <ThumbsDown className="h-3 w-3 text-red-500" />
                    <span>Not helpful</span>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Feedback form */}
        {showFeedback && (
          <div className="bg-muted rounded-lg p-3 space-y-3">
            <p className="text-sm font-medium">Help us improve</p>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="What could be better about this response?"
              className="w-full px-3 py-2 text-sm bg-background border rounded-md resize-none h-20"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleFeedback(false)}
              >
                Submit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFeedback(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* User avatar */}
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 flex items-center justify-center">
          <User className="h-4 w-4 text-white" />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;