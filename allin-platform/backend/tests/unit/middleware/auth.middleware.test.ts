import { authenticate, authorize, optionalAuth, AuthRequest } from '../../../src/middleware/auth';
import { authService } from '../../../src/services/auth.service';
import { AppError } from '../../../src/utils/errors';

// Mock the auth service
jest.mock('../../../src/services/auth.service', () => ({
  authService: {
    verifyAccessToken: jest.fn()
  }
}));

// Mock AppError
jest.mock('../../../src/utils/errors', () => ({
  AppError: jest.fn().mockImplementation((message, statusCode) => {
    const error = new Error(message);
    (error as any).statusCode = statusCode;
    return error;
  })
}));

const mockAuthService = authService as jest.Mocked<typeof authService>;

describe('Authentication Middleware', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: any;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      headers: {},
      cookies: {},
      query: {}
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('authenticate middleware', () => {
    const mockTokenPayload = {
      userId: 'user-id-123',
      email: 'test@example.com',
      role: 'user'
    };

    it('should authenticate user with valid Bearer token', async () => {
      mockRequest.headers = {
        authorization: 'Bearer valid-jwt-token'
      };
      mockAuthService.verifyAccessToken.mockReturnValue(mockTokenPayload);

      await authenticate(mockRequest as AuthRequest, mockResponse, mockNext);

      expect(mockAuthService.verifyAccessToken).toHaveBeenCalledWith('valid-jwt-token');
      expect(mockRequest.user).toEqual({
        id: mockTokenPayload.userId,
        email: mockTokenPayload.email,
        name: '',
        role: mockTokenPayload.role
      });
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should authenticate user with token in cookies', async () => {
      mockRequest.cookies = {
        accessToken: 'cookie-jwt-token'
      };
      mockAuthService.verifyAccessToken.mockReturnValue(mockTokenPayload);

      await authenticate(mockRequest as AuthRequest, mockResponse, mockNext);

      expect(mockAuthService.verifyAccessToken).toHaveBeenCalledWith('cookie-jwt-token');
      expect(mockRequest.user).toEqual({
        id: mockTokenPayload.userId,
        email: mockTokenPayload.email,
        name: '',
        role: mockTokenPayload.role
      });
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should authenticate user with token in query parameters', async () => {
      mockRequest.query = {
        token: 'query-jwt-token'
      };
      mockAuthService.verifyAccessToken.mockReturnValue(mockTokenPayload);

      await authenticate(mockRequest as AuthRequest, mockResponse, mockNext);

      expect(mockAuthService.verifyAccessToken).toHaveBeenCalledWith('query-jwt-token');
      expect(mockRequest.user).toEqual({
        id: mockTokenPayload.userId,
        email: mockTokenPayload.email,
        name: '',
        role: mockTokenPayload.role
      });
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should prioritize Authorization header over cookies', async () => {
      mockRequest.headers = {
        authorization: 'Bearer header-token'
      };
      mockRequest.cookies = {
        accessToken: 'cookie-token'
      };
      mockAuthService.verifyAccessToken.mockReturnValue(mockTokenPayload);

      await authenticate(mockRequest as AuthRequest, mockResponse, mockNext);

      expect(mockAuthService.verifyAccessToken).toHaveBeenCalledWith('header-token');
      expect(mockRequest.user).toEqual({
        id: mockTokenPayload.userId,
        email: mockTokenPayload.email,
        name: '',
        role: mockTokenPayload.role
      });
    });

    it('should call next with AppError when no token provided', async () => {
      await authenticate(mockRequest as AuthRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(AppError).toHaveBeenCalledWith('No authentication token provided', 401);
    });

    it('should call next with error when token verification fails', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token'
      };
      const tokenError = new Error('Invalid token');
      mockAuthService.verifyAccessToken.mockImplementation(() => {
        throw tokenError;
      });

      await authenticate(mockRequest as AuthRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(tokenError);
    });

    it('should handle malformed Authorization header', async () => {
      mockRequest.headers = {
        authorization: 'InvalidFormat token-without-bearer'
      };

      await authenticate(mockRequest as AuthRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(AppError).toHaveBeenCalledWith('No authentication token provided', 401);
    });

    it('should handle Authorization header without token', async () => {
      mockRequest.headers = {
        authorization: 'Bearer '
      };

      await authenticate(mockRequest as AuthRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(AppError).toHaveBeenCalledWith('No authentication token provided', 401);
    });

    it('should handle empty token in cookies', async () => {
      mockRequest.cookies = {
        accessToken: ''
      };

      await authenticate(mockRequest as AuthRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(AppError).toHaveBeenCalledWith('No authentication token provided', 401);
    });
  });

  describe('authorize middleware', () => {
    it('should authorize user with correct role', () => {
      mockRequest.user = {
        id: 'user-id-123',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin'
      };

      const authorizeAdmin = authorize('admin', 'superadmin');
      authorizeAdmin(mockRequest as AuthRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should authorize user with one of multiple allowed roles', () => {
      mockRequest.user = {
        id: 'user-id-123',
        email: 'user@example.com',
        name: 'Regular User',
        role: 'user'
      };

      const authorizeMultiple = authorize('admin', 'user', 'moderator');
      authorizeMultiple(mockRequest as AuthRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should call next with error when user not authenticated', () => {
      mockRequest.user = undefined;

      const authorizeAdmin = authorize('admin');
      authorizeAdmin(mockRequest as AuthRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(AppError).toHaveBeenCalledWith('Authentication required', 401);
    });

    it('should call next with error when user role not allowed', () => {
      mockRequest.user = {
        id: 'user-id-123',
        email: 'user@example.com',
        name: 'Regular User',
        role: 'user'
      };

      const authorizeAdmin = authorize('admin', 'superadmin');
      authorizeAdmin(mockRequest as AuthRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(AppError).toHaveBeenCalledWith('You do not have permission to access this resource', 403);
    });

    it('should handle user without role property', () => {
      mockRequest.user = {
        id: 'user-id-123',
        email: 'user@example.com',
        name: 'User Without Role'
        // role property is missing
      };

      const authorizeAdmin = authorize('admin');
      authorizeAdmin(mockRequest as AuthRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(AppError).toHaveBeenCalledWith('You do not have permission to access this resource', 403);
    });

    it('should be case sensitive for roles', () => {
      mockRequest.user = {
        id: 'user-id-123',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'Admin' // Capitalized
      };

      const authorizeAdmin = authorize('admin'); // lowercase
      authorizeAdmin(mockRequest as AuthRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(AppError).toHaveBeenCalledWith('You do not have permission to access this resource', 403);
    });
  });

  describe('optionalAuth middleware', () => {
    const mockTokenPayload = {
      userId: 'user-id-123',
      email: 'test@example.com',
      role: 'user'
    };

    it('should set user when valid token provided', async () => {
      mockRequest.headers = {
        authorization: 'Bearer valid-token'
      };
      mockAuthService.verifyAccessToken.mockReturnValue(mockTokenPayload);

      await optionalAuth(mockRequest as AuthRequest, mockResponse, mockNext);

      expect(mockAuthService.verifyAccessToken).toHaveBeenCalledWith('valid-token');
      expect(mockRequest.user).toEqual({
        id: mockTokenPayload.userId,
        email: mockTokenPayload.email,
        name: '',
        role: mockTokenPayload.role
      });
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should continue without user when no token provided', async () => {
      await optionalAuth(mockRequest as AuthRequest, mockResponse, mockNext);

      expect(mockAuthService.verifyAccessToken).not.toHaveBeenCalled();
      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should continue without user when token is invalid', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token'
      };
      mockAuthService.verifyAccessToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await optionalAuth(mockRequest as AuthRequest, mockResponse, mockNext);

      expect(mockAuthService.verifyAccessToken).toHaveBeenCalledWith('invalid-token');
      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should continue without user when token verification throws error', async () => {
      mockRequest.cookies = {
        accessToken: 'expired-token'
      };
      mockAuthService.verifyAccessToken.mockImplementation(() => {
        throw new Error('Token expired');
      });

      await optionalAuth(mockRequest as AuthRequest, mockResponse, mockNext);

      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('token extraction', () => {
    it('should extract token from Authorization header with Bearer prefix', async () => {
      mockRequest.headers = {
        authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'
      };
      const mockTokenPayload = {
        userId: 'user-id-123',
        email: 'test@example.com',
        role: 'user'
      };
      mockAuthService.verifyAccessToken.mockReturnValue(mockTokenPayload);

      await authenticate(mockRequest as AuthRequest, mockResponse, mockNext);

      expect(mockAuthService.verifyAccessToken).toHaveBeenCalledWith('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
    });

    it('should extract token from cookies', async () => {
      mockRequest.cookies = {
        accessToken: 'cookie-jwt-token-value',
        otherCookie: 'other-value'
      };
      const mockTokenPayload = {
        userId: 'user-id-123',
        email: 'test@example.com',
        role: 'user'
      };
      mockAuthService.verifyAccessToken.mockReturnValue(mockTokenPayload);

      await authenticate(mockRequest as AuthRequest, mockResponse, mockNext);

      expect(mockAuthService.verifyAccessToken).toHaveBeenCalledWith('cookie-jwt-token-value');
    });

    it('should extract token from query parameters', async () => {
      mockRequest.query = {
        token: 'query-token-value',
        other: 'param'
      };
      const mockTokenPayload = {
        userId: 'user-id-123',
        email: 'test@example.com',
        role: 'user'
      };
      mockAuthService.verifyAccessToken.mockReturnValue(mockTokenPayload);

      await authenticate(mockRequest as AuthRequest, mockResponse, mockNext);

      expect(mockAuthService.verifyAccessToken).toHaveBeenCalledWith('query-token-value');
    });

    it('should return null when no token found anywhere', async () => {
      mockRequest.headers = {};
      mockRequest.cookies = {};
      mockRequest.query = {};

      await authenticate(mockRequest as AuthRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(AppError).toHaveBeenCalledWith('No authentication token provided', 401);
    });
  });

  describe('AuthRequest interface', () => {
    it('should properly extend Request interface', () => {
      const authRequest: AuthRequest = {
        ...mockRequest,
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          organizationId: 'org-123',
          role: 'user'
        }
      } as AuthRequest;

      expect(authRequest.user).toBeDefined();
      expect(authRequest.user?.id).toBe('user-123');
      expect(authRequest.user?.email).toBe('test@example.com');
      expect(authRequest.user?.name).toBe('Test User');
      expect(authRequest.user?.organizationId).toBe('org-123');
      expect(authRequest.user?.role).toBe('user');
    });

    it('should allow optional user property', () => {
      const authRequest: AuthRequest = {
        ...mockRequest
      } as AuthRequest;

      expect(authRequest.user).toBeUndefined();
    });

    it('should allow optional organizationId and role', () => {
      const authRequest: AuthRequest = {
        ...mockRequest,
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User'
          // organizationId and role are optional
        }
      } as AuthRequest;

      expect(authRequest.user?.organizationId).toBeUndefined();
      expect(authRequest.user?.role).toBeUndefined();
    });
  });

  describe('middleware aliases', () => {
    it('should export authenticate as authenticateToken', () => {
      const { authenticateToken } = require('../../../src/middleware/auth');
      expect(authenticateToken).toBe(authenticate);
    });

    it('should export authenticate as authMiddleware', () => {
      const { authMiddleware } = require('../../../src/middleware/auth');
      expect(authMiddleware).toBe(authenticate);
    });
  });
});