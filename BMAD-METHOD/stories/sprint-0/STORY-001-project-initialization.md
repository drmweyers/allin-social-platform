# Story 001: Project Initialization and Structure
**Sprint**: 0 - Infrastructure Setup
**Points**: 3
**Priority**: CRITICAL
**Type**: Setup

## Story Description
As a developer, I need to initialize the AllIN social media platform project with a proper monorepo structure, version control, and base configuration files so that the team can begin development with a consistent environment.

## Acceptance Criteria
- [ ] Git repository initialized with proper .gitignore
- [ ] Monorepo structure created with frontend and backend folders
- [ ] README.md created with project overview
- [ ] Package.json files configured for both applications
- [ ] Environment variable templates created
- [ ] License file added (MIT)
- [ ] Basic documentation structure established

## Technical Details

### Step 1: Create Project Directory Structure
```bash
# Create main project directory
mkdir allin-social-platform
cd allin-social-platform

# Initialize git repository
git init

# Create monorepo structure
mkdir -p frontend
mkdir -p backend
mkdir -p docs
mkdir -p scripts
mkdir -p .github/workflows
mkdir -p docker
```

### Step 2: Create Root Configuration Files

#### File: `/package.json`
```json
{
  "name": "allin-social-platform",
  "version": "1.0.0",
  "description": "AI-powered social media management platform",
  "private": true,
  "workspaces": [
    "frontend",
    "backend"
  ],
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:frontend": "cd frontend && npm run dev",
    "dev:backend": "cd backend && npm run dev",
    "build": "npm run build:backend && npm run build:frontend",
    "build:frontend": "cd frontend && npm run build",
    "build:backend": "cd backend && npm run build",
    "test": "npm run test:backend && npm run test:frontend",
    "test:frontend": "cd frontend && npm test",
    "test:backend": "cd backend && npm test",
    "lint": "npm run lint:backend && npm run lint:frontend",
    "lint:frontend": "cd frontend && npm run lint",
    "lint:backend": "cd backend && npm run lint",
    "docker:up": "docker-compose -f docker/docker-compose.yml up -d",
    "docker:down": "docker-compose -f docker/docker-compose.yml down",
    "docker:logs": "docker-compose -f docker/docker-compose.yml logs -f",
    "prisma:generate": "cd backend && npx prisma generate",
    "prisma:migrate": "cd backend && npx prisma migrate dev",
    "prisma:studio": "cd backend && npx prisma studio"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
```

#### File: `/.gitignore`
```gitignore
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/
*.lcov
.nyc_output

# Production builds
dist/
build/
.next/
out/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
*.env

# IDE
.vscode/
.idea/
*.swp
*.swo
*.swn
.DS_Store
Thumbs.db

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*
.pnpm-debug.log*

# Database
*.db
*.sqlite
*.sqlite3
prisma/migrations/dev/

# Docker
docker/data/

# Temporary files
tmp/
temp/
.cache/

# OS files
.DS_Store
Thumbs.db
```

#### File: `/.env.example`
```env
# Environment
NODE_ENV=development

# Frontend URLs
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:5001

# Backend Configuration
PORT=5000
WS_PORT=5001

# Database
DATABASE_URL="postgresql://allin_user:allin_password@localhost:5432/allin_db?schema=public"

# Redis
REDIS_URL=redis://localhost:6380

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# Encryption
ENCRYPTION_KEY=generate-64-character-hex-string-for-encryption

# Email (MailHog for development)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@allin.app

# Social Media API Keys (Add your own)
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
TWITTER_API_KEY=
TWITTER_API_SECRET=
TWITTER_BEARER_TOKEN=
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
TIKTOK_CLIENT_KEY=
TIKTOK_CLIENT_SECRET=

# AI Services
OPENAI_API_KEY=

# Storage
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
S3_BUCKET_NAME=allin-media

# Monitoring
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

#### File: `/README.md`
```markdown
# AllIN - AI-Powered Social Media Management Platform

## Overview
AllIN is a comprehensive social media management platform that combines AI-powered content creation with advanced scheduling, analytics, and team collaboration features.

