# 🔄 BMAD MONITOR - Test Watch Mode Guide

**Last Updated:** January 2025
**Phase:** MONITOR - Continuous Testing Setup

---

## 📋 Overview

Test watch mode enables continuous, automatic test execution during development. Tests automatically re-run when files change, providing immediate feedback on code modifications.

### Benefits
- ✅ **Instant Feedback** - See test results immediately after saving files
- ✅ **Faster Development** - No need to manually run tests
- ✅ **Catch Regressions Early** - Detect breaking changes before committing
- ✅ **Improved Confidence** - Continuous validation during refactoring

---

## 🚀 Quick Start

### Start Watch Mode
```bash
cd allin-platform/backend

# Basic watch mode (recommended for daily use)
npm run test:watch

# Watch mode with coverage tracking
npm run test:coverage:watch
```

### Stop Watch Mode
Press `q` to quit watch mode, or `Ctrl+C` to force stop.

---

## 🎯 Watch Mode Commands

Once watch mode is running, use these interactive commands:

### Navigation Commands
```
Press a to run all tests
Press f to run only failed tests
Press p to filter by filename regex pattern
Press t to filter by test name regex pattern
Press q to quit watch mode
Press Enter to trigger a test run
```

### Filter Examples
```
# Press 'p' then type pattern
auth         # Run only files matching 'auth'
service      # Run only files matching 'service'
routes       # Run only route tests

# Press 't' then type pattern
"should create"    # Run only tests with "should create" in name
"error handling"   # Run only error handling tests
```

---

## 📊 Watch Mode Workflows

### Workflow 1: Feature Development
```bash
# Terminal 1: Start development server
npm run dev

# Terminal 2: Start test watch mode
npm run test:watch

# Terminal 3: Code editor
# Make changes → Save → Tests auto-run → See results immediately
```

### Workflow 2: Test-Driven Development (TDD)
```bash
# Start watch mode
npm run test:watch

# Press 'f' to only run failing tests
# Write test → See it fail (Red)
# Write code → See it pass (Green)
# Refactor code → Tests still pass (Refactor)
```

### Workflow 3: Refactoring
```bash
# Start watch mode with coverage
npm run test:coverage:watch

# Press 'a' to run all tests
# Refactor code → Tests auto-run → Coverage updates
# Ensure all tests still pass and coverage maintained
```

### Workflow 4: Bug Fixing
```bash
# Start watch mode
npm run test:watch

# Press 't' then type failing test name
# Focus on specific failing test
# Fix code → See test pass → Press 'a' to run all tests
```

---

## 🎨 Watch Mode Best Practices

### 1. **Run Watch Mode in Split Terminal**
```
┌─────────────────┬─────────────────┐
│                 │                 │
│   Code Editor   │  Watch Mode     │
│                 │  Output         │
│                 │                 │
└─────────────────┴─────────────────┘
```

### 2. **Focus on Relevant Tests**
- Use filters (`p`, `t`) to run only tests related to current work
- Reduces test execution time
- Faster feedback loop

### 3. **Fix Failing Tests Immediately**
- Press `f` to see only failing tests
- Fix failures before adding new code
- Maintain high test pass rate

### 4. **Monitor Coverage**
- Use `test:coverage:watch` when refactoring
- Ensure coverage doesn't decrease
- Target: Increase coverage by 1-2% per session

### 5. **Keep Tests Fast**
- Slow tests = slow feedback
- Optimize test setup/teardown
- Mock external dependencies properly

---

## 🛠️ Configuration

### Jest Watch Mode Config (jest.config.js)
```javascript
module.exports = {
  // Watch mode settings
  watchman: true,                    // Use Watchman for file watching (faster)
  watchPathIgnorePatterns: [
    'node_modules',
    'dist',
    'coverage'
  ],

  // Only re-run tests affected by changes
  // (Not enabled by default, enable if needed)
  // bail: false,
  // collectCoverageOnlyFrom: undefined,
};
```

### Custom Watch Scripts (package.json)
```json
{
  "scripts": {
    "test:watch": "jest --watch",
    "test:coverage:watch": "jest --coverage --watch",
    "test:watch:unit": "jest --watch tests/unit",
    "test:watch:integration": "jest --watch tests/integration",
    "test:watch:verbose": "jest --watch --verbose"
  }
}
```

---

## 📈 Watch Mode Metrics

### Track These Metrics During Development
- **Test Execution Time** - Should remain < 15 seconds for fast feedback
- **Pass Rate** - Should maintain > 95% during development
- **Coverage Change** - Track coverage delta per session
- **Failed Test Count** - Should trend towards 0

