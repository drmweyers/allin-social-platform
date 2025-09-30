'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Building,
  User,
  Bell,
  Shield,
  CreditCard,
  Globe,
  Palette,
  Clock,
  Mail,
  Phone,
  MapPin,
  Camera,
  Save,
  AlertTriangle,
  Check,
  X,
  Plus,
  Trash2,
  Edit,
  Key,
  Eye,
  EyeOff,
  Download,
  Upload,
  RefreshCw,
  Zap,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  TiktokIcon as Tiktok,
  Users
} from 'lucide-react';

interface SocialAccount {
  id: string;
  platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'youtube' | 'tiktok';
  accountName: string;
  username: string;
  isConnected: boolean;
  followers: number;
  connectedAt?: string;
  lastSync?: string;
}

interface OrganizationSettings {
  name: string;
  description: string;
  website: string;
  industry: string;
  size: string;
  logo?: string;
  timezone: string;
  language: string;
  currency: string;
}

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  location: string;
  bio: string;
  avatar?: string;
  title: string;
  department: string;
}

interface NotificationSettings {
  emailNotifications: {
    posts: boolean;
    mentions: boolean;
    teamActivity: boolean;
    billing: boolean;
    security: boolean;
  };
  pushNotifications: {
    posts: boolean;
    mentions: boolean;
    teamActivity: boolean;
  };
  weeklyReports: boolean;
  monthlyReports: boolean;
}

const mockSocialAccounts: SocialAccount[] = [
  {
    id: '1',
    platform: 'facebook',
    accountName: 'AllIn Social Media',
    username: '@allinsocial',
    isConnected: true,
    followers: 12500,
    connectedAt: '2024-01-15T10:00:00Z',
    lastSync: '2024-01-20T14:30:00Z'
  },
  {
    id: '2',
    platform: 'instagram',
    accountName: 'AllIn Social',
    username: '@allinsocial',
    isConnected: true,
    followers: 8900,
    connectedAt: '2024-01-15T10:05:00Z',
    lastSync: '2024-01-20T14:25:00Z'
  },
  {
    id: '3',
    platform: 'twitter',
    accountName: 'AllIn Social Media',
    username: '@AllInSocial',
    isConnected: true,
    followers: 5600,
    connectedAt: '2024-01-15T10:10:00Z',
    lastSync: '2024-01-20T14:20:00Z'
  },
  {
    id: '4',
    platform: 'linkedin',
    accountName: 'AllIn Social Media Company',
    username: 'allin-social-media',
    isConnected: false,
    followers: 0
  },
  {
    id: '5',
    platform: 'youtube',
    accountName: 'AllIn Social',
    username: '@AllInSocial',
    isConnected: false,
    followers: 0
  },
  {
    id: '6',
    platform: 'tiktok',
    accountName: 'AllIn Social',
    username: '@allinsocial',
    isConnected: false,
    followers: 0
  }
];

