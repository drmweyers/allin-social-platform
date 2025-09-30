'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Grid3x3,
  List,
  Settings
} from 'lucide-react';

// Platform colors for visual distinction
const PLATFORM_COLORS = {
  facebook: '#1877F2',
  instagram: '#E4405F',
  twitter: '#1DA1F2',
  linkedin: '#0A66C2',
  pinterest: '#E60023',
  youtube: '#FF0000',
  tiktok: '#000000'
};

interface ScheduledPost {
  id: string;
  title: string;
  content: string;
  platforms: string[];
  scheduledFor: Date;
  status: 'scheduled' | 'published' | 'failed' | 'draft';
  mediaUrls?: string[];
}

export default function CalendarPage() {
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTimezone, setSelectedTimezone] = useState('America/New_York');
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Calendar navigation functions
  const navigatePrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const navigateToday = () => {
    setCurrentDate(new Date());
  };

  // Format date for display
  const formatDateHeader = () => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: viewMode === 'day' ? 'numeric' : undefined
    };
    return currentDate.toLocaleDateString('en-US', options);
  };

  // Generate calendar days for month view
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

  // Generate week days
  const generateWeekDays = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  };

  // Generate hours for day view
  const generateDayHours = () => {
    const hours = [];
    for (let i = 0; i < 24; i++) {
      hours.push(i);
    }
    return hours;
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Content Calendar</h1>
          <p className="text-gray-500">Schedule and manage your social media posts</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Schedule Post
        </Button>
      </div>

      {/* Calendar Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Navigation */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={navigatePrevious}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={navigateToday}>
                Today
              </Button>
              <Button variant="outline" size="icon" onClick={navigateNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <span className="ml-4 text-lg font-semibold">{formatDateHeader()}</span>
            </div>

            {/* View Controls */}
            <div className="flex items-center gap-4">
              <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
                <TabsList>
                  <TabsTrigger value="month" className="gap-2">
                    <Grid3x3 className="h-4 w-4" />
                    Month
                  </TabsTrigger>
                  <TabsTrigger value="week" className="gap-2">
                    <List className="h-4 w-4" />
                    Week
                  </TabsTrigger>
                  <TabsTrigger value="day" className="gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    Day
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <Select value={selectedTimezone} onValueChange={setSelectedTimezone}>
                <SelectTrigger className="w-[180px]">
                  <Clock className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/New_York">Eastern Time</SelectItem>
                  <SelectItem value="America/Chicago">Central Time</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="Europe/London">London</SelectItem>
                  <SelectItem value="Europe/Paris">Paris</SelectItem>
                  <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Views */}
      <Card className="min-h-[600px]">
        <CardContent className="p-6">
          {viewMode === 'month' && (
            <div className="h-full">
              {/* Month View Header */}
              <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 mb-px">
                {dayNames.map(day => (
                  <div key={day} className="bg-white dark:bg-gray-900 p-2 text-center font-semibold text-sm">
                    {day}
                  </div>
                ))}
              </div>

              {/* Month View Grid */}
              <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 h-[500px]">
                {generateMonthDays().map((day, index) => {
                  const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                  const isToday = day.toDateString() === new Date().toDateString();

                  return (
                    <div
                      key={index}
                      className={`
                        bg-white dark:bg-gray-900 p-2 min-h-[80px] cursor-pointer
                        hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors
                        ${!isCurrentMonth ? 'opacity-50' : ''}
                        ${isToday ? 'ring-2 ring-blue-500' : ''}
                      `}
                      onClick={() => setSelectedDate(day)}
                    >
                      <div className="font-semibold text-sm mb-1">
                        {day.getDate()}
                      </div>
                      {/* Sample posts - would be populated from scheduledPosts */}
                      <div className="space-y-1">
                        {index % 7 === 3 && (
                          <div className="text-xs p-1 bg-blue-100 dark:bg-blue-900 rounded truncate">
                            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block mr-1"></span>
                            Facebook Post
                          </div>
                        )}
                        {index % 5 === 2 && (
                          <div className="text-xs p-1 bg-pink-100 dark:bg-pink-900 rounded truncate">
                            <span className="w-2 h-2 rounded-full bg-pink-500 inline-block mr-1"></span>
                            Instagram
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {viewMode === 'week' && (
            <div className="h-full">
              {/* Week View Header */}
              <div className="grid grid-cols-8 gap-px bg-gray-200 dark:bg-gray-700 mb-px">
                <div className="bg-white dark:bg-gray-900 p-2 text-center text-sm font-semibold">
                  Time
                </div>
                {generateWeekDays().map((day, index) => {
                  const isToday = day.toDateString() === new Date().toDateString();
                  return (
                    <div
                      key={index}
                      className={`bg-white dark:bg-gray-900 p-2 text-center ${isToday ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                    >
                      <div className="text-sm font-semibold">{dayNames[day.getDay()]}</div>
                      <div className="text-lg">{day.getDate()}</div>
                    </div>
                  );
                })}
              </div>

              {/* Week View Time Grid */}
              <div className="overflow-y-auto h-[500px]">
                {generateDayHours().map(hour => (
                  <div key={hour} className="grid grid-cols-8 gap-px bg-gray-200 dark:bg-gray-700 mb-px">
                    <div className="bg-white dark:bg-gray-900 p-2 text-right text-sm">
                      {hour.toString().padStart(2, '0')}:00
                    </div>
                    {generateWeekDays().map((day, dayIndex) => (
                      <div
                        key={dayIndex}
                        className="bg-white dark:bg-gray-900 p-2 min-h-[60px] hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                        onClick={() => {
                          const dateTime = new Date(day);
                          dateTime.setHours(hour);
                          setSelectedDate(dateTime);
                        }}
                      >
                        {/* Sample scheduled posts */}
                        {hour === 10 && dayIndex === 2 && (
                          <div className="text-xs p-1 bg-blue-100 dark:bg-blue-900 rounded">
                            Twitter Thread
                          </div>
                        )}
                        {hour === 14 && dayIndex === 4 && (
                          <div className="text-xs p-1 bg-red-100 dark:bg-red-900 rounded">
                            LinkedIn Article
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {viewMode === 'day' && (
            <div className="h-full">
              {/* Day View Header */}
              <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded">
                <h3 className="text-lg font-semibold">
                  {currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </h3>
              </div>

              {/* Day View Timeline */}
              <div className="overflow-y-auto h-[500px]">
                {generateDayHours().map(hour => (
                  <div key={hour} className="flex gap-4 mb-px">
                    <div className="w-20 text-right text-sm py-4">
                      {hour.toString().padStart(2, '0')}:00
                    </div>
                    <div className="flex-1 border-t border-gray-200 dark:border-gray-700 py-4 min-h-[80px] hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer px-4">
                      {/* Sample posts for day view */}
                      {hour === 9 && (
                        <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge style={{ backgroundColor: PLATFORM_COLORS.facebook }}>
                              Facebook
                            </Badge>
                            <span className="text-sm text-gray-500">9:00 AM</span>
                          </div>
                          <p className="text-sm">Morning motivational quote</p>
                        </div>
                      )}
                      {hour === 15 && (
                        <div className="p-3 bg-pink-100 dark:bg-pink-900 rounded">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge style={{ backgroundColor: PLATFORM_COLORS.instagram }}>
                              Instagram
                            </Badge>
                            <span className="text-sm text-gray-500">3:00 PM</span>
                          </div>
                          <p className="text-sm">Product showcase with carousel</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Today's Posts</p>
                <p className="text-2xl font-bold">5</p>
              </div>
              <CalendarIcon className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">This Week</p>
                <p className="text-2xl font-bold">28</p>
              </div>
              <Clock className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Scheduled</p>
                <p className="text-2xl font-bold">42</p>
              </div>
              <List className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Draft</p>
                <p className="text-2xl font-bold">12</p>
              </div>
              <Settings className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}