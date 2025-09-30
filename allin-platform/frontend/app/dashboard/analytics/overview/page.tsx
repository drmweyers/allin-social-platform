'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Users,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  DollarSign,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

export default function AnalyticsOverview() {
  const [timeframe, setTimeframe] = useState('7d');
  const [platform, setPlatform] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [metrics, setMetrics] = useState({
    totalReach: 125000,
    totalEngagement: 8500,
    totalImpressions: 450000,
    totalClicks: 3200,
    engagementRate: 6.8,
    clickThroughRate: 0.71,
    followerGrowth: 1250,
    avgResponseTime: '2h 15m',
  });

  // Mock data for charts
  const performanceData = [
    { date: 'Mon', reach: 15000, engagement: 1200, impressions: 50000 },
    { date: 'Tue', reach: 18000, engagement: 1500, impressions: 62000 },
    { date: 'Wed', reach: 16000, engagement: 1100, impressions: 55000 },
    { date: 'Thu', reach: 20000, engagement: 1800, impressions: 70000 },
    { date: 'Fri', reach: 19000, engagement: 1600, impressions: 68000 },
    { date: 'Sat', reach: 17000, engagement: 1300, impressions: 75000 },
    { date: 'Sun', reach: 20000, engagement: 2000, impressions: 70000 },
  ];

  const platformDistribution = [
    { name: 'Facebook', value: 35, color: '#1877F2' },
    { name: 'Instagram', value: 30, color: '#E4405F' },
    { name: 'Twitter', value: 20, color: '#1DA1F2' },
    { name: 'LinkedIn', value: 15, color: '#0A66C2' },
  ];

  const engagementByType = [
    { type: 'Likes', count: 4500, percentage: 53 },
    { type: 'Comments', count: 2000, percentage: 23.5 },
    { type: 'Shares', count: 1500, percentage: 17.6 },
    { type: 'Saves', count: 500, percentage: 5.9 },
  ];

  const topPosts = [
    { id: 1, content: 'Product launch announcement', engagement: 2500, platform: 'Instagram' },
    { id: 2, content: 'Behind the scenes video', engagement: 2100, platform: 'Facebook' },
    { id: 3, content: 'Customer success story', engagement: 1800, platform: 'LinkedIn' },
    { id: 4, content: 'Industry insights thread', engagement: 1600, platform: 'Twitter' },
    { id: 5, content: 'Team spotlight feature', engagement: 1400, platform: 'Instagram' },
  ];

  const audienceGrowth = [
    { month: 'Jan', followers: 10000 },
    { month: 'Feb', followers: 11200 },
    { month: 'Mar', followers: 12800 },
    { month: 'Apr', followers: 14500 },
    { month: 'May', followers: 16200 },
    { month: 'Jun', followers: 18500 },
  ];

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/analytics/overview?timeframe=${timeframe}&platform=${platform}`);
      const data = await response.json();
      // Update metrics with real data
      if (data.metrics) {
        setMetrics(data.metrics);
      }
    } catch (error) {
      console.error('Failed to refresh analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      const response = await fetch(`/api/analytics/export?format=${format}&timeframe=${timeframe}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-report.${format}`;
      a.click();
    } catch (error) {
      console.error('Failed to export report:', error);
    }
  };

  const MetricCard = ({ title, value, change, icon: Icon, trend }: any) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {change && (
              <div className="flex items-center mt-2">
                {trend === 'up' ? (
                  <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                  {change}
                </span>
              </div>
            )}
          </div>
          <div className="p-3 bg-primary/10 rounded-full">
            <Icon className="w-6 h-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Overview</h1>
          <p className="text-muted-foreground mt-2">
            Track your social media performance across all platforms
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={platform} onValueChange={setPlatform}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Platforms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="twitter">Twitter</SelectItem>
              <SelectItem value="linkedin">LinkedIn</SelectItem>
            </SelectContent>
          </Select>
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Last 7 days" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => handleExport('csv')}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Reach"
          value={metrics.totalReach.toLocaleString()}
          change="+12.5%"
          icon={Eye}
          trend="up"
        />
        <MetricCard
          title="Total Engagement"
          value={metrics.totalEngagement.toLocaleString()}
          change="+8.2%"
          icon={Heart}
          trend="up"
        />
        <MetricCard
          title="Engagement Rate"
          value={`${metrics.engagementRate}%`}
          change="-0.3%"
          icon={TrendingUp}
          trend="down"
        />
        <MetricCard
          title="Follower Growth"
          value={`+${metrics.followerGrowth.toLocaleString()}`}
          change="+15.8%"
          icon={Users}
          trend="up"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Performance Over Time */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Performance Over Time</CardTitle>
            <CardDescription>Reach, engagement, and impressions trends</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="impressions" stackId="1" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                <Area type="monotone" dataKey="reach" stackId="2" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} />
                <Area type="monotone" dataKey="engagement" stackId="3" stroke="#ffc658" fill="#ffc658" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Platform Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Distribution</CardTitle>
            <CardDescription>Engagement by platform</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={platformDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {platformDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Engagement Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Engagement Breakdown</CardTitle>
            <CardDescription>Types of engagement received</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {engagementByType.map((item) => (
                <div key={item.type}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{item.type}</span>
                    <span className="text-sm text-muted-foreground">
                      {item.count.toLocaleString()} ({item.percentage}%)
                    </span>
                  </div>
                  <Progress value={item.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Audience Growth */}
      <Card>
        <CardHeader>
          <CardTitle>Audience Growth</CardTitle>
          <CardDescription>Total followers over the last 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={audienceGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="followers" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Performing Posts */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Posts</CardTitle>
          <CardDescription>Your best content this period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topPosts.map((post, index) => (
              <div key={post.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center space-x-3">
                  <div className="text-lg font-semibold text-muted-foreground">
                    #{index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{post.content}</p>
                    <p className="text-sm text-muted-foreground">
                      {post.platform} • {post.engagement.toLocaleString()} engagements
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  View Post
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}