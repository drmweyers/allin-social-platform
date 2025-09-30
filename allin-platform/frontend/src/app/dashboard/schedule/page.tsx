'use client';

import React, { useState, useEffect } from 'react';
import { Calendar } from '@/components/calendar/Calendar';
import { PostScheduler } from '@/components/schedule/PostScheduler';
import { QueueManager } from '@/components/schedule/QueueManager';
import { OptimalTimesSuggestions } from '@/components/schedule/OptimalTimesSuggestions';
import { RecurringPostsManager } from '@/components/schedule/RecurringPostsManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Clock, Repeat, Zap, BarChart } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ScheduledPost {
  id: string;
  postId: string;
  content: string;
  scheduledFor: string;
  platform: string;
  status: 'PENDING' | 'QUEUED' | 'PUBLISHED' | 'FAILED';
  socialAccount: {
    accountName: string;
    platform: string;
  };
}

export default function SchedulePage() {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null);
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch scheduled posts
  useEffect(() => {
    fetchScheduledPosts();
  }, []);

  const fetchScheduledPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/schedule/posts');
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts);
      }
    } catch (error) {
      console.error('Failed to fetch scheduled posts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load scheduled posts',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handlePostClick = (post: ScheduledPost) => {
    setSelectedPost(post);
  };

  const handlePostDrop = async (postId: string, newDate: Date) => {
    try {
      const response = await fetch(`/api/schedule/posts/${postId}/reschedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledFor: newDate.toISOString() }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Post rescheduled successfully',
        });
        fetchScheduledPosts();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reschedule post',
        variant: 'destructive',
      });
    }
  };

  const handleAddPost = (date: Date) => {
    setSelectedDate(date);
    setIsSchedulerOpen(true);
  };

  const handleScheduleComplete = () => {
    setIsSchedulerOpen(false);
    fetchScheduledPosts();
  };

  // Calculate statistics
  const stats = {
    total: posts.length,
    pending: posts.filter(p => p.status === 'PENDING').length,
    queued: posts.filter(p => p.status === 'QUEUED').length,
    published: posts.filter(p => p.status === 'PUBLISHED').length,
    failed: posts.filter(p => p.status === 'FAILED').length,
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Content Schedule</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Clock className="mr-2 h-4 w-4" />
            Time Zones
          </Button>
          <Button variant="outline">
            <BarChart className="mr-2 h-4 w-4" />
            Analytics
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Scheduled</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Queued</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.queued}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <CalendarIcon className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.published}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <CalendarIcon className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.failed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="calendar" className="space-y-4">
        <TabsList>
          <TabsTrigger value="calendar">
            <CalendarIcon className="mr-2 h-4 w-4" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="queue">
            <Clock className="mr-2 h-4 w-4" />
            Posting Queue
          </TabsTrigger>
          <TabsTrigger value="recurring">
            <Repeat className="mr-2 h-4 w-4" />
            Recurring Posts
          </TabsTrigger>
          <TabsTrigger value="optimal">
            <Zap className="mr-2 h-4 w-4" />
            Optimal Times
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4">
          <Calendar
            posts={posts}
            onDateClick={handleDateClick}
            onPostClick={handlePostClick}
            onPostDrop={handlePostDrop}
            onAddPost={handleAddPost}
          />
        </TabsContent>

        <TabsContent value="queue" className="space-y-4">
          <QueueManager
            posts={posts}
            onUpdate={fetchScheduledPosts}
          />
        </TabsContent>

        <TabsContent value="recurring" className="space-y-4">
          <RecurringPostsManager
            onUpdate={fetchScheduledPosts}
          />
        </TabsContent>

        <TabsContent value="optimal" className="space-y-4">
          <OptimalTimesSuggestions
            onSchedule={(date) => {
              setSelectedDate(date);
              setIsSchedulerOpen(true);
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Post Scheduler Dialog */}
      <Dialog open={isSchedulerOpen} onOpenChange={setIsSchedulerOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Schedule New Post</DialogTitle>
            <DialogDescription>
              Create and schedule a new post for {selectedDate?.toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>
          <PostScheduler
            initialDate={selectedDate}
            onComplete={handleScheduleComplete}
            onCancel={() => setIsSchedulerOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Post Details Dialog */}
      {selectedPost && (
        <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Scheduled Post Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Content</h4>
                <p className="mt-1">{selectedPost.content}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Platform</h4>
                  <p className="mt-1">{selectedPost.socialAccount.platform}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Account</h4>
                  <p className="mt-1">{selectedPost.socialAccount.accountName}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Scheduled For</h4>
                  <p className="mt-1">
                    {new Date(selectedPost.scheduledFor).toLocaleString()}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Status</h4>
                  <p className="mt-1">{selectedPost.status}</p>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setSelectedPost(null)}>
                  Close
                </Button>
                <Button variant="outline" onClick={() => {
                  setSelectedDate(new Date(selectedPost.scheduledFor));
                  setIsSchedulerOpen(true);
                  setSelectedPost(null);
                }}>
                  Reschedule
                </Button>
                <Button variant="destructive" onClick={async () => {
                  // Delete post logic
                  try {
                    const response = await fetch(`/api/schedule/posts/${selectedPost.id}`, {
                      method: 'DELETE',
                    });
                    if (response.ok) {
                      toast({
                        title: 'Success',
                        description: 'Post deleted successfully',
                      });
                      fetchScheduledPosts();
                      setSelectedPost(null);
                    }
                  } catch (error) {
                    toast({
                      title: 'Error',
                      description: 'Failed to delete post',
                      variant: 'destructive',
                    });
                  }
                }}>
                  Delete
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}