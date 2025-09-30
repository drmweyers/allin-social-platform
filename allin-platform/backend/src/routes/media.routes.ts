import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { requireAuth } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'media');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|svg|mp4|avi|mov|mp3|wav|pdf|doc|docx|psd|ai/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Validation schemas
const mediaQuerySchema = z.object({
  type: z.enum(['image', 'video', 'audio', 'document', 'all']).optional(),
  folder: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['name', 'date', 'size', 'usage']).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  offset: z.string().regex(/^\d+$/).transform(Number).optional()
});

const updateMediaSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  folder: z.string().optional(),
  isFavorite: z.boolean().optional()
});

const createFolderSchema = z.object({
  name: z.string().min(1, 'Folder name is required'),
  parentId: z.string().optional()
});

// Mock data for development
const mockFolders = [
  { id: 'all', name: 'All Media', itemCount: 24, createdAt: '2024-01-01', userId: 'user1' },
  { id: 'recent', name: 'Recently Added', itemCount: 8, createdAt: '2024-01-15', userId: 'user1' },
  { id: 'favorites', name: 'Favorites', itemCount: 6, createdAt: '2024-01-10', userId: 'user1' },
  { id: 'campaigns', name: 'Campaign Assets', itemCount: 12, createdAt: '2024-01-05', userId: 'user1' },
  { id: 'logos', name: 'Logos & Branding', itemCount: 4, createdAt: '2024-01-03', userId: 'user1' },
  { id: 'social-templates', name: 'Social Templates', itemCount: 8, createdAt: '2024-01-08', userId: 'user1' }
];

const mockMediaFiles = [
  {
    id: '1',
    name: 'hero-banner-2024.jpg',
    type: 'image',
    url: '/uploads/media/hero-banner-2024.jpg',
    thumbnail: '/uploads/media/thumbnails/hero-banner-2024_thumb.jpg',
    size: 2567890,
    dimensions: { width: 1920, height: 1080 },
    uploadedAt: '2024-01-20T10:30:00Z',
    uploadedBy: 'John Doe',
    tags: ['banner', 'hero', 'marketing'],
    folder: 'campaigns',
    isFavorite: true,
    description: 'Main hero banner for 2024 campaign',
    usageCount: 15,
    lastUsed: '2024-01-19T14:20:00Z',
    userId: 'user1'
  },
  {
    id: '2',
    name: 'product-demo-video.mp4',
    type: 'video',
    url: '/uploads/media/product-demo-video.mp4',
    thumbnail: '/uploads/media/thumbnails/product-demo-video_thumb.jpg',
    size: 45678901,
    dimensions: { width: 1920, height: 1080 },
    uploadedAt: '2024-01-19T15:45:00Z',
    uploadedBy: 'Sarah Wilson',
    tags: ['product', 'demo', 'video'],
    folder: 'campaigns',
    isFavorite: false,
    description: 'Product demonstration video for social media',
    usageCount: 8,
    lastUsed: '2024-01-18T09:30:00Z',
    userId: 'user1'
  },
  {
    id: '3',
    name: 'company-logo.svg',
    type: 'image',
    url: '/uploads/media/company-logo.svg',
    size: 89012,
    uploadedAt: '2024-01-18T12:00:00Z',
    uploadedBy: 'Design Team',
    tags: ['logo', 'branding', 'vector'],
    folder: 'logos',
    isFavorite: true,
    description: 'Official company logo in SVG format',
    usageCount: 32,
    lastUsed: '2024-01-20T08:15:00Z',
    userId: 'user1'
  }
];

/**
 * @route GET /api/media/files
 * @desc Get media files with filtering and pagination
 * @access Private
 */
