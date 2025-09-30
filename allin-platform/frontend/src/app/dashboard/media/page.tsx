'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Upload,
  Search,
  Filter,
  Grid3X3,
  List,
  Download,
  Share2,
  Copy,
  Trash2,
  Edit,
  MoreVertical,
  Image,
  Video,
  File,
  FolderPlus,
  Folder,
  Eye,
  Calendar,
  User,
  Tag,
  Heart,
  Star,
  Clock,
  FileImage,
  FileVideo,
  FileAudio,
  FileText
} from 'lucide-react';

interface MediaFile {
  id: string;
  name: string;
  type: 'image' | 'video' | 'audio' | 'document';
  url: string;
  thumbnail?: string;
  size: number;
  dimensions?: {
    width: number;
    height: number;
  };
  uploadedAt: string;
  uploadedBy: string;
  tags: string[];
  folder: string;
  isFavorite: boolean;
  description?: string;
  usageCount: number;
  lastUsed?: string;
}

interface Folder {
  id: string;
  name: string;
  itemCount: number;
  createdAt: string;
}

const mockFolders: Folder[] = [
  { id: 'all', name: 'All Media', itemCount: 26, createdAt: '2024-01-01' },
  { id: 'recent', name: 'Recently Added', itemCount: 10, createdAt: '2024-01-15' },
  { id: 'favorites', name: 'Favorites', itemCount: 9, createdAt: '2024-01-10' },
  { id: 'campaigns', name: 'Campaign Assets', itemCount: 20, createdAt: '2024-01-05' },
  { id: 'logos', name: 'Logos & Branding', itemCount: 3, createdAt: '2024-01-03' },
  { id: 'social-templates', name: 'Social Templates', itemCount: 3, createdAt: '2024-01-08' }
];

