'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  Calendar as CalendarIcon,
  Clock,
  Image,
  Video,
  Link,
  Hash,
  Users,
  Sparkles,
  AlertCircle,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube
} from 'lucide-react';

interface SchedulePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: Date | null;
  onSchedule: (postData: any) => void;
}

const PLATFORMS = [
  { id: 'facebook', name: 'Facebook', icon: Facebook, color: '#1877F2' },
  { id: 'instagram', name: 'Instagram', icon: Instagram, color: '#E4405F' },
  { id: 'twitter', name: 'Twitter', icon: Twitter, color: '#1DA1F2' },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: '#0A66C2' },
  { id: 'youtube', name: 'YouTube', icon: Youtube, color: '#FF0000' },
];

export default function SchedulePostModal({
  isOpen,
  onClose,
  selectedDate,
  onSchedule
}: SchedulePostModalProps) {
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>(
    selectedDate || new Date()
  );
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [hashtags, setHashtags] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringPattern, setRecurringPattern] = useState('daily');
  const [aiSuggestions, setAiSuggestions] = useState(false);

  const handlePlatformToggle = (platformId: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    );
  };

  const handleSchedule = () => {
    const postData = {
      title: postTitle,
      content: postContent,
      platforms: selectedPlatforms,
      scheduledFor: new Date(
        scheduleDate!.getFullYear(),
        scheduleDate!.getMonth(),
        scheduleDate!.getDate(),
        parseInt(scheduleTime.split(':')[0]),
        parseInt(scheduleTime.split(':')[1])
      ),
      hashtags: hashtags.split(' ').filter(tag => tag.startsWith('#')),
      mediaFiles,
      isRecurring,
      recurringPattern: isRecurring ? recurringPattern : null,
      aiSuggestions
    };

    onSchedule(postData);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setPostTitle('');
    setPostContent('');
    setSelectedPlatforms([]);
    setScheduleDate(new Date());
    setScheduleTime('09:00');
    setHashtags('');
    setMediaFiles([]);
    setIsRecurring(false);
    setRecurringPattern('daily');
    setAiSuggestions(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setMediaFiles(Array.from(e.target.files));
    }
  };

  const getOptimalTimes = () => {
    // Mock optimal times - would come from backend analytics
    return {
      facebook: '9:00 AM, 3:00 PM',
      instagram: '11:00 AM, 5:00 PM',
      twitter: '8:00 AM, 7:00 PM',
      linkedin: '7:30 AM, 5:30 PM',
      youtube: '2:00 PM, 8:00 PM'
    };
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule New Post</DialogTitle>
          <DialogDescription>
            Create and schedule your content across multiple social media platforms
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Platform Selection */}
          <div className="space-y-2">
            <Label>Select Platforms</Label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map(platform => (
                <Button
                  key={platform.id}
                  variant={selectedPlatforms.includes(platform.id) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePlatformToggle(platform.id)}
                  className="gap-2"
                  style={{
                    backgroundColor: selectedPlatforms.includes(platform.id)
                      ? platform.color
                      : undefined
                  }}
                >
                  <platform.icon className="h-4 w-4" />
                  {platform.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Post Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Post Title (Internal)</Label>
            <Input
              id="title"
              placeholder="e.g., Monday Motivation Post"
              value={postTitle}
              onChange={(e) => setPostTitle(e.target.value)}
            />
          </div>

          {/* Post Content */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="content">Content</Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAiSuggestions(!aiSuggestions)}
                  className="gap-1"
                >
                  <Sparkles className="h-4 w-4" />
                  AI Suggestions
                </Button>
                <span className="text-sm text-gray-500">
                  {postContent.length} / 280 characters
                </span>
              </div>
            </div>
            <Textarea
              id="content"
              placeholder="Write your post content here..."
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              rows={4}
              className="resize-none"
            />
            {aiSuggestions && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded space-y-2">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  AI Suggestions
                </p>
                <div className="space-y-1 text-sm">
                  <p className="cursor-pointer hover:text-blue-600">
                    "Start your week with purpose! What's your main goal for today? 💪"
                  </p>
                  <p className="cursor-pointer hover:text-blue-600">
                    "Monday motivation: Remember, every expert was once a beginner. Keep going!"
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Media Upload */}
          <div className="space-y-2">
            <Label htmlFor="media">Media</Label>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Image className="h-4 w-4" />
                Add Photo
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Video className="h-4 w-4" />
                Add Video
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Link className="h-4 w-4" />
                Add Link
              </Button>
            </div>
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileUpload}
              className="hidden"
              id="media-upload"
            />
            {mediaFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {mediaFiles.map((file, index) => (
                  <Badge key={index} variant="secondary">
                    {file.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Hashtags */}
          <div className="space-y-2">
            <Label htmlFor="hashtags">Hashtags</Label>
            <div className="relative">
              <Hash className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                id="hashtags"
                placeholder="Add hashtags separated by spaces"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Schedule Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !scheduleDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {scheduleDate ? format(scheduleDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={scheduleDate}
                    onSelect={setScheduleDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  id="time"
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          {/* Optimal Posting Times */}
          {selectedPlatforms.length > 0 && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded space-y-2">
              <p className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Optimal Posting Times
              </p>
              <div className="space-y-1 text-sm">
                {selectedPlatforms.map(platform => (
                  <p key={platform}>
                    <span className="font-medium capitalize">{platform}:</span>{' '}
                    {getOptimalTimes()[platform as keyof ReturnType<typeof getOptimalTimes>]}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Recurring Post */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="recurring"
                checked={isRecurring}
                onCheckedChange={(checked) => setIsRecurring(checked as boolean)}
              />
              <Label htmlFor="recurring">Make this a recurring post</Label>
            </div>
            {isRecurring && (
              <Select value={recurringPattern} onValueChange={setRecurringPattern}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Bi-weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Audience Targeting */}
          <div className="space-y-2">
            <Label>Audience Targeting</Label>
            <Select>
              <SelectTrigger>
                <Users className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Select target audience" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Followers</SelectItem>
                <SelectItem value="engaged">Highly Engaged Users</SelectItem>
                <SelectItem value="new">New Followers</SelectItem>
                <SelectItem value="custom">Custom Segment</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSchedule}
            disabled={!postContent || selectedPlatforms.length === 0}
          >
            Schedule Post
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}