# AllIN Platform

## AI-Powered Social Media Management Platform

AllIN is a comprehensive social media management platform that leverages AI to help businesses and content creators manage their social media presence effectively.

### Features

- 🤖 AI-powered content generation
- 📅 Smart scheduling and queue management
- 📊 Unified analytics dashboard
- 👥 Team collaboration tools
- 🔗 Multi-platform support
- 🎯 MCP integration for LLM control
- 🤝 Autonomous AI agents

### Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Radix UI
- **Backend**: Express, TypeScript, Prisma ORM
- **Database**: PostgreSQL 16, Redis 7
- **AI**: OpenAI GPT-4, DALL-E 3
- **Email**: Mailgun (production), MailHog (development)
- **Infrastructure**: Docker, Docker Compose

### Prerequisites

- Node.js 18+
- Docker Desktop
- Git

### Quick Start

1. Clone the repository
```bash
git clone https://github.com/yourusername/allin-platform.git
cd allin-platform
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start Docker services
```bash
docker-compose up -d
```

5. Run database migrations
```bash
npm run db:migrate
npm run db:seed
```

6. Start development server
```bash
npm run dev
```

Visit:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Documentation: http://localhost:5000/api-docs
- MailHog: http://localhost:8025
- pgAdmin: http://localhost:5050

### Project Structure

```
allin-platform/
├── frontend/          # Next.js frontend application
├── backend/           # Express backend API
├── shared/            # Shared types and utilities
├── prisma/            # Database schema and migrations
├── docker/            # Docker configuration
├── scripts/           # Build and deployment scripts
├── docs/              # Documentation
└── .github/           # GitHub Actions workflows
```

### Development

#### Available Scripts

- `npm run dev` - Start development servers
- `npm run build` - Build for production
- `npm run test` - Run tests
- `npm run lint` - Lint code
- `npm run format` - Format code with Prettier

#### Database Commands

- `npm run db:migrate` - Run migrations
- `npm run db:seed` - Seed database
- `npm run db:studio` - Open Prisma Studio

### Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

### License

This project is proprietary software. All rights reserved.

### Support

For support, email support@allin-platform.com or join our Slack channel.