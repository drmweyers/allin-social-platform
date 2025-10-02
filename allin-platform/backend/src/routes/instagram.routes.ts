import { Router } from 'express';
import InstagramController from '../controllers/instagram.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();
const instagramController = new InstagramController();

// All Instagram routes require authentication
router.use(requireAuth);

// OAuth Authentication routes
router.get('/auth/url', (req, res) => instagramController.getAuthUrl(req, res));
router.post('/auth/callback', (req, res) => instagramController.completeAuth(req, res));
router.post('/refresh-token', (req, res) => instagramController.refreshToken(req, res));
router.get('/connection-status', (req, res) => instagramController.getConnectionStatus(req, res));

// Account management
router.get('/account', (req, res) => instagramController.getAccount(req, res));

// Media management routes
router.get('/media', (req, res) => instagramController.getMedia(req, res));
router.post('/post', (req, res) => instagramController.createPost(req, res));
router.get('/media/:mediaId', (req, res) => instagramController.getMediaDetails(req, res));

// Analytics and insights
router.get('/media/:mediaId/insights', (req, res) => instagramController.getMediaInsights(req, res));
router.get('/insights', (req, res) => instagramController.getAccountInsights(req, res));

// Comment management
router.get('/media/:mediaId/comments', (req, res) => instagramController.getMediaComments(req, res));
router.post('/comments/:commentId/reply', (req, res) => instagramController.replyToComment(req, res));
router.delete('/comments/:commentId', (req, res) => instagramController.deleteComment(req, res));

// Hashtag features
router.get('/hashtags/search', (req, res) => instagramController.searchHashtags(req, res));
router.get('/hashtags/:hashtagId/insights', (req, res) => instagramController.getHashtagInsights(req, res));

export default router;