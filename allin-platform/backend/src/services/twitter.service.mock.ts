// Mock Twitter Service for testing
export const twitterService = {
  generateAuthUrl: jest.fn(),
  exchangeCodeForToken: jest.fn(),
  refreshAccessToken: jest.fn(),
  getMe: jest.fn(),
  getTweets: jest.fn(),
  postTweet: jest.fn(),
  postThread: jest.fn(),
  deleteTweet: jest.fn(),
  likeTweet: jest.fn(),
  unlikeTweet: jest.fn(),
  retweet: jest.fn(),
  unretweet: jest.fn(),
  getConnectionStatus: jest.fn(() => Promise.resolve({ connected: false })),
  getTweetAnalytics: jest.fn(),
  getTimeline: jest.fn(),
  searchTweets: jest.fn(),
  getFollowers: jest.fn(),
  getFollowing: jest.fn(),
  followUser: jest.fn(),
  unfollowUser: jest.fn(),
};

export type TwitterPostRequest = {
  text: string;
  mediaUrls?: string[];
  thread?: string[];
};