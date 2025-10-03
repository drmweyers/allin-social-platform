import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';

// Mock dependencies before importing the routes
const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
  verifyEmail: jest.fn(),
  refreshTokens: jest.fn(),
  forgotPassword: jest.fn(),
  resetPassword: jest.fn(),
  logout: jest.fn(),
  validateSession: jest.fn(),
  getMe: jest.fn(),
};

const mockAuthenticate = jest.fn((req: any, _res: any, next: any) => {
  req.user = { id: 'user-123', email: 'test@example.com' };
  next();
});

const mockStrictRateLimiter = jest.fn((_req: any, _res: any, next: any) => next());

jest.mock('../services/auth.service', () => ({
  authService: mockAuthService,
}));

jest.mock('../middleware/auth', () => ({
  authenticate: mockAuthenticate,
}));

jest.mock('../middleware/rateLimiter', () => ({
  strictRateLimiter: mockStrictRateLimiter,
}));

// Import routes after mocking
import authRoutes from './auth.routes';

describe('Auth Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/auth', authRoutes);
    jest.clearAllMocks();
  });

  describe('POST /register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'ValidPass123',
        name: 'Test User',
      };

      const mockResult = {
        user: { id: 'user-123', email: 'test@example.com', name: 'Test User' },
        sessionToken: 'session-token-123',
      };

      mockAuthService.register.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Registration successful');
      expect(mockAuthService.register).toHaveBeenCalledWith(userData);
    });

    it('should return validation errors for invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'ValidPass123',
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
      expect(mockAuthService.register).not.toHaveBeenCalled();
    });

    it('should return validation errors for weak password', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'weak',
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
      expect(mockAuthService.register).not.toHaveBeenCalled();
    });
  });

  describe('POST /login', () => {
    it('should login user successfully and set cookies', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'ValidPass123',
        rememberMe: true,
      };

      const mockResult = {
        user: { id: 'user-123', email: 'test@example.com' },
        sessionToken: 'session-token-123',
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-123',
      };

      mockAuthService.login.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/auth/login')
        .send(loginData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.headers['set-cookie']).toBeDefined();
      expect(mockAuthService.login).toHaveBeenCalledWith(loginData);
    });

    it('should handle login without remember me', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'ValidPass123',
      };

      const mockResult = {
        user: { id: 'user-123', email: 'test@example.com' },
        sessionToken: 'session-token-123',
      };

      mockAuthService.login.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/auth/login')
        .send(loginData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockAuthService.login).toHaveBeenCalledWith(loginData);
    });

    it('should return validation errors for invalid login data', async () => {
      const loginData = {
        email: 'invalid-email',
        password: '',
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData);

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
      expect(mockAuthService.login).not.toHaveBeenCalled();
    });
  });

  describe('POST /verify-email', () => {
    it('should verify email successfully', async () => {
      const token = 'a'.repeat(32);
      const mockResult = { verified: true };

      mockAuthService.verifyEmail.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/auth/verify-email')
        .send({ token });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockAuthService.verifyEmail).toHaveBeenCalledWith(token);
    });

    it('should return validation error for invalid token', async () => {
      const response = await request(app)
        .post('/auth/verify-email')
        .send({ token: 'short' });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
      expect(mockAuthService.verifyEmail).not.toHaveBeenCalled();
    });
  });

  describe('POST /refresh', () => {
    it('should refresh tokens successfully', async () => {
      const refreshToken = 'refresh-token-123';
      const mockResult = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      mockAuthService.refreshTokens.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Tokens refreshed successfully');
      expect(mockAuthService.refreshTokens).toHaveBeenCalledWith(refreshToken);
    });

    it('should return validation error for missing refresh token', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
      expect(mockAuthService.refreshTokens).not.toHaveBeenCalled();
    });
  });

  describe('POST /forgot-password', () => {
    it('should send forgot password email successfully', async () => {
      const email = 'test@example.com';
      const mockResult = { sent: true };

      mockAuthService.forgotPassword.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/auth/forgot-password')
        .send({ email });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockAuthService.forgotPassword).toHaveBeenCalledWith(email);
    });

    it('should return validation error for invalid email', async () => {
      const response = await request(app)
        .post('/auth/forgot-password')
        .send({ email: 'invalid-email' });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
      expect(mockAuthService.forgotPassword).not.toHaveBeenCalled();
    });
  });

  describe('POST /reset-password', () => {
    it('should reset password successfully', async () => {
      const resetData = {
        token: 'a'.repeat(32),
        password: 'NewValidPass123',
      };
      const mockResult = { reset: true };

      mockAuthService.resetPassword.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/auth/reset-password')
        .send(resetData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockAuthService.resetPassword).toHaveBeenCalledWith(resetData.token, resetData.password);
    });

    it('should return validation errors for invalid reset data', async () => {
      const resetData = {
        token: 'short',
        password: 'weak',
      };

      const response = await request(app)
        .post('/auth/reset-password')
        .send(resetData);

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
      expect(mockAuthService.resetPassword).not.toHaveBeenCalled();
    });
  });

  describe('POST /logout', () => {
    it('should logout user successfully', async () => {
      mockAuthService.logout.mockResolvedValue({ success: true });

      const response = await request(app)
        .post('/auth/logout')
        .set('Cookie', ['sessionToken=session-token-123']);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logged out successfully');
      expect(mockAuthService.logout).toHaveBeenCalledWith('session-token-123');
    });

    it('should logout even without session token', async () => {
      const response = await request(app)
        .post('/auth/logout');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logged out successfully');
      expect(mockAuthService.logout).not.toHaveBeenCalled();
    });
  });

  describe('GET /session', () => {
    it('should return user session if valid', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      mockAuthService.validateSession.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/auth/session')
        .set('Cookie', ['sessionToken=session-token-123']);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toEqual(mockUser);
      expect(mockAuthService.validateSession).toHaveBeenCalledWith('session-token-123');
    });

    it('should return null user if no session token', async () => {
      const response = await request(app)
        .get('/auth/session');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeNull();
      expect(mockAuthService.validateSession).not.toHaveBeenCalled();
    });

    it('should return null user if session validation fails', async () => {
      mockAuthService.validateSession.mockRejectedValue(new Error('Invalid session'));

      const response = await request(app)
        .get('/auth/session')
        .set('Cookie', ['sessionToken=invalid-token']);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeNull();
    });
  });

  describe('POST /_log', () => {
    it('should handle log endpoint successfully', async () => {
      const response = await request(app)
        .post('/auth/_log')
        .send({ message: 'test log' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.logged).toBe(true);
    });
  });

  describe('GET /me', () => {
    it('should return current user data', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com', name: 'Test User' };
      mockAuthService.getMe.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/auth/me');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockUser);
      expect(mockAuthService.getMe).toHaveBeenCalledWith('user-123');
    });
  });
});