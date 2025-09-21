'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowUpRight,
  ArrowDownRight,
  Users,
  FileText,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  MoreVertical,
} from 'lucide-react';

const stats = [
  {
    title: 'Total Posts',
    value: '248',
    change: '+12%',
    trend: 'up',
    icon: FileText,
  },
  {
    title: 'Total Reach',
    value: '45.2K',
    change: '+23%',
    trend: 'up',
    icon: Users,
  },
  {
    title: 'Engagement Rate',
    value: '4.8%',
    change: '-2%',
    trend: 'down',
    icon: TrendingUp,
  },
  {
    title: 'Scheduled Posts',
    value: '18',
    change: '+5',
    trend: 'up',
    icon: Calendar,
  },
];

const recentPosts = [
  {
    id: 1,
    title: 'Introducing our new AI-powered features!',
    platform: 'Twitter',
    status: 'published',
    time: '2 hours ago',
    engagement: '1.2K',
  },
  {
    id: 2,
    title: 'Behind the scenes of our latest product launch',
    platform: 'Instagram',
    status: 'scheduled',
    time: 'Tomorrow at 2:00 PM',
    engagement: '-',
  },
  {
    id: 3,
    title: 'Tips for maximizing your social media ROI',
    platform: 'LinkedIn',
    status: 'published',
    time: '1 day ago',
    engagement: '856',
  },
  {
    id: 4,
    title: 'Join our upcoming webinar on content strategy',
    platform: 'Facebook',
    status: 'draft',
    time: 'Not scheduled',
    engagement: '-',
  },
];

const platformStats = [
  { platform: 'Facebook', accounts: 2, posts: 45, reach: '12.5K' },
  { platform: 'Instagram', accounts: 3, posts: 89, reach: '18.3K' },
  { platform: 'Twitter/X', accounts: 2, posts: 67, reach: '9.8K' },
  { platform: 'LinkedIn', accounts: 1, posts: 47, reach: '4.6K' },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your social media overview.</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Last 30 days
          </Button>
          <Button>
            <FileText className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground flex items-center mt-1">
                  {stat.trend === 'up' ? (
                    <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                  )}
                  {stat.change} from last period
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Posts - 2/3 width */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Posts</CardTitle>
            <CardDescription>
              Your latest published and scheduled content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentPosts.map((post) => (
                <div
                  key={post.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium">{post.title}</h4>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          post.status === 'published'
                            ? 'bg-green-100 text-green-700'
                            : post.status === 'scheduled'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {post.status}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
                      <span>{post.platform}</span>
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {post.time}
                      </span>
                      {post.engagement !== '-' && (
                        <span className="flex items-center">
                          <Users className="h-3 w-3 mr-1" />
                          {post.engagement}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              View All Posts
            </Button>
          </CardContent>
        </Card>

        {/* Platform Performance - 1/3 width */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Performance</CardTitle>
            <CardDescription>
              Connected accounts overview
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {platformStats.map((platform) => (
                <div key={platform.platform} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{platform.platform}</span>
                    <span className="text-sm text-muted-foreground">
                      {platform.accounts} account{platform.accounts > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between p-2 bg-muted rounded">
                      <span className="text-muted-foreground">Posts</span>
                      <span className="font-medium">{platform.posts}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-muted rounded">
                      <span className="text-muted-foreground">Reach</span>
                      <span className="font-medium">{platform.reach}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              Manage Accounts
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks and shortcuts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex flex-col">
              <FileText className="h-5 w-5 mb-2" />
              <span className="text-xs">Create Post</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col">
              <Calendar className="h-5 w-5 mb-2" />
              <span className="text-xs">Schedule</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col">
              <TrendingUp className="h-5 w-5 mb-2" />
              <span className="text-xs">Analytics</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col">
              <Users className="h-5 w-5 mb-2" />
              <span className="text-xs">Team</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Important updates and alerts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">5 posts published successfully</p>
                <p className="text-xs text-muted-foreground">All scheduled posts for today have been published</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Instagram API rate limit warning</p>
                <p className="text-xs text-muted-foreground">You've used 80% of your hourly API quota</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}