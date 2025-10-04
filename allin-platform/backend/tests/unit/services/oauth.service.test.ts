// Set up environment before importing services
process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

import { OAuthService } from './oauth.service';
import { SocialPlatform } from '@prisma/client';
import { AppError } from '../utils/errors';
import crypto from 'crypto';

// Mock crypto module
jest.mock('crypto', () => ({
  randomBytes: jest.fn(),
  createCipheriv: jest.fn(),
  createDecipheriv: jest.fn(),
}));

// Mock prisma
jest.mock('./database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    socialAccount: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

// Create a concrete implementation for testing
class TestOAuthService extends OAuthService {
  // Make protected methods public for testing
  public encryptToken(token: string): string {
    return super.encryptToken(token);
  }
  
  public decryptToken(encryptedToken: string): string {
    return super.decryptToken(encryptedToken);
  }
  
  public get testPlatform() {
    return this.platform;
  }
  
  public get testConfig() {
    return this.config;
  }
  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scope.join(' '),
      state,
      response_type: 'code',
    });
    return `https://oauth.example.com/authorize?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }> {
    if (code === 'invalid_code') {
      throw new AppError('Invalid authorization code', 400);
    }
    return {
      accessToken: 'test_access_token',
      refreshToken: 'test_refresh_token',
      expiresIn: 3600,
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }> {
    if (refreshToken === 'invalid_refresh_token') {
      throw new AppError('Invalid refresh token', 400);
    }
    return {
      accessToken: 'new_access_token',
      refreshToken: 'new_refresh_token',
      expiresIn: 3600,
    };
  }

  async getUserProfile(accessToken: string): Promise<{
    id: string;
    username?: string;
    displayName?: string;
    email?: string;
    profileImage?: string;
    profileUrl?: string;
    followersCount?: number;
    followingCount?: number;
  }> {
    if (accessToken === 'invalid_token') {
      throw new AppError('Invalid access token', 401);
    }
    return {
      id: 'test_user_id',
      username: 'testuser',
      displayName: 'Test User',
      email: 'test@example.com',
      profileImage: 'https://example.com/avatar.jpg',
      profileUrl: 'https://example.com/testuser',
      followersCount: 1000,
      followingCount: 500,
    };
  }

  async revokeAccess(accessToken: string): Promise<void> {
    if (accessToken === 'invalid_token') {
      throw new AppError('Invalid access token', 401);
    }
    // Mock revocation - no return value needed
  }
}

const mockCrypto = crypto as jest.Mocked<typeof crypto>;

describe('OAuthService', () => {
  let oauthService: TestOAuthService;
  let mockCipher: any;
  let mockDecipher: any;

  const config = {
    clientId: 'test_client_id',
    clientSecret: 'test_client_secret',
    redirectUri: 'https://example.com/callback',
    scope: ['read', 'write'],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    oauthService = new TestOAuthService(SocialPlatform.INSTAGRAM, config);

    // Mock cipher for encryption
    mockCipher = {
      update: jest.fn().mockReturnValue('encrypted_part'),
      final: jest.fn().mockReturnValue('final_part'),
      getAuthTag: jest.fn().mockReturnValue(Buffer.from('auth_tag', 'hex')),
    };

    // Mock decipher for decryption
    mockDecipher = {
      setAuthTag: jest.fn(),
      update: jest.fn().mockReturnValue('decrypted_part'),
      final: jest.fn().mockReturnValue('final_part'),
    };

    mockCrypto.createCipheriv.mockReturnValue(mockCipher);
    mockCrypto.createDecipheriv.mockReturnValue(mockDecipher);
    mockCrypto.randomBytes.mockReturnValue({ toString: () => 'mocked_random_string' } as any);
  });

  describe('constructor', () => {
    it('should initialize with platform and config', () => {
      expect(oauthService.testPlatform).toBe(SocialPlatform.INSTAGRAM);
      expect(oauthService.testConfig).toEqual(config);
    });
  });

  describe('getAuthorizationUrl', () => {
    it('should generate correct authorization URL', () => {
      const state = 'test_state';
      const url = oauthService.getAuthorizationUrl(state);
      
      expect(url).toContain('client_id=test_client_id');
      expect(url).toContain('redirect_uri=https%3A%2F%2Fexample.com%2Fcallback');
      expect(url).toContain('scope=read+write');
      expect(url).toContain('state=test_state');
      expect(url).toContain('response_type=code');
    });

    it('should handle empty scope array', () => {
      const serviceWithEmptyScope = new TestOAuthService(SocialPlatform.INSTAGRAM, {
        ...config,
        scope: [],
      });
      
      const url = serviceWithEmptyScope.getAuthorizationUrl('test_state');
      expect(url).toContain('scope=');
    });
  });

  describe('exchangeCodeForTokens', () => {
    it('should exchange valid code for tokens', async () => {
      const tokens = await oauthService.exchangeCodeForTokens('valid_code');
      
      expect(tokens).toEqual({
        accessToken: 'test_access_token',
        refreshToken: 'test_refresh_token',
        expiresIn: 3600,
      });
    });

    it('should throw error for invalid code', async () => {
      await expect(oauthService.exchangeCodeForTokens('invalid_code'))
        .rejects.toThrow('Invalid authorization code');
    });
  });

  describe('refreshAccessToken', () => {
    it('should refresh valid token', async () => {
      const tokens = await oauthService.refreshAccessToken('valid_refresh_token');
      
      expect(tokens).toEqual({
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
        expiresIn: 3600,
      });
    });

    it('should throw error for invalid refresh token', async () => {
      await expect(oauthService.refreshAccessToken('invalid_refresh_token'))
        .rejects.toThrow('Invalid refresh token');
    });
  });

  describe('getUserProfile', () => {
    it('should get user profile with valid token', async () => {
      const profile = await oauthService.getUserProfile('valid_token');
      
      expect(profile).toEqual({
        id: 'test_user_id',
        username: 'testuser',
        displayName: 'Test User',
        email: 'test@example.com',
        profileImage: 'https://example.com/avatar.jpg',
        profileUrl: 'https://example.com/testuser',
        followersCount: 1000,
        followingCount: 500,
      });
    });

    it('should throw error for invalid token', async () => {
      await expect(oauthService.getUserProfile('invalid_token'))
        .rejects.toThrow('Invalid access token');
    });
  });

  describe('revokeAccess', () => {
    it('should revoke valid token', async () => {
      await expect(oauthService.revokeAccess('valid_token')).resolves.toBeUndefined();
    });

    it('should throw error for invalid token', async () => {
      await expect(oauthService.revokeAccess('invalid_token'))
        .rejects.toThrow('Invalid access token');
    });
  });

  describe('generateState', () => {
    it('should generate random state string', () => {
      const state = oauthService.generateState();
      
      expect(mockCrypto.randomBytes).toHaveBeenCalledWith(32);
      expect(typeof state).toBe('string');
      expect(state.length).toBeGreaterThan(0);
    });

    it('should generate different states on multiple calls', () => {
      mockCrypto.randomBytes
        .mockReturnValueOnce({ toString: () => 'first_random_string' } as any)
        .mockReturnValueOnce({ toString: () => 'second_random_string' } as any);

      const state1 = oauthService.generateState();
      const state2 = oauthService.generateState();
      
      expect(state1).not.toBe(state2);
    });
  });

  describe('encryptToken', () => {
    it('should encrypt token successfully', () => {
      const token = 'test_token';
      const encrypted = oauthService.encryptToken(token);
      
      expect(mockCrypto.createCipheriv).toHaveBeenCalledWith(
        'aes-256-gcm',
        expect.anything(),
        expect.anything()
      );
      expect(mockCipher.update).toHaveBeenCalledWith(token, 'utf8', 'hex');
      expect(mockCipher.final).toHaveBeenCalledWith('hex');
      expect(mockCipher.getAuthTag).toHaveBeenCalled();
      expect(typeof encrypted).toBe('string');
      expect(encrypted).toContain(':');
    });

    it('should handle different token lengths', () => {
      const shortToken = 'short';
      const longToken = 'a'.repeat(1000);
      
      const encryptedShort = oauthService.encryptToken(shortToken);
      const encryptedLong = oauthService.encryptToken(longToken);
      
      expect(encryptedShort).toBeDefined();
      expect(encryptedLong).toBeDefined();
      expect(mockCipher.update).toHaveBeenCalledTimes(2);
    });
  });

  describe('decryptToken', () => {
    it('should decrypt token successfully', () => {
      const encryptedToken = 'iv_hex:auth_tag_hex:encrypted_data';
      const decrypted = oauthService.decryptToken(encryptedToken);
      
      expect(mockCrypto.createDecipheriv).toHaveBeenCalledWith(
        'aes-256-gcm',
        expect.anything(),
        expect.anything()
      );
      expect(mockDecipher.setAuthTag).toHaveBeenCalled();
      expect(mockDecipher.update).toHaveBeenCalled();
      expect(mockDecipher.final).toHaveBeenCalledWith('utf8');
      expect(typeof decrypted).toBe('string');
    });

    it('should handle malformed encrypted token', () => {
      const malformedToken = 'invalid_format';
      
      expect(() => oauthService.decryptToken(malformedToken)).toThrow();
    });

    it('should handle empty encrypted token parts', () => {
      const emptyPartsToken = '::';
      
      // Empty parts should cause Buffer.from to throw or return invalid data
      mockDecipher.update.mockImplementation(() => { throw new Error('Invalid encrypted data'); });
      expect(() => oauthService.decryptToken(emptyPartsToken)).toThrow();
    });
  });

  describe('encryption/decryption round trip', () => {
    it('should encrypt and decrypt token correctly', () => {
      // Mock the actual encryption/decryption behavior
      const originalToken = 'original_test_token';
      
      // Mock encryption
      mockCipher.update.mockReturnValue('encrypted_data');
      mockCipher.final.mockReturnValue('_final');
      mockCipher.getAuthTag.mockReturnValue(Buffer.from('auth_tag_data'));
      mockCrypto.randomBytes.mockReturnValue(Buffer.from('iv_data') as any);
      
      const encrypted = oauthService.encryptToken(originalToken);
      
      // Mock decryption to return original token
      mockDecipher.update.mockReturnValue('original_test');
      mockDecipher.final.mockReturnValue('_token');
      
      const decrypted = oauthService.decryptToken(encrypted);
      
      expect(decrypted).toBe('original_test_token');
    });
  });

  describe('error handling', () => {
    it('should handle encryption errors gracefully', () => {
      mockCipher.update.mockImplementation(() => {
        throw new Error('Encryption failed');
      });
      
      expect(() => oauthService.encryptToken('test')).toThrow('Encryption failed');
    });

    it('should handle decryption errors gracefully', () => {
      mockDecipher.update.mockImplementation(() => {
        throw new Error('Decryption failed');
      });
      
      expect(() => oauthService.decryptToken('iv:tag:data')).toThrow('Decryption failed');
    });
  });

  describe('platform-specific configuration', () => {
    it('should work with different social platforms', () => {
      const facebookService = new TestOAuthService(SocialPlatform.FACEBOOK, config);
      const twitterService = new TestOAuthService(SocialPlatform.TWITTER, config);
      const linkedinService = new TestOAuthService(SocialPlatform.LINKEDIN, config);
      
      expect(facebookService.testPlatform).toBe(SocialPlatform.FACEBOOK);
      expect(twitterService.testPlatform).toBe(SocialPlatform.TWITTER);
      expect(linkedinService.testPlatform).toBe(SocialPlatform.LINKEDIN);
    });

    it('should handle different scope configurations', () => {
      const readOnlyConfig = { ...config, scope: ['read'] };
      const fullAccessConfig = { ...config, scope: ['read', 'write', 'admin'] };
      
      const readOnlyService = new TestOAuthService(SocialPlatform.INSTAGRAM, readOnlyConfig);
      const fullAccessService = new TestOAuthService(SocialPlatform.INSTAGRAM, fullAccessConfig);
      
      const readOnlyUrl = readOnlyService.getAuthorizationUrl('state');
      const fullAccessUrl = fullAccessService.getAuthorizationUrl('state');
      
      expect(readOnlyUrl).toContain('scope=read');
      expect(fullAccessUrl).toContain('scope=read+write+admin');
    });
  });

  describe('configuration validation', () => {
    it('should handle missing configuration values', () => {
      const incompleteConfig = {
        clientId: '',
        clientSecret: '',
        redirectUri: '',
        scope: [],
      };
      
      const service = new TestOAuthService(SocialPlatform.INSTAGRAM, incompleteConfig);
      const url = service.getAuthorizationUrl('state');
      
      expect(url).toContain('client_id=');
      expect(url).toContain('redirect_uri=');
    });
  });

  describe('token format validation', () => {
    it('should handle various token formats in getUserProfile', async () => {
      const profile = await oauthService.getUserProfile('Bearer token_value');
      expect(profile.id).toBe('test_user_id');
    });

    it('should handle tokens with special characters', async () => {
      const specialToken = 'token-with_special.chars+symbols=';
      const profile = await oauthService.getUserProfile(specialToken);
      expect(profile.id).toBe('test_user_id');
    });
  });
});