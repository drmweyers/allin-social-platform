/**
 * LinkedIn Security Middleware
 * Express middleware for LinkedIn API security enforcement
 */

import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { 
  LINKEDIN_SECURITY_CONFIG, 
  LINKEDIN_SECURITY_HEADERS,
  LINKEDIN_RATE_LIMITS,
  LinkedInSecurityValidator,
  LinkedInSecurityLogger,
  LinkedInSecurityEvent,
  LinkedInSecurityAudit
} from './linkedin-security-config';

// Extended request interface for security context
interface SecurityRequest extends Request {
  securityContext?: {
    ipAddress: string;
    userAgent: string;
    userId?: string;
    sessionId?: string;
  };
}

/**
 * Security headers middleware
 */
export const linkedInSecurityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Apply security headers
  Object.entries(LINKEDIN_SECURITY_HEADERS).forEach(([header, value]) => {
    res.setHeader(header, value);
  });

  next();
};

/**
 * CSRF protection middleware for LinkedIn OAuth
 */
export const linkedInCSRFProtection = (req: SecurityRequest, res: Response, next: NextFunction) => {
  if (!LINKEDIN_SECURITY_CONFIG.validation.csrfProtection) {
    return next();
  }

  // Skip CSRF check for GET requests
  if (req.method === 'GET') {
    return next();
  }

  const csrfToken = req.headers['x-csrf-token'] as string || req.body.csrfToken;
  const sessionCSRFToken = req.session?.csrfToken;

  if (!csrfToken || !sessionCSRFToken || csrfToken !== sessionCSRFToken) {
    LinkedInSecurityLogger.logSecurityEvent({
      timestamp: new Date(),
      event: LinkedInSecurityEvent.UNAUTHORIZED_ACCESS,
      userId: req.securityContext?.userId,
      ipAddress: req.securityContext?.ipAddress || req.ip,
      userAgent: req.securityContext?.userAgent || req.get('User-Agent') || '',
      details: { 
        endpoint: req.path,
        method: req.method,
        csrfTokenPresent: !!csrfToken
      },
      severity: 'high'
    });

    return res.status(403).json({ error: 'Invalid CSRF token' });
  }

  next();
};

/**
 * Input validation and sanitization middleware
 */
export const linkedInInputValidation = (req: SecurityRequest, res: Response, next: NextFunction) => {
  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      // Check for XSS
      if (LinkedInSecurityValidator.checkXSS(obj)) {
        LinkedInSecurityLogger.logSecurityEvent({
          timestamp: new Date(),
          event: LinkedInSecurityEvent.XSS_ATTEMPT,
          userId: req.securityContext?.userId,
          ipAddress: req.securityContext?.ipAddress || req.ip,
          userAgent: req.securityContext?.userAgent || req.get('User-Agent') || '',
          details: { 
            input: obj.substring(0, 100),
            endpoint: req.path
          },
          severity: 'high'
        });
        throw new Error('Invalid input detected');
      }

      // Check for SQL injection
      if (LinkedInSecurityValidator.checkSQLInjection(obj)) {
        LinkedInSecurityLogger.logSecurityEvent({
          timestamp: new Date(),
          event: LinkedInSecurityEvent.SQL_INJECTION_ATTEMPT,
          userId: req.securityContext?.userId,
          ipAddress: req.securityContext?.ipAddress || req.ip,
          userAgent: req.securityContext?.userAgent || req.get('User-Agent') || '',
          details: { 
            input: obj.substring(0, 100),
            endpoint: req.path
          },
          severity: 'critical'
        });
        throw new Error('Invalid input detected');
      }

      return LinkedInSecurityValidator.sanitizeInput(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }

    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    }

    return obj;
  };

  try {
    // Sanitize request body
    if (req.body) {
      req.body = sanitizeObject(req.body);
    }

    // Sanitize query parameters
    if (req.query) {
      req.query = sanitizeObject(req.query);
    }

    next();
  } catch (error) {
    return res.status(400).json({ error: 'Invalid input provided' });
  }
};

/**
 * OAuth state parameter validation
 */