router.get('/files', requireAuth, validateRequest(mediaQuerySchema, 'query'), async (req, res) => {
  try {
    const { type, folder, search, sortBy = 'date', limit = 50, offset = 0 } = req.query;
    const userId = req.user?.id;

    let filteredFiles = mockMediaFiles.filter(file => file.userId === userId);

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
      const searchLower = search.toLowerCase();
      filteredFiles = filteredFiles.filter(file =>
        file.name.toLowerCase().includes(searchLower) ||
        file.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
        (file.description && file.description.toLowerCase().includes(searchLower))
      );
    }

    // Apply sorting
    filteredFiles.sort((a, b) => {
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

    // Apply pagination
    const paginatedFiles = filteredFiles.slice(offset, offset + limit);

    res.json({
      success: true,
      data: {
        files: paginatedFiles,
        pagination: {
          total: filteredFiles.length,
          limit,
          offset,
          hasMore: offset + limit < filteredFiles.length
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
 * @route POST /api/media/upload
 * @desc Upload media files
 * @access Private
 */
router.post('/upload', requireAuth, upload.array('files', 10), async (req, res) => {
  try {
    const userId = req.user?.id;
    const { folder = 'recent', tags = '[]', description = '' } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const uploadedFiles = [];

    for (const file of files) {
      const fileType = file.mimetype.startsWith('image/') ? 'image' :
                      file.mimetype.startsWith('video/') ? 'video' :
                      file.mimetype.startsWith('audio/') ? 'audio' : 'document';

      const newFile = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: file.originalname,
        type: fileType,
        url: `/uploads/media/${file.filename}`,
        thumbnail: fileType === 'image' ? `/uploads/media/${file.filename}` : undefined,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        uploadedBy: req.user?.name || 'Unknown',
        tags: JSON.parse(tags),
        folder,
        isFavorite: false,
        description,
        usageCount: 0,
        userId
      };

      // Add to mock data
      mockMediaFiles.push(newFile);
      uploadedFiles.push(newFile);
    }

    res.json({
      success: true,
      data: uploadedFiles,
      message: `${uploadedFiles.length} file(s) uploaded successfully`
    });
  } catch (error) {
    console.error('Error uploading files:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload files'
    });
  }
});

/**
 * @route GET /api/media/files/:id
 * @desc Get a specific media file
 * @access Private
 */
router.get('/files/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const file = mockMediaFiles.find(f => f.id === id && f.userId === userId);

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    res.json({
      success: true,
      data: file
    });
  } catch (error) {
    console.error('Error fetching file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch file'
    });
  }
});

/**
 * @route PATCH /api/media/files/:id
 * @desc Update media file metadata
 * @access Private
 */
router.patch('/files/:id', requireAuth, validateRequest(updateMediaSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const updates = req.body;

    const fileIndex = mockMediaFiles.findIndex(f => f.id === id && f.userId === userId);

    if (fileIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Update file properties
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        mockMediaFiles[fileIndex][key] = updates[key];
      }
    });

    res.json({
      success: true,
      data: mockMediaFiles[fileIndex],
      message: 'File updated successfully'
    });
  } catch (error) {
    console.error('Error updating file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update file'
    });
  }
});

/**
 * @route DELETE /api/media/files/:id
 * @desc Delete a media file
 * @access Private
 */
router.delete('/files/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const fileIndex = mockMediaFiles.findIndex(f => f.id === id && f.userId === userId);

    if (fileIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    const file = mockMediaFiles[fileIndex];

    // In a real implementation, delete the actual file from storage
    try {
      const filePath = path.join(process.cwd(), file.url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (fsError) {
      console.warn('Could not delete physical file:', fsError);
    }

    // Remove from mock data
    mockMediaFiles.splice(fileIndex, 1);

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete file'
    });
  }
});

/**
 * @route GET /api/media/folders
 * @desc Get all folders
 * @access Private
 */
router.get('/folders', requireAuth, async (req, res) => {
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
 * @route POST /api/media/folders
 * @desc Create a new folder
 * @access Private
 */
router.post('/folders', requireAuth, validateRequest(createFolderSchema), async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user?.id;

    const newFolder = {
      id: Date.now().toString(),
      name,
      itemCount: 0,
      createdAt: new Date().toISOString(),
      userId
    };

    mockFolders.push(newFolder);

    res.json({
      success: true,
      data: newFolder,
      message: 'Folder created successfully'
    });
  } catch (error) {
    console.error('Error creating folder:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create folder'
    });
  }
});

/**
 * @route GET /api/media/stats
 * @desc Get media library statistics
 * @access Private
 */
router.get('/stats', requireAuth, async (req, res) => {
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

/**
 * @route POST /api/media/files/bulk-action
 * @desc Perform bulk actions on multiple files
 * @access Private
 */
router.post('/files/bulk-action', requireAuth, async (req, res) => {
  try {
    const { fileIds, action, data } = req.body;
    const userId = req.user?.id;

    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'File IDs array is required'
      });
    }

    let updatedCount = 0;

    switch (action) {
      case 'delete':
        for (const fileId of fileIds) {
          const fileIndex = mockMediaFiles.findIndex(f => f.id === fileId && f.userId === userId);
          if (fileIndex !== -1) {
            mockMediaFiles.splice(fileIndex, 1);
            updatedCount++;
          }
        }
        break;

      case 'move':
        if (!data.folder) {
          return res.status(400).json({
            success: false,
            message: 'Target folder is required for move action'
          });
        }
        for (const fileId of fileIds) {
          const fileIndex = mockMediaFiles.findIndex(f => f.id === fileId && f.userId === userId);
          if (fileIndex !== -1) {
            mockMediaFiles[fileIndex].folder = data.folder;
            updatedCount++;
          }
        }
        break;

      case 'favorite':
        for (const fileId of fileIds) {
          const fileIndex = mockMediaFiles.findIndex(f => f.id === fileId && f.userId === userId);
          if (fileIndex !== -1) {
            mockMediaFiles[fileIndex].isFavorite = data.isFavorite !== false;
            updatedCount++;
          }
        }
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action'
        });
    }

    res.json({
      success: true,
      data: { updatedCount },
      message: `${action} action completed on ${updatedCount} files`
    });
  } catch (error) {
    console.error('Error performing bulk action:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform bulk action'
    });
  }
});

export default router;