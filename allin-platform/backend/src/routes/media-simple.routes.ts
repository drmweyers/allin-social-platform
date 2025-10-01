import express from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Mock data for development
let mockMediaFiles = [
  {
    id: '1',
    name: 'hero-banner-2024.jpg',
    type: 'image',
    url: '/uploads/media/hero-banner-2024.jpg',
    size: 2567890,
    uploadedAt: '2024-01-20T10:30:00Z',
    uploadedBy: 'John Doe',
    tags: ['banner', 'hero', 'marketing'],
    folder: 'campaigns',
    isFavorite: true,
    description: 'Main hero banner for 2024 campaign',
    usageCount: 15,
    lastUsed: '2024-01-19T14:20:00Z',
    userId: 'admin1'
  },
  {
    id: '2',
    name: 'product-demo-video.mp4',
    type: 'video',
    url: '/uploads/media/product-demo-video.mp4',
    size: 45678901,
    uploadedAt: '2024-01-19T15:45:00Z',
    uploadedBy: 'Sarah Wilson',
    tags: ['product', 'demo', 'video'],
    folder: 'campaigns',
    isFavorite: false,
    description: 'Product demonstration video for social media',
    usageCount: 8,
    lastUsed: '2024-01-18T09:30:00Z',
    userId: 'admin1'
  }
];

const mockFolders = [
  { id: 'all', name: 'All Media', itemCount: 24, createdAt: '2024-01-01', userId: 'admin1' },
  { id: 'recent', name: 'Recently Added', itemCount: 8, createdAt: '2024-01-15', userId: 'admin1' },
  { id: 'favorites', name: 'Favorites', itemCount: 6, createdAt: '2024-01-10', userId: 'admin1' },
  { id: 'campaigns', name: 'Campaign Assets', itemCount: 12, createdAt: '2024-01-05', userId: 'admin1' }
];

/**
 * @route GET /api/media/files
 * @desc Get media files with filtering and pagination
 * @access Private
 */
router.get('/files', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    let filteredFiles = mockMediaFiles.filter(file => file.userId === userId);

    const { type, folder, search, limit = '50', offset = '0' } = req.query;

    // Apply filters
    if (type && type !== 'all') {
      filteredFiles = filteredFiles.filter(file => file.type === type);
    }

    if (folder && folder !== 'all') {
      if (folder === 'recent') {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        filteredFiles = filteredFiles.filter(file => new Date(file.uploadedAt) > weekAgo);
      } else if (folder === 'favorites') {
        filteredFiles = filteredFiles.filter(file => file.isFavorite);
      } else {
        filteredFiles = filteredFiles.filter(file => file.folder === folder);
      }
    }

    if (search) {
      const searchLower = (search as string).toLowerCase();
      filteredFiles = filteredFiles.filter(file =>
        file.name.toLowerCase().includes(searchLower) ||
        file.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
        (file.description && file.description.toLowerCase().includes(searchLower))
      );
    }

    // Apply pagination
    const limitNum = parseInt(limit as string, 10);
    const offsetNum = parseInt(offset as string, 10);
    const paginatedFiles = filteredFiles.slice(offsetNum, offsetNum + limitNum);

    res.json({
      success: true,
      data: {
        files: paginatedFiles,
        pagination: {
          total: filteredFiles.length,
          limit: limitNum,
          offset: offsetNum,
          hasMore: offsetNum + limitNum < filteredFiles.length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching media files:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch media files'
    });
  }
});

/**
 * @route GET /api/media/folders
 * @desc Get all folders
 * @access Private
 */
router.get('/folders', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const userFolders = mockFolders.filter(folder => folder.userId === userId);

    // Update item counts
    const foldersWithCounts = userFolders.map(folder => {
      let itemCount = 0;

      if (folder.id === 'all') {
        itemCount = mockMediaFiles.filter(f => f.userId === userId).length;
      } else if (folder.id === 'recent') {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        itemCount = mockMediaFiles.filter(f => f.userId === userId && new Date(f.uploadedAt) > weekAgo).length;
      } else if (folder.id === 'favorites') {
        itemCount = mockMediaFiles.filter(f => f.userId === userId && f.isFavorite).length;
      } else {
        itemCount = mockMediaFiles.filter(f => f.userId === userId && f.folder === folder.id).length;
      }

      return { ...folder, itemCount };
    });

    res.json({
      success: true,
      data: foldersWithCounts
    });
  } catch (error) {
    console.error('Error fetching folders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch folders'
    });
  }
});

/**
 * @route GET /api/media/stats
 * @desc Get media library statistics
 * @access Private
 */
router.get('/stats', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const userFiles = mockMediaFiles.filter(f => f.userId === userId);

    const stats = {
      totalFiles: userFiles.length,
      totalSize: userFiles.reduce((acc, file) => acc + file.size, 0),
      byType: {
        image: userFiles.filter(f => f.type === 'image').length,
        video: userFiles.filter(f => f.type === 'video').length,
        audio: userFiles.filter(f => f.type === 'audio').length,
        document: userFiles.filter(f => f.type === 'document').length
      },
      favorites: userFiles.filter(f => f.isFavorite).length,
      recentUploads: userFiles.filter(f => {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return new Date(f.uploadedAt) > weekAgo;
      }).length
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching media stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch media statistics'
    });
  }
});

export default router;