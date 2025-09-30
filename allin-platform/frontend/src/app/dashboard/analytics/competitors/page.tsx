'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import {
  Plus,
  Search,
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowRight,
  Trophy,
  Target,
  Zap,
} from 'lucide-react';

export default function CompetitorAnalysis() {
  const [competitors, setCompetitors] = useState([
    {
      id: 1,
      name: 'Competitor A',
      handle: '@competitora',
      avatar: '/api/placeholder/32/32',
      followers: 125000,
      engagement: 5.2,
      postFrequency: 14,
      platforms: ['Facebook', 'Instagram', 'Twitter'],
      status: 'active',
    },
    {
      id: 2,
      name: 'Competitor B',
      handle: '@competitorb',
      avatar: '/api/placeholder/32/32',
      followers: 98000,
      engagement: 6.8,
      postFrequency: 21,
      platforms: ['Instagram', 'TikTok'],
      status: 'active',
    },
    {
      id: 3,
      name: 'Competitor C',
      handle: '@competitorc',
      avatar: '/api/placeholder/32/32',
      followers: 156000,
      engagement: 4.1,
      postFrequency: 7,
      platforms: ['LinkedIn', 'Twitter'],
      status: 'active',
    },
  ]);

  const [newCompetitor, setNewCompetitor] = useState('');

  // Performance comparison data
  const performanceComparison = [
    { metric: 'Followers', you: 85, competitorA: 100, competitorB: 78, competitorC: 125 },
    { metric: 'Engagement', you: 120, competitorA: 80, competitorB: 110, competitorC: 65 },
    { metric: 'Post Frequency', you: 100, competitorA: 70, competitorB: 105, competitorC: 35 },
    { metric: 'Response Time', you: 95, competitorA: 60, competitorB: 80, competitorC: 40 },
    { metric: 'Content Quality', you: 110, competitorA: 90, competitorB: 85, competitorC: 95 },
  ];

  // Growth trends
  const growthTrends = [
    { month: 'Jan', you: 10000, competitorA: 11000, competitorB: 9000, competitorC: 12000 },
    { month: 'Feb', you: 11500, competitorA: 12000, competitorB: 9800, competitorC: 13500 },
    { month: 'Mar', you: 13200, competitorA: 13000, competitorB: 11000, competitorC: 14800 },
    { month: 'Apr', you: 15000, competitorA: 14500, competitorB: 12500, competitorC: 15500 },
    { month: 'May', you: 17500, competitorA: 15800, competitorB: 14200, competitorC: 16200 },
    { month: 'Jun', you: 20000, competitorA: 17000, competitorB: 16000, competitorC: 17500 },
  ];

  // Content analysis
  const contentTypes = [
    { type: 'Images', you: 40, competitors: 35 },
    { type: 'Videos', you: 25, competitors: 30 },
    { type: 'Carousels', you: 20, competitors: 15 },
    { type: 'Stories', you: 10, competitors: 15 },
    { type: 'Live', you: 5, competitors: 5 },
  ];

  // SWOT Analysis
  const swotAnalysis = {
    strengths: [
      'Higher engagement rate than 2 competitors',
      'Better response time to audience',
      'More diverse content types',
      'Consistent posting schedule',
    ],
    weaknesses: [
      'Lower follower count than average',
      'Less video content than competitors',
      'Limited presence on TikTok',
      'Lower posting frequency on weekends',
    ],
    opportunities: [
      'Expand to new platforms (TikTok)',
      'Increase video content production',
      'Partner with influencers',
      'Target competitor\'s inactive times',
    ],
    threats: [
      'Competitor A gaining market share',
      'New entrants in the market',
      'Platform algorithm changes',
      'Audience shifting to video-first platforms',
    ],
  };

  // Competitive insights
  const insights = [
    {
      type: 'success',
      title: 'Outperforming in Engagement',
      description: 'Your engagement rate is 23% higher than the industry average',
      action: 'Maintain current content strategy',
    },
    {
      type: 'warning',
      title: 'Follower Growth Lagging',
      description: 'Competitor C is growing 40% faster',
      action: 'Analyze their growth tactics',
    },
    {
      type: 'info',
      title: 'Content Gap Identified',
      description: 'Competitors post 30% more video content',
      action: 'Increase video production',
    },
    {
      type: 'success',
      title: 'Best Response Time',
      description: 'You respond 2x faster than competitors',
      action: 'Leverage for marketing',
    },
  ];

  const handleAddCompetitor = () => {
    if (!newCompetitor.trim()) return;

    const newComp = {
      id: competitors.length + 1,
      name: newCompetitor,
      handle: `@${newCompetitor.toLowerCase().replace(/\s+/g, '')}`,
      avatar: '/api/placeholder/32/32',
      followers: 0,
      engagement: 0,
      postFrequency: 0,
      platforms: [],
      status: 'pending',
    };

    setCompetitors([...competitors, newComp]);
    setNewCompetitor('');
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Competitor Analysis</h1>
          <p className="text-muted-foreground mt-2">
            Track and analyze your competition to stay ahead
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Generate Report
        </Button>
      </div>

      {/* Add Competitor */}
      <Card>
        <CardHeader>
          <CardTitle>Track Competitors</CardTitle>
          <CardDescription>Add competitors to monitor their performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Input
              placeholder="Enter competitor name or social handle"
              value={newCompetitor}
              onChange={(e) => setNewCompetitor(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddCompetitor()}
            />
            <Button onClick={handleAddCompetitor}>
              <Plus className="w-4 h-4 mr-2" />
              Add Competitor
            </Button>
          </div>

          <div className="mt-4 space-y-2">
            {competitors.map((comp) => (
              <div key={comp.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={comp.avatar} />
                    <AvatarFallback>{comp.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{comp.name}</p>
                    <p className="text-sm text-muted-foreground">{comp.handle}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">{comp.followers.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">followers</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{comp.engagement}%</p>
                    <p className="text-xs text-muted-foreground">engagement</p>
                  </div>
                  <Badge variant={comp.status === 'active' ? 'default' : 'secondary'}>
                    {comp.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="content">Content Analysis</TabsTrigger>
          <TabsTrigger value="swot">SWOT Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Competitive Positioning */}
          <Card>
            <CardHeader>
              <CardTitle>Competitive Positioning</CardTitle>
              <CardDescription>How you compare across key metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={performanceComparison}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" />
                  <PolarRadiusAxis angle={90} domain={[0, 150]} />
                  <Radar name="You" dataKey="you" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  <Radar name="Competitor A" dataKey="competitorA" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} />
                  <Radar name="Competitor B" dataKey="competitorB" stroke="#ffc658" fill="#ffc658" fillOpacity={0.3} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Key Insights */}
          <div className="grid gap-4 md:grid-cols-2">
            {insights.map((insight, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-start space-x-3">
                    {insight.type === 'success' && (
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    )}
                    {insight.type === 'warning' && (
                      <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
                    )}
                    {insight.type === 'info' && (
                      <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <h3 className="font-medium">{insight.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
                      <Button variant="link" className="p-0 h-auto mt-2">
                        {insight.action} <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Growth Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Follower Growth Comparison</CardTitle>
              <CardDescription>Track growth trends over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={growthTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="you" stroke="#8884d8" strokeWidth={3} />
                  <Line type="monotone" dataKey="competitorA" stroke="#82ca9d" strokeWidth={2} />
                  <Line type="monotone" dataKey="competitorB" stroke="#ffc658" strokeWidth={2} />
                  <Line type="monotone" dataKey="competitorC" stroke="#ff7c7c" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Trophy className="w-8 h-8 text-yellow-500" />
                  <Badge variant="outline">Rank #2</Badge>
                </div>
                <h3 className="font-semibold mb-1">Market Position</h3>
                <p className="text-2xl font-bold">2nd of 4</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Up 1 position from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Target className="w-8 h-8 text-blue-500" />
                  <TrendingUp className="w-4 h-4 text-green-500" />
                </div>
                <h3 className="font-semibold mb-1">Share of Voice</h3>
                <p className="text-2xl font-bold">28%</p>
                <p className="text-sm text-muted-foreground mt-1">
                  +3% from last period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Zap className="w-8 h-8 text-purple-500" />
                  <Badge>Leading</Badge>
                </div>
                <h3 className="font-semibold mb-1">Engagement Lead</h3>
                <p className="text-2xl font-bold">+23%</p>
                <p className="text-sm text-muted-foreground mt-1">
                  vs. competitor average
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          {/* Content Type Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Content Type Distribution</CardTitle>
              <CardDescription>Compare your content mix with competitors</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={contentTypes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="you" fill="#8884d8" />
                  <Bar dataKey="competitors" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Content Performance */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Content Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['Videos', 'Carousels', 'Images', 'Stories'].map((type, index) => (
                    <div key={type}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{type}</span>
                        <span className="text-sm text-muted-foreground">
                          {85 - index * 10}% engagement
                        </span>
                      </div>
                      <Progress value={85 - index * 10} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Posting Time Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 rounded bg-green-50 dark:bg-green-950">
                    <span className="text-sm">Your best time: 2-4 PM</span>
                    <Badge variant="outline" className="bg-green-100 dark:bg-green-900">
                      Optimal
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded">
                    <span className="text-sm">Competitor avg: 10-12 AM</span>
                    <Badge variant="outline">Different</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    You're posting at different times than competitors, which could be an advantage
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="swot" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Strengths */}
            <Card className="border-green-200 dark:border-green-800">
              <CardHeader>
                <CardTitle className="text-green-600 dark:text-green-400">
                  Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {swotAnalysis.strengths.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Weaknesses */}
            <Card className="border-red-200 dark:border-red-800">
              <CardHeader>
                <CardTitle className="text-red-600 dark:text-red-400">
                  Weaknesses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {swotAnalysis.weaknesses.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <XCircle className="w-4 h-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Opportunities */}
            <Card className="border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="text-blue-600 dark:text-blue-400">
                  Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {swotAnalysis.opportunities.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <TrendingUp className="w-4 h-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Threats */}
            <Card className="border-yellow-200 dark:border-yellow-800">
              <CardHeader>
                <CardTitle className="text-yellow-600 dark:text-yellow-400">
                  Threats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {swotAnalysis.threats.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <AlertCircle className="w-4 h-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Action Plan */}
          <Card>
            <CardHeader>
              <CardTitle>Recommended Action Plan</CardTitle>
              <CardDescription>Based on SWOT analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-primary/5 border">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Expand to TikTok</h4>
                      <p className="text-sm text-muted-foreground">
                        Capture younger audience before competitors
                      </p>
                    </div>
                    <Badge>High Priority</Badge>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-primary/5 border">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Increase Video Content</h4>
                      <p className="text-sm text-muted-foreground">
                        Match competitor video output to stay competitive
                      </p>
                    </div>
                    <Badge variant="secondary">Medium Priority</Badge>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-primary/5 border">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Leverage Engagement Advantage</h4>
                      <p className="text-sm text-muted-foreground">
                        Highlight superior engagement in marketing
                      </p>
                    </div>
                    <Badge variant="outline">Quick Win</Badge>
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