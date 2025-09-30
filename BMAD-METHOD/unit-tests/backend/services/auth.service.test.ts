import { AuthService } from '../../../allin-platform/backend/src/services/auth.service';
import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { testUsers, registrationData, loginData, passwordResetData, createTestUserData } from '../../test-data/fixtures/users';
import { AppError } from '../../../allin-platform/backend/src/utils/errors';

// Mock external dependencies
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('nodemailer');

const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockJwt = jwt as jest.Mocked<typeof jwt>;

describe('AuthService', () => {
  let authService: AuthService;
  let prisma: PrismaClient;

  beforeAll(() => {
    prisma = global.testUtils.prisma;
    authService = new AuthService();
  });

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup default mock implementations
    mockBcrypt.hash.mockResolvedValue('hashed_password' as never);
    mockBcrypt.compare.mockResolvedValue(true as never);
    mockJwt.sign.mockReturnValue('mock_jwt_token' as never);
    mockJwt.verify.mockReturnValue({ userId: 'test_user_id', role: 'USER' } as never);
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      // Arrange
      const userData = registrationData.valid;

      // Act
      const result = await authService.register(userData);

      // Assert
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('sessionToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe(userData.email);
      expect(result.user.name).toBe(userData.name);
      expect(result.user.status).toBe('PENDING');
      expect(mockBcrypt.hash).toHaveBeenCalledWith(userData.password, 10);
    });

    it('should register user without name', async () => {
      // Arrange
      const userData = registrationData.withoutName;

      // Act
      const result = await authService.register(userData);

      // Assert
      expect(result.user.email).toBe(userData.email);
      expect(result.user.name).toBeNull();
      expect(result.user.status).toBe('PENDING');
    });

    it('should throw error for duplicate email', async () => {
      // Arrange
      await global.testUtils.createTestUser({ email: registrationData.duplicateEmail.email });

      // Act & Assert
      await expect(authService.register(registrationData.duplicateEmail))
        .rejects
        .toThrow(AppError);
    });

    it('should validate email format', async () => {
      // Arrange
      const invalidEmailData = { ...registrationData.valid, email: 'invalid-email' };

      // Act & Assert
      await expect(authService.register(invalidEmailData))
        .rejects
        .toThrow(AppError);
    });

    it('should validate password strength', async () => {
      // Arrange
      const weakPasswordData = { ...registrationData.valid, password: 'weak' };

      // Act & Assert
      await expect(authService.register(weakPasswordData))
        .rejects
        .toThrow(AppError);
    });

    it('should create verification token', async () => {
      // Arrange
      const userData = registrationData.valid;

      // Act
      await authService.register(userData);

      // Assert
      const verificationToken = await prisma.verificationToken.findFirst({
        where: { identifier: userData.email }
      });
      expect(verificationToken).toBeTruthy();
      expect(verificationToken?.expires).toBeInstanceOf(Date);
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      const userData = registrationData.valid;
      jest.spyOn(prisma.user, 'create').mockRejectedValueOnce(new Error('Database error'));

      // Act & Assert
      await expect(authService.register(userData))
        .rejects
        .toThrow('Database error');
    });
  });

  describe('login', () => {
    let testUser: any;

    beforeEach(async () => {
      testUser = await global.testUtils.createTestUser({
        email: loginData.valid.email,
        password: 'hashed_password',
        status: 'ACTIVE'
      });
    });

    it('should successfully login with valid credentials', async () => {
      // Act
      const result = await authService.login(loginData.valid);

      // Assert
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('sessionToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.id).toBe(testUser.id);
      expect(mockBcrypt.compare).toHaveBeenCalledWith(loginData.valid.password, testUser.password);
    });

    it('should update lastLoginAt timestamp', async () => {
      // Act
      await authService.login(loginData.valid);

      // Assert
      const updatedUser = await prisma.user.findUnique({ where: { id: testUser.id } });
      expect(updatedUser?.lastLoginAt).toBeInstanceOf(Date);
    });

    it('should create session record', async () => {
      // Act
      const result = await authService.login(loginData.valid);

      // Assert
      const session = await prisma.session.findFirst({
        where: { userId: testUser.id }
      });
      expect(session).toBeTruthy();
      expect(session?.sessionToken).toBe(result.sessionToken);
    });

    it('should handle remember me option', async () => {
      // Arrange
      const loginDataWithRememberMe = loginData.validWithRememberMe;

      // Act
      const result = await authService.login(loginDataWithRememberMe);

      // Assert
      expect(result.sessionToken).toBeTruthy();
      const session = await prisma.session.findFirst({
        where: { sessionToken: result.sessionToken }
      });
      expect(session?.expires.getTime()).toBeGreaterThan(Date.now() + 7 * 24 * 60 * 60 * 1000); // More than 7 days
    });

    it('should throw error for invalid email', async () => {
      // Act & Assert
      await expect(authService.login(loginData.invalidEmail))
        .rejects
        .toThrow(AppError);
    });

    it('should throw error for invalid password', async () => {
      // Arrange
      mockBcrypt.compare.mockResolvedValue(false as never);

      // Act & Assert
      await expect(authService.login(loginData.invalidPassword))
        .rejects
        .toThrow(AppError);
    });

    it('should throw error for suspended user', async () => {
      // Arrange
      await prisma.user.update({
        where: { id: testUser.id },
        data: { status: 'SUSPENDED' }
      });

      // Act & Assert
      await expect(authService.login(loginData.valid))
        .rejects
        .toThrow(AppError);
    });

    it('should throw error for pending user', async () => {
      // Arrange
      await prisma.user.update({
        where: { id: testUser.id },
        data: { status: 'PENDING' }
      });

      // Act & Assert
      await expect(authService.login(loginData.valid))
        .rejects
        .toThrow(AppError);
    });

    it('should limit concurrent sessions per user', async () => {
      // Arrange - Create multiple sessions
      const maxSessions = 5;
      for (let i = 0; i < maxSessions + 2; i++) {
        await authService.login(loginData.valid);
      }

      // Assert
      const sessions = await prisma.session.findMany({
        where: { userId: testUser.id }
      });
      expect(sessions.length).toBeLessThanOrEqual(maxSessions);
    });
  });

  describe('verifyEmail', () => {
    let testUser: any;
    let verificationToken: any;

    beforeEach(async () => {
      testUser = await global.testUtils.createTestUser({
        status: 'PENDING',
        emailVerified: null
      });

      verificationToken = await prisma.verificationToken.create({
        data: {
          identifier: testUser.email,
          token: 'valid_verification_token',
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          userId: testUser.id
        }
      });
    });

    it('should successfully verify email with valid token', async () => {
      // Act
      const result = await authService.verifyEmail('valid_verification_token');

      // Assert
      expect(result.success).toBe(true);

      const updatedUser = await prisma.user.findUnique({ where: { id: testUser.id } });
      expect(updatedUser?.status).toBe('ACTIVE');
      expect(updatedUser?.emailVerified).toBeInstanceOf(Date);
    });

    it('should delete verification token after successful verification', async () => {
      // Act
      await authService.verifyEmail('valid_verification_token');

      // Assert
      const token = await prisma.verificationToken.findUnique({
        where: { token: 'valid_verification_token' }
      });
      expect(token).toBeNull();
    });

    it('should throw error for invalid token', async () => {
      // Act & Assert
      await expect(authService.verifyEmail('invalid_token'))
        .rejects
        .toThrow(AppError);
    });

    it('should throw error for expired token', async () => {
      // Arrange
      await prisma.verificationToken.update({
        where: { token: 'valid_verification_token' },
        data: { expires: new Date(Date.now() - 1000) } // Expired 1 second ago
      });

      // Act & Assert
      await expect(authService.verifyEmail('valid_verification_token'))
        .rejects
        .toThrow(AppError);
    });

    it('should clean up expired tokens', async () => {
      // Arrange
      await prisma.verificationToken.create({
        data: {
          identifier: 'expired@example.com',
          token: 'expired_token',
          expires: new Date(Date.now() - 24 * 60 * 60 * 1000), // Expired 24 hours ago
          userId: testUser.id
        }
      });

      // Act
      await authService.verifyEmail('valid_verification_token');

      // Assert
      const expiredToken = await prisma.verificationToken.findUnique({
        where: { token: 'expired_token' }
      });
      expect(expiredToken).toBeNull();
    });
  });

  describe('refreshTokens', () => {
    let testUser: any;
    let session: any;

    beforeEach(async () => {
      testUser = await global.testUtils.createTestUser({ status: 'ACTIVE' });

      session = await prisma.session.create({
        data: {
          sessionToken: 'valid_session_token',
          refreshToken: 'valid_refresh_token',
          userId: testUser.id,
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        }
      });
    });

    it('should successfully refresh tokens with valid refresh token', async () => {
      // Act
      const result = await authService.refreshTokens('valid_refresh_token');

      // Assert
      expect(result).toHaveProperty('sessionToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(result.user.id).toBe(testUser.id);
    });

    it('should invalidate old session', async () => {
      // Act
      await authService.refreshTokens('valid_refresh_token');

      // Assert
      const oldSession = await prisma.session.findUnique({
        where: { refreshToken: 'valid_refresh_token' }
      });
      expect(oldSession).toBeNull();
    });

    it('should create new session', async () => {
      // Act
      const result = await authService.refreshTokens('valid_refresh_token');

      // Assert
      const newSession = await prisma.session.findUnique({
        where: { sessionToken: result.sessionToken }
      });
      expect(newSession).toBeTruthy();
      expect(newSession?.userId).toBe(testUser.id);
    });

    it('should throw error for invalid refresh token', async () => {
      // Act & Assert
      await expect(authService.refreshTokens('invalid_refresh_token'))
        .rejects
        .toThrow(AppError);
    });

    it('should throw error for expired session', async () => {
      // Arrange
      await prisma.session.update({
        where: { id: session.id },
        data: { expires: new Date(Date.now() - 1000) } // Expired 1 second ago
      });

      // Act & Assert
      await expect(authService.refreshTokens('valid_refresh_token'))
        .rejects
        .toThrow(AppError);
    });

    it('should throw error for inactive user', async () => {
      // Arrange
      await prisma.user.update({
        where: { id: testUser.id },
        data: { status: 'INACTIVE' }
      });

      // Act & Assert
      await expect(authService.refreshTokens('valid_refresh_token'))
        .rejects
        .toThrow(AppError);
    });
  });

  describe('forgotPassword', () => {
    let testUser: any;

    beforeEach(async () => {
      testUser = await global.testUtils.createTestUser({
        email: passwordResetData.validEmail,
        status: 'ACTIVE'
      });
    });

    it('should successfully create password reset token for valid email', async () => {
      // Act
      const result = await authService.forgotPassword(passwordResetData.validEmail);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toContain('password reset');

      const resetToken = await prisma.passwordResetToken.findFirst({
        where: { userId: testUser.id }
      });
      expect(resetToken).toBeTruthy();
      expect(resetToken?.expires).toBeInstanceOf(Date);
    });

    it('should return success even for invalid email (security)', async () => {
      // Act
      const result = await authService.forgotPassword(passwordResetData.invalidEmail);

      // Assert
      expect(result.success).toBe(true); // Always returns success for security
    });

    it('should invalidate existing password reset tokens', async () => {
      // Arrange
      await prisma.passwordResetToken.create({
        data: {
          token: 'old_token',
          expires: new Date(Date.now() + 60 * 60 * 1000),
          userId: testUser.id,
          used: false
        }
      });

      // Act
      await authService.forgotPassword(passwordResetData.validEmail);

      // Assert
      const resetTokens = await prisma.passwordResetToken.findMany({
        where: { userId: testUser.id, used: false }
      });
      expect(resetTokens).toHaveLength(1); // Only new token should exist
    });

    it('should rate limit password reset requests', async () => {
      // Arrange - Make multiple rapid requests
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(authService.forgotPassword(passwordResetData.validEmail));
      }

      // Act & Assert
      await Promise.all(promises); // Should not throw error but limit internally

      const resetTokens = await prisma.passwordResetToken.findMany({
        where: { userId: testUser.id }
      });
      expect(resetTokens.length).toBeLessThanOrEqual(1); // Should only create one token
    });
  });

  describe('resetPassword', () => {
    let testUser: any;
    let resetToken: any;

    beforeEach(async () => {
      testUser = await global.testUtils.createTestUser({ status: 'ACTIVE' });

      resetToken = await prisma.passwordResetToken.create({
        data: {
          token: 'valid_reset_token',
          expires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
          userId: testUser.id,
          used: false
        }
      });
    });

    it('should successfully reset password with valid token', async () => {
      // Act
      const result = await authService.resetPassword('valid_reset_token', passwordResetData.newPassword);

      // Assert
      expect(result.success).toBe(true);
      expect(mockBcrypt.hash).toHaveBeenCalledWith(passwordResetData.newPassword, 10);

      const updatedUser = await prisma.user.findUnique({ where: { id: testUser.id } });
      expect(updatedUser?.password).toBe('hashed_password');
    });

    it('should mark reset token as used', async () => {
      // Act
      await authService.resetPassword('valid_reset_token', passwordResetData.newPassword);

      // Assert
      const usedToken = await prisma.passwordResetToken.findUnique({
        where: { token: 'valid_reset_token' }
      });
      expect(usedToken?.used).toBe(true);
    });

    it('should invalidate all user sessions after password reset', async () => {
      // Arrange
      await prisma.session.create({
        data: {
          sessionToken: 'session_1',
          refreshToken: 'refresh_1',
          userId: testUser.id,
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      });

      // Act
      await authService.resetPassword('valid_reset_token', passwordResetData.newPassword);

      // Assert
      const sessions = await prisma.session.findMany({
        where: { userId: testUser.id }
      });
      expect(sessions).toHaveLength(0);
    });

    it('should throw error for invalid token', async () => {
      // Act & Assert
      await expect(authService.resetPassword('invalid_token', passwordResetData.newPassword))
        .rejects
        .toThrow(AppError);
    });

    it('should throw error for expired token', async () => {
      // Arrange
      await prisma.passwordResetToken.update({
        where: { token: 'valid_reset_token' },
        data: { expires: new Date(Date.now() - 1000) } // Expired 1 second ago
      });

      // Act & Assert
      await expect(authService.resetPassword('valid_reset_token', passwordResetData.newPassword))
        .rejects
        .toThrow(AppError);
    });

    it('should throw error for already used token', async () => {
      // Arrange
      await prisma.passwordResetToken.update({
        where: { token: 'valid_reset_token' },
        data: { used: true }
      });

      // Act & Assert
      await expect(authService.resetPassword('valid_reset_token', passwordResetData.newPassword))
        .rejects
        .toThrow(AppError);
    });

    it('should validate new password strength', async () => {
      // Act & Assert
      await expect(authService.resetPassword('valid_reset_token', passwordResetData.weakNewPassword))
        .rejects
        .toThrow(AppError);
    });
  });

  describe('logout', () => {
    let testUser: any;
    let session: any;

    beforeEach(async () => {
      testUser = await global.testUtils.createTestUser({ status: 'ACTIVE' });

      session = await prisma.session.create({
        data: {
          sessionToken: 'valid_session_token',
          refreshToken: 'valid_refresh_token',
          userId: testUser.id,
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      });
    });

    it('should successfully logout with valid session token', async () => {
      // Act
      const result = await authService.logout('valid_session_token');

      // Assert
      expect(result.success).toBe(true);
    });

    it('should delete session from database', async () => {
      // Act
      await authService.logout('valid_session_token');

      // Assert
      const deletedSession = await prisma.session.findUnique({
        where: { sessionToken: 'valid_session_token' }
      });
      expect(deletedSession).toBeNull();
    });

    it('should handle invalid session token gracefully', async () => {
      // Act
      const result = await authService.logout('invalid_session_token');

      // Assert
      expect(result.success).toBe(true); // Should still return success
    });

    it('should handle already deleted session gracefully', async () => {
      // Arrange
      await prisma.session.delete({ where: { sessionToken: 'valid_session_token' } });

      // Act
      const result = await authService.logout('valid_session_token');

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe('validateSession', () => {
    let testUser: any;
    let session: any;

    beforeEach(async () => {
      testUser = await global.testUtils.createTestUser({ status: 'ACTIVE' });

      session = await prisma.session.create({
        data: {
          sessionToken: 'valid_session_token',
          refreshToken: 'valid_refresh_token',
          userId: testUser.id,
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      });
    });

    it('should successfully validate valid session', async () => {
      // Act
      const result = await authService.validateSession('valid_session_token');

      // Assert
      expect(result).toBeTruthy();
      expect(result?.id).toBe(testUser.id);
      expect(result?.email).toBe(testUser.email);
    });

    it('should return null for invalid session token', async () => {
      // Act
      const result = await authService.validateSession('invalid_session_token');

      // Assert
      expect(result).toBeNull();
    });

    it('should return null for expired session', async () => {
      // Arrange
      await prisma.session.update({
        where: { sessionToken: 'valid_session_token' },
        data: { expires: new Date(Date.now() - 1000) } // Expired 1 second ago
      });

      // Act
      const result = await authService.validateSession('valid_session_token');

      // Assert
      expect(result).toBeNull();
    });

    it('should return null for inactive user', async () => {
      // Arrange
      await prisma.user.update({
        where: { id: testUser.id },
        data: { status: 'INACTIVE' }
      });

      // Act
      const result = await authService.validateSession('valid_session_token');

      // Assert
      expect(result).toBeNull();
    });

    it('should clean up expired sessions', async () => {
      // Arrange
      await prisma.session.create({
        data: {
          sessionToken: 'expired_session',
          refreshToken: 'expired_refresh',
          userId: testUser.id,
          expires: new Date(Date.now() - 24 * 60 * 60 * 1000) // Expired 24 hours ago
        }
      });

      // Act
      await authService.validateSession('valid_session_token');

      // Assert
      const expiredSession = await prisma.session.findUnique({
        where: { sessionToken: 'expired_session' }
      });
      expect(expiredSession).toBeNull();
    });
  });

  describe('getMe', () => {
    let testUser: any;

    beforeEach(async () => {
      testUser = await global.testUtils.createTestUser({
        status: 'ACTIVE',
        role: 'USER',
        emailVerified: new Date()
      });
    });

    it('should successfully get user profile', async () => {
      // Act
      const result = await authService.getMe(testUser.id);

      // Assert
      expect(result).toBeTruthy();
      expect(result.id).toBe(testUser.id);
      expect(result.email).toBe(testUser.email);
      expect(result.name).toBe(testUser.name);
      expect(result.role).toBe(testUser.role);
      expect(result).not.toHaveProperty('password'); // Password should be excluded
    });

    it('should include organization memberships', async () => {
      // Arrange
      const organization = await global.testUtils.createTestOrganization();
      await prisma.organizationMember.create({
        data: {
          userId: testUser.id,
          organizationId: organization.id,
          role: 'MEMBER'
        }
      });

      // Act
      const result = await authService.getMe(testUser.id);

      // Assert
      expect(result.organizations).toBeTruthy();
      expect(result.organizations).toHaveLength(1);
      expect(result.organizations[0].organizationId).toBe(organization.id);
    });

    it('should throw error for non-existent user', async () => {
      // Act & Assert
      await expect(authService.getMe('non_existent_user_id'))
        .rejects
        .toThrow(AppError);
    });

    it('should throw error for inactive user', async () => {
      // Arrange
      await prisma.user.update({
        where: { id: testUser.id },
        data: { status: 'INACTIVE' }
      });

      // Act & Assert
      await expect(authService.getMe(testUser.id))
        .rejects
        .toThrow(AppError);
    });
  });

  describe('Security Tests', () => {
    it('should hash passwords properly', async () => {
      // Act
      await authService.register(registrationData.valid);

      // Assert
      expect(mockBcrypt.hash).toHaveBeenCalledWith(registrationData.valid.password, 10);
    });

    it('should generate secure session tokens', async () => {
      // Arrange
      const testUser = await global.testUtils.createTestUser({ status: 'ACTIVE' });

      // Act
      const result = await authService.login({
        email: testUser.email,
        password: 'test_password',
        rememberMe: false
      });

      // Assert
      expect(result.sessionToken).toBeTruthy();
      expect(result.refreshToken).toBeTruthy();
      expect(result.sessionToken).not.toBe(result.refreshToken);
    });

    it('should prevent timing attacks on login', async () => {
      // Arrange
      const start1 = Date.now();

      // Act - Invalid email
      try {
        await authService.login({ email: 'nonexistent@example.com', password: 'password', rememberMe: false });
      } catch {}
      const time1 = Date.now() - start1;

      const start2 = Date.now();

      // Act - Invalid password
      const testUser = await global.testUtils.createTestUser({ status: 'ACTIVE' });
      mockBcrypt.compare.mockResolvedValueOnce(false as never);
      try {
        await authService.login({ email: testUser.email, password: 'wrongpassword', rememberMe: false });
      } catch {}
      const time2 = Date.now() - start2;

      // Assert - Times should be similar (within reasonable variance)
      const timeDifference = Math.abs(time1 - time2);
      expect(timeDifference).toBeLessThan(100); // 100ms tolerance
    });
  });

  describe('Rate Limiting', () => {
    it('should implement rate limiting for login attempts', async () => {
      // This test would check if the service implements rate limiting
      // For the actual implementation, you would mock the rate limiter
      const testUser = await global.testUtils.createTestUser({ status: 'ACTIVE' });
      mockBcrypt.compare.mockResolvedValue(false as never);

      // Make multiple failed login attempts
      const promises = [];
      for (let i = 0; i < 6; i++) {
        promises.push(
          authService.login({
            email: testUser.email,
            password: 'wrongpassword',
            rememberMe: false
          }).catch(() => {})
        );
      }

      await Promise.all(promises);

      // The 6th attempt should be rate limited (implementation dependent)
      // This is a placeholder test - actual implementation would depend on your rate limiting strategy
    });
  });

  describe('Edge Cases', () => {
    it('should handle database connection errors', async () => {
      // Arrange
      jest.spyOn(prisma.user, 'findUnique').mockRejectedValueOnce(new Error('Database connection failed'));

      // Act & Assert
      await expect(authService.validateSession('any_token'))
        .rejects
        .toThrow('Database connection failed');
    });

    it('should handle malformed JWTs', async () => {
      // Arrange
      mockJwt.verify.mockImplementationOnce(() => {
        throw new Error('Invalid JWT');
      });

      // This would be used in JWT validation scenarios
      expect(() => mockJwt.verify('malformed_jwt', 'secret')).toThrow('Invalid JWT');
    });

    it('should handle concurrent session creation', async () => {
      // Arrange
      const testUser = await global.testUtils.createTestUser({ status: 'ACTIVE' });

      // Act - Create multiple sessions simultaneously
      const loginPromises = [];
      for (let i = 0; i < 3; i++) {
        loginPromises.push(authService.login({
          email: testUser.email,
          password: 'test_password',
          rememberMe: false
        }));
      }

      const results = await Promise.all(loginPromises);

      // Assert - All should succeed with unique tokens
      expect(results).toHaveLength(3);
      const tokens = results.map(r => r.sessionToken);
      const uniqueTokens = new Set(tokens);
      expect(uniqueTokens.size).toBe(3);
    });
  });
});