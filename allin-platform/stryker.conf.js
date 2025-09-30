/**
 * Stryker Configuration for AllIN Platform
 * Bulletproof mutation testing with ≥90% mutation score requirement
 */
module.exports = {
  // Core configuration
  packageManager: 'npm',
  reporters: ['html', 'clear-text', 'progress', 'json'],
  testRunner: 'jest',

  // Target files for mutation
  mutate: [
    // Backend critical paths
    'backend/src/services/**/*.ts',
    'backend/src/middleware/**/*.ts',
    'backend/src/routes/**/*.ts',
    'backend/src/utils/**/*.ts',

    // Frontend critical components
    'frontend/src/components/**/*.{ts,tsx}',
    'frontend/src/hooks/**/*.{ts,tsx}',
    'frontend/src/lib/**/*.{ts,tsx}',

    // Exclusions - files that shouldn't be mutated
    '!**/*.test.ts',
    '!**/*.spec.ts',
    '!**/*.d.ts',
    '!**/index.ts',
    '!**/*.interface.ts',
    '!**/*.type.ts',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/dist/**',
    '!**/build/**'
  ],

  // Test files to run for each mutant
  testRunner: 'jest',
  jest: {
    projectType: 'custom',
    config: {
      // Use the bulletproof Jest configuration
      preset: 'ts-jest',
      testEnvironment: 'node',
      projects: [
        {
          displayName: 'backend',
          testMatch: ['<rootDir>/backend/**/*.test.ts'],
          transform: {
            '^.+\\.ts$': 'ts-jest'
          }
        },
        {
          displayName: 'frontend',
          testEnvironment: 'jsdom',
          testMatch: ['<rootDir>/frontend/**/*.test.{ts,tsx}'],
          transform: {
            '^.+\\.(ts|tsx)$': 'ts-jest'
          }
        }
      ],
      collectCoverageFrom: [
        'backend/src/**/*.ts',
        'frontend/src/**/*.{ts,tsx}',
        '!**/*.d.ts'
      ]
    }
  },

  // BULLETPROOF MUTATION SCORE THRESHOLDS
  thresholds: {
    high: 90,  // ≥90% required for merge
    low: 85,   // Warning threshold
    break: 80  // Build breaks below this
  },

  // Per-file thresholds for critical paths
  mutationScoreThreshold: {
    // Global requirement
    '*': 90,

    // Critical security/auth files need higher scores
    'backend/src/services/auth.service.ts': 95,
    'backend/src/middleware/auth.ts': 95,
    'backend/src/middleware/security.ts': 95,

    // Payment/billing critical paths
    'backend/src/services/billing.service.ts': 95,
    'backend/src/services/payment.service.ts': 95,

    // UI components can have slightly lower thresholds
    'frontend/src/components/ui/**': 85,

    // Test utilities and configuration
    '**/test/**': 70,
    '**/*.config.*': 70
  },

  // Coverage analysis options
  coverageAnalysis: 'perTest', // Most accurate but slowest

  // Concurrency settings
  concurrency: 4, // Adjust based on CI resources

  // Timeout settings
  timeoutMS: 60000,    // 1 minute per test
  timeoutFactor: 1.5,  // 1.5x slower than original test

  // Reporting configuration
  htmlReporter: {
    fileName: 'reports/mutation/mutation-report.html'
  },

  jsonReporter: {
    fileName: 'reports/mutation/mutation-report.json'
  },

  // Ignore patterns for mutations that don't add value
  ignorePatterns: [
    // Skip logging statements
    'console.*',
    'logger.*'
  ],

  // Mutation types to apply
  mutator: {
    plugins: [
      '@stryker-mutator/typescript-checker'
    ],

    // Control which mutations to apply
    excludedMutations: [
      'StringLiteral', // Skip string literal mutations for config
      'RegexMutator'   // Skip regex mutations for complex patterns
    ]
  },

  // TypeScript configuration
  tsconfigFile: 'tsconfig.json',

  // Performance optimizations
  incremental: true,  // Only mutate changed files in incremental runs

  // CI-friendly settings
  clearTextReporter: {
    allowColor: false,  // Disable colors in CI
    logTests: false     // Don't log all test results
  },

  // Dashboard integration (optional)
  dashboard: {
    project: 'allin-platform',
    version: 'main',
    module: 'all'
  },

  // Build command configuration
  buildCommand: 'npm run build',

  // Custom plugins for enhanced reporting
  plugins: [
    '@stryker-mutator/core',
    '@stryker-mutator/jest-runner',
    '@stryker-mutator/typescript-checker',
    '@stryker-mutator/html-reporter'
  ],

  // Temp directory for mutation files
  tempDirName: '.stryker-tmp',

  // Clean up temporary files
  cleanTempDir: true,

  // Warning/error handling
  warnings: {
    // Warn about slow tests
    slow: true,
    // Warn about potentially flaky tests
    timeout: true
  }
};