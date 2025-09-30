import { Router } from 'express';
import authRoutes from './auth.routes';
import healthRoutes from './health.routes';
import aiRoutes from './ai.routes';
// Temporarily disable problematic routes while fixing TypeScript issues
// import socialRoutes from './social.routes';
// import scheduleRoutes from './schedule.routes';
// import analyticsRoutes from './analytics.routes';
// Re-enable these routes one by one after testing
// import aiSupportRoutes from './ai-support.routes';
// import aiChatRoutes from './ai-chat.routes';
// import inboxRoutes from './inbox.routes';
// import mediaRoutes from './media.routes';
// import teamRoutes from './team.routes';
// import settingsRoutes from './settings.routes';
// import workflowRoutes from './workflow.routes';
// import collaborationRoutes from './collaboration.routes';
// import draftRoutes from './draft.routes'; // Keep this disabled for now
// import { mcpRoutes } from './mcp.routes'; // Keep this disabled for now

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

// API Route modules - Basic working routes only
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/ai', aiRoutes);

// TODO: Re-enable routes after fixing TypeScript issues:
// - Social routes (OAuth integration)
// - Schedule routes (post scheduling)
// - Analytics routes (reporting)
// - AI Support routes (RAG system)
// - Media routes (file management)
// - Team routes (collaboration)
// - Settings routes (configuration)

export default router;