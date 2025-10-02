# Contributing to AllIN Social Media Management Platform

Thank you for your interest in contributing to AllIN! We welcome contributions from developers of all skill levels and backgrounds.

## 🤝 Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](./CODE_OF_CONDUCT.md). Please read it before contributing.

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 14+
- Redis 6+
- Docker (recommended)
- Git

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/allin-social-platform.git
   cd allin-social-platform
   ```

2. **Install Dependencies**
   ```bash
   npm ci
   ```

3. **Environment Setup**
   ```bash
   cp allin-platform/backend/.env.example allin-platform/backend/.env
   cp allin-platform/frontend/.env.example allin-platform/frontend/.env
   ```

4. **Database Setup**
   ```bash
   npm run db:setup
   npm run db:migrate
   npm run db:seed
   ```

5. **Start Development**
   ```bash
   # Option 1: Docker (recommended)
   docker-compose --profile dev up -d
   
   # Option 2: Local development
   npm run dev
   ```

## 📝 How to Contribute

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates.

**Bug Report Template:**
```markdown
**Description**
A clear description of the bug.

**Steps to Reproduce**
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected Behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment**
- OS: [e.g. Windows 10, macOS 12]
- Browser: [e.g. Chrome 91, Safari 14]
- Node.js version: [e.g. 20.5.0]
```

### Suggesting Features

We love feature suggestions! Please provide:

- **Clear description** of the feature
- **Use case** - why is this feature needed?
- **Alternative solutions** - what workarounds currently exist?
- **Additional context** - mockups, examples, etc.

### Pull Requests

1. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes**
   - Follow our coding standards
   - Write comprehensive tests
   - Update documentation

3. **Test Your Changes**
   ```bash
   # Run all tests
   npm run test:all
   
   # Check coverage
   npm run test:coverage
   
   # Type checking
   npm run type-check
   
   # Linting
   npm run lint
   ```

4. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat(scope): description of changes"
   ```

5. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

## 🎯 Development Guidelines

### Code Standards

#### TypeScript
- **100% TypeScript** - All new code must be properly typed
- **Strict mode** enabled
- **No `any` types** unless absolutely necessary
- **Interface over type** for object shapes

#### Code Style
- **Prettier** for formatting
- **ESLint** for code quality
- **2 spaces** for indentation
- **Semicolons** required
- **Single quotes** for strings

#### File Naming
- **kebab-case** for files and directories
- **PascalCase** for React components
- **camelCase** for functions and variables
- **SCREAMING_SNAKE_CASE** for constants

### Testing Requirements

#### Test Coverage
- **100% line coverage** required for new code
- **100% branch coverage** required
- **100% function coverage** required

#### Test Types
1. **Unit Tests** - Test individual functions/components
2. **Integration Tests** - Test service interactions
3. **E2E Tests** - Test complete user workflows

#### Test Structure
```typescript
// Unit test example
describe('UserService', () => {
  describe('createUser', () => {
    it('should create user with valid data', async () => {
      // Arrange
      const userData = { email: 'test@example.com', name: 'Test User' };
      
      // Act
      const result = await userService.createUser(userData);
      
      // Assert
      expect(result).toMatchObject({
        id: expect.any(String),
        email: userData.email,
        name: userData.name
      });
    });
  });
});
```

### Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

#### Types
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, etc.)
- `refactor` - Code refactoring
- `test` - Adding or updating tests
- `chore` - Maintenance tasks

#### Examples
```bash
feat(auth): add two-factor authentication
fix(api): resolve token refresh issue
docs(readme): update installation instructions
test(user): add user creation tests
```

### Database Changes

#### Migrations
- **Never edit existing migrations** - create new ones
- **Test migrations** in both directions (up and down)
- **Document breaking changes** in migration comments

#### Schema Changes
```bash
# Create migration
npx prisma migrate dev --name add-user-preferences

# Reset database (development only)
npx prisma migrate reset

# Deploy to production
npx prisma migrate deploy
```

### API Development

#### REST API Guidelines
- **RESTful endpoints** - follow REST conventions
- **Consistent naming** - use plural nouns for resources
- **HTTP status codes** - use appropriate status codes
- **Error handling** - consistent error response format

#### Error Response Format
```typescript
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

### Frontend Development

#### Component Guidelines
- **Single responsibility** - one component, one purpose
- **Props interface** - always define props interface
- **Default props** - provide sensible defaults
- **Error boundaries** - handle component errors gracefully

#### Component Structure
```typescript
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
}

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md',
  onClick,
  disabled = false 
}: ButtonProps) {
  // Component implementation
}
```

## 🔄 Review Process

### Pull Request Checklist

Before submitting your PR, ensure:

- [ ] **Tests pass** - All tests must pass
- [ ] **Coverage maintained** - 100% coverage required
- [ ] **TypeScript compiles** - No type errors
- [ ] **Linting passes** - No ESLint errors
- [ ] **Documentation updated** - Update relevant docs
- [ ] **Change log updated** - Add entry to CHANGELOG.md
- [ ] **Self-review completed** - Review your own code first

### Review Criteria

Reviewers will check:

1. **Code Quality**
   - Follows coding standards
   - Proper error handling
   - Performance considerations

2. **Testing**
   - Comprehensive test coverage
   - Test quality and clarity
   - Edge cases covered

3. **Documentation**
   - Code comments where needed
   - API documentation updated
   - User documentation updated

4. **Security**
   - No security vulnerabilities
   - Proper input validation
   - Authentication/authorization

### Review Timeline

- **Initial review** - Within 48 hours
- **Follow-up reviews** - Within 24 hours
- **Merge timeline** - 1-7 days depending on complexity

## 🏷️ Issue Labels

We use labels to categorize issues:

- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Documentation improvements
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention needed
- `priority:high` - High priority
- `priority:medium` - Medium priority
- `priority:low` - Low priority

## 🎖️ Recognition

Contributors are recognized in:

- **README.md** - Contributors section
- **CHANGELOG.md** - Release notes
- **GitHub releases** - Release descriptions
- **Monthly updates** - Community highlights

## 📚 Resources

### Documentation
- [API Documentation](./docs/API.md)
- [Architecture Guide](./docs/ARCHITECTURE.md)
- [Database Schema](./docs/DATABASE.md)
- [Testing Guide](./BMAD-METHOD/ALLIN-TESTING-FRAMEWORK.md)

### Tools & Libraries
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Jest Testing Framework](https://jestjs.io/docs/getting-started)

### Community
- **Discord** - [Join our community](https://discord.gg/allin-social)
- **GitHub Discussions** - [Community discussions](https://github.com/drmweyers/allin-social-platform/discussions)
- **Stack Overflow** - Use tag `allin-platform`

## ❓ Questions?

If you have questions about contributing:

1. **Check existing issues** - Your question might already be answered
2. **Read documentation** - Check our comprehensive docs
3. **Ask in Discord** - Join our community for real-time help
4. **Create an issue** - For more complex questions

Thank you for contributing to AllIN! 🎉