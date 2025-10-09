import crypto from 'crypto';
import { SocialPlatform } from '@prisma/client';
import { getCacheService } from './redis';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * OAuth State Data stored in Redis
 */
export interface OAuthStateData {
  userId: string;
  platform: SocialPlatform;
  organizationId?: string;
  timestamp: number;
  codeVerifier?: string; // For PKCE flow (Twitter)
}

/**
 * OAuth State Management Service
 * Prevents CSRF attacks by managing state parameters with Redis
 *
 * Security Features:
 * - Cryptographically random state generation
 * - Short TTL (5 minutes) to prevent stale attacks
 * - Single-use states (deleted after validation)
 * - Platform validation to prevent cross-platform attacks
 * - Timestamp validation for additional security
 */
export class OAuthStateService {
  private cacheService = getCacheService();
  private readonly STATE_PREFIX = 'oauth:state:';
  private readonly STATE_TTL = 300; // 5 minutes
  private readonly MAX_STATE_AGE = 300000; // 5 minutes in milliseconds

  /**
   * Generate a cryptographically secure state parameter
   * @returns 64-character hex string (256 bits of entropy)
   */
  generateState(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Store OAuth state in Redis with short TTL
   * @param state - The state parameter
   * @param data - OAuth state data including userId, platform, etc.
   * @returns Promise<boolean> - true if successfully stored
   */
  async storeState(state: string, data: OAuthStateData): Promise<boolean> {
    try {
      const key = this.getStateKey(state);
      const stateData: OAuthStateData = {
        ...data,
        timestamp: Date.now()
      };

      const success = await this.cacheService.set(key, stateData, this.STATE_TTL);

      if (success) {
        logger.info('OAuth state stored', {
          state: state.substring(0, 8) + '...', // Log only prefix for security
          platform: data.platform,
          userId: data.userId
        });
      } else {
        logger.error('Failed to store OAuth state', { state: state.substring(0, 8) + '...' });
      }

      return success;
    } catch (error) {
      logger.error('Error storing OAuth state', { error, state: state.substring(0, 8) + '...' });
      throw new AppError('Failed to store OAuth state', 500);
    }
  }

  /**
   * Validate and retrieve OAuth state from Redis
   * @param state - The state parameter to validate
   * @param platform - Expected platform (for additional validation)
   * @returns Promise<OAuthStateData> - The stored state data
   * @throws AppError if state is invalid, expired, or platform mismatch
   */
  async validateAndRetrieveState(state: string, platform: SocialPlatform): Promise<OAuthStateData> {
    try {
      // Check if state parameter exists
      if (!state || typeof state !== 'string') {
        logger.warn('Invalid state parameter format', { state });
        throw new AppError('Invalid state parameter', 400);
      }

      const key = this.getStateKey(state);
      const stateData = await this.cacheService.get<OAuthStateData>(key);

      // State not found or expired
      if (!stateData) {
        logger.warn('OAuth state not found or expired', {
          state: state.substring(0, 8) + '...',
          platform
        });
        throw new AppError('Invalid or expired state parameter', 400);
      }

      // Validate platform matches
      if (stateData.platform !== platform) {
        logger.warn('OAuth state platform mismatch', {
          state: state.substring(0, 8) + '...',
          expected: platform,
          actual: stateData.platform
        });
        throw new AppError('State platform mismatch - possible CSRF attack', 403);
      }

      // Validate timestamp (additional check beyond Redis TTL)
      const age = Date.now() - stateData.timestamp;
      if (age > this.MAX_STATE_AGE) {
        logger.warn('OAuth state too old', {
          state: state.substring(0, 8) + '...',
          age: age,
          maxAge: this.MAX_STATE_AGE
        });
        throw new AppError('State parameter expired', 400);
      }

      // Delete state immediately to prevent reuse (single-use only)
      await this.deleteState(state);

      logger.info('OAuth state validated successfully', {
        state: state.substring(0, 8) + '...',
        platform: stateData.platform,
        userId: stateData.userId,
        age: age
      });

      return stateData;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error validating OAuth state', { error, state: state.substring(0, 8) + '...' });
      throw new AppError('Failed to validate OAuth state', 500);
    }
  }

  /**
   * Delete OAuth state from Redis
   * Called automatically after validation to prevent reuse
   * @param state - The state parameter to delete
   * @returns Promise<boolean> - true if successfully deleted
   */
  async deleteState(state: string): Promise<boolean> {
    try {
      const key = this.getStateKey(state);
      const deleted = await this.cacheService.del(key);

      if (deleted) {
        logger.debug('OAuth state deleted', { state: state.substring(0, 8) + '...' });
      }

      return deleted;
    } catch (error) {
      logger.error('Error deleting OAuth state', { error, state: state.substring(0, 8) + '...' });
      return false;
    }
  }

  /**
   * Check if a state exists in Redis (without deleting it)
   * Useful for debugging or admin purposes
   * @param state - The state parameter to check
   * @returns Promise<boolean> - true if state exists
   */
  async stateExists(state: string): Promise<boolean> {
    try {
      const key = this.getStateKey(state);
      return await this.cacheService.exists(key);
    } catch (error) {
      logger.error('Error checking OAuth state existence', { error, state: state.substring(0, 8) + '...' });
      return false;
    }
  }

  /**
   * Get remaining TTL for a state (for debugging)
   * @param state - The state parameter
   * @returns Promise<number> - TTL in seconds (-1 if expired, -2 if doesn't exist)
   */
  async getStateTTL(state: string): Promise<number> {
    try {
      const key = this.getStateKey(state);
      return await this.cacheService.ttl(key);
    } catch (error) {
      logger.error('Error getting OAuth state TTL', { error, state: state.substring(0, 8) + '...' });
      return -2;
    }
  }

  /**
   * Clean up all expired OAuth states (maintenance operation)
   * Note: Redis automatically handles TTL expiration, but this is for manual cleanup
   * @returns Promise<number> - Number of states deleted
   */
  async cleanupExpiredStates(): Promise<number> {
    try {
      // Redis automatically handles TTL expiration
      // This method is kept for compatibility but doesn't need to do anything
      logger.info('OAuth state cleanup completed (automatic via Redis TTL)');
      return 0;
    } catch (error) {
      logger.error('Error cleaning up OAuth states', { error });
      return 0;
    }
  }

  /**
   * Get Redis key for OAuth state
   * @param state - The state parameter
   * @returns Full Redis key with prefix
   */
  private getStateKey(state: string): string {
    return `${this.STATE_PREFIX}${state}`;
  }

  /**
   * Generate authorization URL with state
   * Helper method that combines state generation with URL building
   * @param userId - User ID
   * @param platform - Social platform
   * @param organizationId - Optional organization ID
   * @param codeVerifier - Optional PKCE code verifier (for Twitter)
   * @returns Promise<{ state: string, authUrl: string }> - Generated state and URL
   */
  async generateAuthorizationState(
    userId: string,
    platform: SocialPlatform,
    organizationId?: string,
    codeVerifier?: string
  ): Promise<string> {
    const state = this.generateState();

    const stateData: OAuthStateData = {
      userId,
      platform,
      organizationId,
      timestamp: Date.now(),
      codeVerifier
    };

    const stored = await this.storeState(state, stateData);
    if (!stored) {
      throw new AppError('Failed to initialize OAuth flow', 500);
    }

    return state;
  }
}

// Singleton instance
let oauthStateServiceInstance: OAuthStateService | null = null;

/**
 * Get OAuth State Service singleton instance
 */
export function getOAuthStateService(): OAuthStateService {
  if (!oauthStateServiceInstance) {
    oauthStateServiceInstance = new OAuthStateService();
  }
  return oauthStateServiceInstance;
}
