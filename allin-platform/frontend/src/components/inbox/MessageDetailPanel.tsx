import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  ExternalLink,
  Reply,
  Archive,
  Trash2,
  Star,
  MoreHorizontal,
  Send,
  Image,
  Paperclip,
  Smile,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Message } from '@/types/inbox';

const platformIcons = {
  facebook: <Facebook className="h-4 w-4 text-blue-600" />,
  instagram: <Instagram className="h-4 w-4 text-pink-600" />,
  twitter: <Twitter className="h-4 w-4 text-blue-400" />,
  linkedin: <Linkedin className="h-4 w-4 text-blue-700" />
};

const priorityColors = {
  low: 'bg-gray-100 text-gray-700 border-gray-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  high: 'bg-red-100 text-red-700 border-red-200'
};

interface MessageDetailPanelProps {
  message: Message | null;
  onReply: (messageId: string, content: string) => Promise<void>;
  onMarkAsRead: (messageId: string) => void;
  onToggleStar: (messageId: string, isStarred: boolean) => void;
  onArchive: (messageId: string) => void;
  loading?: boolean;
}

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const MessageDetailPanel: React.FC<MessageDetailPanelProps> = ({
  message,
  onReply,
  onMarkAsRead,
  onToggleStar,
  onArchive,
  loading = false,
}) => {
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);

  const handleReply = async () => {
    if (!message || !replyText.trim()) return;

    try {
      setIsReplying(true);
      await onReply(message.id, replyText);
      setReplyText('');
    } catch (error) {
      console.error('Error sending reply:', error);
    } finally {
      setIsReplying(false);
    }
  };

  if (!message) {
    return (
      <Card className="h-full">
        <CardContent className="p-6 text-center h-full flex items-center justify-center">
          <div>
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Reply className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-lg font-medium mb-2">Select a message</p>
            <p className="text-sm text-muted-foreground">
              Choose a message from the list to view details and reply
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Message Details */}
      <Card className="flex-shrink-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Message Details</CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onMarkAsRead(message.id)}
                disabled={message.isRead}
              >
                Mark as Read
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onToggleStar(message.id, !message.isStarred)}>
                    <Star className={`h-4 w-4 mr-2 ${message.isStarred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                    {message.isStarred ? 'Unstar' : 'Star'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onArchive(message.id)}>
                    <Archive className="h-4 w-4 mr-2" />
                    Archive
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in Platform
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* User Info */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Avatar className="h-12 w-12">
                <AvatarImage src={message.from.avatar} alt={message.from.name} />
                <AvatarFallback>
                  {message.from.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm">
                {platformIcons[message.platform]}
              </div>
            </div>
            <div className="flex-1">
              <p className="font-medium text-lg">{message.from.name}</p>
              <p className="text-sm text-muted-foreground">{message.from.username}</p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className={priorityColors[message.priority]}>
                {message.priority} priority
              </Badge>
              <Badge variant={message.status === 'unread' ? 'destructive' : 'secondary'}>
                {message.status}
              </Badge>
            </div>
          </div>

          {/* Original Post Context */}
          {message.postContext && (
            <>
              <Separator />
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium mb-1 text-muted-foreground">Original Post:</p>
                <p className="text-sm">{message.postContext}</p>
              </div>
            </>
          )}

          {/* Message Content */}
          <Separator />
          <div className="p-4 border rounded-lg bg-white">
            <p className="text-base leading-relaxed">{message.content}</p>
          </div>

          {/* Metadata */}
          <div className="flex items-center justify-between text-sm text-muted-foreground pt-2">
            <span>{formatTimestamp(message.timestamp)}</span>
            {message.engagement && (
              <div className="flex space-x-4">
                <span>{message.engagement.likes} likes</span>
                <span>{message.engagement.replies} replies</span>
                <span>{message.engagement.shares} shares</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Reply Section */}
      <Card className="flex-1 flex flex-col">
        <CardHeader className="flex-shrink-0">
          <CardTitle className="text-lg flex items-center">
            <Reply className="h-5 w-5 mr-2" />
            Reply to {message.from.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col space-y-4">
          <div className="flex-1">
            <Textarea
              placeholder={`Reply to ${message.from.name}...`}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="resize-none h-32 focus:ring-2 focus:ring-primary"
              disabled={isReplying}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" disabled={isReplying}>
                <Image className="h-4 w-4 mr-2" />
                Add Image
              </Button>
              <Button variant="outline" size="sm" disabled={isReplying}>
                <Paperclip className="h-4 w-4 mr-2" />
                Attach File
              </Button>
              <Button variant="outline" size="sm" disabled={isReplying}>
                <Smile className="h-4 w-4 mr-2" />
                Emoji
              </Button>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setReplyText('')}
                disabled={isReplying || !replyText.trim()}
              >
                Clear
              </Button>
              <Button 
                onClick={handleReply} 
                disabled={!replyText.trim() || isReplying}
                className="min-w-24"
              >
                {isReplying ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </div>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Reply
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Character Count */}
          <div className="text-xs text-muted-foreground text-right">
            {replyText.length}/280 characters
          </div>
        </CardContent>
      </Card>
    </div>
  );
};