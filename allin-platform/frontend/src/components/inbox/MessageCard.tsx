import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Clock,
  Heart,
  MessageCircle,
  Share,
  Star,
  Check,
  CheckCheck,
  AlertCircle,
  Archive,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
} from 'lucide-react';
import { Message } from '@/types/inbox';

const platformIcons = {
  facebook: <Facebook className="h-4 w-4 text-blue-600" />,
  instagram: <Instagram className="h-4 w-4 text-pink-600" />,
  twitter: <Twitter className="h-4 w-4 text-blue-400" />,
  linkedin: <Linkedin className="h-4 w-4 text-blue-700" />
};

const typeIcons = {
  message: <MessageCircle className="h-4 w-4" />,
  comment: <MessageCircle className="h-4 w-4" />,
  mention: <Share className="h-4 w-4" />,
  review: <Star className="h-4 w-4" />
};

const priorityColors = {
  low: 'bg-gray-100 text-gray-700 border-gray-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  high: 'bg-red-100 text-red-700 border-red-200'
};

const statusIcons = {
  unread: <AlertCircle className="h-4 w-4 text-orange-500" />,
  read: <Check className="h-4 w-4 text-green-500" />,
  replied: <CheckCheck className="h-4 w-4 text-blue-500" />,
  archived: <Archive className="h-4 w-4 text-gray-500" />
};

interface MessageCardProps {
  message: Message;
  isSelected: boolean;
  onClick: (message: Message) => void;
  onToggleStar: (messageId: string, isStarred: boolean) => void;
  onMarkAsRead?: (messageId: string) => void;
}

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

  if (diffInHours < 1) return 'Just now';
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
  return date.toLocaleDateString();
};

export const MessageCard: React.FC<MessageCardProps> = ({
  message,
  isSelected,
  onClick,
  onToggleStar,
  onMarkAsRead,
}) => {
  const handleCardClick = () => {
    onClick(message);
    if (!message.isRead && onMarkAsRead) {
      onMarkAsRead(message.id);
    }
  };

  const handleStarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleStar(message.id, !message.isStarred);
  };

  return (
    <Card
      className={`cursor-pointer hover:shadow-md transition-all duration-200 ${
        isSelected ? 'ring-2 ring-primary shadow-lg' : ''
      } ${!message.isRead ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : ''}`}
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarImage src={message.from.avatar} alt={message.from.name} />
                <AvatarFallback className="text-xs">
                  {message.from.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                {platformIcons[message.platform]}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1 flex-wrap">
                <span className="font-medium text-sm truncate">{message.from.name}</span>
                <span className="text-xs text-muted-foreground truncate">{message.from.username}</span>
                {typeIcons[message.type]}
                <Badge variant="outline" className={`text-xs ${priorityColors[message.priority]}`}>
                  {message.priority}
                </Badge>
                {!message.isRead && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                )}
              </div>

              {message.postContext && (
                <div className="text-xs text-muted-foreground mb-2 p-2 bg-muted/50 rounded text-ellipsis overflow-hidden">
                  <span className="font-medium">Re:</span> {message.postContext}
                </div>
              )}

              <p className="text-sm mb-3 line-clamp-2 text-gray-700">{message.content}</p>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                  <span className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatTimestamp(message.timestamp)}
                  </span>
                  {message.engagement && (
                    <>
                      <span className="flex items-center">
                        <Heart className="h-3 w-3 mr-1" />
                        {message.engagement.likes}
                      </span>
                      <span className="flex items-center">
                        <MessageCircle className="h-3 w-3 mr-1" />
                        {message.engagement.replies}
                      </span>
                      <span className="flex items-center">
                        <Share className="h-3 w-3 mr-1" />
                        {message.engagement.shares}
                      </span>
                    </>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {statusIcons[message.status]}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleStarClick}
                    className="h-8 w-8 p-0 hover:bg-yellow-50"
                  >
                    <Star 
                      className={`h-4 w-4 ${
                        message.isStarred 
                          ? 'fill-yellow-400 text-yellow-400' 
                          : 'text-gray-400 hover:text-yellow-400'
                      }`} 
                    />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};