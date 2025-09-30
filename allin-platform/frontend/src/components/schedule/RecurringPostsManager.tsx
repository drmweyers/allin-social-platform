'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Repeat, Calendar, Clock, Pause, Play, Trash2, Edit } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface RecurringPost {
  id: string;
  name: string;
  pattern: string;
  frequency: number;
  startDate: string;
  endDate?: string;
  nextRunDate?: string;
  isActive: boolean;
  scheduledPost: {
    post: {
      content: string;
    };
    socialAccount: {
      accountName: string;
      platform: string;
    };
  };
}

interface RecurringPostsManagerProps {
  onUpdate: () => void;
}

export function RecurringPostsManager({ onUpdate }: RecurringPostsManagerProps) {
  const [recurringPosts, setRecurringPosts] = useState<RecurringPost[]>([]);
  const [editingPost, setEditingPost] = useState<RecurringPost | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchRecurringPosts();
  }, []);

  const fetchRecurringPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/schedule/recurring');
      if (response.ok) {
        const data = await response.json();
        setRecurringPosts(data.recurringGroups);
      }
    } catch (error) {
      console.error('Failed to fetch recurring posts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load recurring posts',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (postId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/schedule/recurring/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: isActive ? 'Recurring post activated' : 'Recurring post paused',
        });
        fetchRecurringPosts();
        onUpdate();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update recurring post',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateEndDate = async () => {
    if (!editingPost) return;

    try {
      const response = await fetch(`/api/schedule/recurring/${editingPost.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endDate: editingPost.endDate }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'End date updated successfully',
        });
        setIsEditDialogOpen(false);
        fetchRecurringPosts();
        onUpdate();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update end date',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this recurring post?')) {
      return;
    }

    try {
      const response = await fetch(`/api/schedule/recurring/${postId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Recurring post deleted',
        });
        fetchRecurringPosts();
        onUpdate();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete recurring post',
        variant: 'destructive',
      });
    }
  };

  const getPatternLabel = (pattern: string, frequency: number): string => {
    const labels: Record<string, string> = {
      DAILY: `Every ${frequency === 1 ? 'day' : `${frequency} days`}`,
      WEEKLY: `Every ${frequency === 1 ? 'week' : `${frequency} weeks`}`,
      BIWEEKLY: 'Every 2 weeks',
      MONTHLY: `Every ${frequency === 1 ? 'month' : `${frequency} months`}`,
      CUSTOM: 'Custom schedule',
    };
    return labels[pattern] || pattern;
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Recurring Posts</h3>
          <p className="text-sm text-gray-500">
            Manage posts that automatically repeat on a schedule
          </p>
        </div>
        <Badge variant="secondary">
          {recurringPosts.filter(p => p.isActive).length} Active
        </Badge>
      </div>

      {/* Recurring Posts List */}
      {loading ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">Loading recurring posts...</p>
          </CardContent>
        </Card>
      ) : recurringPosts.length > 0 ? (
        <div className="space-y-4">
          {recurringPosts.map((post) => (
            <Card key={post.id} className={cn(!post.isActive && 'opacity-60')}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Repeat className="h-4 w-4 text-gray-500" />
                      <CardTitle className="text-base">
                        {post.name || 'Recurring Post'}
                      </CardTitle>
                    </div>
                    <CardDescription>
                      {post.scheduledPost.post.content.substring(0, 100)}...
                    </CardDescription>
                  </div>
                  <Switch
                    checked={post.isActive}
                    onCheckedChange={(checked) => handleToggleActive(post.id, checked)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Platform and Account */}
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <div
                        className={cn(
                          'w-2 h-8 rounded',
                          getPlatformColor(post.scheduledPost.socialAccount.platform)
                        )}
                      />
                      <div>
                        <p className="text-sm font-medium">
                          {post.scheduledPost.socialAccount.accountName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {post.scheduledPost.socialAccount.platform}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Schedule Info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Pattern</p>
                      <p className="font-medium">
                        {getPatternLabel(post.pattern, post.frequency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Started</p>
                      <p className="font-medium">
                        {format(new Date(post.startDate), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Next Run</p>
                      <p className="font-medium">
                        {post.nextRunDate
                          ? format(new Date(post.nextRunDate), 'MMM d, h:mm a')
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Ends</p>
                      <p className="font-medium">
                        {post.endDate
                          ? format(new Date(post.endDate), 'MMM d, yyyy')
                          : 'Never'}
                      </p>
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div className="flex items-center space-x-2">
                    {post.isActive ? (
                      <Badge variant="default" className="bg-green-500">
                        <Play className="mr-1 h-3 w-3" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <Pause className="mr-1 h-3 w-3" />
                        Paused
                      </Badge>
                    )}
                    {post.endDate && new Date(post.endDate) < new Date() && (
                      <Badge variant="destructive">Expired</Badge>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 pt-2 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingPost(post);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit End Date
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(post.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Repeat className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No recurring posts set up yet</p>
            <p className="text-sm text-gray-400">
              Create recurring posts when scheduling to have them automatically repeat
            </p>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Recurring Post</DialogTitle>
            <DialogDescription>
              Update the end date for this recurring post
            </DialogDescription>
          </DialogHeader>
          {editingPost && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={editingPost.endDate?.split('T')[0] || ''}
                  onChange={(e) =>
                    setEditingPost({
                      ...editingPost,
                      endDate: e.target.value ? `${e.target.value}T00:00:00Z` : undefined,
                    })
                  }
                />
                <p className="text-sm text-gray-500">
                  Leave empty for the post to continue indefinitely
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateEndDate}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}