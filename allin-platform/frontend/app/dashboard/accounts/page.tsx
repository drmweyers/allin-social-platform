'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Music2,
  Plus,
  Check,
  X,
  AlertCircle,
  Settings,
  RefreshCw,
  Link2,
  Unlink
} from 'lucide-react';

interface SocialPlatform {
  id: string;
  name: string;
  icon: any;
  color: string;
  bgColor: string;
  connected: boolean;
  username?: string;
  followersCount?: number;
  lastSync?: string;
  permissions?: string[];
}

const socialPlatforms: SocialPlatform[] = [
  {
    id: 'facebook',
    name: 'Facebook',
    icon: Facebook,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    connected: false,
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: Instagram,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    connected: false,
  },
  {
    id: 'twitter',
    name: 'Twitter / X',
    icon: Twitter,
    color: 'text-sky-500',
    bgColor: 'bg-sky-50',
    connected: false,
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: Linkedin,
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    connected: false,
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: Music2,
    color: 'text-gray-900',
    bgColor: 'bg-gray-100',
    connected: false,
  },
];

export default function AccountsPage() {
  const [platforms, setPlatforms] = useState<SocialPlatform[]>(socialPlatforms);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleConnect = async (platformId: string) => {
    setConnecting(platformId);
    setMessage(null);

    try {
      // TODO: Implement OAuth flow
      const response = await fetch(`/api/social/connect/${platformId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.authUrl) {
          // Redirect to OAuth provider
          window.location.href = data.authUrl;
        }
      } else {
        throw new Error('Failed to initiate connection');
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: `Failed to connect to ${platforms.find(p => p.id === platformId)?.name}. Please try again.`
      });
      setConnecting(null);
    }
  };

  const handleDisconnect = async (platformId: string) => {
    setMessage(null);

    try {
      const response = await fetch(`/api/social/disconnect/${platformId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPlatforms(platforms.map(p =>
          p.id === platformId ? { ...p, connected: false, username: undefined } : p
        ));
        setMessage({
          type: 'success',
          text: `Successfully disconnected from ${platforms.find(p => p.id === platformId)?.name}`
        });
      } else {
        throw new Error('Failed to disconnect');
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: `Failed to disconnect. Please try again.`
      });
    }
  };

  const handleRefresh = async (platformId: string) => {
    // TODO: Implement token refresh
    console.log('Refreshing token for:', platformId);
  };

  const connectedCount = platforms.filter(p => p.connected).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Connected Accounts</h2>
        <p className="text-muted-foreground mt-2">
          Connect your social media accounts to start managing all your platforms in one place.
        </p>
      </div>

      {/* Status Alert */}
      {message && (
        <Alert className={message.type === 'error' ? 'border-red-200' : 'border-green-200'}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Connection Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected Accounts</CardTitle>
            <Link2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{connectedCount}</div>
            <p className="text-xs text-muted-foreground">
              out of {platforms.length} available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reach</CardTitle>
            <Check className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              followers across platforms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Sync</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Never</div>
            <p className="text-xs text-muted-foreground">
              sync your accounts to update
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Platform Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {platforms.map((platform) => (
          <Card key={platform.id} className="relative overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${platform.bgColor}`}>
                    <platform.icon className={`h-6 w-6 ${platform.color}`} />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{platform.name}</CardTitle>
                    {platform.connected && platform.username && (
                      <p className="text-sm text-muted-foreground">@{platform.username}</p>
                    )}
                  </div>
                </div>
                <Badge variant={platform.connected ? "success" : "secondary"}>
                  {platform.connected ? 'Connected' : 'Not Connected'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {platform.connected ? (
                <>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Followers</span>
                      <span className="font-medium">{platform.followersCount || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Sync</span>
                      <span className="font-medium">{platform.lastSync || 'Never'}</span>
                    </div>
                    {platform.permissions && (
                      <div>
                        <span className="text-muted-foreground">Permissions:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {platform.permissions.map(permission => (
                            <Badge key={permission} variant="outline" className="text-xs">
                              {permission}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleRefresh(platform.id)}
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Refresh
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Settings
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDisconnect(platform.id)}
                    >
                      <Unlink className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Connect your {platform.name} account to start posting and tracking analytics.
                  </p>
                  <Button
                    className="w-full"
                    onClick={() => handleConnect(platform.id)}
                    disabled={connecting === platform.id}
                  >
                    {connecting === platform.id ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Connect {platform.name}
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
          <CardDescription>
            Having trouble connecting your accounts? Here are some common solutions:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-start space-x-2">
            <Check className="h-4 w-4 text-green-500 mt-0.5" />
            <p className="text-sm">Make sure you're logged into your social media account in your browser</p>
          </div>
          <div className="flex items-start space-x-2">
            <Check className="h-4 w-4 text-green-500 mt-0.5" />
            <p className="text-sm">Grant all requested permissions for full functionality</p>
          </div>
          <div className="flex items-start space-x-2">
            <Check className="h-4 w-4 text-green-500 mt-0.5" />
            <p className="text-sm">Check that your account has the necessary admin/business privileges</p>
          </div>
          <div className="flex items-start space-x-2">
            <Check className="h-4 w-4 text-green-500 mt-0.5" />
            <p className="text-sm">Try disconnecting and reconnecting if you experience issues</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}