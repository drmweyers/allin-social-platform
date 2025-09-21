'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Send,
  Clock,
  Image,
  Video,
  Hash,
  Smile,
  AtSign,
  Link2,
  Sparkles,
  Save,
  X,
  ChevronDown,
  Calendar,
  Eye,
  Bold,
  Italic,
  List,
  Link,
  Quote,
  Code,
  MoreHorizontal,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Music2,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface Platform {
  id: string;
  name: string;
  icon: any;
  color: string;
  selected: boolean;
  maxChars: number;
  maxImages: number;
  maxVideos: number;
  supports: {
    images: boolean;
    videos: boolean;
    stories: boolean;
    reels: boolean;
    polls: boolean;
    threads: boolean;
  };
}

interface MediaFile {
  id: string;
  file: File;
  url: string;
  type: 'image' | 'video';
  size: number;
  name: string;
}

export default function CreatePostPage() {
  const [content, setContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([]);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const platforms: Platform[] = [
    {
      id: 'facebook',
      name: 'Facebook',
      icon: Facebook,
      color: 'text-blue-600',
      selected: false,
      maxChars: 63206,
      maxImages: 10,
      maxVideos: 1,
      supports: {
        images: true,
        videos: true,
        stories: true,
        reels: true,
        polls: true,
        threads: false,
      },
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: Instagram,
      color: 'text-pink-600',
      selected: false,
      maxChars: 2200,
      maxImages: 10,
      maxVideos: 1,
      supports: {
        images: true,
        videos: true,
        stories: true,
        reels: true,
        polls: false,
        threads: false,
      },
    },
    {
      id: 'twitter',
      name: 'Twitter/X',
      icon: Twitter,
      color: 'text-sky-500',
      selected: false,
      maxChars: 280,
      maxImages: 4,
      maxVideos: 1,
      supports: {
        images: true,
        videos: true,
        stories: false,
        reels: false,
        polls: true,
        threads: true,
      },
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'text-blue-700',
      selected: false,
      maxChars: 3000,
      maxImages: 9,
      maxVideos: 1,
      supports: {
        images: true,
        videos: true,
        stories: false,
        reels: false,
        polls: true,
        threads: false,
      },
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      icon: Music2,
      color: 'text-gray-900',
      selected: false,
      maxChars: 2200,
      maxImages: 0,
      maxVideos: 1,
      supports: {
        images: false,
        videos: true,
        stories: false,
        reels: true,
        polls: false,
        threads: false,
      },
    },
  ];

  const [platformsState, setPlatformsState] = useState(platforms);

  const togglePlatform = (platformId: string) => {
    setPlatformsState(prev =>
      prev.map(p => ({
        ...p,
        selected: p.id === platformId ? !p.selected : p.selected,
      }))
    );
  };

  const handleMediaUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newMediaFiles: MediaFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const url = URL.createObjectURL(file);
      const type = file.type.startsWith('image/') ? 'image' : 'video';

      newMediaFiles.push({
        id: `${Date.now()}-${i}`,
        file,
        url,
        type,
        size: file.size,
        name: file.name,
      });
    }

    setMediaFiles(prev => [...prev, ...newMediaFiles]);
  };

  const removeMedia = (id: string) => {
    setMediaFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file) {
        URL.revokeObjectURL(file.url);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const generateAISuggestions = async () => {
    setAiSuggestions(true);
    // Simulate AI generation
    setTimeout(() => {
      setHashtags(['#socialmedia', '#marketing', '#business', '#growth', '#digitalmarketing']);
      setAiSuggestions(false);
    }, 2000);
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    // Simulate publishing
    setTimeout(() => {
      setIsPublishing(false);
      // Reset form
      setContent('');
      setMediaFiles([]);
      setPlatformsState(platforms);
    }, 2000);
  };

  const selectedCount = platformsState.filter(p => p.selected).length;
  const minCharLimit = Math.min(...platformsState.filter(p => p.selected).map(p => p.maxChars).filter(Boolean), Infinity);
  const charCount = content.length;
  const charPercentage = minCharLimit !== Infinity ? (charCount / minCharLimit) * 100 : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Create Post</h2>
        <p className="text-muted-foreground mt-2">
          Compose and publish content across all your connected social media platforms.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Composer */}
        <div className="lg:col-span-2 space-y-6">
          {/* Platform Selector */}
          <Card>
            <CardHeader>
              <CardTitle>Select Platforms</CardTitle>
              <CardDescription>
                Choose where to publish your content. Each platform has different requirements.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {platformsState.map((platform) => (
                  <Button
                    key={platform.id}
                    variant={platform.selected ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => togglePlatform(platform.id)}
                    className={platform.selected ? '' : 'hover:bg-accent'}
                  >
                    <platform.icon className={`h-4 w-4 mr-2 ${platform.color}`} />
                    {platform.name}
                    {platform.selected && <CheckCircle className="h-4 w-4 ml-2" />}
                  </Button>
                ))}
              </div>
              {selectedCount > 0 && (
                <p className="text-sm text-muted-foreground mt-4">
                  {selectedCount} platform{selectedCount > 1 ? 's' : ''} selected
                </p>
              )}
            </CardContent>
          </Card>

          {/* Content Composer */}
          <Card>
            <CardHeader>
              <CardTitle>Compose Content</CardTitle>
              <div className="flex items-center justify-between">
                <CardDescription>
                  Write your message. AI can help with suggestions.
                </CardDescription>
                {minCharLimit !== Infinity && (
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${charPercentage > 90 ? 'text-red-500' : 'text-muted-foreground'}`}>
                      {charCount} / {minCharLimit}
                    </span>
                    <div className="w-20 h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          charPercentage > 90 ? 'bg-red-500' : charPercentage > 70 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(charPercentage, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Formatting Toolbar */}
              <div className="flex items-center gap-1 p-2 border rounded-lg">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Bold className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Italic className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <List className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Link className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Quote className="h-4 w-4" />
                </Button>
                <div className="flex-1" />
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Smile className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <AtSign className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Hash className="h-4 w-4" />
                </Button>
              </div>

              {/* Text Area */}
              <textarea
                className="w-full min-h-[200px] p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="What's on your mind? Share your thoughts, ideas, or updates..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />

              {/* AI Assistant */}
              <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">AI Assistant</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={generateAISuggestions}
                  disabled={aiSuggestions}
                >
                  {aiSuggestions ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Get Suggestions
                    </>
                  )}
                </Button>
              </div>

              {/* Hashtags */}
              {hashtags.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Suggested Hashtags:</p>
                  <div className="flex flex-wrap gap-2">
                    {hashtags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Media Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Media</CardTitle>
              <CardDescription>
                Add images or videos to your post. Requirements vary by platform.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Upload Area */}
                <div
                  className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={handleMediaUpload}
                  />
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Image className="h-8 w-8 text-muted-foreground" />
                      <Video className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium">Click to upload media</p>
                    <p className="text-xs text-muted-foreground">
                      Support for JPG, PNG, GIF, MP4, MOV up to 100MB
                    </p>
                  </div>
                </div>

                {/* Media Preview */}
                {mediaFiles.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {mediaFiles.map((media) => (
                      <div key={media.id} className="relative group">
                        {media.type === 'image' ? (
                          <img
                            src={media.url}
                            alt={media.name}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                        ) : (
                          <video
                            src={media.url}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeMedia(media.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                        <div className="absolute bottom-2 left-2 right-2">
                          <Badge variant="secondary" className="text-xs">
                            {media.type === 'image' ? 'Image' : 'Video'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Publishing Options */}
          <Card>
            <CardHeader>
              <CardTitle>Publishing Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Post Now / Schedule */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="now"
                    name="schedule"
                    checked={!isScheduling}
                    onChange={() => setIsScheduling(false)}
                  />
                  <label htmlFor="now" className="text-sm font-medium cursor-pointer">
                    Post Now
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="schedule"
                    name="schedule"
                    checked={isScheduling}
                    onChange={() => setIsScheduling(true)}
                  />
                  <label htmlFor="schedule" className="text-sm font-medium cursor-pointer">
                    Schedule for Later
                  </label>
                </div>
              </div>

              {/* Schedule Options */}
              {isScheduling && (
                <div className="space-y-3 p-3 bg-secondary/50 rounded-lg">
                  <div>
                    <label className="text-sm font-medium">Date</label>
                    <input
                      type="date"
                      className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Time</label>
                    <input
                      type="time"
                      className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    <Clock className="h-4 w-4 mr-2" />
                    Suggest Best Time
                  </Button>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button
                  className="w-full"
                  onClick={handlePublish}
                  disabled={!content || selectedCount === 0 || isPublishing}
                >
                  {isPublishing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Publishing...
                    </>
                  ) : isScheduling ? (
                    <>
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule Post
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Publish Now
                    </>
                  )}
                </Button>
                <Button variant="outline" className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Save as Draft
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>
                See how your post will look on different platforms.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedCount > 0 ? (
                <div className="space-y-3">
                  {platformsState.filter(p => p.selected).map((platform) => (
                    <div key={platform.id} className="p-3 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <platform.icon className={`h-4 w-4 ${platform.color}`} />
                        <span className="text-sm font-medium">{platform.name}</span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {content || 'Your content will appear here...'}
                      </p>
                      {mediaFiles.length > 0 && (
                        <div className="mt-2 flex gap-1">
                          {mediaFiles.slice(0, 2).map((media, idx) => (
                            <div key={idx} className="w-12 h-12 bg-secondary rounded" />
                          ))}
                          {mediaFiles.length > 2 && (
                            <div className="w-12 h-12 bg-secondary rounded flex items-center justify-center text-xs">
                              +{mediaFiles.length - 2}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Select platforms to see preview</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tips */}
          <Card>
            <CardHeader>
              <CardTitle>Pro Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <p>Post when your audience is most active for better engagement</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <p>Use 3-5 relevant hashtags to increase discoverability</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <p>Include a clear call-to-action to drive engagement</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <p>Keep videos under 60 seconds for maximum reach</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}