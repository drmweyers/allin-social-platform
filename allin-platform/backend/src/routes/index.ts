import { Router } from 'express';
import authRoutes from './auth.routes';
import healthRoutes from './health.routes';
// Temporarily disabled routes due to TypeScript errors - enabling only essential ones
import aiRoutes from './ai.routes';
// import aiSupportRoutes from './ai-support.routes';
// import aiChatRoutes from './ai-chat.routes';
// import inboxRoutes from './inbox.routes';
// import mediaRoutes from './media.routes';
// import teamRoutes from './team.routes';
// import settingsRoutes from './settings.routes';
// import socialRoutes from './social.routes';
// import scheduleRoutes from './schedule.routes';
// import analyticsRoutes from './analytics.routes';
// import workflowRoutes from './workflow.routes';
// import collaborationRoutes from './collaboration.routes';
// import draftRoutes from './draft.routes';
// import { mcpRoutes } from './mcp.routes';

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
      media: '/api/media',
      team: '/api/team',
      settings: '/api/settings',
      'ai-support': '/api/ai',
      users: '/api/users',
      posts: '/api/posts',
      analytics: '/api/analytics',
    },
  });
});

// API Route modules
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/ai', aiRoutes); // Re-enabled after fixing TypeScript errors
// router.use('/ai-support', aiSupportRoutes); // Temporarily disabled
// router.use('/ai-chat', aiChatRoutes); // Temporarily disabled
// router.use('/inbox', inboxRoutes); // Temporarily disabled
// router.use('/media', mediaRoutes); // Temporarily disabled
// router.use('/team', teamRoutes); // Temporarily disabled
// router.use('/settings', settingsRoutes); // Temporarily disabled
// router.use('/social', socialRoutes); // Temporarily disabled
// router.use('/schedule', scheduleRoutes); // Temporarily disabled
// router.use('/analytics', analyticsRoutes); // Temporarily disabled
// router.use('/workflow', workflowRoutes); // Temporarily disabled
// router.use('/collaboration', collaborationRoutes); // Temporarily disabled
// router.use('/draft', draftRoutes); // Temporarily disabled
// router.use('/mcp', mcpRoutes); // Temporarily disabled

export default router;