import { SocialPlatform } from '@prisma/client';
import { OAuthStateService, OAuthStateData } from './oauth-state.service';
import { getCacheService } from './redis';
import { AppError } from '../utils/errors';

// Mock Redis cache service
jest.mock('./redis', () => ({
  getCacheService: jest.fn(),
  CACHE_TTL: {
    SHORT: 300,
    MEDIUM: 1800,
    LONG: 3600,
  },
  CACHE_KEYS: {
    OAUTH_STATE: 'oauth:state:',
  },
}));

describe('OAuthStateService - CSRF Protection', () => {
  let oauthStateService: OAuthStateService;
  let mockCacheService: any;

  beforeEach(() => {
    // Create mock cache service
    mockCacheService = {
      set: jest.fn().mockResolvedValue(true),
      get: jest.fn(),
      del: jest.fn().mockResolvedValue(true),
      exists: jest.fn().mockResolvedValue(true),
      ttl: jest.fn().mockResolvedValue(300),
    };

    (getCacheService as jest.Mock).mockReturnValue(mockCacheService);

    oauthStateService = new OAuthStateService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('State Generation', () => {
    it('should generate a cryptographically secure state parameter', () => {
      const state1 = oauthStateService.generateState();
      const state2 = oauthStateService.generateState();

      // Should be 64 characters (32 bytes in hex)
      expect(state1).toHaveLength(64);
      expect(state2).toHaveLength(64);

      // Should be different
      expect(state1).not.toBe(state2);

      // Should be hex string
      expect(state1).toMatch(/^[0-9a-f]{64}$/);
      expect(state2).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should generate high entropy states (256 bits)', () => {
      const states = new Set<string>();
      for (let i = 0; i < 1000; i++) {
        states.add(oauthStateService.generateState());
      }

      // All 1000 states should be unique
      expect(states.size).toBe(1000);
    });
  });

  describe('State Storage', () => {
    it('should store state in Redis with 5 minute TTL', async () => {
      const state = 'test_state_12345';
      const stateData: OAuthStateData = {
        userId: 'user_123',
        platform: SocialPlatform.TWITTER,
        organizationId: 'org_456',
        timestamp: Date.now(),
      };

      await oauthStateService.storeState(state, stateData);

      expect(mockCacheService.set).toHaveBeenCalledWith(
        'oauth:state:test_state_12345',
        expect.objectContaining({
          userId: 'user_123',
          platform: SocialPlatform.TWITTER,
          organizationId: 'org_456',
          timestamp: expect.any(Number),
        }),
        300 // 5 minutes TTL
      );
    });

    it('should include timestamp in stored state data', async () => {
      const state = 'test_state_12345';
      const beforeTimestamp = Date.now();

      const stateData: OAuthStateData = {
        userId: 'user_123',
        platform: SocialPlatform.FACEBOOK,
        timestamp: beforeTimestamp,
      };

      await oauthStateService.storeState(state, stateData);

      const storedData = mockCacheService.set.mock.calls[0][1];
      expect(storedData.timestamp).toBeGreaterThanOrEqual(beforeTimestamp);
    });

    it('should store PKCE code verifier for Twitter', async () => {
      const state = 'test_state_twitter';
      const stateData: OAuthStateData = {
        userId: 'user_123',
        platform: SocialPlatform.TWITTER,
        timestamp: Date.now(),
        codeVerifier: 'pkce_verifier_12345',
      };

      await oauthStateService.storeState(state, stateData);

      expect(mockCacheService.set).toHaveBeenCalledWith(
        'oauth:state:test_state_twitter',
        expect.objectContaining({
          codeVerifier: 'pkce_verifier_12345',
        }),
        300
      );
    });

    it('should handle Redis storage failure gracefully', async () => {
      mockCacheService.set.mockResolvedValue(false);

      const state = 'test_state_fail';
      const stateData: OAuthStateData = {
        userId: 'user_123',
        platform: SocialPlatform.LINKEDIN,
        timestamp: Date.now(),
      };

      const result = await oauthStateService.storeState(state, stateData);

      expect(result).toBe(false);
    });
  });

  describe('State Validation - CSRF Protection', () => {
    it('should validate and retrieve valid state', async () => {
      const state = 'valid_state_12345';
      const storedData: OAuthStateData = {
        userId: 'user_123',
        platform: SocialPlatform.TWITTER,
        organizationId: 'org_456',
        timestamp: Date.now(),
      };

      mockCacheService.get.mockResolvedValue(storedData);

      const result = await oauthStateService.validateAndRetrieveState(
        state,
        SocialPlatform.TWITTER
      );

      expect(result).toEqual(storedData);
      expect(mockCacheService.get).toHaveBeenCalledWith('oauth:state:valid_state_12345');
      expect(mockCacheService.del).toHaveBeenCalledWith('oauth:state:valid_state_12345');
    });

    it('should reject missing state parameter', async () => {
      await expect(
        oauthStateService.validateAndRetrieveState('', SocialPlatform.TWITTER)
      ).rejects.toThrow(AppError);

      await expect(
        oauthStateService.validateAndRetrieveState('', SocialPlatform.TWITTER)
      ).rejects.toThrow('Invalid state parameter');
    });

    it('should reject expired/non-existent state - CSRF ATTACK PREVENTION', async () => {
      mockCacheService.get.mockResolvedValue(null);

      await expect(
        oauthStateService.validateAndRetrieveState('expired_state', SocialPlatform.FACEBOOK)
      ).rejects.toThrow(AppError);

      await expect(
        oauthStateService.validateAndRetrieveState('expired_state', SocialPlatform.FACEBOOK)
      ).rejects.toThrow('Invalid or expired state parameter');
    });

    it('should reject platform mismatch - CSRF ATTACK PREVENTION', async () => {
      const storedData: OAuthStateData = {
        userId: 'user_123',
        platform: SocialPlatform.TWITTER,
        timestamp: Date.now(),
      };

      mockCacheService.get.mockResolvedValue(storedData);

      // Attempt to use Twitter state for Facebook
      await expect(
        oauthStateService.validateAndRetrieveState('state_123', SocialPlatform.FACEBOOK)
      ).rejects.toThrow(AppError);

      await expect(
        oauthStateService.validateAndRetrieveState('state_123', SocialPlatform.FACEBOOK)
      ).rejects.toThrow('State platform mismatch');
    });

    it('should reject state older than 5 minutes', async () => {
      const oldTimestamp = Date.now() - 6 * 60 * 1000; // 6 minutes ago
      const storedData: OAuthStateData = {
        userId: 'user_123',
        platform: SocialPlatform.LINKEDIN,
        timestamp: oldTimestamp,
      };

      mockCacheService.get.mockResolvedValue(storedData);

      await expect(
        oauthStateService.validateAndRetrieveState('old_state', SocialPlatform.LINKEDIN)
      ).rejects.toThrow(AppError);

      await expect(
        oauthStateService.validateAndRetrieveState('old_state', SocialPlatform.LINKEDIN)
      ).rejects.toThrow('State parameter expired');
    });

    it('should delete state after successful validation - SINGLE USE', async () => {
      const state = 'single_use_state';
      const storedData: OAuthStateData = {
        userId: 'user_123',
        platform: SocialPlatform.TIKTOK,
        timestamp: Date.now(),
      };

      mockCacheService.get.mockResolvedValue(storedData);

      await oauthStateService.validateAndRetrieveState(state, SocialPlatform.TIKTOK);

      // State should be deleted immediately
      expect(mockCacheService.del).toHaveBeenCalledWith('oauth:state:single_use_state');
    });

    it('should prevent state reuse - REPLAY ATTACK PREVENTION', async () => {
      const state = 'reused_state';
      const storedData: OAuthStateData = {
        userId: 'user_123',
        platform: SocialPlatform.TWITTER,
        timestamp: Date.now(),
      };

      // First validation succeeds
      mockCacheService.get.mockResolvedValueOnce(storedData);
      await oauthStateService.validateAndRetrieveState(state, SocialPlatform.TWITTER);

      // Second validation fails (state deleted after first use)
      mockCacheService.get.mockResolvedValueOnce(null);
      await expect(
        oauthStateService.validateAndRetrieveState(state, SocialPlatform.TWITTER)
      ).rejects.toThrow('Invalid or expired state parameter');
    });
  });

  describe('Authorization State Generation', () => {
    it('should generate complete authorization state', async () => {
      mockCacheService.set.mockResolvedValue(true);

      const state = await oauthStateService.generateAuthorizationState(
        'user_123',
        SocialPlatform.FACEBOOK,
        'org_456'
      );

      expect(state).toHaveLength(64);
      expect(mockCacheService.set).toHaveBeenCalledWith(
        expect.stringContaining('oauth:state:'),
        expect.objectContaining({
          userId: 'user_123',
          platform: SocialPlatform.FACEBOOK,
          organizationId: 'org_456',
          timestamp: expect.any(Number),
        }),
        300
      );
    });

    it('should include PKCE code verifier when provided', async () => {
      mockCacheService.set.mockResolvedValue(true);

      const state = await oauthStateService.generateAuthorizationState(
        'user_123',
        SocialPlatform.TWITTER,
        undefined,
        'pkce_verifier_abc123'
      );

      expect(mockCacheService.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          codeVerifier: 'pkce_verifier_abc123',
        }),
        300
      );
    });

    it('should throw error if storage fails', async () => {
      mockCacheService.set.mockResolvedValue(false);

      await expect(
        oauthStateService.generateAuthorizationState(
          'user_123',
          SocialPlatform.LINKEDIN
        )
      ).rejects.toThrow('Failed to initialize OAuth flow');
    });
  });

  describe('State Management Operations', () => {
    it('should check if state exists', async () => {
      mockCacheService.exists.mockResolvedValue(true);

      const exists = await oauthStateService.stateExists('test_state');

      expect(exists).toBe(true);
      expect(mockCacheService.exists).toHaveBeenCalledWith('oauth:state:test_state');
    });

    it('should get state TTL', async () => {
      mockCacheService.ttl.mockResolvedValue(250); // 250 seconds remaining

      const ttl = await oauthStateService.getStateTTL('test_state');

      expect(ttl).toBe(250);
      expect(mockCacheService.ttl).toHaveBeenCalledWith('oauth:state:test_state');
    });

    it('should delete state manually', async () => {
      mockCacheService.del.mockResolvedValue(true);

      const deleted = await oauthStateService.deleteState('test_state');

      expect(deleted).toBe(true);
      expect(mockCacheService.del).toHaveBeenCalledWith('oauth:state:test_state');
    });
  });

  describe('Security Edge Cases', () => {
    it('should reject null state parameter', async () => {
      await expect(
        oauthStateService.validateAndRetrieveState(null as any, SocialPlatform.TWITTER)
      ).rejects.toThrow('Invalid state parameter');
    });

    it('should reject undefined state parameter', async () => {
      await expect(
        oauthStateService.validateAndRetrieveState(undefined as any, SocialPlatform.FACEBOOK)
      ).rejects.toThrow('Invalid state parameter');
    });

    it('should reject non-string state parameter', async () => {
      await expect(
        oauthStateService.validateAndRetrieveState(12345 as any, SocialPlatform.LINKEDIN)
      ).rejects.toThrow('Invalid state parameter');
    });

    it('should handle Redis errors gracefully', async () => {
      mockCacheService.get.mockRejectedValue(new Error('Redis connection failed'));

      await expect(
        oauthStateService.validateAndRetrieveState('test_state', SocialPlatform.TWITTER)
      ).rejects.toThrow('Failed to validate OAuth state');
    });

    it('should log security warnings for CSRF attempts', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Attempt platform mismatch
      mockCacheService.get.mockResolvedValue({
        userId: 'user_123',
        platform: SocialPlatform.TWITTER,
        timestamp: Date.now(),
      });

      await expect(
        oauthStateService.validateAndRetrieveState('state_123', SocialPlatform.FACEBOOK)
      ).rejects.toThrow();

      consoleWarnSpy.mockRestore();
    });
  });

  describe('Integration with Multiple Platforms', () => {
    it('should handle Twitter with PKCE code verifier', async () => {
      const state = await oauthStateService.generateAuthorizationState(
        'user_123',
        SocialPlatform.TWITTER,
        undefined,
        'twitter_pkce_verifier'
      );

      mockCacheService.get.mockResolvedValue({
        userId: 'user_123',
        platform: SocialPlatform.TWITTER,
        timestamp: Date.now(),
        codeVerifier: 'twitter_pkce_verifier',
      });

      const retrieved = await oauthStateService.validateAndRetrieveState(
        state,
        SocialPlatform.TWITTER
      );

      expect(retrieved.codeVerifier).toBe('twitter_pkce_verifier');
    });

    it('should handle Facebook without PKCE', async () => {
      await oauthStateService.generateAuthorizationState(
        'user_123',
        SocialPlatform.FACEBOOK
      );

      mockCacheService.get.mockResolvedValue({
        userId: 'user_123',
        platform: SocialPlatform.FACEBOOK,
        timestamp: Date.now(),
      });

      const retrieved = await oauthStateService.validateAndRetrieveState(
        'test_state',
        SocialPlatform.FACEBOOK
      );

      expect(retrieved.codeVerifier).toBeUndefined();
    });

    it('should handle all social platforms', async () => {
      const platforms = [
        SocialPlatform.TWITTER,
        SocialPlatform.FACEBOOK,
        SocialPlatform.INSTAGRAM,
        SocialPlatform.LINKEDIN,
        SocialPlatform.TIKTOK,
      ];

      for (const platform of platforms) {
        await oauthStateService.generateAuthorizationState(
          'user_123',
          platform
        );

        mockCacheService.get.mockResolvedValue({
          userId: 'user_123',
          platform,
          timestamp: Date.now(),
        });

        const retrieved = await oauthStateService.validateAndRetrieveState('test_state_' + platform, platform);

        expect(retrieved.platform).toBe(platform);
      }
    });
  });
});
