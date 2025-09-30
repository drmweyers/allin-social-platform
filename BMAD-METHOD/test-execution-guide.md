# BMAD Test Execution Guide
## AllIN Platform - Complete Testing Playbook

**Last Updated**: September 30, 2025  
**GitHub Repository**: [allin-social-platform](https://github.com/drmweyers/allin-social-platform)  
**Release**: v1.0.0 - Production Ready  
**Status**: ✅ Enterprise-Grade Testing Framework Deployed

---

## 🚀 Quick Start

### Prerequisites
```bash
# Clone from GitHub
git clone https://github.com/drmweyers/allin-social-platform.git
cd allin-social-platform

# Ensure Node.js is installed
node --version  # Should be v20+

# Install dependencies
npm ci

# Start development environment
docker-compose --profile dev up -d

# Install Playwright browsers for E2E testing
npx playwright install
```

---

## 📋 Test Execution Workflows

### 1. Run All Tests (Recommended for CI/CD)
```bash
# From project root
npm run test:all

# Or run each type sequentially
npm run test:backend && npm run test:frontend && npm run test:e2e
```

### 2. Backend Testing

#### Unit Tests
```bash
cd backend

# Run all unit tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- auth.service.test.ts

# Run in watch mode
npm run test:watch

# Run with verbose output
npm test -- --verbose
```

#### Integration Tests
```bash
# Run API integration tests
npm run test:integration

# Test specific endpoints
npm test -- --testPathPattern=auth.routes.test.ts
```

### 3. Frontend Testing

#### Component Tests
```bash
cd frontend

# Run all component tests
npm test

# Run specific component tests
npm test -- login.page.test.tsx

# Run with coverage
npm run test:coverage

# Interactive watch mode
npm run test:watch
```

#### E2E Tests with Playwright
```bash
# Run all E2E tests
npx playwright test

# Run with UI mode (recommended for debugging)
npx playwright test --ui

# Run specific test file
npx playwright test comprehensive-ui.spec.ts

# Run in headed mode (see browser)
npx playwright test --headed

# Run in debug mode
npx playwright test --debug

# Run specific test by name
npx playwright test -g "Login Page"

# Run on specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Generate HTML report
npx playwright show-report
```

### 4. Performance Testing
```bash
# Run Lighthouse CI
npm run test:performance

# Manual Lighthouse audit
npx lighthouse http://localhost:3001 --view
```

### 5. Accessibility Testing
```bash
# Run accessibility tests
npm run test:a11y

# Run axe-core tests
npx playwright test accessibility.spec.ts
```

---

## 🎯 Test Categories

### Authentication Tests
```bash
# Backend auth tests
cd backend && npm test -- auth

# Frontend auth component tests
cd frontend && npm test -- auth

# E2E auth flow tests
npx playwright test auth.spec.ts
```

### Dashboard Tests
```bash
# Dashboard component tests
cd frontend && npm test -- dashboard

# Dashboard E2E tests
npx playwright test dashboard.spec.ts
```

### Social Media Integration Tests
```bash
# API integration tests
cd backend && npm test -- social

# UI integration tests
npx playwright test social-accounts.spec.ts
```

### Analytics Tests
```bash
# Analytics service tests
cd backend && npm test -- analytics

# Analytics UI tests
npx playwright test analytics.spec.ts
```

---

## 🔍 Debugging Tests

### Debug Backend Tests
```bash
# Run with Node debugger
node --inspect-brk ./node_modules/.bin/jest --runInBand

# Use VS Code debugger
# Add breakpoint and press F5 with Jest configuration
```

### Debug Frontend Tests
```bash
# Debug React component tests
npm test -- --no-coverage --inspect-brk

# Debug in Chrome DevTools
chrome://inspect
```

### Debug Playwright Tests
```bash
# Debug mode with Playwright Inspector
npx playwright test --debug

# Use page.pause() in tests
await page.pause();

# Trace viewer for failed tests
npx playwright show-trace trace.zip

# Record videos of test runs
npx playwright test --video=on
```

---

## 📊 Test Reports

### Generate Coverage Reports
```bash
# Backend coverage
cd backend && npm run test:coverage

# Frontend coverage
cd frontend && npm run test:coverage

# Open coverage report
open coverage/lcov-report/index.html
```

### Playwright Reports
```bash
# Generate HTML report
npx playwright test --reporter=html

# Open report
npx playwright show-report

# Generate JSON report for CI
npx playwright test --reporter=json > test-results.json

# Multiple reporters
npx playwright test --reporter=html,json,junit
```

---

## 🔄 Continuous Integration

### GitHub Actions Workflow
```yaml
name: Test Suite
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run backend tests
        run: cd backend && npm test
      
      - name: Run frontend tests
        run: cd frontend && npm test
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: npx playwright test
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage/lcov.info,./frontend/coverage/lcov.info
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: |
            backend/coverage/
            frontend/coverage/
            playwright-report/
            test-results/
```

---

## 🛠️ Test Configuration

### Jest Configuration (jest.config.js)
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.interface.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

### Playwright Configuration (playwright.config.ts)
```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  fullyParallel: true,
  workers: process.env.CI ? 1 : 4,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results.json' }],
    ['junit', { outputFile: 'junit.xml' }],
  ],
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile',
      use: { ...devices['iPhone 13'] },
    },
  ],
});
```

---

## 📱 Mobile Testing

```bash
# Run tests on mobile viewport
npx playwright test --project=mobile

# Test on specific device
npx playwright test --device="iPhone 13"
npx playwright test --device="Pixel 5"
npx playwright test --device="iPad Pro"

# Test responsive design
npx playwright test responsive.spec.ts
```

---

## 🔐 Security Testing

```bash
# Run security audit
npm audit

# Run OWASP dependency check
npm run security:check

# Run security-focused tests
npm test -- security.test.ts
```

---

## 📈 Performance Benchmarks

### Expected Performance Metrics
- **Page Load**: < 3 seconds
- **Time to Interactive**: < 5 seconds
- **First Contentful Paint**: < 1.5 seconds
- **API Response Time**: < 200ms
- **Test Execution Time**: < 5 minutes (all tests)

---

## 🚨 Troubleshooting

### Common Issues

1. **Playwright browsers not installed**
   ```bash
   npx playwright install
   ```

2. **Port already in use**
   ```bash
   # Kill process on port
   npx kill-port 3001 5000
   ```

3. **Database connection issues**
   ```bash
   # Reset test database
   npm run db:reset:test
   ```

4. **Flaky tests**
   ```bash
   # Retry flaky tests
   npx playwright test --retries=3
   ```

5. **Memory issues**
   ```bash
   # Increase Node memory
   NODE_OPTIONS="--max-old-space-size=4096" npm test
   ```

---

## 📝 Best Practices

1. **Run tests before committing**
   ```bash
   npm run precommit
   ```

2. **Keep tests isolated**
   - Each test should be independent
   - Use proper setup/teardown
   - Don't rely on test order

3. **Use descriptive test names**
   ```javascript
   test('should display error message when login fails with invalid credentials', ...)
   ```

4. **Mock external dependencies**
   - API calls
   - Database queries
   - Third-party services

5. **Maintain test data**
   ```bash
   # Seed test data
   npm run seed:test
   ```

---

## 🎯 Quick Commands Reference

```bash
# Most commonly used commands
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # With coverage
npx playwright test --ui   # Playwright UI mode
npx playwright codegen      # Generate test code
npm run test:ci            # CI environment
npm run test:debug         # Debug mode
```

---

## 📞 Support

For test-related issues:
1. Check test logs in `./test-results/`
2. Review coverage reports in `./coverage/`
3. Check CI/CD pipeline logs
4. Contact: devops@allin.com

---

**Last Updated**: 2025-09-22  
**Version**: 1.0.0  
**Status**: Production Ready ✅