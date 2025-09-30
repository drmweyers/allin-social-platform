# AllIN Platform - Next-Generation Social Media Management

## 🚀 Overview

AllIN is a revolutionary social media management platform that combines cutting-edge AI capabilities with enterprise-grade analytics. Built with the latest technologies and featuring the industry's first full Model Context Protocol (MCP) integration, AllIN empowers businesses to manage, analyze, and optimize their social media presence like never before.

### ✨ Key Features

#### 🤖 AI-Powered Management
- **5 Specialized AI Agents**: Content Creator, Analytics Advisor, Campaign Manager, Engagement Optimizer, and Strategy Planner
- **Natural Language Control**: Manage everything with plain English commands
- **MCP Integration**: Industry's first platform with full Model Context Protocol support
- **Claude AI Integration**: Powered by Anthropic's advanced AI models

#### 📊 Enterprise Analytics
- **Comprehensive Dashboards**: Real-time performance metrics and insights
- **Competitor Analysis**: Track and benchmark against competitors
- **Custom Reports**: Generate tailored reports in PDF, Excel, CSV formats
- **Predictive Analytics**: AI-driven performance predictions

#### 📅 Smart Scheduling
- **Visual Calendar**: Drag-and-drop content management
- **Bulk Scheduling**: Schedule multiple posts at once
- **Optimal Timing**: AI-suggested best posting times
- **Auto-Publishing**: Set and forget your content strategy

#### 👥 Team Collaboration
- **Role-Based Access**: Granular permission controls
- **Approval Workflows**: Streamlined content approval process
- **Real-Time Collaboration**: Work together seamlessly
- **Activity Tracking**: Complete audit trail of all actions

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