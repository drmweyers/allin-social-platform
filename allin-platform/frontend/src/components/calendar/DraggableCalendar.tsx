'use client';

import { useState, useRef, DragEvent } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  MoreVertical,
  Copy,
  Trash2,
  Edit,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Post {
  id: string;
  title: string;
  content: string;
  platforms: string[];
  scheduledFor: Date;
  status: 'scheduled' | 'published' | 'failed' | 'draft';
  mediaUrls?: string[];
}

interface DraggableCalendarProps {
  posts: Post[];
  onPostMove: (postId: string, newDate: Date) => void;
  onPostEdit: (postId: string) => void;
  onPostDelete: (postId: string) => void;
  onPostDuplicate: (postId: string) => void;
  viewMode: 'month' | 'week' | 'day';
  currentDate: Date;
}

const PLATFORM_CONFIG = {
  facebook: { icon: Facebook, color: '#1877F2' },
  instagram: { icon: Instagram, color: '#E4405F' },
  twitter: { icon: Twitter, color: '#1DA1F2' },
  linkedin: { icon: Linkedin, color: '#0A66C2' },
  youtube: { icon: Youtube, color: '#FF0000' },
};

const STATUS_CONFIG = {
  scheduled: { icon: Clock, color: 'text-blue-500' },
  published: { icon: CheckCircle, color: 'text-green-500' },
  failed: { icon: XCircle, color: 'text-red-500' },
  draft: { icon: AlertCircle, color: 'text-yellow-500' }
};

export default function DraggableCalendar({
  posts,
  onPostMove,
  onPostEdit,
  onPostDelete,
  onPostDuplicate,
  viewMode,
  currentDate
}: DraggableCalendarProps) {
  const [draggedPost, setDraggedPost] = useState<Post | null>(null);
  const [dragOverDate, setDragOverDate] = useState<Date | null>(null);
  const dragCounterRef = useRef(0);

  const handleDragStart = (e: DragEvent<HTMLDivElement>, post: Post) => {
    setDraggedPost(post);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', post.id);

    // Add visual feedback
    const element = e.currentTarget as HTMLElement;
    element.style.opacity = '0.5';
  };

  const handleDragEnd = (e: DragEvent<HTMLDivElement>) => {
    const element = e.currentTarget as HTMLElement;
    element.style.opacity = '1';
    setDraggedPost(null);
    setDragOverDate(null);
    dragCounterRef.current = 0;
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>, date: Date) => {
    e.preventDefault();
    dragCounterRef.current++;
    setDragOverDate(date);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setDragOverDate(null);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, targetDate: Date, targetHour?: number) => {
    e.preventDefault();
    e.stopPropagation();

    const postId = e.dataTransfer.getData('text/plain');
    if (postId && draggedPost) {
      const newDate = new Date(targetDate);
      if (targetHour !== undefined) {
        newDate.setHours(targetHour);
      }
      onPostMove(postId, newDate);
    }

    setDraggedPost(null);
    setDragOverDate(null);
    dragCounterRef.current = 0;
  };

  const PostCard = ({ post, compact = false }: { post: Post; compact?: boolean }) => {
    const StatusIcon = STATUS_CONFIG[post.status].icon;
    const statusColor = STATUS_CONFIG[post.status].color;

    return (
      <div
        draggable
        onDragStart={(e) => handleDragStart(e, post)}
        onDragEnd={handleDragEnd}
        className={`
          group relative cursor-move p-2 rounded-lg border
          bg-white dark:bg-gray-800 hover:shadow-md transition-shadow
          ${compact ? 'text-xs' : 'text-sm'}
        `}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {!compact && (
              <div className="flex items-center gap-2 mb-1">
                <StatusIcon className={`h-3 w-3 ${statusColor}`} />
                <span className="font-medium truncate">{post.title}</span>
              </div>
            )}

            <p className="text-gray-600 dark:text-gray-400 line-clamp-2">
              {post.content}
            </p>

            <div className="flex items-center gap-1 mt-1">
              {post.platforms.map(platform => {
                const config = PLATFORM_CONFIG[platform as keyof typeof PLATFORM_CONFIG];
                if (!config) return null;
                const Icon = config.icon;
                return (
                  <div
                    key={platform}
                    className="w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: config.color }}
                  >
                    <Icon className="h-3 w-3 text-white" />
                  </div>
                );
              })}
              {!compact && (
                <span className="ml-1 text-xs text-gray-500">
                  {post.scheduledFor.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  })}
                </span>
              )}
            </div>
          </div>

          {!compact && (
            <DropdownMenu>
              <DropdownMenuTrigger className="opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="h-4 w-4 text-gray-400" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onPostEdit(post.id)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onPostDuplicate(post.id)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onPostDelete(post.id)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    );
  };

  const getPostsForDate = (date: Date) => {
    return posts.filter(post => {
      const postDate = new Date(post.scheduledFor);
      return (
        postDate.getDate() === date.getDate() &&
        postDate.getMonth() === date.getMonth() &&
        postDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const getPostsForHour = (date: Date, hour: number) => {
    return posts.filter(post => {
      const postDate = new Date(post.scheduledFor);
      return (
        postDate.getDate() === date.getDate() &&
        postDate.getMonth() === date.getMonth() &&
        postDate.getFullYear() === date.getFullYear() &&
        postDate.getHours() === hour
      );
    });
  };

  const generateMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const current = new Date(startDate);

    while (current <= lastDay || current.getDay() !== 0) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  if (viewMode === 'month') {
    return (
      <div className="h-full">
        <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700">
          {generateMonthDays().map((day, index) => {
            const dayPosts = getPostsForDate(day);
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const isToday = day.toDateString() === new Date().toDateString();
            const isDraggedOver = dragOverDate?.toDateString() === day.toDateString();

            return (
              <div
                key={index}
                className={`
                  bg-white dark:bg-gray-900 p-2 min-h-[120px]
                  ${!isCurrentMonth ? 'opacity-50' : ''}
                  ${isToday ? 'ring-2 ring-blue-500' : ''}
                  ${isDraggedOver ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                  transition-colors
                `}
                onDragOver={handleDragOver}
                onDragEnter={(e) => handleDragEnter(e, day)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, day)}
              >
                <div className="font-semibold text-sm mb-2">
                  {day.getDate()}
                </div>

                <div className="space-y-1 overflow-y-auto max-h-[80px]">
                  {dayPosts.slice(0, 3).map(post => (
                    <PostCard key={post.id} post={post} compact />
                  ))}
                  {dayPosts.length > 3 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{dayPosts.length - 3} more
                    </div>
                  )}
                </div>

                {isDraggedOver && draggedPost && (
                  <div className="mt-1 p-1 border-2 border-dashed border-blue-400 rounded bg-blue-50/50 dark:bg-blue-900/20">
                    <p className="text-xs text-blue-600 dark:text-blue-400 text-center">
                      Drop here
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Week and Day view implementations would follow similar patterns
  // with appropriate drag and drop zones for time slots

  return null;
}