export const linkedInOAuthStateValidation = (req: SecurityRequest, res: Response, next: NextFunction) => {
  const { state } = req.query;

  if (!state || typeof state !== 'string') {
    LinkedInSecurityLogger.logSecurityEvent({
      timestamp: new Date(),
      event: LinkedInSecurityEvent.INVALID_STATE,
      userId: req.securityContext?.userId,
      ipAddress: req.securityContext?.ipAddress || req.ip,
      userAgent: req.securityContext?.userAgent || req.get('User-Agent') || '',
      details: { 
        statePresent: !!state,
        endpoint: req.path
      },
      severity: 'high'
    });
    return res.status(400).json({ error: 'Invalid or missing state parameter' });
  }

  if (!LinkedInSecurityValidator.validateStateParameter(state)) {
    LinkedInSecurityLogger.logSecurityEvent({
      timestamp: new Date(),
      event: LinkedInSecurityEvent.INVALID_STATE,
      userId: req.securityContext?.userId,
      ipAddress: req.securityContext?.ipAddress || req.ip,
      userAgent: req.securityContext?.userAgent || req.get('User-Agent') || '',
      details: { 
        state: state.substring(0, 20),
        endpoint: req.path
      },
      severity: 'high'
    });
    return res.status(400).json({ error: 'Invalid state parameter format' });
  }

  // Verify state exists in session
  const sessionState = req.session?.linkedInOAuthState;
  if (!sessionState || sessionState !== state) {
    LinkedInSecurityLogger.logSecurityEvent({
      timestamp: new Date(),
      event: LinkedInSecurityEvent.INVALID_STATE,
      userId: req.securityContext?.userId,
      ipAddress: req.securityContext?.ipAddress || req.ip,
      userAgent: req.securityContext?.userAgent || req.get('User-Agent') || '',
      details: { 
        sessionStateExists: !!sessionState,
        endpoint: req.path
      },
      severity: 'high'
    });
    return res.status(400).json({ error: 'State parameter mismatch' });
  }

  next();
};

/**
 * Redirect URI validation
 */
export const linkedInRedirectValidation = (req: SecurityRequest, res: Response, next: NextFunction) => {
  const { redirect_uri } = req.body;

  if (redirect_uri && !LinkedInSecurityValidator.validateRedirectUri(redirect_uri)) {
    LinkedInSecurityLogger.logSecurityEvent({
      timestamp: new Date(),
      event: LinkedInSecurityEvent.SUSPICIOUS_REDIRECT,
      userId: req.securityContext?.userId,
      ipAddress: req.securityContext?.ipAddress || req.ip,
      userAgent: req.securityContext?.userAgent || req.get('User-Agent') || '',
      details: { 
        redirectUri: redirect_uri,
        endpoint: req.path
      },
      severity: 'high'
    });
    return res.status(400).json({ error: 'Invalid redirect URI' });
  }

  next();
};

/**
 * Scope validation middleware
 */
export const linkedInScopeValidation = (req: SecurityRequest, res: Response, next: NextFunction) => {
  const { scope } = req.body;

  if (scope) {
    const scopes = Array.isArray(scope) ? scope : scope.split(' ');
    
    if (!LinkedInSecurityValidator.validateScopes(scopes)) {
      LinkedInSecurityLogger.logSecurityEvent({
        timestamp: new Date(),
        event: LinkedInSecurityEvent.INVALID_SCOPE,
        userId: req.securityContext?.userId,
        ipAddress: req.securityContext?.ipAddress || req.ip,
        userAgent: req.securityContext?.userAgent || req.get('User-Agent') || '',
        details: { 
          requestedScopes: scopes,
          endpoint: req.path
        },
        severity: 'medium'
      });
      return res.status(400).json({ error: 'Invalid or excessive scope requested' });
    }
  }

  next();
};

/**
 * Rate limiting middleware configurations
 */
export const linkedInOAuthRateLimit = rateLimit({
  ...LINKEDIN_RATE_LIMITS.oauth,
  keyGenerator: (req) => {
    return `linkedin_oauth_${req.ip}_${req.session?.userId || 'anonymous'}`;
  },
  handler: (req: SecurityRequest, res: Response) => {
    LinkedInSecurityLogger.logSecurityEvent({
      timestamp: new Date(),
      event: LinkedInSecurityEvent.RATE_LIMIT_EXCEEDED,
      userId: req.securityContext?.userId,
      ipAddress: req.securityContext?.ipAddress || req.ip,
      userAgent: req.securityContext?.userAgent || req.get('User-Agent') || '',
      details: { 
        endpoint: req.path,
        limitType: 'oauth'
      },
      severity: 'medium'
    });
    res.status(429).json({ error: LINKEDIN_RATE_LIMITS.oauth.message });
  }
});

export const linkedInApiRateLimit = rateLimit({
  ...LINKEDIN_RATE_LIMITS.api,
  keyGenerator: (req) => {
    return `linkedin_api_${req.ip}_${req.session?.userId || 'anonymous'}`;
  },
  handler: (req: SecurityRequest, res: Response) => {
    LinkedInSecurityLogger.logSecurityEvent({
      timestamp: new Date(),
      event: LinkedInSecurityEvent.RATE_LIMIT_EXCEEDED,
      userId: req.securityContext?.userId,
      ipAddress: req.securityContext?.ipAddress || req.ip,
      userAgent: req.securityContext?.userAgent || req.get('User-Agent') || '',
      details: { 
        endpoint: req.path,
        limitType: 'api'
      },
      severity: 'medium'
    });
    res.status(429).json({ error: LINKEDIN_RATE_LIMITS.api.message });
  }
});

