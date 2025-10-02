import { LinkedInOAuthService } from './linkedin.oauth';
import { AppError } from '../../utils/errors';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('LinkedInOAuthService', () => {
  let service: LinkedInOAuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up environment variables
    process.env.LINKEDIN_CLIENT_ID = 'test_client_id';
    process.env.LINKEDIN_CLIENT_SECRET = 'test_client_secret';
    process.env.LINKEDIN_REDIRECT_URI = 'http://localhost:3001/api/social/callback/linkedin';

    service = new LinkedInOAuthService();
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.LINKEDIN_CLIENT_ID;
    delete process.env.LINKEDIN_CLIENT_SECRET;
    delete process.env.LINKEDIN_REDIRECT_URI;
  });

  describe('constructor', () => {
    it('should initialize with correct platform and configuration', () => {
      // Test platform through the getAuthorizationUrl method
      const authUrl = service.getAuthorizationUrl('test_state');
      expect(authUrl).toContain('https://www.linkedin.com/oauth/v2/authorization');
      expect(authUrl).toContain('client_id=test_client_id');
      expect(authUrl).toContain('scope=openid+profile+email+w_member_social');
      expect(authUrl).toContain('redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fapi%2Fsocial%2Fcallback%2Flinkedin');
    });

    it('should use default values when environment variables are not set', () => {
      delete process.env.LINKEDIN_CLIENT_ID;
      delete process.env.LINKEDIN_CLIENT_SECRET;
      delete process.env.LINKEDIN_REDIRECT_URI;

      const serviceWithDefaults = new LinkedInOAuthService();
      const authUrl = serviceWithDefaults.getAuthorizationUrl('test_state');
      expect(authUrl).toContain('client_id=');
      expect(authUrl).toContain('redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fapi%2Fsocial%2Fcallback%2Flinkedin');
    });
  });

  describe('getAuthorizationUrl', () => {
    it('should generate correct authorization URL', () => {
      const state = 'test_state_123';
      const url = service.getAuthorizationUrl(state);

      expect(url).toContain('https://www.linkedin.com/oauth/v2/authorization');
      expect(url).toContain('response_type=code');
      expect(url).toContain('client_id=test_client_id');
      expect(url).toContain('redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fapi%2Fsocial%2Fcallback%2Flinkedin');
      expect(url).toContain('state=test_state_123');
      expect(url).toContain('scope=openid+profile+email');
    });

    it('should handle special characters in state', () => {
      const state = 'test@state#123';
      const url = service.getAuthorizationUrl(state);

      expect(url).toContain('state=test%40state%23123');
    });
  });

  describe('exchangeCodeForTokens', () => {
    it('should successfully exchange authorization code for tokens', async () => {
      const mockResponse = {
        data: {
          access_token: 'test_access_token',
          token_type: 'Bearer',
          expires_in: 5184000,
          scope: 'openid profile email',
        },
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await service.exchangeCodeForTokens('test_code');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://www.linkedin.com/oauth/v2/accessToken',
        {
          grant_type: 'authorization_code',
          code: 'test_code',
          client_id: 'test_client_id',
          client_secret: 'test_client_secret',
          redirect_uri: 'http://localhost:3001/api/social/callback/linkedin',
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      expect(result).toEqual({
        accessToken: 'test_access_token',
        expiresIn: 5184000,
      });
    });

    it('should use default expiry when not provided', async () => {
      const mockResponse = {
        data: {
          access_token: 'test_access_token',
          token_type: 'Bearer',
          scope: 'openid profile email',
        },
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await service.exchangeCodeForTokens('test_code');

      expect(result.expiresIn).toBe(5184000); // 60 days default
    });

    it('should throw AppError when token exchange fails', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Network error'));

      await expect(service.exchangeCodeForTokens('invalid_code')).rejects.toThrow(AppError);
      await expect(service.exchangeCodeForTokens('invalid_code')).rejects.toThrow('Failed to exchange code for tokens');
    });
  });

  describe('refreshAccessToken', () => {
    it('should successfully refresh access token', async () => {
      const mockResponse = {
        data: {
          access_token: 'new_access_token',
          token_type: 'Bearer',
          expires_in: 5184000,
        },
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await service.refreshAccessToken('refresh_token');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://www.linkedin.com/oauth/v2/accessToken',
        {
          grant_type: 'refresh_token',
          refresh_token: 'refresh_token',
          client_id: 'test_client_id',
          client_secret: 'test_client_secret',
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      expect(result).toEqual({
        accessToken: 'new_access_token',
        expiresIn: 5184000,
      });
    });

    it('should throw AppError when refresh fails', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Invalid refresh token'));

      await expect(service.refreshAccessToken('invalid_refresh_token')).rejects.toThrow(AppError);
      await expect(service.refreshAccessToken('invalid_refresh_token')).rejects.toThrow('Failed to refresh access token');
    });
  });

  describe('getUserProfile', () => {
    it('should successfully fetch user profile', async () => {
      const mockProfileResponse = {
        data: {
          sub: 'linkedin_user_id',
          name: 'John Doe',
          given_name: 'John',
          family_name: 'Doe',
          picture: 'https://media.licdn.com/profile.jpg',
          email: 'john@example.com',
          email_verified: true,
          locale: {
            country: 'US',
            language: 'en',
          },
        },
      };

      const mockOrgsResponse = {
        data: {
          elements: [
            {
              organization: 'urn:li:organization:123',
              organizationalTarget: 'urn:li:organization:123',
              role: 'ADMINISTRATOR',
              state: 'APPROVED',
            },
          ],
        },
      };

      mockedAxios.get
        .mockResolvedValueOnce(mockProfileResponse) // userinfo call
        .mockResolvedValueOnce(mockOrgsResponse); // organizationAcls call

      const result = await service.getUserProfile('test_access_token');

      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.linkedin.com/v2/userinfo',
        {
          headers: {
            Authorization: 'Bearer test_access_token',
          },
        }
      );

      expect(result).toEqual({
        id: 'linkedin_user_id',
        displayName: 'John Doe',
        email: 'john@example.com',
        profileImage: 'https://media.licdn.com/profile.jpg',
        profileUrl: 'https://linkedin.com/in/linkedin_user_id',
        platformData: {
          firstName: 'John',
          lastName: 'Doe',
          locale: {
            country: 'US',
            language: 'en',
          },
          emailVerified: true,
          organizations: [
            {
              organization: 'urn:li:organization:123',
              organizationalTarget: 'urn:li:organization:123',
              role: 'ADMINISTRATOR',
              state: 'APPROVED',
            },
          ],
        },
      });
    });

    it('should handle missing organizations gracefully', async () => {
      const mockProfileResponse = {
        data: {
          sub: 'linkedin_user_id',
          name: 'John Doe',
          email: 'john@example.com',
        },
      };

      mockedAxios.get
        .mockResolvedValueOnce(mockProfileResponse) // userinfo call
        .mockRejectedValueOnce(new Error('Organizations not accessible')); // organizationAcls call fails

      const result = await service.getUserProfile('test_access_token');

      expect(result.platformData.organizations).toEqual([]);
    });

    it('should throw AppError when profile fetch fails', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Unauthorized'));

      await expect(service.getUserProfile('invalid_token')).rejects.toThrow(AppError);
      await expect(service.getUserProfile('invalid_token')).rejects.toThrow('Failed to fetch user profile');
    });
  });

  describe('revokeAccess', () => {
    it('should successfully revoke access', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: {} });

      await expect(service.revokeAccess('test_access_token')).resolves.not.toThrow();

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://www.linkedin.com/oauth/v2/revoke',
        {
          token: 'test_access_token',
          client_id: 'test_client_id',
          client_secret: 'test_client_secret',
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
    });

    it('should not throw error when revoke fails', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Token already revoked'));

      await expect(service.revokeAccess('test_access_token')).resolves.not.toThrow();
    });
  });

  describe('getInsights', () => {
    it('should successfully fetch organization insights', async () => {
      const mockInsightsResponse = {
        data: {
          elements: [
            {
              totalShareStatistics: {
                impressionCount: 1000,
                shareCount: 50,
                commentCount: 10,
              },
            },
          ],
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockInsightsResponse);

      const since = new Date('2024-01-01');
      const until = new Date('2024-01-31');
      const result = await service.getInsights('test_access_token', '123', since, until);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.linkedin.com/v2/organizationalEntityStatistics',
        expect.objectContaining({
          params: expect.objectContaining({
            q: 'statistics',
            organizationalEntity: 'urn:li:organization:123',
            timeGranularity: 'DAY',
          }),
          headers: {
            Authorization: 'Bearer test_access_token',
          },
        })
      );

      expect(result).toBe(mockInsightsResponse.data);
    });

    it('should handle missing date parameters', async () => {
      const mockInsightsResponse = { data: {} };
      mockedAxios.get.mockResolvedValueOnce(mockInsightsResponse);

      await service.getInsights('test_access_token', '123');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.linkedin.com/v2/organizationalEntityStatistics',
        expect.objectContaining({
          params: expect.not.objectContaining({
            timeRange: expect.any(String),
          }),
        })
      );
    });

    it('should throw AppError when insights fetch fails', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Insufficient permissions'));

      await expect(service.getInsights('test_access_token', '123')).rejects.toThrow(AppError);
      await expect(service.getInsights('test_access_token', '123')).rejects.toThrow('Failed to fetch insights');
    });
  });

  describe('publishPost', () => {
    it('should successfully publish post for organization', async () => {
      const mockResponse = {
        data: {},
        headers: {
          'x-restli-id': 'urn:li:share:12345',
        },
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await service.publishPost(
        'test_access_token',
        'urn:li:organization:123',
        'Test post content'
      );

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.linkedin.com/v2/ugcPosts',
        {
          author: 'urn:li:organization:123',
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: {
                text: 'Test post content',
              },
              shareMediaCategory: 'NONE',
            },
          },
          visibility: {
            'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
          },
        },
        {
          headers: {
            Authorization: 'Bearer test_access_token',
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0',
          },
        }
      );

      expect(result).toEqual({
        id: 'urn:li:share:12345',
        url: 'https://linkedin.com/feed/update/urn:li:share:12345',
      });
    });

    it('should successfully publish post for person', async () => {
      const mockResponse = {
        data: {},
        headers: {
          'x-restli-id': 'urn:li:share:67890',
        },
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await service.publishPost(
        'test_access_token',
        'person123',
        'Personal post content'
      );

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.linkedin.com/v2/ugcPosts',
        expect.objectContaining({
          author: 'urn:li:person:person123',
        }),
        expect.any(Object)
      );

      expect(result.id).toBe('urn:li:share:67890');
    });

    it('should handle media attachments', async () => {
      const mockResponse = {
        data: {},
        headers: {
          'x-restli-id': 'urn:li:share:media123',
        },
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      await service.publishPost(
        'test_access_token',
        'urn:li:organization:123',
        'Post with media',
        ['https://example.com/image.jpg']
      );

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.linkedin.com/v2/ugcPosts',
        expect.objectContaining({
          specificContent: {
            'com.linkedin.ugc.ShareContent': expect.objectContaining({
              shareMediaCategory: 'IMAGE',
              media: expect.arrayContaining([
                expect.objectContaining({
                  media: 'https://example.com/image.jpg',
                }),
              ]),
            }),
          },
        }),
        expect.any(Object)
      );
    });

    it('should throw AppError when post publish fails', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Rate limit exceeded'));

      await expect(
        service.publishPost('test_access_token', 'urn:li:organization:123', 'Test content')
      ).rejects.toThrow(AppError);
      await expect(
        service.publishPost('test_access_token', 'urn:li:organization:123', 'Test content')
      ).rejects.toThrow('Failed to publish post');
    });
  });

  describe('getCompanyProfile', () => {
    it('should successfully fetch company profile', async () => {
      const mockCompanyResponse = {
        data: {
          id: 123,
          name: 'Test Company',
          description: 'A test company',
          logo: {
            originalImageUrl: 'https://media.licdn.com/company-logo.jpg',
          },
          website: 'https://testcompany.com',
          followerCount: 1000,
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockCompanyResponse);

      const result = await service.getCompanyProfile('test_access_token', '123');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.linkedin.com/v2/organizations/123',
        {
          params: {
            projection: '(id,name,description,logo,website,followerCount)',
          },
          headers: {
            Authorization: 'Bearer test_access_token',
          },
        }
      );

      expect(result).toBe(mockCompanyResponse.data);
    });

    it('should throw AppError when company profile fetch fails', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Company not found'));

      await expect(service.getCompanyProfile('test_access_token', '999')).rejects.toThrow(AppError);
      await expect(service.getCompanyProfile('test_access_token', '999')).rejects.toThrow('Failed to fetch company profile');
    });
  });
});