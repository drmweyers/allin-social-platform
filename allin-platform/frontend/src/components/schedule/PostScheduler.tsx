'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, Globe, Repeat, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';

interface PostSchedulerProps {
  initialDate?: Date | null;
  postId?: string;
  onComplete: () => void;
  onCancel: () => void;
}

interface SocialAccount {
  id: string;
  platform: string;
  accountName: string;
  accountHandle: string;
}

export function PostScheduler({
  initialDate,
  postId,
  onComplete,
  onCancel,
}: PostSchedulerProps) {
  const [content, setContent] = useState('');
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [scheduleDate, setScheduleDate] = useState(
    initialDate ? format(initialDate, "yyyy-MM-dd'T'HH:mm") : ''
  );
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringPattern, setRecurringPattern] = useState('DAILY');
  const [recurringEndDate, setRecurringEndDate] = useState('');
  const [useOptimalTime, setUseOptimalTime] = useState(false);
  const [addToQueue, setAddToQueue] = useState(false);
  const [selectedQueue, setSelectedQueue] = useState('');
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [queues, setQueues] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAccounts();
    fetchQueues();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/social/accounts');
      if (response.ok) {
        const data = await response.json();
        setAccounts(data.accounts);
      }
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
    }
  };

  const fetchQueues = async () => {
    try {
      const response = await fetch('/api/schedule/queues');
      if (response.ok) {
        const data = await response.json();
        setQueues(data.queues);
      }
    } catch (error) {
      console.error('Failed to fetch queues:', error);
    }
  };

  const handleAccountToggle = (accountId: string) => {
    setSelectedAccounts((prev) =>
      prev.includes(accountId)
        ? prev.filter((id) => id !== accountId)
        : [...prev, accountId]
    );
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter post content',
        variant: 'destructive',
      });
      return;
    }

    if (selectedAccounts.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one account',
        variant: 'destructive',
      });
      return;
    }

    if (!addToQueue && !scheduleDate) {
      toast({
        title: 'Error',
        description: 'Please select a date and time',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const payload = {
        content,
        accountIds: selectedAccounts,
        scheduledFor: scheduleDate,
        timezone,
        isRecurring,
        recurringPattern: isRecurring ? recurringPattern : null,
        recurringEndDate: isRecurring ? recurringEndDate : null,
        useOptimalTime,
        queueId: addToQueue ? selectedQueue : null,
      };

      const response = await fetch('/api/schedule/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Post scheduled successfully',
        });
        onComplete();
      } else {
        throw new Error('Failed to schedule post');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to schedule post',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getPlatformColor = (platform: string): string => {
    const colors: Record<string, string> = {
      FACEBOOK: 'bg-blue-500',
      INSTAGRAM: 'bg-pink-500',
      TWITTER: 'bg-sky-400',
      LINKEDIN: 'bg-blue-700',
      TIKTOK: 'bg-black',
    };
    return colors[platform] || 'bg-gray-500';
  };

  return (
    <div className="space-y-6">
      {/* Content Input */}
      <div className="space-y-2">
        <Label htmlFor="content">Post Content</Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          className="min-h-[120px]"
        />
        <div className="flex justify-between text-sm text-gray-500">
          <span>{content.length} characters</span>
          <span>
            {280 - content.length > 0
              ? `${280 - content.length} characters remaining (Twitter)`
              : 'Over Twitter limit'}
          </span>
        </div>
      </div>

      {/* Account Selection */}
      <div className="space-y-2">
        <Label>Select Accounts</Label>
        <div className="grid grid-cols-2 gap-2">
          {accounts.map((account) => (
            <div
              key={account.id}
              className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                selectedAccounts.includes(account.id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => handleAccountToggle(account.id)}
            >
              <div className="flex items-center space-x-2">
                <div
                  className={`w-2 h-8 rounded ${getPlatformColor(
                    account.platform
                  )}`}
                />
                <div>
                  <p className="font-medium text-sm">{account.accountName}</p>
                  <p className="text-xs text-gray-500">{account.accountHandle}</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={selectedAccounts.includes(account.id)}
                onChange={() => {}}
                className="h-4 w-4"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Scheduling Options */}
      <Tabs defaultValue="specific" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="specific">
            <Calendar className="mr-2 h-4 w-4" />
            Specific Time
          </TabsTrigger>
          <TabsTrigger value="queue">
            <Clock className="mr-2 h-4 w-4" />
            Add to Queue
          </TabsTrigger>
          <TabsTrigger value="optimal">
            <Zap className="mr-2 h-4 w-4" />
            Optimal Time
          </TabsTrigger>
        </TabsList>

        <TabsContent value="specific" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="schedule-date">Date & Time</Label>
              <Input
                id="schedule-date"
                type="datetime-local"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger id="timezone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">Eastern Time</SelectItem>
                  <SelectItem value="America/Chicago">Central Time</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                  <SelectItem value="Europe/London">London</SelectItem>
                  <SelectItem value="Europe/Paris">Paris</SelectItem>
                  <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Recurring Options */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="recurring">Recurring Post</Label>
                <p className="text-sm text-gray-500">
                  Automatically republish this post
                </p>
              </div>
              <Switch
                id="recurring"
                checked={isRecurring}
                onCheckedChange={setIsRecurring}
              />
            </div>

            {isRecurring && (
              <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="pattern">Repeat Pattern</Label>
                  <Select value={recurringPattern} onValueChange={setRecurringPattern}>
                    <SelectTrigger id="pattern">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DAILY">Daily</SelectItem>
                      <SelectItem value="WEEKLY">Weekly</SelectItem>
                      <SelectItem value="BIWEEKLY">Bi-weekly</SelectItem>
                      <SelectItem value="MONTHLY">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date">End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={recurringEndDate}
                    onChange={(e) => setRecurringEndDate(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="queue" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="queue">Select Queue</Label>
            <Select value={selectedQueue} onValueChange={setSelectedQueue}>
              <SelectTrigger id="queue">
                <SelectValue placeholder="Choose a posting queue" />
              </SelectTrigger>
              <SelectContent>
                {queues.map((queue) => (
                  <SelectItem key={queue.id} value={queue.id}>
                    {queue.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500">
              Post will be added to the next available slot in the queue
            </p>
          </div>
        </TabsContent>

        <TabsContent value="optimal" className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Zap className="h-5 w-5 text-blue-600" />
              <h4 className="font-medium text-blue-900">AI-Powered Scheduling</h4>
            </div>
            <p className="text-sm text-blue-700">
              Our AI will automatically schedule your post at the optimal time for maximum engagement
              based on your audience's activity patterns.
            </p>
            <div className="mt-4">
              <Badge variant="secondary">
                Suggested time: Today at 6:00 PM
              </Badge>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? 'Scheduling...' : 'Schedule Post'}
        </Button>
      </div>
    </div>
  );
}