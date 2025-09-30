/** @type {import('jest').Config} */
module.exports = {
  // Test environment
  preset: 'ts-jest',
  testEnvironment: 'node',

  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/BMAD-METHOD/test-configs/jest.setup.ts'
  ],

  // Test file patterns
  testMatch: [
    '<rootDir>/BMAD-METHOD/unit-tests/**/*.test.{ts,tsx}',
    '<rootDir>/BMAD-METHOD/integration-tests/**/*.test.{ts,tsx}'
  ],

  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: '<rootDir>/BMAD-METHOD/coverage',
  coverageReporters: [
    'text',
    'text-summary',
    'json',
    'html',
    'lcov',
    'clover'
  ],

  // Coverage thresholds (100% coverage required)
  coverageThreshold: {
    global: {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100
    }
  },

  // Files to collect coverage from
  collectCoverageFrom: [
    'allin-platform/backend/src/**/*.{ts,tsx}',
    'allin-platform/frontend/src/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/*.config.{js,ts}',
    '!**/coverage/**',
    '!**/dist/**',
    '!**/build/**'
  ],

  // Module name mapping for frontend
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/allin-platform/frontend/src/$1',
    '^@backend/(.*)$': '<rootDir>/allin-platform/backend/src/$1',
    '^@shared/(.*)$': '<rootDir>/allin-platform/shared/$1',
    '^@test/(.*)$': '<rootDir>/BMAD-METHOD/test-data/$1'
  },

  // Transform configuration
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest'
  },

  // Module file extensions
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
    'jsx',
    'json'
  ],

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '/coverage/'
  ],

  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // Test timeout
  testTimeout: 30000,

  // Verbose output
  verbose: true,

  // Maximum worker threads
  maxWorkers: '50%',

  // Error handling
  errorOnDeprecated: true,

  // Watch plugins
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ]
};