'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Search,
  Filter,
  MessageCircle,
  Heart,
  Repeat2,
  Share,
  Clock,
  Star,
  Archive,
  Trash2,
  ExternalLink,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Reply,
  Check,
  CheckCheck,
  AlertCircle
} from 'lucide-react';

interface Message {
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
}

const mockMessages: Message[] = [
  {
    id: '1',
    platform: 'instagram',
    type: 'comment',
    from: {
      name: 'Sarah Johnson',
      username: '@sarahjohnson',
      avatar: '/api/placeholder/32/32'
    },
    content: 'Love this post! When will you be releasing the new features?',
    timestamp: '2024-01-20T10:30:00Z',
    isRead: false,
    isStarred: true,
    engagement: { likes: 5, replies: 2, shares: 0 },
    postContext: 'Introducing our new AI-powered features!',
    priority: 'high',
    status: 'unread'
  },
  {
    id: '2',
    platform: 'twitter',
    type: 'mention',
    from: {
      name: 'Tech Reviewer',
      username: '@techreviewer',
      avatar: '/api/placeholder/32/32'
    },
    content: '@allin_app This looks amazing! Can you tell us more about the pricing plans?',
    timestamp: '2024-01-20T09:15:00Z',
    isRead: true,
    isStarred: false,
    engagement: { likes: 12, replies: 3, shares: 1 },
    priority: 'medium',
    status: 'read'
  },
  {
    id: '3',
    platform: 'facebook',
    type: 'message',
    from: {
      name: 'Business Owner',
      username: 'business.owner',
      avatar: '/api/placeholder/32/32'
    },
    content: 'Hi! I\'m interested in using your platform for my business. Could you provide more information about enterprise features?',
    timestamp: '2024-01-20T08:45:00Z',
    isRead: false,
    isStarred: false,
    priority: 'high',
    status: 'unread'
  },
  {
    id: '4',
    platform: 'linkedin',
    type: 'comment',
    from: {
      name: 'Marketing Pro',
      username: 'marketing.pro',
      avatar: '/api/placeholder/32/32'
    },
    content: 'Great insights on social media automation! This is exactly what our team needs.',
    timestamp: '2024-01-19T16:20:00Z',
    isRead: true,
    isStarred: false,
    engagement: { likes: 8, replies: 1, shares: 2 },
    postContext: 'Tips for maximizing your social media ROI',
    priority: 'medium',
    status: 'replied'
  }
];

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
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-red-100 text-red-700'
};

const statusIcons = {
  unread: <AlertCircle className="h-4 w-4 text-orange-500" />,
  read: <Check className="h-4 w-4 text-green-500" />,
  replied: <CheckCheck className="h-4 w-4 text-blue-500" />,
  archived: <Archive className="h-4 w-4 text-gray-500" />
};

