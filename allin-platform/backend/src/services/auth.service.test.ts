// Set up environment before importing services
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

import { authService } from './auth.service';
import { AppError } from '../utils/errors';

// Mock all dependencies
jest.mock('./database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    session: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    verificationToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    passwordResetToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.mock('./email.service', () => ({
  emailService: {
    sendVerificationEmail: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
  },
}));

jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn(),
  TokenExpiredError: class TokenExpiredError extends Error {},
  JsonWebTokenError: class JsonWebTokenError extends Error {},
}));

jest.mock('crypto', () => ({
  randomBytes: jest.fn(() => ({
    toString: jest.fn(() => 'mock-token'),
  })),
}));

// Import mocked modules
import { prisma } from './database';
import { emailService } from './email.service';
import { logger } from '../utils/logger';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

describe('AuthService', () => {
  // Master test credentials
  const MASTER_CREDENTIALS = {
    admin: { email: 'admin@allin.demo', password: 'Admin123!@#' },
    agency: { email: 'agency@allin.demo', password: 'Agency123!@#' },
    manager: { email: 'manager@allin.demo', password: 'Manager123!@#' },
    creator: { email: 'creator@allin.demo', password: 'Creator123!@#' },
    client: { email: 'client@allin.demo', password: 'Client123!@#' },
    team: { email: 'team@allin.demo', password: 'Team123!@#' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
    
    // Force reload of auth service to pick up new env vars
    jest.resetModules();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('register', () => {
    it('should register a new admin user successfully', async () => {
      const registerData = {
        email: MASTER_CREDENTIALS.admin.email,
        password: MASTER_CREDENTIALS.admin.password,
        name: 'Admin User',
      };

      const mockUser = {
        id: 'user-id-1',
        email: registerData.email,
        name: registerData.name,
        role: 'ADMIN',
        status: 'PENDING',
        password: 'hashed-password',
        image: null,
        emailVerified: null,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.findUnique as any).mockResolvedValue(null);
      (bcrypt.hash as any).mockResolvedValue('hashed-password');
      (prisma.user.create as any).mockResolvedValue(mockUser);
      (crypto.randomBytes as any).mockReturnValue({
        toString: jest.fn().mockReturnValue('verification-token'),
      });
      (prisma.verificationToken.create as any).mockResolvedValue({
        id: 'token-id',
        identifier: registerData.email,
        token: 'verification-token',
        expires: new Date(),
        userId: mockUser.id,
        user: mockUser,
      });
      (emailService.sendVerificationEmail as any).mockResolvedValue(undefined);

      const result = await authService.register(registerData);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: registerData.email },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(registerData.password, 12);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: registerData.email,
          password: 'hashed-password',
          name: registerData.name,
          status: 'PENDING',
        },
      });
      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
        registerData.email,
        'verification-token'
      );
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        message: 'Registration successful. Please check your email to verify your account.',
      });
    });

    it('should throw error if user already exists', async () => {
      const registerData = {
        email: MASTER_CREDENTIALS.agency.email,
        password: MASTER_CREDENTIALS.agency.password,
      };

      (prisma.user.findUnique as any).mockResolvedValue({
        id: 'existing-user-id',
        email: registerData.email,
      });

      await expect(authService.register(registerData)).rejects.toThrow(
        new AppError('User already exists with this email', 409)
      );
    });
  });

  describe('login', () => {
    it('should login admin user successfully', async () => {
      const loginData = {
        email: MASTER_CREDENTIALS.admin.email,
        password: MASTER_CREDENTIALS.admin.password,
        rememberMe: false,
      };

      const mockUser = {
        id: 'user-id-1',
        email: loginData.email,
        name: 'Admin User',
        role: 'ADMIN',
        status: 'ACTIVE',
        password: 'hashed-password',
        image: null,
        emailVerified: new Date(),
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.findUnique as any).mockResolvedValue(mockUser);
      (bcrypt.compare as any).mockResolvedValue(true);
      (jwt.sign as any)
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');
      (crypto.randomBytes as any).mockReturnValue({
        toString: jest.fn().mockReturnValue('session-token'),
      });
      (prisma.session.create as any).mockResolvedValue({
        id: 'session-id',
        sessionToken: 'session-token',
        refreshToken: 'refresh-token',
        userId: mockUser.id,
        expires: new Date(),
      });
      (prisma.user.update as any).mockResolvedValue(mockUser);

      const result = await authService.login(loginData);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginData.email },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(loginData.password, mockUser.password);
      expect(result).toEqual({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          role: mockUser.role,
          image: mockUser.image,
        },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        sessionToken: 'session-token',
      });
    });

    it('should throw error for invalid email', async () => {
      const loginData = {
        email: 'invalid@allin.demo',
        password: 'wrongpassword',
      };

      (prisma.user.findUnique as any).mockResolvedValue(null);

      await expect(authService.login(loginData)).rejects.toThrow(
        new AppError('Invalid email or password', 401)
      );
    });

    it('should throw error for invalid password', async () => {
      const loginData = {
        email: MASTER_CREDENTIALS.manager.email,
        password: 'wrongpassword',
      };

      (prisma.user.findUnique as any).mockResolvedValue({
        id: 'user-id',
        email: loginData.email,
        password: 'hashed-password',
        status: 'ACTIVE',
      });
      (bcrypt.compare as any).mockResolvedValue(false);

      await expect(authService.login(loginData)).rejects.toThrow(
        new AppError('Invalid email or password', 401)
      );
    });

    it('should throw error for unverified email', async () => {
      const loginData = {
        email: MASTER_CREDENTIALS.creator.email,
        password: MASTER_CREDENTIALS.creator.password,
      };

      (prisma.user.findUnique as any).mockResolvedValue({
        id: 'user-id',
        email: loginData.email,
        password: 'hashed-password',
        status: 'PENDING',
      });
      (bcrypt.compare as any).mockResolvedValue(true);

      await expect(authService.login(loginData)).rejects.toThrow(
        new AppError('Please verify your email before logging in', 403)
      );
    });

    it('should throw error for inactive account', async () => {
      const loginData = {
        email: MASTER_CREDENTIALS.client.email,
        password: MASTER_CREDENTIALS.client.password,
      };

      (prisma.user.findUnique as any).mockResolvedValue({
        id: 'user-id',
        email: loginData.email,
        password: 'hashed-password',
        status: 'SUSPENDED',
      });
      (bcrypt.compare as any).mockResolvedValue(true);

      await expect(authService.login(loginData)).rejects.toThrow(
        new AppError('Your account is not active', 403)
      );
    });
  });

  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      const token = 'valid-verification-token';
      const mockToken = {
        id: 'token-id',
        token,
        expires: new Date(Date.now() + 60000),
        userId: 'user-id',
        identifier: MASTER_CREDENTIALS.admin.email,
        user: {
          id: 'user-id',
          email: MASTER_CREDENTIALS.admin.email,
        },
      };

      (prisma.verificationToken.findUnique as any).mockResolvedValue(mockToken);
      (prisma.user.update as any).mockResolvedValue({});
      (prisma.verificationToken.delete as any).mockResolvedValue({});

      const result = await authService.verifyEmail(token);

      expect(prisma.verificationToken.findUnique).toHaveBeenCalledWith({
        where: { token },
        include: { user: true },
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockToken.userId },
        data: {
          emailVerified: expect.any(Date),
          status: 'ACTIVE',
        },
      });
      expect(result.message).toBe('Email verified successfully. You can now login.');
    });

    it('should throw error for invalid token', async () => {
      (prisma.verificationToken.findUnique as any).mockResolvedValue(null);

      await expect(authService.verifyEmail('invalid-token')).rejects.toThrow(
        new AppError('Invalid verification token', 400)
      );
    });

    it('should throw error for expired token', async () => {
      const mockToken = {
        id: 'token-id',
        token: 'expired-token',
        expires: new Date(Date.now() - 60000),
        userId: 'user-id',
        user: { email: 'test@example.com' },
      };

      (prisma.verificationToken.findUnique as any).mockResolvedValue(mockToken);

      await expect(authService.verifyEmail('expired-token')).rejects.toThrow(
        new AppError('Verification token has expired', 400)
      );
    });
  });

  describe('refreshTokens', () => {
    it('should refresh tokens successfully', async () => {
      const refreshToken = 'valid-refresh-token';
      const mockSession = {
        id: 'session-id',
        refreshToken,
        expires: new Date(Date.now() + 60000),
        userId: 'user-id',
        user: {
          id: 'user-id',
          email: MASTER_CREDENTIALS.agency.email,
          role: 'AGENCY',
        },
      };

      (jwt.verify as any).mockReturnValue({ userId: 'user-id' });
      (prisma.session.findUnique as any).mockResolvedValue(mockSession);
      (jwt.sign as any)
        .mockReturnValueOnce('new-access-token')
        .mockReturnValueOnce('new-refresh-token');
      (prisma.session.update as any).mockResolvedValue({});

      const result = await authService.refreshTokens(refreshToken);

      expect(jwt.verify).toHaveBeenCalledWith(refreshToken, 'test-refresh-secret');
      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });
    });

    it('should throw error for invalid refresh token', async () => {
      (jwt.verify as any).mockImplementation(() => {
        throw new jwt.JsonWebTokenError('Invalid token');
      });

      await expect(authService.refreshTokens('invalid-token')).rejects.toThrow(
        new AppError('Invalid refresh token', 401)
      );
    });

    it('should throw error for expired refresh token', async () => {
      (jwt.verify as any).mockImplementation(() => {
        throw new jwt.TokenExpiredError('Token expired', new Date());
      });

      await expect(authService.refreshTokens('expired-token')).rejects.toThrow(
        new AppError('Refresh token expired', 401)
      );
    });

    it('should throw error for non-existent session', async () => {
      (jwt.verify as any).mockReturnValue({ userId: 'user-id' });
      (prisma.session.findUnique as any).mockResolvedValue(null);

      await expect(authService.refreshTokens('valid-but-no-session')).rejects.toThrow(
        new AppError('Invalid refresh token', 401)
      );
    });

    it('should throw error and delete expired session', async () => {
      const mockSession = {
        id: 'session-id',
        refreshToken: 'token',
        expires: new Date(Date.now() - 60000),
        userId: 'user-id',
        user: { id: 'user-id', email: 'test@example.com', role: 'USER' },
      };

      (jwt.verify as any).mockReturnValue({ userId: 'user-id' });
      (prisma.session.findUnique as any).mockResolvedValue(mockSession);
      (prisma.session.delete as any).mockResolvedValue({});

      await expect(authService.refreshTokens('token')).rejects.toThrow(
        new AppError('Session expired', 401)
      );
      expect(prisma.session.delete).toHaveBeenCalledWith({
        where: { id: mockSession.id },
      });
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      const sessionToken = 'valid-session-token';

      (prisma.session.delete as any).mockResolvedValue({ userId: 'user-id' });

      await authService.logout(sessionToken);

      expect(prisma.session.delete).toHaveBeenCalledWith({
        where: { sessionToken },
      });
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('User logged out'));
    });

    it('should handle logout with invalid session token', async () => {
      (prisma.session.delete as any).mockRejectedValue(new Error('Record not found'));

      await expect(authService.logout('invalid-token')).rejects.toThrow();
    });
  });

  describe('forgotPassword', () => {
    it('should send password reset email successfully', async () => {
      const email = MASTER_CREDENTIALS.manager.email;
      const mockUser = {
        id: 'user-id',
        email,
        name: 'Manager User',
      };

      (prisma.user.findUnique as any).mockResolvedValue(mockUser);
      (crypto.randomBytes as any).mockReturnValue({
        toString: jest.fn().mockReturnValue('reset-token'),
      });
      (prisma.passwordResetToken.create as any).mockResolvedValue({});
      (emailService.sendPasswordResetEmail as any).mockResolvedValue(undefined);

      const result = await authService.forgotPassword(email);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
      expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith(email, 'reset-token');
      expect(result.message).toBe('If an account exists with this email, you will receive a password reset link.');
    });

    it('should not reveal non-existent email', async () => {
      (prisma.user.findUnique as any).mockResolvedValue(null);

      const result = await authService.forgotPassword('nonexistent@example.com');

      expect(result.message).toBe('If an account exists with this email, you will receive a password reset link.');
      expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      const token = 'valid-reset-token';
      const newPassword = 'NewPassword123!@#';
      const mockToken = {
        id: 'token-id',
        token,
        expires: new Date(Date.now() + 60000),
        userId: 'user-id',
        used: false,
        user: { email: 'test@example.com' },
      };

      (prisma.passwordResetToken.findUnique as any).mockResolvedValue(mockToken);
      (bcrypt.hash as any).mockResolvedValue('new-hashed-password');
      (prisma.user.update as any).mockResolvedValue({});
      (prisma.passwordResetToken.update as any).mockResolvedValue({});
      (prisma.session.deleteMany as any).mockResolvedValue({});

      const result = await authService.resetPassword(token, newPassword);

      expect(bcrypt.hash).toHaveBeenCalledWith(newPassword, 12);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockToken.userId },
        data: { password: 'new-hashed-password' },
      });
      expect(result.message).toBe('Password reset successfully. Please login with your new password.');
    });

    it('should throw error for invalid reset token', async () => {
      (prisma.passwordResetToken.findUnique as any).mockResolvedValue(null);

      await expect(authService.resetPassword('invalid-token', 'newpass')).rejects.toThrow(
        new AppError('Invalid or already used reset token', 400)
      );
    });

    it('should throw error for expired reset token', async () => {
      const mockToken = {
        id: 'token-id',
        token: 'expired-token',
        expires: new Date(Date.now() - 60000),
        userId: 'user-id',
      };

      (prisma.passwordResetToken.findUnique as any).mockResolvedValue(mockToken);

      await expect(authService.resetPassword('expired-token', 'newpass')).rejects.toThrow(
        new AppError('Reset token has expired', 400)
      );
    });
  });

  describe('verifyAccessToken', () => {
    it('should validate access token successfully', async () => {
      const token = 'valid-access-token';
      const payload = {
        userId: 'user-id',
        email: MASTER_CREDENTIALS.admin.email,
        role: 'ADMIN',
      };

      (jwt.verify as any).mockReturnValue(payload);

      const result = authService.verifyAccessToken(token);

      expect(jwt.verify).toHaveBeenCalledWith(token, process.env.JWT_SECRET);
      expect(result).toEqual(payload);
    });

    it('should throw error for invalid access token', async () => {
      (jwt.verify as any).mockImplementation(() => {
        throw new jwt.JsonWebTokenError('Invalid token');
      });

      expect(() => authService.verifyAccessToken('invalid-token')).toThrow(
        new AppError('Invalid access token', 401)
      );
    });

    it('should throw error for expired access token', async () => {
      (jwt.verify as any).mockImplementation(() => {
        throw new jwt.TokenExpiredError('Token expired', new Date());
      });

      expect(() => authService.verifyAccessToken('expired-token')).toThrow(
        new AppError('Access token expired', 401)
      );
    });
  });

  describe('getMe', () => {
    it('should get user by ID successfully', async () => {
      const userId = 'user-id';
      const mockUser = {
        id: userId,
        email: MASTER_CREDENTIALS.creator.email,
        name: 'Creator User',
        role: 'CREATOR',
        image: null,
        emailVerified: new Date(),
        status: 'ACTIVE',
        createdAt: new Date(),
        organizations: [],
      };

      (prisma.user.findUnique as any).mockResolvedValue(mockUser);

      const result = await authService.getMe(userId);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          image: true,
          emailVerified: true,
          status: true,
          createdAt: true,
          organizations: {
            include: {
              organization: true,
            },
          },
        },
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw error for non-existent user', async () => {
      (prisma.user.findUnique as any).mockResolvedValue(null);

      await expect(authService.getMe('nonexistent-id')).rejects.toThrow(
        new AppError('User not found', 404)
      );
    });
  });

  describe('validateSession', () => {
    it('should validate session successfully', async () => {
      const sessionToken = 'valid-session-token';
      const mockSession = {
        id: 'session-id',
        sessionToken,
        expires: new Date(Date.now() + 60000),
        user: {
          id: 'user-id',
          email: MASTER_CREDENTIALS.admin.email,
          password: 'hashed-password',
          name: 'Admin User',
          role: 'ADMIN',
        },
      };

      (prisma.session.findUnique as any).mockResolvedValue(mockSession);

      const result = await authService.validateSession(sessionToken);

      expect(prisma.session.findUnique).toHaveBeenCalledWith({
        where: { sessionToken },
        include: { user: true },
      });
      expect(result).not.toHaveProperty('password');
      expect(result.email).toBe(MASTER_CREDENTIALS.admin.email);
    });

    it('should throw error for invalid session', async () => {
      (prisma.session.findUnique as any).mockResolvedValue(null);

      await expect(authService.validateSession('invalid-token')).rejects.toThrow(
        new AppError('Invalid session', 401)
      );
    });

    it('should throw error and delete expired session', async () => {
      const mockSession = {
        id: 'session-id',
        sessionToken: 'expired-token',
        expires: new Date(Date.now() - 60000),
        user: { id: 'user-id' },
      };

      (prisma.session.findUnique as any).mockResolvedValue(mockSession);
      (prisma.session.delete as any).mockResolvedValue({});

      await expect(authService.validateSession('expired-token')).rejects.toThrow(
        new AppError('Session expired', 401)
      );
      expect(prisma.session.delete).toHaveBeenCalledWith({
        where: { id: mockSession.id },
      });
    });
  });
});