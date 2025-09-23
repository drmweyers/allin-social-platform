import { PrismaClient } from '@prisma/client';
import { encryptOAuthToken, decryptOAuthToken } from '../utils/crypto';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export class OAuthEncryptionService {
  /**
   * Encrypt OAuth tokens before storing in database
   */
  static encryptTokens(accessToken: string, refreshToken?: string) {
    try {
      const encrypted = {
        accessToken: accessToken ? encryptOAuthToken(accessToken) : '',
        refreshToken: refreshToken ? encryptOAuthToken(refreshToken) : undefined,
      };

      logger.info('OAuth tokens encrypted successfully');
      return encrypted;
    } catch (error) {
      logger.error('Failed to encrypt OAuth tokens:', error);
      throw new Error('Failed to encrypt OAuth tokens');
    }
  }

  /**
   * Decrypt OAuth tokens after retrieving from database
   */
  static decryptTokens(encryptedAccessToken: string, encryptedRefreshToken?: string) {
    try {
      const decrypted = {
        accessToken: encryptedAccessToken ? decryptOAuthToken(encryptedAccessToken) : '',
        refreshToken: encryptedRefreshToken ? decryptOAuthToken(encryptedRefreshToken) : undefined,
      };

      logger.info('OAuth tokens decrypted successfully');
      return decrypted;
    } catch (error) {
      logger.error('Failed to decrypt OAuth tokens:', error);
      throw new Error('Failed to decrypt OAuth tokens');
    }
  }

  /**
   * Create or update social account with encrypted tokens
   */
  static async createSocialAccount(data: {
    userId: string;
    organizationId?: string;
    platform: string;
    platformId: string;
    username?: string;
    displayName?: string;
    profileUrl?: string;
    profileImage?: string;
    accessToken: string;
    refreshToken?: string;
    tokenExpiry?: Date;
    scope: string[];
    platformData?: any;
    followersCount?: number;
    followingCount?: number;
    postsCount?: number;
  }) {
    try {
      // Encrypt the tokens before storing
      const encryptedTokens = this.encryptTokens(data.accessToken, data.refreshToken);

      const socialAccount = await prisma.socialAccount.create({
        data: {
          ...data,
          platform: data.platform as any, // Type assertion for enum
          accessToken: encryptedTokens.accessToken,
          refreshToken: encryptedTokens.refreshToken,
        },
      });

      logger.info(`Social account created for user ${data.userId} on ${data.platform}`);
      return socialAccount;
    } catch (error) {
      logger.error('Failed to create social account:', error);
      throw new Error('Failed to create social account');
    }
  }

  /**
   * Update social account tokens with encryption
   */
  static async updateSocialAccountTokens(
    socialAccountId: string,
    accessToken: string,
    refreshToken?: string,
    tokenExpiry?: Date
  ) {
    try {
      // Encrypt the new tokens
      const encryptedTokens = this.encryptTokens(accessToken, refreshToken);

      const updatedAccount = await prisma.socialAccount.update({
        where: { id: socialAccountId },
        data: {
          accessToken: encryptedTokens.accessToken,
          refreshToken: encryptedTokens.refreshToken,
          tokenExpiry,
          lastSyncAt: new Date(),
        },
      });

      logger.info(`Social account tokens updated for account ${socialAccountId}`);
      return updatedAccount;
    } catch (error) {
      logger.error('Failed to update social account tokens:', error);
      throw new Error('Failed to update social account tokens');
    }
  }

  /**
   * Get social account with decrypted tokens
   */
  static async getSocialAccountWithTokens(socialAccountId: string) {
    try {
      const socialAccount = await prisma.socialAccount.findUnique({
        where: { id: socialAccountId },
        include: {
          user: true,
          organization: true,
        },
      });

      if (!socialAccount) {
        throw new Error('Social account not found');
      }

      // Decrypt the tokens
      const decryptedTokens = this.decryptTokens(
        socialAccount.accessToken,
        socialAccount.refreshToken || undefined
      );

      return {
        ...socialAccount,
        accessToken: decryptedTokens.accessToken,
        refreshToken: decryptedTokens.refreshToken,
      };
    } catch (error) {
      logger.error('Failed to get social account with tokens:', error);
      throw new Error('Failed to get social account with tokens');
    }
  }

  /**
   * Get all social accounts for a user with decrypted tokens
   */
  static async getUserSocialAccountsWithTokens(userId: string) {
    try {
      const socialAccounts = await prisma.socialAccount.findMany({
        where: { userId },
        include: {
          organization: true,
        },
      });

      // Decrypt tokens for each account
      const accountsWithDecryptedTokens = socialAccounts.map(account => {
        const decryptedTokens = this.decryptTokens(
          account.accessToken,
          account.refreshToken || undefined
        );

        return {
          ...account,
          accessToken: decryptedTokens.accessToken,
          refreshToken: decryptedTokens.refreshToken,
        };
      });

      logger.info(`Retrieved ${accountsWithDecryptedTokens.length} social accounts for user ${userId}`);
      return accountsWithDecryptedTokens;
    } catch (error) {
      logger.error('Failed to get user social accounts:', error);
      throw new Error('Failed to get user social accounts');
    }
  }

  /**
   * Delete social account (tokens are automatically encrypted so safe to delete)
   */
  static async deleteSocialAccount(socialAccountId: string) {
    try {
      await prisma.socialAccount.delete({
        where: { id: socialAccountId },
      });

      logger.info(`Social account ${socialAccountId} deleted`);
    } catch (error) {
      logger.error('Failed to delete social account:', error);
      throw new Error('Failed to delete social account');
    }
  }

  /**
   * Rotate encryption key (re-encrypt all existing tokens)
   * This should be run during maintenance windows
   */
  static async rotateEncryptionKey(oldDecryptionFunction: (token: string) => string) {
    try {
      logger.info('Starting OAuth token encryption key rotation');

      const socialAccounts = await prisma.socialAccount.findMany({
        select: {
          id: true,
          accessToken: true,
          refreshToken: true,
        },
      });

      let rotatedCount = 0;
      const batchSize = 100;

      for (let i = 0; i < socialAccounts.length; i += batchSize) {
        const batch = socialAccounts.slice(i, i + batchSize);

        await Promise.all(
          batch.map(async account => {
            try {
              // Decrypt with old key
              const oldAccessToken = oldDecryptionFunction(account.accessToken);
              const oldRefreshToken = account.refreshToken
                ? oldDecryptionFunction(account.refreshToken)
                : undefined;

              // Encrypt with new key
              const newEncryptedTokens = this.encryptTokens(oldAccessToken, oldRefreshToken);

              // Update in database
              await prisma.socialAccount.update({
                where: { id: account.id },
                data: {
                  accessToken: newEncryptedTokens.accessToken,
                  refreshToken: newEncryptedTokens.refreshToken,
                },
              });

              rotatedCount++;
            } catch (error) {
              logger.error(`Failed to rotate encryption for account ${account.id}:`, error);
            }
          })
        );

        logger.info(`Rotated encryption for ${Math.min(i + batchSize, socialAccounts.length)} accounts`);
      }

      logger.info(`OAuth token encryption key rotation completed. Rotated ${rotatedCount} accounts`);
      return { rotatedCount, totalAccounts: socialAccounts.length };
    } catch (error) {
      logger.error('Failed to rotate encryption key:', error);
      throw new Error('Failed to rotate encryption key');
    }
  }

  /**
   * Health check - verify encryption/decryption is working
   */
  static async healthCheck() {
    try {
      const testToken = 'test-oauth-token-12345';
      const encrypted = encryptOAuthToken(testToken);
      const decrypted = decryptOAuthToken(encrypted);

      if (decrypted !== testToken) {
        throw new Error('Encryption/decryption verification failed');
      }

      logger.info('OAuth encryption service health check passed');
      return { status: 'healthy', timestamp: new Date().toISOString() };
    } catch (error) {
      logger.error('OAuth encryption service health check failed:', error);
      return { status: 'unhealthy', error: error.message, timestamp: new Date().toISOString() };
    }
  }
}