// Bulletproof Jest configuration for backend with 100% coverage enforcement
module.exports = {
  // Inherit from existing config
  ...require('./jest.config.js'),

  // Enhanced test discovery - excluding Playwright e2e tests
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts',
    'tests/**/*.test.ts',
    '!tests/e2e/**/*.spec.ts'  // Exclude Playwright tests
  ],

  // Comprehensive coverage collection
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.interface.ts',
    '!src/**/*.type.ts',
    '!src/index.ts', // Entry point excluded
    // Remove exclusions from original config to enforce 100%
  ],

  // BULLETPROOF COVERAGE THRESHOLDS
  coverageThreshold: {
    global: {
      lines: 100,
      branches: 100,
      functions: 100,
      statements: 100
    },
    // Critical paths get extra scrutiny
    './src/services/auth.service.ts': {
      lines: 100,
      branches: 100,
      functions: 100,
      statements: 100
    },
    './src/middleware/auth.ts': {
      lines: 100,
      branches: 100,
      functions: 100,
      statements: 100
    },
    './src/routes/': {
      lines: 100,
      branches: 100,
      functions: 100,
      statements: 100
    },
    './src/services/': {
      lines: 100,
      branches: 100,
      functions: 100,
      statements: 100
    }
  },

  // Enhanced reporters for better visibility
  reporters: [
    'default'
  ],

  // Strict test environment
  testEnvironment: 'node',

  // Setup files for test utilities
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.ts'
  ],

  // Module mapping for absolute imports
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1'
  },

  // Performance and reliability
  testTimeout: 15000,
  maxWorkers: '50%',
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // Fail fast on coverage violations
  bail: false, // Don't bail to collect full coverage info
  verbose: true,

  // Enhanced error reporting
  errorOnDeprecated: true,
  detectLeaks: true,

  // Coverage formats for CI/CD integration
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json',
    'clover',
    'cobertura'
  ],

  // Transform configuration for TypeScript
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      isolatedModules: true,
      useESM: false
    }]
  },

  // Global test variables
  globals: {
    'ts-jest': {
      isolatedModules: true,
      tsconfig: {
        allowJs: true,
        esModuleInterop: true
      }
    }
  }
};