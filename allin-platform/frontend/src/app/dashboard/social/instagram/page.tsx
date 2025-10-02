'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Instagram, 
  Users, 
  Heart, 
  MessageCircle, 
  Eye, 
  TrendingUp, 
  Camera,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface InstagramAccount {
  id: string;
  username: string;
  name?: string;
  profilePictureUrl?: string;
  accountType: 'BUSINESS' | 'MEDIA_CREATOR' | 'PERSONAL';
  mediaCount?: number;
  followersCount?: number;
  followsCount?: number;
}

interface InstagramMedia {
  id: string;
  mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  mediaUrl: string;
  thumbnailUrl?: string;
  permalink: string;
  caption?: string;
  timestamp: string;
  username: string;
  likesCount?: number;
  commentsCount?: number;
}

interface InstagramInsights {
  impressions: number;
  reach: number;
  engagement: number;
  saves: number;
  videoViews?: number;
  websiteClicks?: number;
  profileViews?: number;
  follows?: number;
}

interface ConnectionStatus {
  connected: boolean;
  account?: InstagramAccount;
  error?: string;
}

export default function InstagramPage() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({ connected: false });
  const [media, setMedia] = useState<InstagramMedia[]>([]);
  const [insights, setInsights] = useState<InstagramInsights | null>(null);
  const [newPostData, setNewPostData] = useState({
    imageUrl: '',
    caption: ''
  });
  const [isPosting, setIsPosting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  // Check Instagram connection status on component mount
  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch('/api/instagram/connection-status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      
      if (data.success) {
        setConnectionStatus(data.data);
        if (data.data.connected) {
          fetchUserMedia();
          fetchAccountInsights();
        }
      } else {
        toast({
          title: "Connection Check Failed",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error checking Instagram connection:', error);
      toast({
        title: "Error",
        description: "Failed to check Instagram connection status",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const connectInstagram = async () => {
    try {
      setIsConnecting(true);
      const response = await fetch('/api/instagram/auth/url', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      
      if (data.success) {
        // In a real implementation, you would:
        // 1. Store the state temporarily
        // 2. Redirect to the authUrl
        // 3. Handle the callback to complete authentication
        window.open(data.data.authUrl, '_blank');
        toast({
          title: "Instagram Connection",
          description: "Please complete the authorization in the new window",
        });
      } else {
        toast({
          title: "Connection Failed",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error connecting to Instagram:', error);
      toast({
        title: "Error",
        description: "Failed to initiate Instagram connection",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const fetchUserMedia = async () => {
    try {
      const response = await fetch('/api/instagram/media?limit=6', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      
      if (data.success) {
        setMedia(data.data.media);
      } else {
        toast({
          title: "Media Fetch Failed",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching Instagram media:', error);
      toast({
        title: "Error",
        description: "Failed to fetch Instagram media",
        variant: "destructive",
      });
    }
  };

  const fetchAccountInsights = async () => {
    try {
      const response = await fetch('/api/instagram/insights?period=day', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      
      if (data.success) {
        setInsights(data.data.insights);
      } else {
        toast({
          title: "Insights Fetch Failed",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching Instagram insights:', error);
      toast({
        title: "Error",
        description: "Failed to fetch Instagram insights",
        variant: "destructive",
      });
    }
  };

  const createPost = async () => {
    if (!newPostData.imageUrl.trim() || isPosting) return;

    try {
      setIsPosting(true);
      const response = await fetch('/api/instagram/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          imageUrl: newPostData.imageUrl,
          caption: newPostData.caption
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setNewPostData({ imageUrl: '', caption: '' });
        fetchUserMedia(); // Refresh media
        toast({
          title: "Success",
          description: "Instagram post published successfully!",
        });
      } else {
        toast({
          title: "Post Failed",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error creating Instagram post:', error);
      toast({
        title: "Error",
        description: "Failed to create Instagram post",
        variant: "destructive",
      });
    } finally {
      setIsPosting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatNumber = (num?: number) => {
    if (!num) return 'N/A';
    return num.toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm text-muted-foreground">Loading Instagram connection status...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Instagram className="mr-3 h-8 w-8 text-pink-600" />
          Instagram Management
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your Instagram account and content
        </p>
      </div>

      {!connectionStatus.connected ? (
        /* Not Connected State */
        <Card className="w-full max-w-2xl mx-auto">
          <CardContent className="p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-pink-100 mb-6">
              <Camera className="h-8 w-8 text-pink-600" />
            </div>
            <CardTitle className="text-xl mb-2">Connect your Instagram account</CardTitle>
            <CardDescription className="mb-6">
              Connect your Instagram Business Account to start managing your posts and analytics.
            </CardDescription>
            <Button
              onClick={connectInstagram}
              disabled={isConnecting}
              className="bg-pink-600 hover:bg-pink-700"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Connect Instagram Account'
              )}
            </Button>
            {connectionStatus.error && (
              <div className="mt-4 text-sm text-red-600">
                Error: {connectionStatus.error}
              </div>
            )}
            <div className="mt-4 text-xs text-gray-500">
              Note: Requires Instagram Business Account linked to a Facebook Page
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Connected State */
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Account Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Account Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage 
                      src={connectionStatus.account?.profilePictureUrl} 
                      alt="Profile"
                    />
                    <AvatarFallback>
                      <Camera className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium">Connected</span>
                      <Badge variant="secondary">
                        {connectionStatus.account?.accountType}
                      </Badge>
                    </div>
                    {connectionStatus.account && (
                      <div className="mt-1">
                        <p className="text-sm font-medium">
                          {connectionStatus.account.name || connectionStatus.account.username}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          @{connectionStatus.account.username}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <Separator className="my-4" />
                <div className="grid grid-cols-2 gap-4 text-center">
                  <Button variant="outline" size="sm" className="text-pink-600 border-pink-200">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Profile
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600 border-red-200">
                    Disconnect
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Account Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Account Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-blue-500" />
                      <span className="text-sm text-muted-foreground">Followers</span>
                    </div>
                    <span className="font-medium">
                      {formatNumber(connectionStatus.account?.followersCount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-muted-foreground">Following</span>
                    </div>
                    <span className="font-medium">
                      {formatNumber(connectionStatus.account?.followsCount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Camera className="h-4 w-4 text-purple-500" />
                      <span className="text-sm text-muted-foreground">Posts</span>
                    </div>
                    <span className="font-medium">
                      {formatNumber(connectionStatus.account?.mediaCount)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Today's Insights</CardTitle>
              </CardHeader>
              <CardContent>
                {insights ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <Eye className="h-4 w-4 text-blue-500" />
                        <span className="text-sm text-muted-foreground">Impressions</span>
                      </div>
                      <span className="font-medium">{formatNumber(insights.impressions)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-muted-foreground">Reach</span>
                      </div>
                      <span className="font-medium">{formatNumber(insights.reach)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <Heart className="h-4 w-4 text-red-500" />
                        <span className="text-sm text-muted-foreground">Engagement</span>
                      </div>
                      <span className="font-medium">{formatNumber(insights.engagement)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-purple-500" />
                        <span className="text-sm text-muted-foreground">Profile Views</span>
                      </div>
                      <span className="font-medium">{formatNumber(insights.profileViews)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    <span className="text-sm text-muted-foreground">Loading insights...</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Create New Post */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Create New Post</CardTitle>
              <CardDescription>
                Upload an image and create a new Instagram post
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="imageUrl">Image URL</Label>
                  <Input
                    id="imageUrl"
                    type="url"
                    value={newPostData.imageUrl}
                    onChange={(e) => setNewPostData({ ...newPostData, imageUrl: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="caption">Caption</Label>
                  <Textarea
                    id="caption"
                    value={newPostData.caption}
                    onChange={(e) => setNewPostData({ ...newPostData, caption: e.target.value })}
                    placeholder="Write your caption here... #hashtags"
                    rows={3}
                    maxLength={2200}
                    className="mt-1"
                  />
                  <div className="mt-2 flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      {newPostData.caption.length}/2200 characters
                    </span>
                    <Button
                      onClick={createPost}
                      disabled={!newPostData.imageUrl.trim() || isPosting}
                      className="bg-pink-600 hover:bg-pink-700"
                    >
                      {isPosting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Publishing...
                        </>
                      ) : (
                        'Publish Post'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Posts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Posts</CardTitle>
              <CardDescription>
                Your latest Instagram content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {media.length > 0 ? (
                  media.map((item) => (
                    <div key={item.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="aspect-square mb-3 relative overflow-hidden rounded-md">
                        <img 
                          src={item.thumbnailUrl || item.mediaUrl} 
                          alt="Instagram post"
                          className="w-full h-full object-cover"
                        />
                        <Badge 
                          variant="secondary" 
                          className="absolute top-2 right-2 text-xs"
                        >
                          {item.mediaType}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {item.caption && (
                          <p className="text-sm text-gray-900 line-clamp-2">
                            {item.caption}
                          </p>
                        )}
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{formatDate(item.timestamp)}</span>
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-1">
                              <Heart className="h-3 w-3" />
                              <span>{formatNumber(item.likesCount)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MessageCircle className="h-3 w-3" />
                              <span>{formatNumber(item.commentsCount)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8">
                    <Camera className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <span className="text-gray-500">No posts found</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}