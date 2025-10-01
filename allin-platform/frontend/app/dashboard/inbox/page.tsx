'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  MessageSquare,
  Search,
  Filter,
  Reply,
  Heart,
  Share,
  MoreHorizontal,
  Archive,
  Star,
  UserCheck,
  Clock,
  Send,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface Message {
  id: string;
  platform: 'FACEBOOK' | 'INSTAGRAM' | 'TWITTER' | 'LINKEDIN';
  type: 'comment' | 'message' | 'mention' | 'review';
  author: {
    name: string;
    username: string;
    avatar?: string;
    verified?: boolean;
  };
  content: string;
  timestamp: string;
  status: 'unread' | 'read' | 'replied' | 'archived';
  postContext?: {
    title: string;
    excerpt: string;
  };
  sentiment: 'positive' | 'neutral' | 'negative';
}

const mockMessages: Message[] = [
  {
    id: '1',
    platform: 'FACEBOOK',
    type: 'comment',
    author: {
      name: 'Sarah Johnson',
      username: 'sarah.j',
      verified: true
    },
    content: 'Love this post! Could you share more about your process?',
    timestamp: '2 hours ago',
    status: 'unread',
    postContext: {
      title: 'New Product Launch',
      excerpt: 'Excited to announce our latest innovation...'
    },
    sentiment: 'positive'
  },
  {
    id: '2',
    platform: 'INSTAGRAM',
    type: 'message',
    author: {
      name: 'Mike Chen',
      username: 'mike_designs'
    },
    content: 'Hi! I\'m interested in collaborating on a project. Do you have time for a quick call?',
    timestamp: '4 hours ago',
    status: 'read',
    sentiment: 'neutral'
  },
  {
    id: '3',
    platform: 'TWITTER',
    type: 'mention',
    author: {
      name: 'Tech News Daily',
      username: 'technewsdaily',
      verified: true
    },
    content: '@your_handle Great insights on the latest trends! What do you think about the future of AI?',
    timestamp: '6 hours ago',
    status: 'replied',
    sentiment: 'positive'
  },
  {
    id: '4',
    platform: 'LINKEDIN',
    type: 'comment',
    author: {
      name: 'Jennifer Liu',
      username: 'jliu_business'
    },
    content: 'I disagree with this approach. Have you considered the potential risks?',
    timestamp: '1 day ago',
    status: 'unread',
    postContext: {
      title: 'Business Strategy Update',
      excerpt: 'Here\'s our new approach to market expansion...'
    },
    sentiment: 'negative'
  }
];

const PlatformIcon = ({ platform }: { platform: string }) => {
  switch (platform) {
    case 'FACEBOOK': return <Facebook className="h-4 w-4 text-blue-600" />;
    case 'INSTAGRAM': return <Instagram className="h-4 w-4 text-pink-600" />;
    case 'TWITTER': return <Twitter className="h-4 w-4 text-sky-500" />;
    case 'LINKEDIN': return <Linkedin className="h-4 w-4 text-blue-700" />;
    default: return <MessageSquare className="h-4 w-4" />;
  }
};

const SentimentBadge = ({ sentiment }: { sentiment: string }) => {
  const colors = {
    positive: 'bg-green-100 text-green-700',
    neutral: 'bg-gray-100 text-gray-700',
    negative: 'bg-red-100 text-red-700'
  };
  return (
    <Badge variant="outline" className={colors[sentiment as keyof typeof colors]}>
      {sentiment}
    </Badge>
  );
};

export default function InboxPage() {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyText, setReplyText] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'replied'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMessages = messages.filter(message => {
    const matchesFilter = filter === 'all' || message.status === filter;
    const matchesSearch = searchQuery === '' || 
      message.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.author.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const unreadCount = messages.filter(m => m.status === 'unread').length;

  const handleReply = (messageId: string) => {
    if (replyText.trim()) {
      setMessages(messages.map(m => 
        m.id === messageId ? { ...m, status: 'replied' as const } : m
      ));
      setReplyText('');
      setSelectedMessage(null);
    }
  };

  const markAsRead = (messageId: string) => {
    setMessages(messages.map(m => 
      m.id === messageId && m.status === 'unread' ? { ...m, status: 'read' as const } : m
    ));
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Social Inbox</h2>
          <p className="text-muted-foreground mt-2">
            Manage all your social media conversations in one place.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <Badge className="bg-red-500">
              {unreadCount} unread
            </Badge>
          )}
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Messages</p>
                <p className="text-2xl font-bold">{messages.length}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unread</p>
                <p className="text-2xl font-bold text-red-600">{unreadCount}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Replied</p>
                <p className="text-2xl font-bold text-green-600">
                  {messages.filter(m => m.status === 'replied').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Response Rate</p>
                <p className="text-2xl font-bold">85%</p>
              </div>
              <Reply className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Messages</CardTitle>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search messages..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                </div>
              </div>
              <Tabs value={filter} onValueChange={(value) => setFilter(value as any)}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="unread">Unread</TabsTrigger>
                  <TabsTrigger value="replied">Replied</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {filteredMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-4 hover:bg-accent cursor-pointer transition-colors ${
                      message.status === 'unread' ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                    onClick={() => {
                      setSelectedMessage(message);
                      if (message.status === 'unread') {
                        markAsRead(message.id);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="flex-shrink-0">
                          <PlatformIcon platform={message.platform} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium text-gray-900">
                              {message.author.name}
                            </p>
                            {message.author.verified && (
                              <CheckCircle className="h-4 w-4 text-blue-500" />
                            )}
                            <Badge variant="outline" className="text-xs">
                              {message.type}
                            </Badge>
                            <SentimentBadge sentiment={message.sentiment} />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            @{message.author.username}
                          </p>
                          <p className="text-sm text-gray-900 mt-1 line-clamp-2">
                            {message.content}
                          </p>
                          {message.postContext && (
                            <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                              <p className="font-medium">{message.postContext.title}</p>
                              <p className="text-muted-foreground">{message.postContext.excerpt}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Message Detail & Reply */}
        <div className="space-y-6">
          {selectedMessage ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PlatformIcon platform={selectedMessage.platform} />
                  <span>Reply to {selectedMessage.author.name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm">{selectedMessage.content}</p>
                </div>
                <Textarea
                  placeholder="Type your reply..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={4}
                />
                <div className="flex justify-between items-center">
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Heart className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Archive className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button 
                    onClick={() => handleReply(selectedMessage.id)}
                    disabled={!replyText.trim()}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Reply
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Select a message to view details and reply
                </p>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark All as Read
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Archive className="h-4 w-4 mr-2" />
                Archive Selected
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Star className="h-4 w-4 mr-2" />
                Add to Favorites
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}