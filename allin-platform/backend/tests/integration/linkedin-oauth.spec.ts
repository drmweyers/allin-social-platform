import request from 'supertest';
import { PrismaClient, SocialPlatform } from '@prisma/client';
import { createTestApp } from '../utils/test-app';
import { createTestUser, getAuthToken } from '../utils/test-helpers';
import { LinkedInOAuthService } from '../../src/services/oauth/linkedin.oauth';

const prisma = new PrismaClient();

describe('LinkedIn OAuth Integration', () => {
  let app: any;
  let testUser: any;
  let authToken: string;
  let linkedinService: LinkedInOAuthService;

  beforeAll(async () => {
    app = await createTestApp();
    testUser = await createTestUser();
    authToken = getAuthToken(testUser.id);
    linkedinService = new LinkedInOAuthService();

    // Set test environment variables
    process.env.LINKEDIN_CLIENT_ID = 'test_linkedin_client_id';
    process.env.LINKEDIN_CLIENT_SECRET = 'test_linkedin_client_secret';
    process.env.LINKEDIN_REDIRECT_URI = 'http://localhost:3001/api/social/callback/linkedin';
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.socialAccount.deleteMany({
      where: { userId: testUser.id, platform: SocialPlatform.LINKEDIN },
    });
    await prisma.user.delete({ where: { id: testUser.id } });
    await prisma.$disconnect();

    // Clean up environment variables
    delete process.env.LINKEDIN_CLIENT_ID;
    delete process.env.LINKEDIN_CLIENT_SECRET;
    delete process.env.LINKEDIN_REDIRECT_URI;
  });

  describe('POST /api/social/connect/linkedin', () => {
    it('should initiate LinkedIn OAuth flow', async () => {
      const response = await request(app)
        .post('/api/social/connect/linkedin')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.authUrl).toContain('https://www.linkedin.com/oauth/v2/authorization');
      expect(response.body.data.authUrl).toContain('client_id=test_linkedin_client_id');
      expect(response.body.data.authUrl).toContain('scope=openid%20profile%20email');
      expect(response.body.data.state).toBeDefined();
    });

    it('should handle missing platform', async () => {
      const response = await request(app)
        .post('/api/social/connect/invalid_platform')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Unsupported social platform');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/social/connect/linkedin')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('token');
    });
  });

  describe('GET /api/social/callback/linkedin', () => {
    let testState: string;

    beforeEach(() => {
      testState = 'test_state_' + Date.now();
      // Mock state storage (normally handled by the connect endpoint)
      // This would be stored in Redis in production
    });

    it('should handle successful OAuth callback', async () => {
      // Mock successful LinkedIn API responses
      const mockLinkedInUserProfile = {
        sub: 'linkedin_test_user_123',
        name: 'Test User',
        given_name: 'Test',
        family_name: 'User',
        email: 'test@linkedin.com',
        picture: 'https://media.licdn.com/profile.jpg',
        email_verified: true,
      };

      const mockTokenResponse = {
        access_token: 'test_linkedin_access_token',
        expires_in: 5184000,
        token_type: 'Bearer',
      };

      // Mock LinkedIn API calls
      jest.spyOn(linkedinService, 'exchangeCodeForTokens').mockResolvedValue({
        accessToken: mockTokenResponse.access_token,
        expiresIn: mockTokenResponse.expires_in,
      });

      jest.spyOn(linkedinService, 'getUserProfile').mockResolvedValue({
        id: mockLinkedInUserProfile.sub,
        displayName: mockLinkedInUserProfile.name,
        email: mockLinkedInUserProfile.email,
        profileImage: mockLinkedInUserProfile.picture,
        profileUrl: `https://linkedin.com/in/${mockLinkedInUserProfile.sub}`,
        platformData: {
          firstName: mockLinkedInUserProfile.given_name,
          lastName: mockLinkedInUserProfile.family_name,
          emailVerified: mockLinkedInUserProfile.email_verified,
          organizations: [],
        },
      });

      const response = await request(app)
        .get('/api/social/callback/linkedin')
        .query({
          code: 'test_authorization_code',
          state: testState,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.platform).toBe(SocialPlatform.LINKEDIN);
      expect(response.body.data.displayName).toBe('Test User');
      expect(response.body.data.email).toBe('test@linkedin.com');

      // Verify account was created in database
      const socialAccount = await prisma.socialAccount.findFirst({
        where: {
          userId: testUser.id,
          platform: SocialPlatform.LINKEDIN,
          platformId: mockLinkedInUserProfile.sub,
        },
      });

      expect(socialAccount).toBeTruthy();
      expect(socialAccount?.displayName).toBe('Test User');
      expect(socialAccount?.accessToken).toBeDefined(); // Should be encrypted
    });

    it('should handle OAuth callback errors', async () => {
      const response = await request(app)
        .get('/api/social/callback/linkedin')
        .query({
          error: 'access_denied',
          error_description: 'User denied authorization',
          state: testState,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('access_denied');
    });

    it('should handle missing authorization code', async () => {
      const response = await request(app)
        .get('/api/social/callback/linkedin')
        .query({
          state: testState,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Missing authorization code');
    });

    it('should handle invalid state parameter', async () => {
      const response = await request(app)
        .get('/api/social/callback/linkedin')
        .query({
          code: 'test_code',
          state: 'invalid_state',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid state');
    });
  });

  describe('GET /api/social/accounts', () => {
    let linkedinAccount: any;

    beforeEach(async () => {
      // Create a test LinkedIn account
      linkedinAccount = await prisma.socialAccount.create({
        data: {
          userId: testUser.id,
          platform: SocialPlatform.LINKEDIN,
          platformId: 'linkedin_test_123',
          username: 'testuser',
          displayName: 'Test LinkedIn User',
          email: 'test@linkedin.com',
          profileImage: 'https://media.licdn.com/profile.jpg',
          profileUrl: 'https://linkedin.com/in/testuser',
          accessToken: 'encrypted_access_token',
          scope: 'openid profile email w_member_social',
          status: 'ACTIVE',
          followersCount: 500,
          followingCount: 300,
          connectedAt: new Date(),
        },
      });
    });

    afterEach(async () => {
      await prisma.socialAccount.delete({ where: { id: linkedinAccount.id } });
    });

    it('should return user LinkedIn accounts', async () => {
      const response = await request(app)
        .get('/api/social/accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);

      const linkedinAccounts = response.body.data.filter(
        (account: any) => account.platform === SocialPlatform.LINKEDIN
      );

      expect(linkedinAccounts).toHaveLength(1);
      expect(linkedinAccounts[0].displayName).toBe('Test LinkedIn User');
      expect(linkedinAccounts[0].username).toBe('testuser');
      expect(linkedinAccounts[0].followersCount).toBe(500);
    });

    it('should not return access tokens in response', async () => {
      const response = await request(app)
        .get('/api/social/accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const linkedinAccounts = response.body.data.filter(
        (account: any) => account.platform === SocialPlatform.LINKEDIN
      );

      expect(linkedinAccounts[0].accessToken).toBeUndefined();
      expect(linkedinAccounts[0].refreshToken).toBeUndefined();
    });
  });

  describe('DELETE /api/social/disconnect/:accountId', () => {
    let linkedinAccount: any;

    beforeEach(async () => {
      linkedinAccount = await prisma.socialAccount.create({
        data: {
          userId: testUser.id,
          platform: SocialPlatform.LINKEDIN,
          platformId: 'linkedin_disconnect_test',
          username: 'disconnecttest',
          displayName: 'Disconnect Test User',
          accessToken: 'encrypted_access_token',
          scope: 'openid profile email',
          status: 'ACTIVE',
          connectedAt: new Date(),
        },
      });
    });

    it('should successfully disconnect LinkedIn account', async () => {
      // Mock LinkedIn revoke API call
      jest.spyOn(linkedinService, 'revokeAccess').mockResolvedValue(undefined);

      const response = await request(app)
        .delete(`/api/social/disconnect/${linkedinAccount.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify account was deleted from database
      const deletedAccount = await prisma.socialAccount.findUnique({
        where: { id: linkedinAccount.id },
      });

      expect(deletedAccount).toBeNull();
    });

    it('should handle non-existent account', async () => {
      const response = await request(app)
        .delete('/api/social/disconnect/non_existent_id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });

    it('should prevent disconnecting another user\'s account', async () => {
      const otherUser = await createTestUser('other@example.com');
      const otherUserToken = getAuthToken(otherUser.id);

      const response = await request(app)
        .delete(`/api/social/disconnect/${linkedinAccount.id}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('access');

      // Clean up other user
      await prisma.user.delete({ where: { id: otherUser.id } });
    });
  });

  describe('LinkedIn API Service Methods', () => {
    describe('getInsights', () => {
      it('should fetch LinkedIn organization insights', async () => {
        const mockInsightsData = {
          elements: [
            {
              totalShareStatistics: {
                impressionCount: 1000,
                shareCount: 50,
                commentCount: 10,
                likeCount: 100,
              },
            },
          ],
        };

        jest.spyOn(linkedinService, 'getInsights').mockResolvedValue(mockInsightsData);

        const insights = await linkedinService.getInsights(
          'test_access_token',
          'test_company_id',
          new Date('2024-01-01'),
          new Date('2024-01-31')
        );

        expect(insights).toBe(mockInsightsData);
        expect(linkedinService.getInsights).toHaveBeenCalledWith(
          'test_access_token',
          'test_company_id',
          new Date('2024-01-01'),
          new Date('2024-01-31')
        );
      });
    });

    describe('publishPost', () => {
      it('should publish post to LinkedIn organization', async () => {
        const mockPostResponse = {
          id: 'urn:li:share:12345',
          url: 'https://linkedin.com/feed/update/urn:li:share:12345',
        };

        jest.spyOn(linkedinService, 'publishPost').mockResolvedValue(mockPostResponse);

        const result = await linkedinService.publishPost(
          'test_access_token',
          'urn:li:organization:123',
          'Test LinkedIn post content'
        );

        expect(result).toBe(mockPostResponse);
        expect(linkedinService.publishPost).toHaveBeenCalledWith(
          'test_access_token',
          'urn:li:organization:123',
          'Test LinkedIn post content'
        );
      });

      it('should publish post with media attachments', async () => {
        const mockPostResponse = {
          id: 'urn:li:share:67890',
          url: 'https://linkedin.com/feed/update/urn:li:share:67890',
        };

        jest.spyOn(linkedinService, 'publishPost').mockResolvedValue(mockPostResponse);

        const result = await linkedinService.publishPost(
          'test_access_token',
          'urn:li:person:456',
          'Post with image',
          ['https://example.com/image.jpg']
        );

        expect(result).toBe(mockPostResponse);
        expect(linkedinService.publishPost).toHaveBeenCalledWith(
          'test_access_token',
          'urn:li:person:456',
          'Post with image',
          ['https://example.com/image.jpg']
        );
      });
    });

    describe('getCompanyProfile', () => {
      it('should fetch LinkedIn company profile', async () => {
        const mockCompanyProfile = {
          id: 123,
          name: 'Test Company',
          description: 'A test company for LinkedIn integration',
          logo: {
            originalImageUrl: 'https://media.licdn.com/company-logo.jpg',
          },
          website: 'https://testcompany.com',
          followerCount: 1000,
        };

        jest.spyOn(linkedinService, 'getCompanyProfile').mockResolvedValue(mockCompanyProfile);

        const profile = await linkedinService.getCompanyProfile('test_access_token', '123');

        expect(profile).toBe(mockCompanyProfile);
        expect(linkedinService.getCompanyProfile).toHaveBeenCalledWith('test_access_token', '123');
      });
    });
  });
});