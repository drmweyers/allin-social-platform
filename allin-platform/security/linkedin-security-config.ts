/**
 * LinkedIn Security Configuration
 * Security settings and policies for LinkedIn API integration
 */

export interface LinkedInSecurityConfig {
  oauth: {
    enforceHTTPS: boolean;
    stateParameterLength: number;
    tokenExpiration: number; // in seconds
    allowedRedirectHosts: string[];
    requiredScopes: string[];
    maxScopeCount: number;
  };
  api: {
    rateLimiting: {
      windowMs: number;
      max: number;
      skipSuccessfulRequests: boolean;
    };
    timeout: number;
    maxRetries: number;
    allowedOrigins: string[];
  };
  validation: {
    inputSanitization: boolean;
    sqlInjectionProtection: boolean;
    xssProtection: boolean;
    csrfProtection: boolean;
  };
  monitoring: {
    logSecurityEvents: boolean;
    alertOnSuspiciousActivity: boolean;
    maxFailedAttempts: number;
    blockDuration: number; // in minutes
  };
}

export const LINKEDIN_SECURITY_CONFIG: LinkedInSecurityConfig = {
  oauth: {
    enforceHTTPS: process.env.NODE_ENV === 'production',
    stateParameterLength: 32,
    tokenExpiration: 3600, // 1 hour
    allowedRedirectHosts: [
      'localhost',
      'allin.demo',
      process.env.ALLOWED_DOMAIN || ''
    ].filter(Boolean),
    requiredScopes: [
      'openid',
      'profile', 
      'email'
    ],
    maxScopeCount: 10
  },
  api: {
    rateLimiting: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // requests per window
      skipSuccessfulRequests: false
    },
    timeout: 10000, // 10 seconds
    maxRetries: 3,
    allowedOrigins: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'https://allin.demo',
      process.env.FRONTEND_URL || ''
    ].filter(Boolean)
  },
  validation: {
    inputSanitization: true,
    sqlInjectionProtection: true,
    xssProtection: true,
    csrfProtection: true
  },
  monitoring: {
    logSecurityEvents: true,
    alertOnSuspiciousActivity: true,
    maxFailedAttempts: 5,
    blockDuration: 30 // 30 minutes
  }
};

// Security validation functions
export class LinkedInSecurityValidator {
  static validateRedirectUri(uri: string): boolean {
    try {
      const url = new URL(uri);
      
      // Check protocol
      if (LINKEDIN_SECURITY_CONFIG.oauth.enforceHTTPS && url.protocol !== 'https:') {
        return false;
      }
      
      // Check allowed hosts
      return LINKEDIN_SECURITY_CONFIG.oauth.allowedRedirectHosts.includes(url.hostname);
    } catch {
      return false;
    }
  }

  static validateScopes(scopes: string[]): boolean {
    // Check scope count
    if (scopes.length > LINKEDIN_SECURITY_CONFIG.oauth.maxScopeCount) {
      return false;
    }

    // Check required scopes are present
    const hasRequiredScopes = LINKEDIN_SECURITY_CONFIG.oauth.requiredScopes.every(
      scope => scopes.includes(scope)
    );

    return hasRequiredScopes;
  }

  static sanitizeInput(input: string): string {
    if (!LINKEDIN_SECURITY_CONFIG.validation.inputSanitization) {
      return input;
    }

    return input
      .replace(/[<>]/g, '') // Remove < and >
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }

  static validateStateParameter(state: string): boolean {
    // Check length
    if (state.length !== LINKEDIN_SECURITY_CONFIG.oauth.stateParameterLength) {
      return false;
    }

    // Check format (alphanumeric)
    return /^[a-zA-Z0-9]+$/.test(state);
  }

  static checkSQLInjection(input: string): boolean {
    const sqlPatterns = [
      /(\b(select|insert|update|delete|drop|create|alter|exec|execute)\b)/i,
      /(union\s+select)/i,
      /(or\s+1\s*=\s*1)/i,
      /(and\s+1\s*=\s*1)/i,
      /(\bor\b\s+\'\w+\'\s*=\s*\'\w+')/i,
      /(--)/,
      /(\/\*.*\*\/)/
    ];

    return sqlPatterns.some(pattern => pattern.test(input));
  }

  static checkXSS(input: string): boolean {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe/gi,
      /<object/gi,
      /<embed/gi,
      /<form/gi,
      /eval\s*\(/gi,
      /expression\s*\(/gi
    ];

    return xssPatterns.some(pattern => pattern.test(input));
  }
}

// Security middleware configuration
export const LINKEDIN_SECURITY_HEADERS = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://platform.linkedin.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "connect-src 'self' https://api.linkedin.com https://www.linkedin.com",
    "frame-src 'self' https://www.linkedin.com",
    "object-src 'none'",
    "base-uri 'self'"
  ].join('; '),
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
};

// Rate limiting configuration
export const LINKEDIN_RATE_LIMITS = {
  oauth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 OAuth attempts per window
    message: 'Too many OAuth attempts, please try again later'
  },
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes  
    max: 100, // 100 API calls per window
    message: 'Too many API requests, please try again later'
  },
  profile: {
    windowMs: 60 * 1000, // 1 minute
    max: 5, // 5 profile updates per minute
    message: 'Too many profile updates, please try again later'
  }
};

// Security event types for logging
export enum LinkedInSecurityEvent {
  OAUTH_FAILURE = 'oauth_failure',
  INVALID_STATE = 'invalid_state_parameter',
  SUSPICIOUS_REDIRECT = 'suspicious_redirect_uri',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  INVALID_TOKEN = 'invalid_access_token',
  XSS_ATTEMPT = 'xss_attempt_detected',
  SQL_INJECTION_ATTEMPT = 'sql_injection_attempt',
  UNAUTHORIZED_ACCESS = 'unauthorized_access_attempt',
  INVALID_SCOPE = 'invalid_scope_request'
}

// Security audit configuration
export interface LinkedInSecurityAudit {
  timestamp: Date;
  event: LinkedInSecurityEvent;
  userId?: string;
  ipAddress: string;
  userAgent: string;
  details: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class LinkedInSecurityLogger {
  static logSecurityEvent(audit: LinkedInSecurityAudit): void {
    if (!LINKEDIN_SECURITY_CONFIG.monitoring.logSecurityEvents) {
      return;
    }

    // In production, this would integrate with your logging system
    console.log('[SECURITY]', JSON.stringify(audit, null, 2));

    // Alert on high/critical severity events
    if (LINKEDIN_SECURITY_CONFIG.monitoring.alertOnSuspiciousActivity && 
        ['high', 'critical'].includes(audit.severity)) {
      this.triggerSecurityAlert(audit);
    }
  }

  private static triggerSecurityAlert(audit: LinkedInSecurityAudit): void {
    // In production, this would integrate with your alerting system
    console.error('[SECURITY ALERT]', audit);
  }
}