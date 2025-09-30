'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Bot,
  Brain,
  MessageSquare,
  Sparkles,
  BarChart3,
  Calendar,
  Target,
  Zap,
  Send,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';

export default function AIDashboard() {
  const [command, setCommand] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [commandHistory, setCommandHistory] = useState<any[]>([]);
  const [activeAgents, setActiveAgents] = useState<string[]>([]);
  const [selectedTool, setSelectedTool] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');

  const aiAgents = [
    {
      id: 'content-creator',
      name: 'Content Creator',
      icon: Sparkles,
      status: 'ready',
      description: 'Creates engaging social media content',
      capabilities: ['Generate posts', 'Create ideas', 'Enhance content'],
    },
    {
      id: 'analytics-advisor',
      name: 'Analytics Advisor',
      icon: BarChart3,
      status: 'ready',
      description: 'Analyzes performance and provides insights',
      capabilities: ['Performance analysis', 'Trend detection', 'Reports'],
    },
    {
      id: 'campaign-manager',
      name: 'Campaign Manager',
      icon: Target,
      status: 'ready',
      description: 'Manages marketing campaigns',
      capabilities: ['Campaign creation', 'Budget management', 'ROI tracking'],
    },
    {
      id: 'engagement-optimizer',
      name: 'Engagement Optimizer',
      icon: Zap,
      status: 'ready',
      description: 'Optimizes content for maximum engagement',
      capabilities: ['Content optimization', 'Timing analysis', 'Hashtags'],
    },
    {
      id: 'strategy-planner',
      name: 'Strategy Planner',
      icon: Brain,
      status: 'ready',
      description: 'Provides strategic planning and insights',
      capabilities: ['Strategy development', 'Goal setting', 'Forecasting'],
    },
  ];

  const mcpTools = [
    { value: 'create_post', label: 'Create Post', description: 'Generate AI-powered content' },
    { value: 'analyze_performance', label: 'Analyze Performance', description: 'Get insights on metrics' },
    { value: 'manage_campaign', label: 'Manage Campaign', description: 'Create or manage campaigns' },
    { value: 'generate_ideas', label: 'Generate Ideas', description: 'Get content suggestions' },
    { value: 'optimize_time', label: 'Optimize Timing', description: 'Find best posting times' },
    { value: 'schedule_bulk', label: 'Bulk Schedule', description: 'Schedule multiple posts' },
  ];

  const handleSendCommand = async () => {
    if (!command.trim()) return;

    setIsProcessing(true);
    const newCommand = {
      id: Date.now(),
      command,
      timestamp: new Date().toISOString(),
      status: 'processing',
      response: null,
    };

    setCommandHistory(prev => [newCommand, ...prev]);
    setCommand('');

    try {
      const response = await fetch('/api/mcp/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
      });

      const result = await response.json();

      setCommandHistory(prev =>
        prev.map(cmd =>
          cmd.id === newCommand.id
            ? { ...cmd, status: result.success ? 'success' : 'error', response: result }
            : cmd
        )
      );

      if (result.data?.content) {
        setGeneratedContent(result.data.content);
      }
    } catch (error) {
      setCommandHistory(prev =>
        prev.map(cmd =>
          cmd.id === newCommand.id
            ? { ...cmd, status: 'error', response: { error: 'Failed to process command' } }
            : cmd
        )
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToolExecution = async () => {
    if (!selectedTool) return;

    setIsProcessing(true);
    try {
      const response = await fetch('/api/mcp/tool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: selectedTool,
          parameters: {
            // Add default parameters based on tool
            ...(selectedTool === 'create_post' && {
              prompt: 'Create an engaging post about our latest product',
              platforms: ['facebook', 'twitter'],
              tone: 'professional',
            }),
            ...(selectedTool === 'analyze_performance' && {
              timeframe: 'week',
              metrics: ['engagement', 'reach'],
            }),
          },
        }),
      });

      const result = await response.json();

      if (result.data?.content) {
        setGeneratedContent(result.data.content);
      }
    } catch (error) {
      console.error('Tool execution failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Command Center</h1>
          <p className="text-muted-foreground mt-2">
            Control your social media with natural language and AI agents
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          <Bot className="w-5 h-5 mr-2" />
          MCP Connected
        </Badge>
      </div>

      <Tabs defaultValue="command" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="command">Natural Language</TabsTrigger>
          <TabsTrigger value="agents">AI Agents</TabsTrigger>
          <TabsTrigger value="tools">MCP Tools</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
        </TabsList>

        <TabsContent value="command" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Natural Language Command Interface</CardTitle>
              <CardDescription>
                Type commands in plain English to control your social media
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  placeholder="e.g., 'Create a post about our summer sale' or 'Analyze last week's performance'"
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendCommand()}
                  disabled={isProcessing}
                  className="flex-1"
                />
                <Button onClick={handleSendCommand} disabled={isProcessing}>
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Quick Commands</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCommand("Create an engaging post about our product")}
                  >
                    Generate Content
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCommand("Analyze this week's performance")}
                  >
                    Weekly Analysis
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCommand("What's the best time to post on Instagram?")}
                  >
                    Optimal Timing
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCommand("Generate 5 content ideas for next week")}
                  >
                    Content Ideas
                  </Button>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="mb-2 block">Command History</Label>
                <ScrollArea className="h-64 rounded-md border p-4">
                  {commandHistory.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No commands yet</p>
                  ) : (
                    <div className="space-y-4">
                      {commandHistory.map((cmd) => (
                        <div key={cmd.id} className="space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium">{cmd.command}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(cmd.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                            {cmd.status === 'processing' && (
                              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                            )}
                            {cmd.status === 'success' && (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            )}
                            {cmd.status === 'error' && (
                              <XCircle className="w-4 h-4 text-red-500" />
                            )}
                          </div>
                          {cmd.response && (
                            <div className="pl-4 border-l-2 border-muted">
                              <pre className="text-xs whitespace-pre-wrap">
                                {typeof cmd.response === 'string'
                                  ? cmd.response
                                  : JSON.stringify(cmd.response, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </CardContent>
          </Card>

          {generatedContent && (
            <Card>
              <CardHeader>
                <CardTitle>Generated Content</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={generatedContent}
                  onChange={(e) => setGeneratedContent(e.target.value)}
                  rows={6}
                  className="mb-4"
                />
                <div className="flex space-x-2">
                  <Button variant="outline">Save as Draft</Button>
                  <Button>Schedule Post</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="agents" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {aiAgents.map((agent) => {
              const Icon = agent.icon;
              return (
                <Card key={agent.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Icon className="w-5 h-5" />
                        <CardTitle className="text-lg">{agent.name}</CardTitle>
                      </div>
                      <Badge
                        variant={agent.status === 'ready' ? 'default' : 'secondary'}
                      >
                        {agent.status}
                      </Badge>
                    </div>
                    <CardDescription>{agent.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-xs">Capabilities</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {agent.capabilities.map((cap) => (
                          <Badge key={cap} variant="outline" className="text-xs">
                            {cap}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button
                      className="w-full"
                      variant={activeAgents.includes(agent.id) ? 'default' : 'outline'}
                      onClick={() => {
                        setActiveAgents(prev =>
                          prev.includes(agent.id)
                            ? prev.filter(id => id !== agent.id)
                            : [...prev, agent.id]
                        );
                      }}
                    >
                      {activeAgents.includes(agent.id) ? 'Active' : 'Activate'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="tools" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>MCP Tool Execution</CardTitle>
              <CardDescription>
                Execute specific tools directly with predefined parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Select Tool</Label>
                <Select value={selectedTool} onValueChange={setSelectedTool}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a tool to execute" />
                  </SelectTrigger>
                  <SelectContent>
                    {mcpTools.map((tool) => (
                      <SelectItem key={tool.value} value={tool.value}>
                        <div>
                          <div className="font-medium">{tool.label}</div>
                          <div className="text-xs text-muted-foreground">
                            {tool.description}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleToolExecution}
                disabled={!selectedTool || isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>Execute Tool</>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Automation Workflows</CardTitle>
              <CardDescription>
                Set up automated triggers and workflows powered by AI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    trigger: 'Low Engagement Detection',
                    action: 'Optimize Content',
                    status: 'active',
                    description: 'Automatically optimize posts when engagement drops below threshold',
                  },
                  {
                    trigger: 'Content Gap',
                    action: 'Generate Content',
                    status: 'active',
                    description: 'Generate new content when posting frequency drops',
                  },
                  {
                    trigger: 'Weekly Report',
                    action: 'Generate Analytics',
                    status: 'scheduled',
                    description: 'Generate comprehensive analytics report every Monday',
                  },
                  {
                    trigger: 'Campaign End',
                    action: 'Performance Review',
                    status: 'inactive',
                    description: 'Analyze campaign performance when it ends',
                  },
                ].map((workflow, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{workflow.trigger}</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="font-medium">{workflow.action}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {workflow.description}
                      </p>
                    </div>
                    <Badge
                      variant={
                        workflow.status === 'active'
                          ? 'default'
                          : workflow.status === 'scheduled'
                          ? 'secondary'
                          : 'outline'
                      }
                    >
                      {workflow.status}
                    </Badge>
                  </div>
                ))}
              </div>
              <Button className="w-full mt-4" variant="outline">
                Create New Automation
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}