export default function InboxPage() {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [replyText, setReplyText] = useState('');

  const filteredMessages = messages.filter(message => {
    const matchesSearch = message.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         message.from.name.toLowerCase().includes(searchQuery.toLowerCase());

    switch (activeTab) {
      case 'unread':
        return matchesSearch && message.status === 'unread';
      case 'starred':
        return matchesSearch && message.isStarred;
      case 'high-priority':
        return matchesSearch && message.priority === 'high';
      default:
        return matchesSearch;
    }
  });

  const unreadCount = messages.filter(m => m.status === 'unread').length;
  const starredCount = messages.filter(m => m.isStarred).length;
  const highPriorityCount = messages.filter(m => m.priority === 'high').length;

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return date.toLocaleDateString();
  };

  const handleMarkAsRead = (messageId: string) => {
    setMessages(prev => prev.map(msg =>
      msg.id === messageId ? { ...msg, status: 'read', isRead: true } : msg
    ));
  };

  const handleToggleStar = (messageId: string) => {
    setMessages(prev => prev.map(msg =>
      msg.id === messageId ? { ...msg, isStarred: !msg.isStarred } : msg
    ));
  };

  const handleReply = () => {
    if (!selectedMessage || !replyText.trim()) return;

    // In a real app, this would send the reply via API
    setMessages(prev => prev.map(msg =>
      msg.id === selectedMessage.id ? { ...msg, status: 'replied' } : msg
    ));
    setReplyText('');
    alert('Reply sent successfully!');
  };

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
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline">
            <Archive className="h-4 w-4 mr-2" />
            Archive Selected
          </Button>
        </div>
      </div>

      {/* Search and Tabs */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search messages, mentions, and comments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All Messages</TabsTrigger>
            <TabsTrigger value="unread">
              Unread {unreadCount > 0 && <Badge variant="destructive" className="ml-2">{unreadCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="starred">
              Starred {starredCount > 0 && <Badge variant="secondary" className="ml-2">{starredCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="high-priority">
              High Priority {highPriorityCount > 0 && <Badge variant="destructive" className="ml-2">{highPriorityCount}</Badge>}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Messages Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages List */}
        <div className="lg:col-span-2 space-y-4">
          {filteredMessages.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No messages found</p>
              </CardContent>
            </Card>
          ) : (
            filteredMessages.map((message) => (
              <Card
                key={message.id}
                className={`cursor-pointer hover:shadow-md transition-shadow ${
                  selectedMessage?.id === message.id ? 'ring-2 ring-primary' : ''
                } ${!message.isRead ? 'border-l-4 border-l-blue-500' : ''}`}
                onClick={() => setSelectedMessage(message)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <Avatar>
                        <AvatarImage src={message.from.avatar} />
                        <AvatarFallback>
                          {message.from.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium">{message.from.name}</span>
                          <span className="text-sm text-muted-foreground">{message.from.username}</span>
                          {platformIcons[message.platform]}
                          {typeIcons[message.type]}
                          <Badge className={priorityColors[message.priority]}>
                            {message.priority}
                          </Badge>
                        </div>

                        {message.postContext && (
                          <div className="text-xs text-muted-foreground mb-2 p-2 bg-muted rounded">
                            Re: {message.postContext}
                          </div>
                        )}

                        <p className="text-sm mb-2 line-clamp-2">{message.content}</p>

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
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleStar(message.id);
                              }}
                            >
                              <Star className={`h-4 w-4 ${message.isStarred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Message Detail and Reply Panel */}
        <div className="space-y-4">
          {selectedMessage ? (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Message Details</CardTitle>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMarkAsRead(selectedMessage.id)}
                        disabled={selectedMessage.isRead}
                      >
                        Mark as Read
                      </Button>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={selectedMessage.from.avatar} />
                      <AvatarFallback>
                        {selectedMessage.from.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{selectedMessage.from.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedMessage.from.username}</p>
                    </div>
                    <div className="ml-auto flex items-center space-x-2">
                      {platformIcons[selectedMessage.platform]}
                      <Badge className={priorityColors[selectedMessage.priority]}>
                        {selectedMessage.priority}
                      </Badge>
                    </div>
                  </div>

                  {selectedMessage.postContext && (
                    <div className="p-3 bg-muted rounded">
                      <p className="text-sm font-medium mb-1">Original Post:</p>
                      <p className="text-sm text-muted-foreground">{selectedMessage.postContext}</p>
                    </div>
                  )}

                  <div className="p-3 border rounded">
                    <p>{selectedMessage.content}</p>
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{formatTimestamp(selectedMessage.timestamp)}</span>
                    {selectedMessage.engagement && (
                      <div className="flex space-x-4">
                        <span>{selectedMessage.engagement.likes} likes</span>
                        <span>{selectedMessage.engagement.replies} replies</span>
                        <span>{selectedMessage.engagement.shares} shares</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Reply</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <textarea
                    placeholder="Type your reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="w-full p-3 border rounded-md resize-none h-24"
                  />
                  <div className="flex justify-between">
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        Add Template
                      </Button>
                      <Button variant="outline" size="sm">
                        Add Media
                      </Button>
                    </div>
                    <Button onClick={handleReply} disabled={!replyText.trim()}>
                      <Reply className="h-4 w-4 mr-2" />
                      Send Reply
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Select a message to view details and reply</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}