const mockMediaFiles: MediaFile[] = [
  // Marketing Images
  {
    id: '1',
    name: 'hero-banner-2024.jpg',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=600&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=200&h=150&fit=crop',
    size: 2567890,
    dimensions: { width: 1920, height: 1080 },
    uploadedAt: '2024-01-20T10:30:00Z',
    uploadedBy: 'Marketing Team',
    tags: ['banner', 'hero', 'marketing', 'business'],
    folder: 'campaigns',
    isFavorite: true,
    description: 'Professional business meeting hero banner',
    usageCount: 15,
    lastUsed: '2024-01-19T14:20:00Z'
  },
  {
    id: '2',
    name: 'startup-team.jpg',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=200&h=150&fit=crop',
    size: 1856432,
    dimensions: { width: 1600, height: 1200 },
    uploadedAt: '2024-01-19T15:45:00Z',
    uploadedBy: 'Content Creator',
    tags: ['team', 'startup', 'collaboration', 'office'],
    folder: 'campaigns',
    isFavorite: false,
    description: 'Young startup team working together',
    usageCount: 8,
    lastUsed: '2024-01-18T09:30:00Z'
  },
  {
    id: '3',
    name: 'technology-workspace.jpg',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=600&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=200&h=150&fit=crop',
    size: 2134567,
    dimensions: { width: 1920, height: 1280 },
    uploadedAt: '2024-01-18T12:00:00Z',
    uploadedBy: 'Design Team',
    tags: ['technology', 'coding', 'workspace', 'developer'],
    folder: 'campaigns',
    isFavorite: true,
    description: 'Modern developer workspace with laptop and code',
    usageCount: 32,
    lastUsed: '2024-01-20T08:15:00Z'
  },
  {
    id: '4',
    name: 'social-media-concept.jpg',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=800&h=600&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=200&h=150&fit=crop',
    size: 1789012,
    dimensions: { width: 1200, height: 900 },
    uploadedAt: '2024-01-17T09:20:00Z',
    uploadedBy: 'Marketing Manager',
    tags: ['social-media', 'digital', 'marketing', 'icons'],
    folder: 'social-templates',
    isFavorite: false,
    description: 'Social media marketing concept with icons',
    usageCount: 5,
    lastUsed: '2024-01-16T11:45:00Z'
  },
  {
    id: '5',
    name: 'business-meeting.jpg',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1542626991-cbc4e32524cc?w=800&h=600&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1542626991-cbc4e32524cc?w=200&h=150&fit=crop',
    size: 2045678,
    dimensions: { width: 1800, height: 1200 },
    uploadedAt: '2024-01-16T14:30:00Z',
    uploadedBy: 'Content Team',
    tags: ['meeting', 'business', 'corporate', 'professional'],
    folder: 'campaigns',
    isFavorite: false,
    description: 'Professional business meeting discussion',
    usageCount: 3,
    lastUsed: '2024-01-15T16:20:00Z'
  },
  {
    id: '6',
    name: 'data-analytics.jpg',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=200&h=150&fit=crop',
    size: 1934567,
    dimensions: { width: 1080, height: 1350 },
    uploadedAt: '2024-01-15T11:15:00Z',
    uploadedBy: 'Analytics Team',
    tags: ['analytics', 'data', 'charts', 'business'],
    folder: 'campaigns',
    isFavorite: true,
    description: 'Data analytics dashboard with charts',
    usageCount: 12,
    lastUsed: '2024-01-14T13:30:00Z'
  },
  // Technology Images
  {
    id: '7',
    name: 'mobile-app-design.jpg',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&h=600&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=200&h=150&fit=crop',
    size: 1678901,
    dimensions: { width: 1200, height: 800 },
    uploadedAt: '2024-01-14T10:20:00Z',
    uploadedBy: 'UX Designer',
    tags: ['mobile', 'app', 'design', 'ui-ux'],
    folder: 'campaigns',
    isFavorite: false,
    description: 'Mobile app interface design mockup',
    usageCount: 7,
    lastUsed: '2024-01-13T15:30:00Z'
  },
  {
    id: '8',
    name: 'cloud-technology.jpg',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=600&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=200&h=150&fit=crop',
    size: 2234567,
    dimensions: { width: 1920, height: 1080 },
    uploadedAt: '2024-01-13T09:45:00Z',
    uploadedBy: 'Tech Team',
    tags: ['cloud', 'technology', 'digital', 'network'],
    folder: 'campaigns',
    isFavorite: true,
    description: 'Cloud computing technology visualization',
    usageCount: 18,
    lastUsed: '2024-01-12T11:20:00Z'
  },
  {
    id: '9',
    name: 'ai-artificial-intelligence.jpg',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=600&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=200&h=150&fit=crop',
    size: 2134890,
    dimensions: { width: 1600, height: 1067 },
    uploadedAt: '2024-01-12T14:15:00Z',
    uploadedBy: 'AI Specialist',
    tags: ['ai', 'artificial-intelligence', 'robot', 'future'],
    folder: 'campaigns',
    isFavorite: false,
    description: 'Artificial intelligence and robotics concept',
    usageCount: 9,
    lastUsed: '2024-01-11T16:45:00Z'
  },
  {
    id: '10',
    name: 'cybersecurity.jpg',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=600&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=200&h=150&fit=crop',
    size: 1987654,
    dimensions: { width: 1400, height: 933 },
    uploadedAt: '2024-01-11T13:30:00Z',
    uploadedBy: 'Security Team',
    tags: ['cybersecurity', 'security', 'lock', 'protection'],
    folder: 'campaigns',
    isFavorite: true,
    description: 'Cybersecurity protection concept',
    usageCount: 14,
    lastUsed: '2024-01-10T12:15:00Z'
  },
  // Business Images
  {
    id: '11',
    name: 'office-space.jpg',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=200&h=150&fit=crop',
    size: 2456789,
    dimensions: { width: 1920, height: 1280 },
    uploadedAt: '2024-01-10T10:00:00Z',
    uploadedBy: 'Office Manager',
    tags: ['office', 'workspace', 'modern', 'interior'],
    folder: 'campaigns',
    isFavorite: false,
    description: 'Modern office workspace interior',
    usageCount: 6,
    lastUsed: '2024-01-09T14:30:00Z'
  },
  {
    id: '12',
    name: 'handshake-partnership.jpg',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1521791055366-0d553872125f?w=800&h=600&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1521791055366-0d553872125f?w=200&h=150&fit=crop',
    size: 1789123,
    dimensions: { width: 1200, height: 800 },
    uploadedAt: '2024-01-09T15:20:00Z',
    uploadedBy: 'Business Dev',
    tags: ['handshake', 'partnership', 'business', 'agreement'],
    folder: 'campaigns',
    isFavorite: true,
    description: 'Business partnership handshake',
    usageCount: 11,
    lastUsed: '2024-01-08T16:00:00Z'
  },
  {
    id: '13',
    name: 'finance-charts.jpg',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=800&h=600&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=200&h=150&fit=crop',
    size: 2067890,
    dimensions: { width: 1600, height: 1200 },
    uploadedAt: '2024-01-08T11:45:00Z',
    uploadedBy: 'Finance Team',
    tags: ['finance', 'charts', 'graphs', 'money'],
    folder: 'campaigns',
    isFavorite: false,
    description: 'Financial charts and analysis',
    usageCount: 8,
    lastUsed: '2024-01-07T13:15:00Z'
  },
  {
    id: '14',
    name: 'entrepreneur-success.jpg',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=150&fit=crop',
    size: 1845673,
    dimensions: { width: 1400, height: 1050 },
    uploadedAt: '2024-01-07T09:30:00Z',
    uploadedBy: 'Success Coach',
    tags: ['entrepreneur', 'success', 'achievement', 'business'],
    folder: 'campaigns',
    isFavorite: true,
    description: 'Successful entrepreneur celebration',
    usageCount: 16,
    lastUsed: '2024-01-06T10:45:00Z'
  },
  // Social Media Templates
  {
    id: '15',
    name: 'instagram-story-template.jpg',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=600&h=800&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=200&h=150&fit=crop',
    size: 1567890,
    dimensions: { width: 1080, height: 1920 },
    uploadedAt: '2024-01-06T14:20:00Z',
    uploadedBy: 'Social Media Manager',
    tags: ['instagram', 'story', 'template', 'social'],
    folder: 'social-templates',
    isFavorite: false,
    description: 'Instagram story template design',
    usageCount: 23,
    lastUsed: '2024-01-05T15:30:00Z'
  },
  {
    id: '16',
    name: 'facebook-post-template.jpg',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=800&h=600&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=200&h=150&fit=crop',
    size: 1345678,
    dimensions: { width: 1200, height: 900 },
    uploadedAt: '2024-01-05T12:00:00Z',
    uploadedBy: 'Content Creator',
    tags: ['facebook', 'post', 'template', 'marketing'],
    folder: 'social-templates',
    isFavorite: true,
    description: 'Facebook post marketing template',
    usageCount: 19,
    lastUsed: '2024-01-04T11:20:00Z'
  },
  {
    id: '17',
    name: 'linkedin-banner.jpg',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1486312338219-ce68e2c6f44d?w=800&h=400&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1486312338219-ce68e2c6f44d?w=200&h=150&fit=crop',
    size: 1876543,
    dimensions: { width: 1584, height: 396 },
    uploadedAt: '2024-01-04T16:15:00Z',
    uploadedBy: 'Professional Network',
    tags: ['linkedin', 'banner', 'professional', 'network'],
    folder: 'social-templates',
    isFavorite: false,
    description: 'LinkedIn professional banner template',
    usageCount: 12,
    lastUsed: '2024-01-03T09:45:00Z'
  },
  // Logos and Branding
  {
    id: '18',
    name: 'company-logo.svg',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1549924231-f129b911e442?w=400&h=400&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1549924231-f129b911e442?w=200&h=150&fit=crop',
    size: 89012,
    dimensions: { width: 512, height: 512 },
    uploadedAt: '2024-01-03T10:30:00Z',
    uploadedBy: 'Brand Designer',
    tags: ['logo', 'branding', 'vector', 'identity'],
    folder: 'logos',
    isFavorite: true,
    description: 'Official company logo design',
    usageCount: 45,
    lastUsed: '2024-01-02T14:20:00Z'
  },
  {
    id: '19',
    name: 'brand-colors.jpg',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&h=600&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=200&h=150&fit=crop',
    size: 1234567,
    dimensions: { width: 1200, height: 900 },
    uploadedAt: '2024-01-02T13:45:00Z',
    uploadedBy: 'Brand Manager',
    tags: ['colors', 'palette', 'branding', 'design'],
    folder: 'logos',
    isFavorite: false,
    description: 'Brand color palette reference',
    usageCount: 28,
    lastUsed: '2024-01-01T16:30:00Z'
  },
  {
    id: '20',
    name: 'typography-guide.jpg',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=800&h=600&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=200&h=150&fit=crop',
    size: 1567234,
    dimensions: { width: 1400, height: 1050 },
    uploadedAt: '2024-01-01T09:00:00Z',
    uploadedBy: 'Typography Expert',
    tags: ['typography', 'fonts', 'text', 'design'],
    folder: 'logos',
    isFavorite: true,
    description: 'Brand typography and font guide',
    usageCount: 34,
    lastUsed: '2023-12-31T11:15:00Z'
  },
  // Additional Demo Files
  {
    id: '21',
    name: 'product-showcase.jpg',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=600&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&h=150&fit=crop',
    size: 2145678,
    dimensions: { width: 1600, height: 1200 },
    uploadedAt: '2023-12-30T15:30:00Z',
    uploadedBy: 'Product Team',
    tags: ['product', 'showcase', 'demo', 'feature'],
    folder: 'campaigns',
    isFavorite: false,
    description: 'Product feature showcase image',
    usageCount: 7,
    lastUsed: '2023-12-29T10:20:00Z'
  },
  {
    id: '22',
    name: 'team-collaboration.jpg',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&h=600&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=200&h=150&fit=crop',
    size: 1987654,
    dimensions: { width: 1500, height: 1000 },
    uploadedAt: '2023-12-29T12:15:00Z',
    uploadedBy: 'Team Lead',
    tags: ['team', 'collaboration', 'work', 'group'],
    folder: 'campaigns',
    isFavorite: true,
    description: 'Team collaboration and teamwork',
    usageCount: 13,
    lastUsed: '2023-12-28T14:45:00Z'
  },
  {
    id: '23',
    name: 'digital-marketing.jpg',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=200&h=150&fit=crop',
    size: 2234567,
    dimensions: { width: 1920, height: 1280 },
    uploadedAt: '2023-12-28T08:45:00Z',
    uploadedBy: 'Digital Marketer',
    tags: ['digital', 'marketing', 'analytics', 'growth'],
    folder: 'campaigns',
    isFavorite: false,
    description: 'Digital marketing analytics dashboard',
    usageCount: 21,
    lastUsed: '2023-12-27T16:30:00Z'
  },
  {
    id: '24',
    name: 'innovation-concept.jpg',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1553775282-20af80779df7?w=800&h=600&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1553775282-20af80779df7?w=200&h=150&fit=crop',
    size: 1876543,
    dimensions: { width: 1400, height: 933 },
    uploadedAt: '2023-12-27T11:20:00Z',
    uploadedBy: 'Innovation Team',
    tags: ['innovation', 'ideas', 'creativity', 'lightbulb'],
    folder: 'campaigns',
    isFavorite: true,
    description: 'Innovation and creative ideas concept',
    usageCount: 15,
    lastUsed: '2023-12-26T13:00:00Z'
  },
  // Video and Audio Files
  {
    id: '25',
    name: 'product-demo-video.mp4',
    type: 'video',
    url: '/api/placeholder/video',
    thumbnail: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=200&h=150&fit=crop',
    size: 45678901,
    dimensions: { width: 1920, height: 1080 },
    uploadedAt: '2023-12-26T09:30:00Z',
    uploadedBy: 'Video Producer',
    tags: ['product', 'demo', 'video', 'presentation'],
    folder: 'campaigns',
    isFavorite: false,
    description: 'Product demonstration video for social media',
    usageCount: 8,
    lastUsed: '2023-12-25T11:15:00Z'
  },
  {
    id: '26',
    name: 'background-music.mp3',
    type: 'audio',
    url: '/api/placeholder/audio',
    size: 3456789,
    uploadedAt: '2023-12-25T14:00:00Z',
    uploadedBy: 'Audio Producer',
    tags: ['music', 'background', 'audio', 'soundtrack'],
    folder: 'campaigns',
    isFavorite: false,
    description: 'Background music for video content',
    usageCount: 3,
    lastUsed: '2023-12-24T16:20:00Z'
  }
];