export const linkedInProfileRateLimit = rateLimit({
  ...LINKEDIN_RATE_LIMITS.profile,
  keyGenerator: (req) => {
    return `linkedin_profile_${req.ip}_${req.session?.userId || 'anonymous'}`;
  },
  handler: (req: SecurityRequest, res: Response) => {
    LinkedInSecurityLogger.logSecurityEvent({
      timestamp: new Date(),
      event: LinkedInSecurityEvent.RATE_LIMIT_EXCEEDED,
      userId: req.securityContext?.userId,
      ipAddress: req.securityContext?.ipAddress || req.ip,
      userAgent: req.securityContext?.userAgent || req.get('User-Agent') || '',
      details: { 
        endpoint: req.path,
        limitType: 'profile'
      },
      severity: 'medium'
    });
    res.status(429).json({ error: LINKEDIN_RATE_LIMITS.profile.message });
  }
});

/**
 * Security context middleware
 */
export const linkedInSecurityContext = (req: SecurityRequest, res: Response, next: NextFunction) => {
  req.securityContext = {
    ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
    userAgent: req.get('User-Agent') || 'unknown',
    userId: req.session?.userId,
    sessionId: req.sessionID
  };

  next();
};

/**
 * Token validation middleware
 */
export const linkedInTokenValidation = (req: SecurityRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    LinkedInSecurityLogger.logSecurityEvent({
      timestamp: new Date(),
      event: LinkedInSecurityEvent.INVALID_TOKEN,
      userId: req.securityContext?.userId,
      ipAddress: req.securityContext?.ipAddress || req.ip,
      userAgent: req.securityContext?.userAgent || req.get('User-Agent') || '',
      details: { 
        endpoint: req.path,
        authHeaderPresent: !!authHeader
      },
      severity: 'medium'
    });
    return res.status(401).json({ error: 'Invalid or missing authorization header' });
  }

  const token = authHeader.substring(7);
  
  // Basic token format validation
  if (!token || token.length < 10 || !/^[A-Za-z0-9\-._~+/]+=*$/.test(token)) {
    LinkedInSecurityLogger.logSecurityEvent({
      timestamp: new Date(),
      event: LinkedInSecurityEvent.INVALID_TOKEN,
      userId: req.securityContext?.userId,
      ipAddress: req.securityContext?.ipAddress || req.ip,
      userAgent: req.securityContext?.userAgent || req.get('User-Agent') || '',
      details: { 
        endpoint: req.path,
        tokenLength: token.length
      },
      severity: 'medium'
    });
    return res.status(401).json({ error: 'Invalid token format' });
  }

  // Store token for further validation in route handlers
  req.accessToken = token;
  next();
};

/**
 * Error handling middleware for security errors
 */
export const linkedInSecurityErrorHandler = (error: Error, req: SecurityRequest, res: Response, next: NextFunction) => {
  LinkedInSecurityLogger.logSecurityEvent({
    timestamp: new Date(),
    event: LinkedInSecurityEvent.UNAUTHORIZED_ACCESS,
    userId: req.securityContext?.userId,
    ipAddress: req.securityContext?.ipAddress || req.ip,
    userAgent: req.securityContext?.userAgent || req.get('User-Agent') || '',
    details: { 
      error: error.message,
      endpoint: req.path,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    },
    severity: 'high'
  });

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production') {
    return res.status(500).json({ error: 'Internal server error' });
  }

  return res.status(500).json({ 
    error: error.message,
    stack: error.stack 
  });
};

// Security middleware stack for LinkedIn routes
export const linkedInSecurityStack = [
  linkedInSecurityContext,
  linkedInSecurityHeaders,
  linkedInInputValidation,
  linkedInCSRFProtection
];

export const linkedInOAuthSecurityStack = [
  ...linkedInSecurityStack,
  linkedInOAuthRateLimit,
  linkedInOAuthStateValidation,
  linkedInRedirectValidation,
  linkedInScopeValidation
];

export const linkedInApiSecurityStack = [
  ...linkedInSecurityStack,
  linkedInApiRateLimit,
  linkedInTokenValidation
];

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      accessToken?: string;
      securityContext?: {
        ipAddress: string;
        userAgent: string;
        userId?: string;
        sessionId?: string;
      };
    }
  }
}