import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from './database';
import { AppError } from '../middleware/error';
import { logger } from '../utils/logger';
import { emailService } from './email.service';

interface RegisterData {
  email: string;
  password: string;
  name?: string;
}

interface LoginData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret';
  private readonly JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret';
  private readonly JWT_EXPIRES_IN = '15m';
  private readonly REFRESH_EXPIRES_IN = '7d';
  private readonly REFRESH_EXPIRES_IN_LONG = '30d';

  async register(data: RegisterData) {
    const { email, password, name } = data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new AppError('User already exists with this email', 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        status: 'PENDING',
      },
    });

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: verificationToken,
        expires: tokenExpiry,
        userId: user.id,
      },
    });

    // Send verification email
    await emailService.sendVerificationEmail(email, verificationToken);

    logger.info(`New user registered: ${email}`);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      message: 'Registration successful. Please check your email to verify your account.',
    };
  }

  async login(data: LoginData) {
    const { email, password, rememberMe } = data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      throw new AppError('Invalid email or password', 401);
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    // Check if email is verified
    if (user.status === 'PENDING') {
      throw new AppError('Please verify your email before logging in', 403);
    }

    // Check if account is active
    if (user.status !== 'ACTIVE') {
      throw new AppError('Your account is not active', 403);
    }

    // Generate tokens
    const accessToken = this.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = this.generateRefreshToken(
      { userId: user.id },
      rememberMe
    );

    // Create session
    const sessionExpiry = rememberMe
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const sessionToken = crypto.randomBytes(32).toString('hex');

    await prisma.session.create({
      data: {
        sessionToken,
        refreshToken,
        userId: user.id,
        expires: sessionExpiry,
      },
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    logger.info(`User logged in: ${email}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        image: user.image,
      },
      accessToken,
      refreshToken,
      sessionToken,
    };
  }

  async verifyEmail(token: string) {
    // Find verification token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!verificationToken) {
      throw new AppError('Invalid verification token', 400);
    }

    // Check if token expired
    if (verificationToken.expires < new Date()) {
      throw new AppError('Verification token has expired', 400);
    }

    // Update user status
    await prisma.user.update({
      where: { id: verificationToken.userId },
      data: {
        emailVerified: new Date(),
        status: 'ACTIVE',
      },
    });

    // Delete verification token
    await prisma.verificationToken.delete({
      where: { id: verificationToken.id },
    });

    logger.info(`Email verified for user: ${verificationToken.user.email}`);

    return {
      message: 'Email verified successfully. You can now login.',
    };
  }

  async refreshTokens(refreshToken: string) {
    try {
      // Verify refresh token
      jwt.verify(refreshToken, this.JWT_REFRESH_SECRET) as { userId: string };

      // Find session
      const session = await prisma.session.findUnique({
        where: { refreshToken },
        include: { user: true },
      });

      if (!session) {
        throw new AppError('Invalid refresh token', 401);
      }

      // Check if session expired
      if (session.expires < new Date()) {
        await prisma.session.delete({ where: { id: session.id } });
        throw new AppError('Session expired', 401);
      }

      // Generate new tokens
      const newAccessToken = this.generateAccessToken({
        userId: session.user.id,
        email: session.user.email,
        role: session.user.role,
      });

      const newRefreshToken = this.generateRefreshToken({ userId: session.user.id });

      // Update session
      await prisma.session.update({
        where: { id: session.id },
        data: {
          refreshToken: newRefreshToken,
          updatedAt: new Date(),
        },
      });

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError('Refresh token expired', 401);
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError('Invalid refresh token', 401);
      }
      throw error;
    }
  }

  async forgotPassword(email: string) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal that user doesn't exist
      return {
        message: 'If an account exists with this email, you will receive a password reset link.',
      };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save reset token
    await prisma.passwordResetToken.create({
      data: {
        token: resetToken,
        userId: user.id,
        expires: tokenExpiry,
      },
    });

    // Send reset email
    await emailService.sendPasswordResetEmail(email, resetToken);

    logger.info(`Password reset requested for: ${email}`);

    return {
      message: 'If an account exists with this email, you will receive a password reset link.',
    };
  }

  async resetPassword(token: string, newPassword: string) {
    // Find reset token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token, used: false },
      include: { user: true },
    });

    if (!resetToken) {
      throw new AppError('Invalid or already used reset token', 400);
    }

    // Check if token expired
    if (resetToken.expires < new Date()) {
      throw new AppError('Reset token has expired', 400);
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user password
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword },
    });

    // Mark token as used
    await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true },
    });

    // Invalidate all sessions
    await prisma.session.deleteMany({
      where: { userId: resetToken.userId },
    });

    logger.info(`Password reset for user: ${resetToken.user.email}`);

    return {
      message: 'Password reset successfully. Please login with your new password.',
    };
  }

  async logout(sessionToken: string) {
    // Delete session
    const session = await prisma.session.delete({
      where: { sessionToken },
    });

    logger.info(`User logged out: ${session.userId}`);

    return {
      message: 'Logged out successfully',
    };
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
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

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  private generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
    });
  }

  private generateRefreshToken(payload: { userId: string }, rememberMe = false): string {
    return jwt.sign(payload, this.JWT_REFRESH_SECRET, {
      expiresIn: rememberMe ? this.REFRESH_EXPIRES_IN_LONG : this.REFRESH_EXPIRES_IN,
    });
  }

  verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, this.JWT_SECRET) as TokenPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError('Access token expired', 401);
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError('Invalid access token', 401);
      }
      throw error;
    }
  }
}

export const authService = new AuthService();