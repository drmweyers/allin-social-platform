/**
 * Environment Variable Validator
 *
 * This utility validates all required environment variables at application startup
 * to prevent runtime failures due to missing or invalid configuration.
 *
 * SECURITY: This validator ensures no hardcoded fallback values are used for
 * security-critical environment variables like JWT secrets and encryption keys.
 */

import { logger } from './logger';

interface EnvValidationRule {
  key: string;
  required: boolean;
  minLength?: number;
  pattern?: RegExp;
  description: string;
  securityCritical?: boolean;
}

const VALIDATION_RULES: EnvValidationRule[] = [
  // Security Critical - Authentication
  {
    key: 'JWT_SECRET',
    required: true,
    minLength: 64,
    description: 'JWT signing secret (minimum 64 characters / 32 bytes in hex)',
    securityCritical: true,
  },
  {
    key: 'JWT_REFRESH_SECRET',
    required: true,
    minLength: 64,
    description: 'JWT refresh token signing secret (minimum 64 characters / 32 bytes in hex)',
    securityCritical: true,
  },
  {
    key: 'ENCRYPTION_KEY',
    required: true,
    minLength: 64,
    description: 'Encryption key for OAuth tokens (minimum 64 characters / 32 bytes in hex)',
    securityCritical: true,
  },

  // Database
  {
    key: 'DATABASE_URL',
    required: true,
    pattern: /^postgresql:\/\/.+/,
    description: 'PostgreSQL database connection string',
    securityCritical: false,
  },

  // Application
  {
    key: 'NODE_ENV',
    required: false,
    pattern: /^(development|production|test)$/,
    description: 'Application environment',
    securityCritical: false,
  },
  {
    key: 'PORT',
    required: false,
    pattern: /^\d+$/,
    description: 'Server port number',
    securityCritical: false,
  },

  // Email (Required for auth flows)
  {
    key: 'MAILGUN_API_KEY',
    required: true,
    minLength: 10,
    description: 'Mailgun API key for sending emails',
    securityCritical: true,
  },
  {
    key: 'MAILGUN_DOMAIN',
    required: true,
    description: 'Mailgun domain for sending emails',
    securityCritical: false,
  },

  // AI Services (Required for core features)
  {
    key: 'OPENAI_API_KEY',
    required: true,
    pattern: /^sk-/,
    description: 'OpenAI API key',
    securityCritical: true,
  },
];

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  missingCritical: string[];
}

/**
 * Validates all environment variables according to the defined rules
 * @throws Error if security-critical variables are missing or invalid
 */
export function validateEnvironment(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missingCritical: string[] = [];

  for (const rule of VALIDATION_RULES) {
    const value = process.env[rule.key];

    // Check if required variable is missing
    if (rule.required && !value) {
      const errorMsg = `MISSING REQUIRED: ${rule.key} - ${rule.description}`;

      if (rule.securityCritical) {
        errors.push(errorMsg);
        missingCritical.push(rule.key);
      } else {
        warnings.push(errorMsg);
      }
      continue;
    }

    // Skip further validation if optional and not provided
    if (!rule.required && !value) {
      continue;
    }

    // Validate minimum length
    if (rule.minLength && value && value.length < rule.minLength) {
      const errorMsg = `INVALID LENGTH: ${rule.key} must be at least ${rule.minLength} characters (current: ${value.length})`;

      if (rule.securityCritical) {
        errors.push(errorMsg);
        missingCritical.push(rule.key);
      } else {
        warnings.push(errorMsg);
      }
    }

    // Validate pattern
    if (rule.pattern && value && !rule.pattern.test(value)) {
      const errorMsg = `INVALID FORMAT: ${rule.key} - ${rule.description}`;

      if (rule.securityCritical) {
        errors.push(errorMsg);
        missingCritical.push(rule.key);
      } else {
        warnings.push(errorMsg);
      }
    }

    // Check for common weak/default values (security critical only)
    if (rule.securityCritical && value) {
      const weakValues = [
        'secret',
        'password',
        'changeme',
        'default',
        'test',
        '12345',
        'admin',
        'your-',
        'example',
      ];

      const isWeak = weakValues.some(weak => value.toLowerCase().includes(weak));
      if (isWeak) {
        errors.push(
          `WEAK SECRET DETECTED: ${rule.key} appears to contain weak/default value. ` +
          `Generate a strong secret using: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
        );
        missingCritical.push(rule.key);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    missingCritical,
  };
}

/**
 * Validates environment and throws if critical errors are found
 * Use this at application startup to fail fast
 */
export function validateEnvironmentOrExit(): void {
  logger.info('🔍 Validating environment configuration...');

  const result = validateEnvironment();

  // Log warnings (non-critical issues)
  if (result.warnings.length > 0) {
    logger.warn('⚠️  Environment configuration warnings:');
    result.warnings.forEach(warning => logger.warn(`   - ${warning}`));
  }

  // Handle critical errors
  if (!result.valid) {
    logger.error('❌ CRITICAL: Environment configuration validation failed!');
    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    result.errors.forEach(error => logger.error(`   ✗ ${error}`));

    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.error('');
    logger.error('SECURITY IMPACT: Missing or weak secrets can lead to:');
    logger.error('  • Authentication bypass (JWT token forgery)');
    logger.error('  • Unauthorized access to user accounts');
    logger.error('  • Data breaches and token theft');
    logger.error('  • OAuth token decryption');
    logger.error('');
    logger.error('ACTION REQUIRED:');
    logger.error('  1. Copy .env.example to .env');
    logger.error('  2. Generate strong secrets using:');
    logger.error('     node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
    logger.error('  3. Update the following variables in your .env file:');
    result.missingCritical.forEach(key => logger.error(`     - ${key}`));
    logger.error('');
    logger.error('For detailed configuration guide, see: .env.example');
    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    throw new Error(
      `Environment validation failed: ${result.missingCritical.length} critical security variables missing or invalid. ` +
      `See logs above for details.`
    );
  }

  logger.info('✅ Environment configuration validated successfully');
}

/**
 * Gets a required environment variable, throwing if not found
 * Use this for runtime access to ensure fail-fast behavior
 */
export function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `CRITICAL: Required environment variable ${key} is not set. ` +
      `This should have been caught at startup validation.`
    );
  }
  return value;
}

/**
 * Gets an optional environment variable with a safe default
 * NOTE: Only use this for non-security-critical values
 */
export function getOptionalEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

/**
 * Validates that a value looks like a strong cryptographic secret
 */
export function isStrongSecret(value: string, minLength = 64): boolean {
  if (value.length < minLength) return false;

  // Check for weak patterns
  const weakPatterns = [
    'secret',
    'password',
    'changeme',
    'default',
    'test',
    '12345',
    'admin',
    'your-',
    'example',
  ];

  return !weakPatterns.some(pattern => value.toLowerCase().includes(pattern));
}
