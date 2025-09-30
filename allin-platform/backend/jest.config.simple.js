/**
 * Simplified Jest Configuration for Bulletproof Testing
 * Start simple and build up to 100% coverage
 */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  // Test discovery
  testMatch: [
    '**/*.test.ts',
    '**/*.spec.ts'
  ],

  // Transform TypeScript
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },

  // Coverage collection
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/index.ts'
  ],

  // Coverage directory
  coverageDirectory: 'coverage',

  // Module paths
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },

  // Clear mocks
  clearMocks: true,

  // Test timeout
  testTimeout: 30000
};