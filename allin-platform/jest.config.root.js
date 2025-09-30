// Root Jest configuration for monorepo with bulletproof coverage
const { defaults } = require('jest-config');

module.exports = {
  // Multi-project setup for monorepo
  projects: [
    '<rootDir>/backend',
    '<rootDir>/frontend'
  ],

  // Global test settings
  testTimeout: 15000,
  maxWorkers: '50%',

  // Coverage aggregation across all packages
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: [
    'text-summary',
    'html',
    'lcov',
    'json',
    'clover',
    'cobertura' // For CI/CD integration
  ],

  // Global coverage thresholds - BULLETPROOF STANDARDS
  coverageThreshold: {
    global: {
      lines: 100,
      branches: 100,
      functions: 100,
      statements: 100
    },
    // Per-package thresholds (can be overridden in individual configs)
    './backend/src/': {
      lines: 100,
      branches: 100,
      functions: 100,
      statements: 100
    },
    './frontend/src/': {
      lines: 95, // Slightly lower for UI components
      branches: 90,
      functions: 95,
      statements: 95
    }
  },

  // Global test reporters
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'coverage/junit',
      outputName: 'test-results.xml',
      usePathForSuiteName: true
    }],
    ['jest-html-reporters', {
      publicPath: './coverage/html-report',
      filename: 'test-report.html',
      expand: true,
      hideIcon: false
    }]
  ],

  // Performance monitoring
  detectLeaks: true,
  logHeapUsage: true,

  // Fail fast on coverage threshold violations
  coverageThreshold: {
    global: {
      lines: 100,
      branches: 100,
      functions: 100,
      statements: 100
    }
  }
};