import { test, expect } from '@playwright/test';

test.describe('Instagram Integration End-to-End Tests', () => {
  let authToken: string;
  const baseURL = process.env.API_URL || 'http://localhost:5000';

  test.beforeAll(async ({ request }) => {
    // Login to get auth token
    const loginResponse = await request.post(`${baseURL}/api/auth/login`, {
      data: {
        email: 'test@example.com',
        password: 'Test123!@#'
      }
    });
    
    const loginData = await loginResponse.json();
    authToken = loginData.data?.token || '';
    expect(authToken).toBeTruthy();
  });

  test.describe('Instagram Connection Flow', () => {
    test('should check connection status when not connected', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/instagram/connection-status`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      
      expect(data).toMatchObject({
        success: true,
        data: {
          connected: expect.any(Boolean)
        }
      });
    });

    test('should generate Instagram OAuth URL', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/instagram/auth/url`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      
      expect(data).toMatchObject({
        success: true,
        data: {
          authUrl: expect.stringContaining('https://api.instagram.com/oauth/authorize'),
          state: expect.any(String)
        }
      });

      // Verify URL contains required parameters
      const url = new URL(data.data.authUrl);
      expect(url.searchParams.has('client_id')).toBeTruthy();
      expect(url.searchParams.has('redirect_uri')).toBeTruthy();
      expect(url.searchParams.has('scope')).toBeTruthy();
      expect(url.searchParams.has('response_type')).toBeTruthy();
      expect(url.searchParams.has('state')).toBeTruthy();
    });

    test('should handle auth callback with invalid code', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/instagram/auth/callback`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        data: {
          code: 'invalid_code',
          state: 'test_state'
        }
      });

      expect(response.status()).toBe(500);
      const data = await response.json();
      expect(data.success).toBe(false);
    });

    test('should validate refresh token endpoint', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/instagram/refresh-token`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        data: {}
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data).toMatchObject({
        success: false,
        message: 'Access token is required'
      });
    });
  });

  test.describe('Mock Data Testing (Development Mode)', () => {
    test('should return mock connection status', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/instagram/connection-status`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      
      if (data.data.connected) {
        expect(data.data.account).toMatchObject({
          id: expect.any(String),
          username: expect.any(String),
          accountType: expect.stringMatching(/BUSINESS|MEDIA_CREATOR|PERSONAL/),
          followersCount: expect.any(Number),
          followsCount: expect.any(Number)
        });
      }
    });

    test('should return mock media data', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/instagram/media?limit=6`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      
      expect(data.success).toBe(true);
      if (data.data?.media?.length > 0) {
        expect(data.data.media[0]).toMatchObject({
          id: expect.any(String),
          mediaType: expect.stringMatching(/IMAGE|VIDEO|CAROUSEL_ALBUM/),
          mediaUrl: expect.any(String),
          permalink: expect.any(String),
          timestamp: expect.any(String),
          username: expect.any(String)
        });
      }
    });

    test('should return mock insights data', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/instagram/insights?period=day`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      
      expect(data.success).toBe(true);
      if (data.data?.insights) {
        expect(data.data.insights).toMatchObject({
          impressions: expect.any(Number),
          reach: expect.any(Number),
          engagement: expect.any(Number),
          saves: expect.any(Number)
        });
      }
    });
  });

  test.describe('Media Management', () => {
    test('should validate post creation with missing image URL', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/instagram/post`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          caption: 'Test caption without image'
        }
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data).toMatchObject({
        success: false,
        message: 'Image URL is required'
      });
    });

    test('should validate media details endpoint', async ({ request }) => {
      const _response = await request.get(`${baseURL}/api/instagram/media/invalid_media_id`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      // Should still return a response structure even with invalid ID in mock mode
      const data = await response.json();
      expect(data).toHaveProperty('success');
    });

    test('should validate media insights endpoint', async ({ request }) => {
      const _response = await request.get(`${baseURL}/api/instagram/media/test_media_id/insights`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      const data = await response.json();
      expect(data).toHaveProperty('success');
    });
  });

  test.describe('Comment Management', () => {
    test('should validate comment reply with missing data', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/instagram/comments/comment_123/reply`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: {}
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data).toMatchObject({
        success: false,
        message: 'Comment ID and message are required'
      });
    });

    test('should validate comment deletion endpoint', async ({ request }) => {
      const _response = await request.delete(`${baseURL}/api/instagram/comments/test_comment_id`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      const data = await response.json();
      expect(data).toHaveProperty('success');
    });

    test('should get media comments', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/instagram/media/test_media_id/comments`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      const data = await response.json();
      expect(data).toHaveProperty('success');
    });
  });

  test.describe('Hashtag Features', () => {
    test('should validate hashtag search with missing query', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/instagram/hashtags/search`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data).toMatchObject({
        success: false,
        message: 'Search query is required'
      });
    });

    test('should search hashtags', async ({ request }) => {
      const _response = await request.get(`${baseURL}/api/instagram/hashtags/search?q=photography`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      const data = await response.json();
      expect(data).toHaveProperty('success');
      if (data.success) {
        expect(data.data).toHaveProperty('query', 'photography');
      }
    });

    test('should get hashtag insights', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/instagram/hashtags/hashtag_123/insights`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      const data = await response.json();
      expect(data).toHaveProperty('success');
    });
  });

  test.describe('Error Handling', () => {
    test('should handle unauthorized requests', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/instagram/connection-status`, {
        headers: {
          'Authorization': 'Bearer invalid_token'
        }
      });

      expect(response.status()).toBe(401);
    });

    test('should handle missing authorization header', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/instagram/connection-status`);
      expect(response.status()).toBe(401);
    });

    test('should handle invalid HTTP methods', async ({ request }) => {
      const response = await request.put(`${baseURL}/api/instagram/connection-status`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });

  test.describe('Rate Limiting and Performance', () => {
    test('should handle multiple concurrent requests', async ({ request }) => {
      const requests = Array(5).fill(null).map(() =>
        request.get(`${baseURL}/api/instagram/connection-status`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        })
      );

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.ok()).toBeTruthy();
      });
    });

    test('should respond within acceptable time', async ({ request }) => {
      const startTime = Date.now();
      
      const response = await request.get(`${baseURL}/api/instagram/connection-status`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      expect(response.ok()).toBeTruthy();
      expect(responseTime).toBeLessThan(3000); // Should respond within 3 seconds
    });
  });

  test.describe('Data Validation', () => {
    test('should validate account data structure', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/instagram/account`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      
      if (data.success && data.data?.account) {
        const account = data.data.account;
        
        // Validate data types
        expect(typeof account.id).toBe('string');
        expect(typeof account.username).toBe('string');
        expect(['BUSINESS', 'MEDIA_CREATOR', 'PERSONAL']).toContain(account.accountType);
        
        if (account.followersCount !== undefined) {
          expect(typeof account.followersCount).toBe('number');
          expect(account.followersCount).toBeGreaterThanOrEqual(0);
        }
      }
    });

    test('should validate media data structure', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/instagram/media?limit=3`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      
      if (data.success && data.data?.media?.length > 0) {
        const media = data.data.media[0];
        
        // Validate required fields
        expect(media).toHaveProperty('id');
        expect(media).toHaveProperty('mediaType');
        expect(media).toHaveProperty('mediaUrl');
        expect(media).toHaveProperty('timestamp');
        
        // Validate media type enum
        expect(['IMAGE', 'VIDEO', 'CAROUSEL_ALBUM']).toContain(media.mediaType);
        
        // Validate timestamp format
        expect(() => new Date(media.timestamp)).not.toThrow();
      }
    });

    test('should validate insights data structure', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/instagram/insights?period=week`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      
      if (data.success && data.data?.insights) {
        const insights = data.data.insights;
        
        // Validate required metrics
        expect(insights).toHaveProperty('impressions');
        expect(insights).toHaveProperty('reach');
        expect(insights).toHaveProperty('engagement');
        
        // Validate data types
        expect(typeof insights.impressions).toBe('number');
        expect(typeof insights.reach).toBe('number');
        expect(typeof insights.engagement).toBe('number');
        
        // Validate non-negative values
        expect(insights.impressions).toBeGreaterThanOrEqual(0);
        expect(insights.reach).toBeGreaterThanOrEqual(0);
        expect(insights.engagement).toBeGreaterThanOrEqual(0);
      }
    });
  });
});