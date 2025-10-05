module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/**/*.interface.ts',
    '!src/**/*.type.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'clover'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testTimeout: 10000,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  modulePathIgnorePatterns: [],

  // BMAD MONITOR Phase 2: Coverage Thresholds
  // Current baseline: 15.11% - Incremental targets to reach 80%+
  coverageThreshold: {
    global: {
      lines: 15,        // Current: 15.11% - Maintain baseline
      statements: 14,   // Current: 14.62% - Maintain baseline
      functions: 15,    // Current: 15.46% - Maintain baseline
      branches: 13      // Current: 13.80% - Maintain baseline
    },
    // High-priority components that should maintain high coverage
    './src/services/auth.service.ts': {
      lines: 99,
      statements: 99,
      functions: 100,
      branches: 90
    },
    './src/middleware/auth.ts': {
      lines: 100,
      statements: 100,
      functions: 100,
      branches: 100
    },
    './src/utils/errors.ts': {
      lines: 100,
      statements: 100,
      functions: 100,
      branches: 100
    },
    './src/utils/response.ts': {
      lines: 100,
      statements: 100,
      functions: 100,
      branches: 100
    }
  }
};