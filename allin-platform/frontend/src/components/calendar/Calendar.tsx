'use client';

import React, { useState, useEffect } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
  set
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, Grid, List } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

interface CalendarProps {
  posts: ScheduledPost[];
  onDateClick: (date: Date) => void;
  onPostClick: (post: ScheduledPost) => void;
  onPostDrop: (postId: string, newDate: Date) => void;
  onAddPost: (date: Date) => void;
}

type ViewMode = 'month' | 'week' | 'day' | 'list';

export function Calendar({
  posts,
  onDateClick,
  onPostClick,
  onPostDrop,
  onAddPost
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [draggedPost, setDraggedPost] = useState<ScheduledPost | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const previousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

  const getPostsForDate = (date: Date): ScheduledPost[] => {
    return posts.filter(post =>
      isSameDay(parseISO(post.scheduledFor), date)
    );
  };

  const getPlatformColor = (platform: string): string => {
    const colors: Record<string, string> = {
      FACEBOOK: 'bg-blue-500',
      INSTAGRAM: 'bg-pink-500',
      TWITTER: 'bg-sky-400',
      LINKEDIN: 'bg-blue-700',
      TIKTOK: 'bg-black'
    };
    return colors[platform] || 'bg-gray-500';
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-500',
      QUEUED: 'bg-blue-500',
      PUBLISHED: 'bg-green-500',
      FAILED: 'bg-red-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  const handleDragStart = (e: React.DragEvent, post: ScheduledPost) => {
    setDraggedPost(post);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, date: Date) => {
    e.preventDefault();
    if (draggedPost) {
      onPostDrop(draggedPost.id, date);
      setDraggedPost(null);
    }
  };

  const renderCalendarDays = () => {
    const rows = [];
    const days = [];
    let day = startDate;

    // Header with day names
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    rows.push(
      <div key="header" className="grid grid-cols-7 mb-2">
        {dayNames.map(dayName => (
          <div
            key={dayName}
            className="text-center text-xs font-medium text-gray-500 py-2"
          >
            {dayName}
          </div>
        ))}
      </div>
    );

    // Calendar days
    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const currentDay = day;
        const dayPosts = getPostsForDate(currentDay);
        const isCurrentMonth = isSameMonth(currentDay, monthStart);
        const isSelected = selectedDate && isSameDay(currentDay, selectedDate);
        const isTodayDate = isToday(currentDay);

        days.push(
          <div
            key={currentDay.toString()}
            className={cn(
              'min-h-[100px] border border-gray-200 p-2 cursor-pointer transition-colors',
              !isCurrentMonth && 'bg-gray-50 text-gray-400',
              isSelected && 'bg-blue-50 border-blue-500',
              isTodayDate && 'bg-yellow-50',
              'hover:bg-gray-50'
            )}
            onClick={() => {
              setSelectedDate(currentDay);
              onDateClick(currentDay);
            }}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, currentDay)}
          >
            <div className="flex justify-between items-start mb-1">
              <span
                className={cn(
                  'text-sm font-medium',
                  isTodayDate && 'bg-blue-600 text-white rounded-full w-7 h-7 flex items-center justify-center'
                )}
              >
                {format(currentDay, 'd')}
              </span>
              {isCurrentMonth && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddPost(currentDay);
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="space-y-1">
              {dayPosts.slice(0, 3).map((post) => (
                <div
                  key={post.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, post)}
                  onClick={(e) => {
                    e.stopPropagation();
                    onPostClick(post);
                  }}
                  className={cn(
                    'text-xs p-1 rounded cursor-move truncate',
                    getPlatformColor(post.socialAccount.platform),
                    'text-white hover:opacity-90'
                  )}
                  title={post.content}
                >
                  {format(parseISO(post.scheduledFor), 'HH:mm')} - {post.content.substring(0, 20)}...
                </div>
              ))}
              {dayPosts.length > 3 && (
                <div className="text-xs text-gray-500 text-center">
                  +{dayPosts.length - 3} more
                </div>
              )}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7">
          {days.splice(0, 7)}
        </div>
      );
    }

    return rows;
  };

  const renderListView = () => {
    const sortedPosts = [...posts].sort(
      (a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime()
    );

    return (
      <div className="space-y-2">
        {sortedPosts.map(post => (
          <div
            key={post.id}
            className="flex items-center justify-between p-4 bg-white border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onPostClick(post)}
          >
            <div className="flex items-center space-x-4">
              <div className={cn('w-2 h-12 rounded', getPlatformColor(post.socialAccount.platform))} />
              <div>
                <p className="font-medium">{post.content.substring(0, 50)}...</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {post.socialAccount.platform}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {post.socialAccount.accountName}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium">
                  {format(parseISO(post.scheduledFor), 'MMM d, yyyy')}
                </p>
                <p className="text-xs text-gray-500">
                  {format(parseISO(post.scheduledFor), 'h:mm a')}
                </p>
              </div>
              <Badge className={cn('text-xs', getStatusColor(post.status))}>
                {post.status}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold">Content Calendar</h2>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={previousMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={nextMonth}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <span className="text-lg font-medium">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                {viewMode === 'month' && <Grid className="h-4 w-4 mr-2" />}
                {viewMode === 'list' && <List className="h-4 w-4 mr-2" />}
                {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} View
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setViewMode('month')}>
                <Grid className="h-4 w-4 mr-2" />
                Month View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setViewMode('week')}>
                <CalendarIcon className="h-4 w-4 mr-2" />
                Week View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setViewMode('day')}>
                <Clock className="h-4 w-4 mr-2" />
                Day View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setViewMode('list')}>
                <List className="h-4 w-4 mr-2" />
                List View
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={() => onAddPost(new Date())}>
            <Plus className="h-4 w-4 mr-2" />
            Schedule Post
          </Button>
        </div>
      </div>

      {/* Calendar Body */}
      <div className="p-4">
        {viewMode === 'month' && renderCalendarDays()}
        {viewMode === 'list' && renderListView()}
        {viewMode === 'week' && (
          <div className="text-center py-8 text-gray-500">
            Week view coming soon...
          </div>
        )}
        {viewMode === 'day' && (
          <div className="text-center py-8 text-gray-500">
            Day view coming soon...
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="border-t p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">Platforms:</span>
            <div className="flex items-center space-x-2">
              {['FACEBOOK', 'INSTAGRAM', 'TWITTER', 'LINKEDIN', 'TIKTOK'].map(platform => (
                <TooltipProvider key={platform}>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className={cn('w-4 h-4 rounded', getPlatformColor(platform))} />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{platform}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">Status:</span>
            <div className="flex items-center space-x-2">
              {['PENDING', 'QUEUED', 'PUBLISHED', 'FAILED'].map(status => (
                <Badge key={status} className={cn('text-xs', getStatusColor(status))}>
                  {status}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}