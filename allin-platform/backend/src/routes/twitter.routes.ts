import { Router } from 'express';
import { twitterController } from '../controllers/twitter.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

// All Twitter routes require authentication
router.use(requireAuth);

// OAuth Authentication routes
router.get('/auth/url', (req, res) => twitterController.getAuthUrl(req, res));
router.post('/auth/callback', (req, res) => twitterController.completeAuth(req, res));
router.post('/auth/refresh', (req, res) => twitterController.refreshToken(req, res));

// User profile management
router.get('/user/me', (req, res) => twitterController.getProfile(req, res));

// Tweet management routes
router.get('/tweets', (req, res) => twitterController.getTweets(req, res));
router.post('/tweets', (req, res) => twitterController.createTweet(req, res));
router.get('/tweets/:id', (req, res) => twitterController.getTweetDetails(req, res));
router.delete('/tweets/:id', (req, res) => twitterController.deleteTweet(req, res));

// Search functionality
router.get('/search', (req, res) => twitterController.searchTweets(req, res));

// Social interactions
router.get('/followers', (req, res) => twitterController.getFollowers(req, res));
router.get('/following', (req, res) => twitterController.getFollowing(req, res));
router.post('/follow/:userId', (req, res) => twitterController.followUser(req, res));
router.delete('/follow/:userId', (req, res) => twitterController.unfollowUser(req, res));

// Tweet interactions
router.post('/likes/:tweetId', (req, res) => twitterController.likeTweet(req, res));
router.delete('/likes/:tweetId', (req, res) => twitterController.unlikeTweet(req, res));
router.post('/retweets/:tweetId', (req, res) => twitterController.retweet(req, res));
router.delete('/retweets/:tweetId', (req, res) => twitterController.unretweet(req, res));

export default router;