## Tech Stack
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Radix UI
- **Backend**: Express, TypeScript, Prisma, PostgreSQL
- **Caching**: Redis
- **AI**: OpenAI GPT-4, DALL-E 3
- **Real-time**: Socket.io
- **Containerization**: Docker

## Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0
- Docker and Docker Compose
- PostgreSQL 16 (via Docker)
- Redis 7 (via Docker)

## Quick Start

### 1. Clone the repository
\`\`\`bash
git clone https://github.com/yourusername/allin-social-platform.git
cd allin-social-platform
\`\`\`

### 2. Install dependencies
\`\`\`bash
npm install
\`\`\`

### 3. Set up environment variables
\`\`\`bash
cp .env.example .env
# Edit .env with your configuration
\`\`\`

### 4. Start Docker services
\`\`\`bash
npm run docker:up
\`\`\`

### 5. Run database migrations
\`\`\`bash
npm run prisma:migrate
\`\`\`

### 6. Start development servers
\`\`\`bash
npm run dev
\`\`\`

Frontend: http://localhost:3000
Backend API: http://localhost:5000
pgAdmin: http://localhost:5050
MailHog: http://localhost:8025

## Project Structure
\`\`\`
allin-social-platform/
├── frontend/          # Next.js application
├── backend/           # Express API server
├── docker/            # Docker configuration
├── docs/              # Documentation
├── scripts/           # Utility scripts
└── .github/           # GitHub Actions workflows
\`\`\`

## Available Scripts
- \`npm run dev\` - Start both frontend and backend in development mode
- \`npm run build\` - Build both applications for production
- \`npm run test\` - Run all tests
- \`npm run lint\` - Lint all code
- \`npm run docker:up\` - Start Docker services
- \`npm run docker:down\` - Stop Docker services
- \`npm run prisma:studio\` - Open Prisma Studio

## Documentation
- [Architecture](./docs/architecture.md)
- [API Documentation](./docs/api.md)
- [Development Guide](./docs/development.md)
- [Deployment Guide](./docs/deployment.md)

## Contributing
Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License
This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## Support
For support, email support@allin.app or join our Discord server.
```

#### File: `/LICENSE`
```
MIT License

Copyright (c) 2025 AllIN Social Platform

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

#### File: `/CONTRIBUTING.md`
```markdown
# Contributing to AllIN

We love your input! We want to make contributing to AllIN as easy and transparent as possible.

## Development Process
We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

## Pull Requests
1. Fork the repo and create your branch from \`main\`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

## Code Style
- Use TypeScript for all new code
- Follow the ESLint and Prettier configurations
- Write meaningful commit messages
- Add comments for complex logic

## License
By contributing, you agree that your contributions will be licensed under its MIT License.
```

### Step 3: Initialize Version Control
```bash
# Initialize git
git add .
git commit -m "Initial commit: Project structure and configuration"

# Create main branch
git branch -M main

# Add remote (replace with your repository URL)
# git remote add origin https://github.com/yourusername/allin-social-platform.git
# git push -u origin main
```

### Step 4: Install Root Dependencies
```bash
# Install concurrently for running multiple scripts
npm install
```

## Implementation Notes

1. **Monorepo Structure**: We're using npm workspaces for managing the monorepo
2. **Scripts**: All major commands can be run from the root directory
3. **Environment Variables**: Template provided, actual values need to be added
4. **Git Strategy**: Using conventional commits for clear history
5. **Documentation**: Basic structure established, to be expanded as we build

## Dependencies
- concurrently: For running multiple npm scripts simultaneously

## Blocking Issues
None

## Next Steps
After completing this story, proceed to:
- STORY-002: Docker environment setup
- STORY-003: Next.js application setup
- STORY-004: Express backend setup

## Time Estimate
- Setup: 30 minutes
- Configuration: 30 minutes
- Documentation: 30 minutes
- Total: 1.5 hours

## Testing
Verify completion by:
1. Confirming all files are created
2. Running `npm install` successfully
3. Checking git repository is initialized
4. Ensuring folder structure matches specification

## Notes for Dev Agent
- Replace placeholder values in package.json with actual project details
- Ensure all files use LF line endings (not CRLF)
- The .env.example file should never contain real secrets
- Update GitHub repository URL when available