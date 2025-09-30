'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Zap, TrendingUp, Clock, Calendar, BarChart3, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

interface OptimalTime {
  dayOfWeek: number;
  hour: number;
  score: number;
  avgEngagement: number;
  avgReach: number;
  sampleSize: number;
}

interface OptimalTimesSuggestionsProps {
  onSchedule: (date: Date) => void;
}

export function OptimalTimesSuggestions({ onSchedule }: OptimalTimesSuggestionsProps) {
  const [optimalTimes, setOptimalTimes] = useState<OptimalTime[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      fetchOptimalTimes(selectedAccount);
    }
  }, [selectedAccount]);

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/social/accounts');
      if (response.ok) {
        const data = await response.json();
        setAccounts(data.accounts);
        if (data.accounts.length > 0) {
          setSelectedAccount(data.accounts[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
    }
  };

  const fetchOptimalTimes = async (accountId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/schedule/optimal-times/${accountId}`);
      if (response.ok) {
        const data = await response.json();
        setOptimalTimes(data.times);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch optimal times',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (hour: number): string => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:00 ${period}`;
  };

  const getEngagementLevel = (score: number): { label: string; color: string } => {
    if (score >= 0.08) return { label: 'Excellent', color: 'text-green-600' };
    if (score >= 0.05) return { label: 'Good', color: 'text-blue-600' };
    if (score >= 0.03) return { label: 'Average', color: 'text-yellow-600' };
    return { label: 'Below Average', color: 'text-red-600' };
  };

  const scheduleAtOptimalTime = (time: OptimalTime) => {
    const nextDate = getNextDateForTime(time.dayOfWeek, time.hour);
    onSchedule(nextDate);
  };

  const getNextDateForTime = (dayOfWeek: number, hour: number): Date => {
    const now = new Date();
    const currentDay = now.getDay();
    const currentHour = now.getHours();

    let daysUntil = dayOfWeek - currentDay;
    if (daysUntil < 0 || (daysUntil === 0 && hour <= currentHour)) {
      daysUntil += 7;
    }

    const nextDate = new Date(now);
    nextDate.setDate(nextDate.getDate() + daysUntil);
    nextDate.setHours(hour, 0, 0, 0);

    return nextDate;
  };

  // Group times by day for heat map
  const timesByDay: Record<number, OptimalTime[]> = {};
  optimalTimes.forEach(time => {
    if (!timesByDay[time.dayOfWeek]) {
      timesByDay[time.dayOfWeek] = [];
    }
    timesByDay[time.dayOfWeek].push(time);
  });

  return (
    <div className="space-y-6">
      {/* Account Selection */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Select value={selectedAccount} onValueChange={setSelectedAccount}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Select an account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map(account => (
                <SelectItem key={account.id} value={account.id}>
                  {account.accountName} ({account.platform})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant="secondary">
            Based on {optimalTimes.reduce((sum, t) => sum + t.sampleSize, 0)} posts analyzed
          </Badge>
        </div>
        <Button variant="outline" onClick={() => fetchOptimalTimes(selectedAccount)}>
          <BarChart3 className="mr-2 h-4 w-4" />
          Refresh Analysis
        </Button>
      </div>

      {/* AI Insights Card */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-blue-900">AI-Powered Insights</CardTitle>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-blue-600" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Our AI analyzes your historical post performance to identify when your
                    audience is most active and engaged.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <CardDescription className="text-blue-700">
            Your audience is most active during these times. Schedule posts accordingly for maximum engagement.
          </CardDescription>
        </CardHeader>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">Analyzing your audience engagement patterns...</p>
          </CardContent>
        </Card>
      ) : optimalTimes.length > 0 ? (
        <>
          {/* Top 3 Optimal Times */}
          <div className="grid gap-4 md:grid-cols-3">
            {optimalTimes.slice(0, 3).map((time, index) => {
              const engagement = getEngagementLevel(time.score);
              const nextDate = getNextDateForTime(time.dayOfWeek, time.hour);

              return (
                <Card key={index} className={index === 0 ? 'border-green-200 bg-green-50/50' : ''}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">
                        {index === 0 && (
                          <Badge className="mb-2 bg-green-600">Best Time</Badge>
                        )}
                        {index === 1 && (
                          <Badge className="mb-2" variant="secondary">2nd Best</Badge>
                        )}
                        {index === 2 && (
                          <Badge className="mb-2" variant="outline">3rd Best</Badge>
                        )}
                      </CardTitle>
                      <TrendingUp className={`h-4 w-4 ${engagement.color}`} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-lg font-semibold">
                        {daysOfWeek[time.dayOfWeek]} at {formatTime(time.hour)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Next: {format(nextDate, 'MMM d, yyyy')}
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Engagement Rate</span>
                        <span className={engagement.color}>{engagement.label}</span>
                      </div>
                      <Progress value={time.score * 1000} className="h-2" />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-gray-500">Avg Engagement</p>
                        <p className="font-medium">{(time.avgEngagement * 100).toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Sample Size</p>
                        <p className="font-medium">{time.sampleSize} posts</p>
                      </div>
                    </div>
                    <Button
                      className="w-full"
                      size="sm"
                      variant={index === 0 ? 'default' : 'outline'}
                      onClick={() => scheduleAtOptimalTime(time)}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      Schedule Here
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Weekly Heat Map */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Engagement Heat Map</CardTitle>
              <CardDescription>
                Darker colors indicate higher engagement rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {daysOfWeek.map((day, dayIndex) => (
                  <div key={day} className="flex items-center space-x-2">
                    <div className="w-24 text-sm font-medium">{day}</div>
                    <div className="flex-1 grid grid-cols-24 gap-1">
                      {Array.from({ length: 24 }, (_, hour) => {
                        const time = timesByDay[dayIndex]?.find(t => t.hour === hour);
                        const opacity = time ? Math.min(time.score * 10, 1) : 0.1;

                        return (
                          <TooltipProvider key={hour}>
                            <Tooltip>
                              <TooltipTrigger>
                                <div
                                  className={`h-6 rounded cursor-pointer transition-all hover:scale-110 ${
                                    time
                                      ? 'bg-blue-600 hover:bg-blue-700'
                                      : 'bg-gray-200 hover:bg-gray-300'
                                  }`}
                                  style={{ opacity }}
                                  onClick={() => time && scheduleAtOptimalTime(time)}
                                />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{formatTime(hour)}</p>
                                {time && (
                                  <p className="text-xs">
                                    Engagement: {(time.avgEngagement * 100).toFixed(1)}%
                                  </p>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                <span>12 AM</span>
                <span>6 AM</span>
                <span>12 PM</span>
                <span>6 PM</span>
                <span>11 PM</span>
              </div>
            </CardContent>
          </Card>

          {/* All Optimal Times List */}
          <Card>
            <CardHeader>
              <CardTitle>All Optimal Times</CardTitle>
              <CardDescription>
                Complete list of recommended posting times sorted by engagement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {optimalTimes.map((time, index) => {
                  const engagement = getEngagementLevel(time.score);
                  const nextDate = getNextDateForTime(time.dayOfWeek, time.hour);

                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="text-sm font-medium">#{index + 1}</div>
                        <div>
                          <p className="font-medium">
                            {daysOfWeek[time.dayOfWeek]} at {formatTime(time.hour)}
                          </p>
                          <p className="text-xs text-gray-500">
                            Next: {format(nextDate, 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className={engagement.color}>
                          {(time.avgEngagement * 100).toFixed(1)}%
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => scheduleAtOptimalTime(time)}
                        >
                          Schedule
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <Zap className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              Not enough data to calculate optimal times. Post more content to get AI insights!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}