const platformIcons = {
  facebook: <Facebook className="h-5 w-5 text-blue-600" />,
  instagram: <Instagram className="h-5 w-5 text-pink-600" />,
  twitter: <Twitter className="h-5 w-5 text-blue-400" />,
  linkedin: <Linkedin className="h-5 w-5 text-blue-700" />,
  youtube: <Youtube className="h-5 w-5 text-red-600" />,
  tiktok: <div className="h-5 w-5 bg-black rounded-full flex items-center justify-center text-white text-xs font-bold">T</div>
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>(mockSocialAccounts);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Settings state
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'John Smith',
    email: 'john.smith@allin.demo',
    phone: '+1 (555) 123-4567',
    location: 'New York, NY',
    bio: 'Social media manager with 5+ years of experience in digital marketing and content strategy.',
    title: 'Marketing Manager',
    department: 'Marketing'
  });

  const [organizationSettings, setOrganizationSettings] = useState<OrganizationSettings>({
    name: 'AllIn Social Media',
    description: 'A comprehensive social media management platform for businesses of all sizes.',
    website: 'https://allin.demo',
    industry: 'Technology',
    size: '51-200 employees',
    timezone: 'America/New_York',
    language: 'English',
    currency: 'USD'
  });

  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: {
      posts: true,
      mentions: true,
      teamActivity: true,
      billing: true,
      security: true
    },
    pushNotifications: {
      posts: true,
      mentions: true,
      teamActivity: false
    },
    weeklyReports: true,
    monthlyReports: true
  });

  const handleConnectAccount = async (platform: string) => {
    try {
      const response = await fetch(`/api/social/connect/${platform}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId: 'org1', // In a real app, get this from user context
        }),
      });

      const result = await response.json();
      if (result.success) {
        // Open OAuth popup
        window.open(result.authUrl, 'oauth', 'width=600,height=600');

        // In a real implementation, you'd listen for the popup to close
        // and refresh the account list
      } else {
        console.error('Failed to initiate OAuth:', result.error);
      }
    } catch (error) {
      console.error('Error connecting account:', error);
    }
  };

  const handleDisconnectAccount = async (accountId: string) => {
    try {
      const response = await fetch(`/api/social/disconnect/${accountId}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (result.success) {
        // Update local state
        setSocialAccounts(prev => prev.filter(account => account.id !== accountId));
      } else {
        console.error('Failed to disconnect account:', result.error);
      }
    } catch (error) {
      console.error('Error disconnecting account:', error);
    }
  };

  const handleSyncAccount = (accountId: string) => {
    setSocialAccounts(prev => prev.map(account =>
      account.id === accountId
        ? { ...account, lastSync: new Date().toISOString() }
        : account
    ));
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account, organization, and platform preferences
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="organization">Organization</TabsTrigger>
          <TabsTrigger value="accounts">Social Accounts</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your personal details and profile information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={userProfile.avatar} />
                  <AvatarFallback className="text-xl">
                    {userProfile.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Button variant="outline">
                    <Camera className="h-4 w-4 mr-2" />
                    Change Photo
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    JPG, GIF or PNG. 1MB max.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={userProfile.name}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={userProfile.email}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={userProfile.phone}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={userProfile.location}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, location: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Job Title</Label>
                  <Input
                    id="title"
                    value={userProfile.title}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={userProfile.department}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, department: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself..."
                  value={userProfile.bio}
                  onChange={(e) => setUserProfile(prev => ({ ...prev, bio: e.target.value }))}
                />
              </div>

              <Button>
                <Save className="h-4 w-4 mr-2" />
                Save Profile
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Organization Settings */}
        <TabsContent value="organization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Organization Details</CardTitle>
              <CardDescription>
                Manage your organization's basic information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="orgName">Organization Name</Label>
                  <Input
                    id="orgName"
                    value={organizationSettings.name}
                    onChange={(e) => setOrganizationSettings(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={organizationSettings.website}
                    onChange={(e) => setOrganizationSettings(prev => ({ ...prev, website: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Select
                    value={organizationSettings.industry}
                    onValueChange={(value) => setOrganizationSettings(prev => ({ ...prev, industry: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Technology">Technology</SelectItem>
                      <SelectItem value="Healthcare">Healthcare</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="Education">Education</SelectItem>
                      <SelectItem value="Retail">Retail</SelectItem>
                      <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="size">Company Size</Label>
                  <Select
                    value={organizationSettings.size}
                    onValueChange={(value) => setOrganizationSettings(prev => ({ ...prev, size: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-10 employees">1-10 employees</SelectItem>
                      <SelectItem value="11-50 employees">11-50 employees</SelectItem>
                      <SelectItem value="51-200 employees">51-200 employees</SelectItem>
                      <SelectItem value="201-500 employees">201-500 employees</SelectItem>
                      <SelectItem value="500+ employees">500+ employees</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your organization..."
                  value={organizationSettings.description}
                  onChange={(e) => setOrganizationSettings(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={organizationSettings.timezone}
                    onValueChange={(value) => setOrganizationSettings(prev => ({ ...prev, timezone: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                      <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                      <SelectItem value="Europe/London">London (GMT)</SelectItem>
                      <SelectItem value="Europe/Berlin">Berlin (CET)</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={organizationSettings.language}
                    onValueChange={(value) => setOrganizationSettings(prev => ({ ...prev, language: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="Spanish">Spanish</SelectItem>
                      <SelectItem value="French">French</SelectItem>
                      <SelectItem value="German">German</SelectItem>
                      <SelectItem value="Italian">Italian</SelectItem>
                      <SelectItem value="Portuguese">Portuguese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={organizationSettings.currency}
                    onValueChange={(value) => setOrganizationSettings(prev => ({ ...prev, currency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="CAD">CAD (C$)</SelectItem>
                      <SelectItem value="JPY">JPY (¥)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button>
                <Save className="h-4 w-4 mr-2" />
                Save Organization Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social Accounts */}
        <TabsContent value="accounts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Connected Accounts</CardTitle>
              <CardDescription>
                Manage your social media platform connections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {socialAccounts.map((account) => (
                  <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-3">
                        {platformIcons[account.platform]}
                        <div>
                          <h4 className="font-medium">{account.accountName}</h4>
                          <p className="text-sm text-muted-foreground">{account.username}</p>
                        </div>
                      </div>

                      {account.isConnected && (
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Users className="h-4 w-4" />
                            <span>{formatNumber(account.followers)} followers</span>
                          </div>
                          {account.lastSync && (
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>Synced {formatDate(account.lastSync)}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      {account.isConnected ? (
                        <>
                          <Badge variant="secondary" className="text-green-700 bg-green-100">
                            <Check className="h-3 w-3 mr-1" />
                            Connected
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSyncAccount(account.id)}
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Sync
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDisconnectAccount(account.id)}
                          >
                            Disconnect
                          </Button>
                        </>
                      ) : (
                        <>
                          <Badge variant="secondary" className="text-gray-700 bg-gray-100">
                            <X className="h-3 w-3 mr-1" />
                            Not Connected
                          </Badge>
                          <Button
                            size="sm"
                            onClick={() => handleConnectAccount(account.platform)}
                          >
                            Connect
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Management</CardTitle>
              <CardDescription>
                Bulk actions and account synchronization settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Auto-sync accounts</h4>
                  <p className="text-sm text-muted-foreground">
                    Automatically sync account data every hour
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Sync follower counts</h4>
                  <p className="text-sm text-muted-foreground">
                    Update follower counts in real-time
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex space-x-2 pt-4">
                <Button variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync All Accounts
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Account Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>
                Configure which email notifications you'd like to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Post Performance</h4>
                  <p className="text-sm text-muted-foreground">
                    Get notified about post engagement and performance metrics
                  </p>
                </div>
                <Switch
                  checked={notifications.emailNotifications.posts}
                  onCheckedChange={(checked) =>
                    setNotifications(prev => ({
                      ...prev,
                      emailNotifications: { ...prev.emailNotifications, posts: checked }
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Mentions & Comments</h4>
                  <p className="text-sm text-muted-foreground">
                    Get notified when someone mentions you or comments on your posts
                  </p>
                </div>
                <Switch
                  checked={notifications.emailNotifications.mentions}
                  onCheckedChange={(checked) =>
                    setNotifications(prev => ({
                      ...prev,
                      emailNotifications: { ...prev.emailNotifications, mentions: checked }
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Team Activity</h4>
                  <p className="text-sm text-muted-foreground">
                    Get notified about team member actions and collaborations
                  </p>
                </div>
                <Switch
                  checked={notifications.emailNotifications.teamActivity}
                  onCheckedChange={(checked) =>
                    setNotifications(prev => ({
                      ...prev,
                      emailNotifications: { ...prev.emailNotifications, teamActivity: checked }
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Billing & Payments</h4>
                  <p className="text-sm text-muted-foreground">
                    Get notified about billing issues and payment confirmations
                  </p>
                </div>
                <Switch
                  checked={notifications.emailNotifications.billing}
                  onCheckedChange={(checked) =>
                    setNotifications(prev => ({
                      ...prev,
                      emailNotifications: { ...prev.emailNotifications, billing: checked }
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Security Alerts</h4>
                  <p className="text-sm text-muted-foreground">
                    Get notified about security events and login attempts
                  </p>
                </div>
                <Switch
                  checked={notifications.emailNotifications.security}
                  onCheckedChange={(checked) =>
                    setNotifications(prev => ({
                      ...prev,
                      emailNotifications: { ...prev.emailNotifications, security: checked }
                    }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Push Notifications</CardTitle>
              <CardDescription>
                Configure push notifications for the web app
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Post Performance</h4>
                  <p className="text-sm text-muted-foreground">
                    Push notifications for post engagement
                  </p>
                </div>
                <Switch
                  checked={notifications.pushNotifications.posts}
                  onCheckedChange={(checked) =>
                    setNotifications(prev => ({
                      ...prev,
                      pushNotifications: { ...prev.pushNotifications, posts: checked }
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Mentions & Comments</h4>
                  <p className="text-sm text-muted-foreground">
                    Push notifications for mentions and comments
                  </p>
                </div>
                <Switch
                  checked={notifications.pushNotifications.mentions}
                  onCheckedChange={(checked) =>
                    setNotifications(prev => ({
                      ...prev,
                      pushNotifications: { ...prev.pushNotifications, mentions: checked }
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Team Activity</h4>
                  <p className="text-sm text-muted-foreground">
                    Push notifications for team collaboration
                  </p>
                </div>
                <Switch
                  checked={notifications.pushNotifications.teamActivity}
                  onCheckedChange={(checked) =>
                    setNotifications(prev => ({
                      ...prev,
                      pushNotifications: { ...prev.pushNotifications, teamActivity: checked }
                    }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reports</CardTitle>
              <CardDescription>
                Configure automated report delivery
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Weekly Reports</h4>
                  <p className="text-sm text-muted-foreground">
                    Receive weekly performance summaries every Monday
                  </p>
                </div>
                <Switch
                  checked={notifications.weeklyReports}
                  onCheckedChange={(checked) =>
                    setNotifications(prev => ({ ...prev, weeklyReports: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Monthly Reports</h4>
                  <p className="text-sm text-muted-foreground">
                    Receive detailed monthly analytics on the 1st of each month
                  </p>
                </div>
                <Switch
                  checked={notifications.monthlyReports}
                  onCheckedChange={(checked) =>
                    setNotifications(prev => ({ ...prev, monthlyReports: checked }))
                  }
                />
              </div>

              <Button>
                <Save className="h-4 w-4 mr-2" />
                Save Notification Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Password & Authentication</CardTitle>
              <CardDescription>
                Manage your password and security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter current password"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Enter new password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                />
              </div>

              <Button>
                Update Password
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>
                Add an extra layer of security to your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">SMS Authentication</h4>
                  <p className="text-sm text-muted-foreground">
                    Receive verification codes via SMS
                  </p>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Authenticator App</h4>
                  <p className="text-sm text-muted-foreground">
                    Use Google Authenticator or similar apps
                  </p>
                </div>
                <Switch />
              </div>

              <Button variant="outline">
                <Key className="h-4 w-4 mr-2" />
                Setup Two-Factor Authentication
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>
                Monitor and manage your active login sessions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Current Session</h4>
                  <p className="text-sm text-muted-foreground">
                    Chrome on Windows • New York, NY • Just now
                  </p>
                </div>
                <Badge variant="secondary">Current</Badge>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Mobile Session</h4>
                  <p className="text-sm text-muted-foreground">
                    Safari on iPhone • Los Angeles, CA • 2 hours ago
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Revoke
                </Button>
              </div>

              <Button variant="outline">
                <Trash2 className="h-4 w-4 mr-2" />
                Revoke All Other Sessions
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing */}
        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>
                Manage your subscription and billing information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-6 border rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50">
                <div>
                  <h3 className="text-xl font-semibold">Professional Plan</h3>
                  <p className="text-muted-foreground">
                    Advanced features for growing teams
                  </p>
                  <div className="flex items-center space-x-4 mt-2">
                    <Badge variant="secondary">
                      <Zap className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Next billing: Feb 20, 2024
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">$49</div>
                  <div className="text-sm text-muted-foreground">per month</div>
                  <Button className="mt-2">
                    Upgrade Plan
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">5</div>
                  <div className="text-sm text-muted-foreground">Team Members</div>
                  <div className="text-xs text-muted-foreground">of 10 included</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">12</div>
                  <div className="text-sm text-muted-foreground">Connected Accounts</div>
                  <div className="text-xs text-muted-foreground">of 25 included</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">2.4TB</div>
                  <div className="text-sm text-muted-foreground">Storage Used</div>
                  <div className="text-xs text-muted-foreground">of 5TB included</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
              <CardDescription>
                Manage your payment methods and billing details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <CreditCard className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <h4 className="font-medium">•••• •••• •••• 1234</h4>
                    <p className="text-sm text-muted-foreground">Expires 12/2027</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>
              </div>

              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Payment Method
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
              <CardDescription>
                Download invoices and view payment history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Invoice #INV-2024-001</h4>
                    <p className="text-sm text-muted-foreground">Jan 20, 2024 • $49.00</p>
                  </div>
                  <div className="flex space-x-2">
                    <Badge variant="secondary">Paid</Badge>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Invoice #INV-2023-012</h4>
                    <p className="text-sm text-muted-foreground">Dec 20, 2023 • $49.00</p>
                  </div>
                  <div className="flex space-x-2">
                    <Badge variant="secondary">Paid</Badge>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Invoice #INV-2023-011</h4>
                    <p className="text-sm text-muted-foreground">Nov 20, 2023 • $49.00</p>
                  </div>
                  <div className="flex space-x-2">
                    <Badge variant="secondary">Paid</Badge>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}