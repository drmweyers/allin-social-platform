import { Router } from 'express';
import authRoutes from './auth.routes';
import healthRoutes from './health.routes';
import aiRoutes from './ai.routes';
import inboxRoutes from './inbox.routes';
import socialRoutes from './social.routes';
import analyticsRoutes from './analytics.routes';
import mediaRoutes from './media-simple.routes';
import instagramRoutes from './instagram.routes';

const router = Router();

// API Welcome
router.get('/', (_req, res) => {
  res.json({
    message: 'AllIN Platform API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      inbox: '/api/inbox',
      social: '/api/social',
      analytics: '/api/analytics',
      media: '/api/media',
      ai: '/api/ai',
      instagram: '/api/instagram',
    },
  });
});

// API Route modules - Core operational routes
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/ai', aiRoutes);
router.use('/inbox', inboxRoutes);
router.use('/social', socialRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/media', mediaRoutes);
router.use('/instagram', instagramRoutes);

// TODO: Additional routes to be enabled after core API stabilization:
// - AI Support routes (RAG system)
// - AI Chat routes (conversation management)
// - Media routes (file management)
// - Team routes (collaboration)
// - Settings routes (configuration)
// - Workflow routes (automation)
// - Collaboration routes (team features)

export default router;