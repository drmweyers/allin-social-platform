import { Router } from 'express';
import authRoutes from './auth.routes';
import socialRoutes from './social.routes';
import aiRoutes from './ai.routes';
import draftRoutes from './draft.routes';

const router = Router();

// API Welcome
router.get('/', (_req, res) => {
  res.json({
    message: 'AllIN Platform API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      users: '/api/users',
      posts: '/api/posts',
      analytics: '/api/analytics',
    },
  });
});

// Route modules
router.use('/auth', authRoutes);
router.use('/social', socialRoutes);
router.use('/ai', aiRoutes);
router.use('/content', draftRoutes);
// router.use('/users', userRoutes);
// router.use('/posts', postRoutes);
// router.use('/analytics', analyticsRoutes);

export default router;