### Example Session Metrics
```
Session Start:
- Tests: 122 passing, 46 failing (72.6% pass rate)
- Coverage: 15.11% lines
- Execution Time: 14.1s

After 2 hours of development:
- Tests: 135 passing, 35 failing (79.4% pass rate) ↑
- Coverage: 18.5% lines ↑
- Execution Time: 12.8s ↓
```

---

## 🚨 Common Issues & Solutions

### Issue 1: Watch Mode Not Detecting Changes
**Symptom:** Files change but tests don't re-run

**Solutions:**
```bash
# Check if Watchman is installed (macOS/Linux)
brew install watchman  # macOS
# Or
apt-get install watchman  # Linux

# Clear Jest cache
npm run test -- --clearCache

# Restart watch mode
npm run test:watch
```

### Issue 2: Tests Running Too Slowly
**Symptom:** Tests take > 20 seconds to run

**Solutions:**
```bash
# Run only relevant tests using filters
# Press 'p' then type pattern

# Disable coverage in watch mode (faster)
npm run test:watch  # Instead of test:coverage:watch

# Run specific test suite
npm run test:watch:unit  # Only unit tests
```

### Issue 3: Too Many Tests Failing
**Symptom:** Overwhelming number of failing tests

**Solutions:**
```bash
# Focus on failing tests only
# Press 'f' in watch mode

# Fix one test at a time
# Press 't' then type specific test name

# Run specific file
# Press 'p' then type filename
```

### Issue 4: Watch Mode Crashes
**Symptom:** Watch mode exits unexpectedly

**Solutions:**
```bash
# Check for syntax errors in test files
npm run type-check

# Clear node_modules and reinstall
rm -rf node_modules
npm ci

# Increase Node memory
NODE_OPTIONS="--max-old-space-size=4096" npm run test:watch
```

---

## 📊 Watch Mode vs Regular Testing

| Feature | Watch Mode | Regular Run |
|---------|------------|-------------|
| **Automatic Re-run** | ✅ Yes | ❌ No |
| **Interactive Filters** | ✅ Yes | ❌ No |
| **Continuous Feedback** | ✅ Yes | ❌ No |
| **CI/CD Integration** | ❌ No | ✅ Yes |
| **Coverage Reports** | ⚠️ Optional | ✅ Default |
| **Resource Usage** | 🔴 High (always running) | 🟢 Low (on-demand) |

### When to Use Each
- **Watch Mode:** Daily development, TDD, refactoring
- **Regular Run:** CI/CD, pre-commit, comprehensive coverage checks

---

## 🎯 Next Steps After Watch Mode Setup

### Immediate
1. ✅ **Learn Interactive Commands** - Practice using `a`, `f`, `p`, `t` filters
2. ✅ **Set Up Split Terminal** - Code on left, watch mode on right
3. ✅ **Fix Failing Tests** - Use `f` filter to focus on failures

### Short Term (This Week)
1. ⏭️ **Add Pre-commit Hook** - Run tests before every commit
2. ⏭️ **Configure VS Code** - Set up test runner extension
3. ⏭️ **Establish Workflow** - Make watch mode part of daily routine

### Long Term (This Month)
1. ⏭️ **Optimize Test Speed** - Keep feedback loop < 10 seconds
2. ⏭️ **Increase Coverage** - Track coverage improvements over time
3. ⏭️ **Add Integration to CI/CD** - Automated testing on push

---

## 📁 Related Documentation

- **MONITOR Phase Setup**: `BMAD-METHOD/MONITOR-PHASE-SETUP.md`
- **BUILD Phase Results**: `BMAD-METHOD/BUILD-PHASE-COMPLETE.md`
- **Testing Strategy**: Main project documentation

---

## ✅ Watch Mode Setup Complete

**Status:** ✅ **READY TO USE**

### Available Commands
```bash
# Start basic watch mode
npm run test:watch

# Start watch mode with coverage
npm run test:coverage:watch

# Watch only unit tests
npm run test:watch:unit

# Watch only integration tests
npm run test:watch:integration
```

### Success Criteria
- ✅ Watch mode starts without errors
- ✅ Tests automatically re-run on file changes
- ✅ Interactive commands work (a, f, p, t, q)
- ✅ Provides immediate feedback during development

**Watch mode is now configured and ready for continuous testing!**

---

**Framework Version:** BMAD v3.0
**Phase:** MONITOR
**Component:** Test Watch Mode
**Last Updated:** January 2025
