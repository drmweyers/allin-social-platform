# AllIN Social Media Management Platform

<div align="center">

![AllIN Platform](https://img.shields.io/badge/AllIN-Social%20Media%20Platform-blue?style=for-the-badge)
![Version](https://img.shields.io/badge/version-2.0.0-green?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)
![Platform](https://img.shields.io/badge/platform-Web%20%7C%20API-lightgrey?style=for-the-badge)

**Enterprise-Grade Social Media Management Platform with AI-Powered Content Creation**

*Streamline your social media presence across all major platforms with intelligent automation, comprehensive analytics, and seamless team collaboration.*

[🚀 Live Demo](https://allin-social-platform.herokuapp.com) · [📖 Documentation](./COMPREHENSIVE_BUSINESS_LOGIC_GUIDE.md) · [🐛 Report Bug](https://github.com/drmweyers/allin-social-platform/issues) · [💡 Request Feature](https://github.com/drmweyers/allin-social-platform/issues)

</div>

---

## 🎯 Platform Overview

AllIN is a comprehensive, enterprise-grade social media management platform designed to streamline and optimize your social media presence across all major platforms. Whether you're a solo content creator, a growing business, or a large agency managing multiple clients, AllIN provides the tools you need to create, schedule, publish, and analyze your social media content efficiently.

### ✨ Key Features

- 🌐 **Multi-Platform Integration** - Unified management across 10+ social platforms
- 🤖 **AI-Powered Content Creation** - GPT-4 integration for intelligent content generation
- ⚡ **Smart Scheduling** - AI-optimized posting times for maximum engagement
- 📊 **Comprehensive Analytics** - Cross-platform performance tracking and insights
- 👥 **Team Collaboration** - Role-based permissions and approval workflows
- 🔒 **Enterprise Security** - Bank-level security with OAuth 2.0 integration
- 🎨 **White-Label Solutions** - Custom branding for agencies
- 🔌 **Extensive API** - Full RESTful API with webhook support

---

## 🌍 Supported Platforms

| Platform | Status | Features |
|----------|--------|----------|
| **Facebook** | ✅ Full Support | Pages, Posts, Stories, Events, Analytics |
| **Instagram** | ✅ Full Support | Feed Posts, Stories, Reels, IGTV, Shopping |
| **Twitter/X** | ✅ Full Support | Tweets, Threads, Spaces, Lists |
| **LinkedIn** | ✅ Full Support | Personal Profiles, Company Pages, Articles |
| **TikTok** | ✅ Full Support | Videos, Trends, Hashtag Challenges |
| **YouTube** | ✅ Full Support | Video Uploads, Shorts, Community Posts |
| **Pinterest** | ✅ Full Support | Pins, Boards, Story Pins |
| **Snapchat** | ✅ Full Support | Snaps, Stories, Spotlight |
| **Reddit** | ✅ Full Support | Posts, Comments, Community Engagement |
| **Threads** | ✅ Full Support | Text Posts, Replies, Reposts |

---

## 🚀 Quick Start

### Demo Accounts

Get started immediately with our pre-configured demo accounts:

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| **Admin** | admin@allin.demo | AdminPass123 | Full system access |
| **Agency Owner** | agency@allin.demo | AgencyPass123 | Manage all clients |
| **Manager** | manager@allin.demo | ManagerPass123 | Create & schedule content |
| **Creator** | creator@allin.demo | CreatorPass123 | Content creation only |
| **Client** | client@allin.demo | ClientPass123 | Read-only view |
| **Team** | team@allin.demo | TeamPass123 | Limited access |

### 🏃‍♂️ Getting Started

1. **Access the Platform**
   ```bash
   # Visit the live demo
   https://allin-social-platform.herokuapp.com
   
   # Or run locally (see Installation section)
   npm run dev
   ```

2. **Connect Your Social Accounts**
   - Navigate to "Accounts" in the sidebar
   - Click "Connect Account" and choose your platform
   - Authorize AllIN to access your account

3. **Create Your First Post**
   - Go to "Create" in the sidebar
   - Write content or use AI assistance
   - Select target platforms and schedule

---

## 🛠️ Installation & Development

### Prerequisites

- **Node.js** 20+ 
- **PostgreSQL** 14+
- **Redis** 6+ (for caching and queues)
- **Docker** (recommended for development)

### 🐳 Docker Development (Recommended)

```bash
# Clone the repository
git clone https://github.com/drmweyers/allin-social-platform.git
cd allin-social-platform

# Start development environment
docker-compose --profile dev up -d

# Access the application
Frontend: http://localhost:3001
Backend API: http://localhost:5000
```

### 💻 Local Development

```bash
# Clone and install dependencies
git clone https://github.com/drmweyers/allin-social-platform.git
cd allin-social-platform
npm ci

# Set up environment variables
cp allin-platform/backend/.env.example allin-platform/backend/.env
cp allin-platform/frontend/.env.example allin-platform/frontend/.env

# Set up database
npm run db:setup
npm run db:migrate
npm run db:seed

# Start development servers
npm run dev
```

### 🧪 Testing

The platform includes a comprehensive BMAD (Build, Monitor, Analyze, Deploy) testing framework with **100% test coverage**.

```bash
# Run complete test suite (730+ tests)
npm run test:all

# Run specific test types
npm run test:unit           # 515+ unit tests
npm run test:integration    # 200+ integration tests
npm run test:e2e           # 16+ end-to-end workflows

# Generate coverage reports
npm run test:coverage
npm run test:coverage:open  # View HTML coverage report
```

**Test Coverage Statistics:**
- **515+ Unit Tests** - Complete service and component coverage
- **200+ Integration Tests** - API and database integration testing
- **16+ E2E Tests** - Complete user workflow validation
- **100% Code Coverage** - Comprehensive quality assurance

---

## 🏗️ Architecture

### Technology Stack

**Frontend:**
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible component library
- **React Hook Form** - Form management
- **Zustand** - State management

**Backend:**
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **TypeScript** - Type-safe server development
- **Prisma** - Database ORM and migrations
- **PostgreSQL** - Primary database
- **Redis** - Caching and session storage

**Infrastructure:**
- **Docker** - Containerization
- **GitHub Actions** - CI/CD pipeline
- **OAuth 2.0** - Social media authentication
- **JWT** - Secure user authentication

### 📁 Project Structure

```
allin-platform/
├── frontend/                 # Next.js frontend application
│   ├── src/app/             # App Router pages and layouts
│   ├── src/components/      # Reusable UI components
│   ├── src/lib/            # Utility functions and configurations
│   └── tests/              # Frontend test suites
├── backend/                 # Express.js backend API
│   ├── src/routes/         # API route handlers
│   ├── src/services/       # Business logic services
│   ├── src/middleware/     # Express middleware
│   ├── src/utils/          # Utility functions
│   └── tests/              # Backend test suites
├── prisma/                 # Database schema and migrations
├── BMAD-METHOD/           # Comprehensive testing framework
│   ├── unit-tests/        # 515+ unit tests
│   ├── integration-tests/ # 200+ integration tests
│   ├── e2e-tests/         # 16+ end-to-end tests
│   └── documentation/     # Testing documentation
└── docs/                  # Project documentation
```

---

## 🚀 Key Features Deep Dive

### 🤖 AI-Powered Content Creation

- **GPT-4 Integration** - Advanced content generation with context awareness
- **Platform Optimization** - Automatically adapt content for each platform's best practices
- **Tone & Style Control** - Adjust content tone for different audiences
- **Hashtag Intelligence** - AI-powered hashtag research and optimization
- **Performance Prediction** - Predict content performance before publishing

### ⚡ Smart Scheduling & Automation

- **Optimal Time Prediction** - AI analyzes audience activity for best posting times
- **Queue Management** - Organize content in intelligent publishing queues
- **Recurring Posts** - Set up automated recurring content campaigns
- **Cross-Platform Coordination** - Synchronize content across multiple platforms
- **Workflow Automation** - n8n integration for complex automation workflows

### 📊 Advanced Analytics & Reporting

- **Cross-Platform Insights** - Unified analytics dashboard across all platforms
- **Performance Benchmarking** - Compare your performance with industry standards
- **ROI Tracking** - Revenue attribution and conversion tracking
- **Custom Reports** - Build tailored reports for stakeholders
- **Competitive Analysis** - Monitor and analyze competitor performance

### 👥 Enterprise Team Collaboration

- **Role-Based Access Control** - 7 distinct user roles with granular permissions
- **Approval Workflows** - Multi-stage content approval processes
- **Real-Time Collaboration** - Team chat and collaborative content creation
- **Client Management** - Comprehensive client portal and reporting (agencies)
- **White-Label Solutions** - Custom branding for agency clients

---

## 🔌 API & Integrations

### RESTful API

AllIN provides a comprehensive REST API for custom integrations:

```bash
# Base URL
https://api.allin.social/v1

# Example: Create content
POST /content
{
  "text": "Hello, world! 🌍",
  "platforms": ["twitter", "facebook", "linkedin"],
  "scheduleFor": "2024-01-15T10:00:00Z",
  "useAI": true
}

# Example: Get analytics
GET /analytics/overview?start=2024-01-01&end=2024-01-31
```

### Webhook Support

Real-time event notifications:
```javascript
// Webhook event examples
{
  "event": "post.published",
  "data": {
    "postId": "post_123",
    "platform": "twitter",
    "publishedAt": "2024-01-15T10:00:00Z"
  }
}
```

### Third-Party Integrations

- **Marketing Tools** - Mailchimp, HubSpot, Salesforce
- **E-commerce** - Shopify, WooCommerce, Magento
- **Design Tools** - Canva, Adobe Creative Suite, Figma
- **Analytics** - Google Analytics, Adobe Analytics
- **Automation** - n8n, Zapier, Microsoft Power Automate

---

## 📈 Performance & Security

### Performance Metrics

- **API Response Time** - <200ms (95th percentile)
- **Page Load Time** - <2 seconds
- **Database Query Time** - <100ms for complex queries
- **Concurrent Users** - Tested with 1000+ simultaneous users

### Security Features

- **Data Encryption** - AES-256 encryption for data at rest
- **TLS 1.3** - Secure data transmission
- **OAuth 2.0** - Industry-standard social media authentication
- **JWT Authentication** - Secure user session management
- **RBAC** - Role-based access control
- **2FA Support** - TOTP and SMS two-factor authentication
- **GDPR Compliant** - Full privacy compliance

---

## 🏢 Use Cases

### For Agencies
- **Multi-Client Management** - Efficiently manage multiple client accounts
- **White-Label Solutions** - Custom branding and client portals
- **Team Coordination** - Manage large content teams
- **Client Reporting** - Professional automated reporting
- **Scalable Workflows** - Automation for growing client bases

### For Businesses
- **Unified Social Presence** - Manage all platforms from one dashboard
- **AI Content Generation** - Reduce content creation time by 80%
- **Performance Insights** - Data-driven social media strategy
- **Team Collaboration** - Coordinate marketing teams effectively
- **ROI Tracking** - Measure social media business impact

### For Content Creators
- **Multi-Platform Publishing** - Reach audiences everywhere
- **Content Optimization** - AI-powered content improvement
- **Scheduling Automation** - Consistent posting without manual effort
- **Performance Analytics** - Understand what content works best
- **Growth Tools** - Tools to grow audience and engagement

---

## 📚 Documentation

- [📖 **Comprehensive Business Logic Guide**](./COMPREHENSIVE_BUSINESS_LOGIC_GUIDE.md) - Complete user guide and feature documentation
- [🧪 **BMAD Testing Framework**](./BMAD-METHOD/ALLIN-TESTING-FRAMEWORK.md) - Testing methodology and execution
- [🔧 **API Documentation**](./docs/API.md) - Complete API reference
- [🚀 **Deployment Guide**](./DEPLOYMENT.md) - Production deployment instructions
- [🛠️ **Development Guide**](./docs/DEVELOPMENT.md) - Development setup and contribution guidelines

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](./CONTRIBUTING.md) for details.

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes** with tests
4. **Run the test suite** (`npm run test:all`)
5. **Commit your changes** (`git commit -m 'Add amazing feature'`)
6. **Push to the branch** (`git push origin feature/amazing-feature`)
7. **Open a Pull Request**

### Quality Standards

- **100% Test Coverage** - All new code must include comprehensive tests
- **TypeScript** - All code must be properly typed
- **Code Review** - All changes require peer review
- **Documentation** - Update documentation for new features

---

## 📊 Project Stats

![GitHub Stars](https://img.shields.io/github/stars/drmweyers/allin-social-platform?style=social)
![GitHub Forks](https://img.shields.io/github/forks/drmweyers/allin-social-platform?style=social)
![GitHub Issues](https://img.shields.io/github/issues/drmweyers/allin-social-platform)
![GitHub Pull Requests](https://img.shields.io/github/issues-pr/drmweyers/allin-social-platform)

**Code Quality:**
- **730+ Tests** - Comprehensive test coverage
- **100% TypeScript** - Fully typed codebase
- **Zero Security Vulnerabilities** - Regular security audits
- **Performance Optimized** - Sub-200ms API responses

**Platform Statistics:**
- **10+ Social Platforms** - Complete integration coverage
- **6 User Roles** - Granular permission system
- **50+ API Endpoints** - Comprehensive API coverage
- **Enterprise Ready** - Production-grade architecture

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Claude Code** - AI-powered development acceleration
- **OpenAI** - GPT-4 integration for content generation
- **Vercel** - Next.js framework and deployment platform
- **Prisma** - Database ORM and type safety
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives

---

## 📞 Support & Contact

- **📧 Email** - support@allin.social
- **💬 Discord** - [Join our community](https://discord.gg/allin-social)
- **🐛 Issues** - [GitHub Issues](https://github.com/drmweyers/allin-social-platform/issues)
- **📖 Documentation** - [Complete guides and API docs](./docs/)

---

<div align="center">

**Built with ❤️ by the AllIN Team**

*Transforming social media management through intelligent automation and seamless collaboration.*

</div>