const fileTypeIcons = {
  image: <FileImage className="h-5 w-5 text-blue-500" />,
  video: <FileVideo className="h-5 w-5 text-red-500" />,
  audio: <FileAudio className="h-5 w-5 text-green-500" />,
  document: <FileText className="h-5 w-5 text-orange-500" />
};

export default function MediaLibraryPage() {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>(mockMediaFiles);
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'usage'>('date');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video' | 'audio' | 'document'>('all');
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredFiles = mediaFiles
    .filter(file => {
      const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           file.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesFolder = selectedFolder === 'all' ||
                           selectedFolder === 'recent' && new Date(file.uploadedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) ||
                           selectedFolder === 'favorites' && file.isFavorite ||
                           file.folder === selectedFolder;
      const matchesType = filterType === 'all' || file.type === filterType;

      return matchesSearch && matchesFolder && matchesType;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'size':
          return b.size - a.size;
        case 'usage':
          return b.usageCount - a.usageCount;
        case 'date':
        default:
          return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
      }
    });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    // In a real app, this would upload files to the server
    Array.from(files).forEach(file => {
      const newMediaFile: MediaFile = {
        id: Date.now().toString() + Math.random(),
        name: file.name,
        type: file.type.startsWith('image/') ? 'image' :
              file.type.startsWith('video/') ? 'video' :
              file.type.startsWith('audio/') ? 'audio' : 'document',
        url: URL.createObjectURL(file),
        thumbnail: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        uploadedBy: 'Current User',
        tags: [],
        folder: selectedFolder === 'all' ? 'recent' : selectedFolder,
        isFavorite: false,
        usageCount: 0
      };

      setMediaFiles(prev => [newMediaFile, ...prev]);
    });

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleToggleFavorite = (fileId: string) => {
    setMediaFiles(prev => prev.map(file =>
      file.id === fileId ? { ...file, isFavorite: !file.isFavorite } : file
    ));
  };

  const handleDeleteFile = (fileId: string) => {
    setMediaFiles(prev => prev.filter(file => file.id !== fileId));
    setSelectedFiles(prev => prev.filter(id => id !== fileId));
  };

  const handleSelectFile = (fileId: string) => {
    setSelectedFiles(prev =>
      prev.includes(fileId)
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const getSelectedFolder = () => {
    return mockFolders.find(folder => folder.id === selectedFolder) || mockFolders[0];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Media Library</h1>
          <p className="text-muted-foreground">
            Manage all your media assets in one centralized location
          </p>
        </div>
        <div className="flex space-x-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.psd,.ai"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button variant="outline">
            <FolderPlus className="h-4 w-4 mr-2" />
            New Folder
          </Button>
          <Button onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Files
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search files, tags, or descriptions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex space-x-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="File Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="image">Images</SelectItem>
              <SelectItem value="video">Videos</SelectItem>
              <SelectItem value="audio">Audio</SelectItem>
              <SelectItem value="document">Documents</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date Added</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="size">File Size</SelectItem>
              <SelectItem value="usage">Usage Count</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Folders Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Folders</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {mockFolders.map((folder) => (
                <div
                  key={folder.id}
                  className={`flex items-center justify-between p-2 rounded cursor-pointer hover:bg-accent ${
                    selectedFolder === folder.id ? 'bg-accent' : ''
                  }`}
                  onClick={() => setSelectedFolder(folder.id)}
                >
                  <div className="flex items-center space-x-2">
                    <Folder className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">{folder.name}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {folder.itemCount}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Selected Files Actions */}
          {selectedFiles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {selectedFiles.length} Selected
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button variant="outline" className="w-full" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <Button variant="outline" className="w-full" size="sm">
                  <Folder className="h-4 w-4 mr-2" />
                  Move to Folder
                </Button>
                <Button variant="destructive" className="w-full" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Media Files */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">{getSelectedFolder().name}</h2>
            <span className="text-sm text-muted-foreground">
              {filteredFiles.length} items
            </span>
          </div>

          {filteredFiles.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No files found</p>
                <Button onClick={() => fileInputRef.current?.click()}>
                  Upload your first file
                </Button>
              </CardContent>
            </Card>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredFiles.map((file) => (
                <Card
                  key={file.id}
                  className={`cursor-pointer hover:shadow-md transition-shadow ${
                    selectedFiles.includes(file.id) ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => handleSelectFile(file.id)}
                >
                  <CardContent className="p-4">
                    <div className="relative mb-3">
                      {file.thumbnail ? (
                        <img
                          src={file.thumbnail}
                          alt={file.name}
                          className="w-full h-32 object-cover rounded"
                        />
                      ) : (
                        <div className="w-full h-32 bg-muted rounded flex items-center justify-center">
                          {fileTypeIcons[file.type]}
                        </div>
                      )}
                      <div className="absolute top-2 right-2 flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 bg-black/50 hover:bg-black/70"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleFavorite(file.id);
                          }}
                        >
                          <Star className={`h-3 w-3 ${file.isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-white'}`} />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 bg-black/50 hover:bg-black/70"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-3 w-3 text-white" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => setSelectedFile(file)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Copy className="h-4 w-4 mr-2" />
                              Copy URL
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDeleteFile(file.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="font-medium text-sm truncate" title={file.name}>
                        {file.name}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{formatFileSize(file.size)}</span>
                        <span>{formatDate(file.uploadedAt)}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {file.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {file.tags.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{file.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredFiles.map((file) => (
                <Card
                  key={file.id}
                  className={`cursor-pointer hover:shadow-sm transition-shadow ${
                    selectedFiles.includes(file.id) ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => handleSelectFile(file.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {file.thumbnail ? (
                          <img
                            src={file.thumbnail}
                            alt={file.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                            {fileTypeIcons[file.type]}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="font-medium truncate">{file.name}</p>
                          {file.isFavorite && (
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>{formatFileSize(file.size)}</span>
                          {file.dimensions && (
                            <span>{file.dimensions.width} × {file.dimensions.height}</span>
                          )}
                          <span className="flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            {file.uploadedBy}
                          </span>
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(file.uploadedAt)}
                          </span>
                          <span className="flex items-center">
                            <Eye className="h-3 w-3 mr-1" />
                            {file.usageCount} uses
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {file.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex-shrink-0">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => setSelectedFile(file)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Copy className="h-4 w-4 mr-2" />
                              Copy URL
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDeleteFile(file.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* File Details Dialog */}
      <Dialog open={selectedFile !== null} onOpenChange={() => setSelectedFile(null)}>
        <DialogContent className="max-w-4xl">
          {selectedFile && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedFile.name}</DialogTitle>
                <DialogDescription>File details and information</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  {selectedFile.thumbnail ? (
                    <img
                      src={selectedFile.url}
                      alt={selectedFile.name}
                      className="w-full rounded-lg border"
                    />
                  ) : (
                    <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center">
                      {fileTypeIcons[selectedFile.type]}
                      <span className="ml-2">{selectedFile.name}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">File Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Size:</span>
                        <span>{formatFileSize(selectedFile.size)}</span>
                      </div>
                      {selectedFile.dimensions && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Dimensions:</span>
                          <span>{selectedFile.dimensions.width} × {selectedFile.dimensions.height}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Uploaded:</span>
                        <span>{formatDate(selectedFile.uploadedAt)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Uploaded by:</span>
                        <span>{selectedFile.uploadedBy}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Usage count:</span>
                        <span>{selectedFile.usageCount}</span>
                      </div>
                      {selectedFile.lastUsed && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Last used:</span>
                          <span>{formatDate(selectedFile.lastUsed)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedFile.description && (
                    <div>
                      <h4 className="font-medium mb-2">Description</h4>
                      <p className="text-sm text-muted-foreground">{selectedFile.description}</p>
                    </div>
                  )}

                  <div>
                    <h4 className="font-medium mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedFile.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex space-x-2 pt-4">
                    <Button>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button variant="outline">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                    <Button variant="outline">
                      <Copy className="h-4 w-4 mr-2" />
                      Copy URL
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}