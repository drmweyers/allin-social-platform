# AllIN Platform - Planning Document

## Project Vision
Build a comprehensive AI-powered social media management platform that democratizes professional social media tools for businesses of all sizes.

---

## Architecture Overview

### System Architecture (Updated v3.0)
```
┌─────────────────────────────────────────────────────────────┐
│                    Client Applications                       │
│  - Next.js PWA      - Mobile Apps      - MCP Clients        │
└─────────────────┬───────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────┐
│                     API Gateway (Kong)                       │
│  - Authentication   - Rate Limiting    - Load Balancing     │
└─────────────────┬───────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────┐
│                   Microservices Layer                        │
├─────────────────────────────────────────────────────────────┤
│ • Auth Service        • Content Service   • Social Service  │
│ • AI Service          • n8n Integration   • Analytics       │
│ • API Vault Service   • MCP Service       • Team Service    │
└─────────────────┬───────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────┐
│                  Event Bus (Apache Kafka)                    │
└─────────────────┬───────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────┐
│                       Data Layer                             │
├─────────────────────────────────────────────────────────────┤
│ PostgreSQL │ Redis │ MongoDB │ Vault │ S3 │ Elasticsearch  │
└─────────────────┬───────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────┐
│                  External Integrations                       │
│ Social APIs │ AI Providers │ n8n Instance │ Email/SMS       │
│ (Including TikTok)  │ (BYOK Support)      │                 │
└─────────────────────────────────────────────────────────────┘
```

### Database Schema (Current)
```prisma
- User (authentication, profile)
- Session (JWT sessions)
- VerificationToken (email verification)
- PasswordResetToken (password recovery)
- Organization (multi-tenancy)
- OrganizationMember (team management)

// Coming Next:
- SocialAccount (platform connections)
- Post (content management)
- ScheduledPost (scheduling)
- Analytics (metrics storage)
- Media (file management)
```

---

## Technology Stack Decisions

### Frontend Stack
- **Next.js 14.2.18**: App router, server components, API routes
- **TypeScript**: Type safety throughout
- **Tailwind CSS**: Utility-first styling
- **Radix UI**: Headless component primitives
- **class-variance-authority**: Component variants
- **React Hook Form**: Form management (planned)
- **TanStack Query**: Data fetching (planned)

### Backend Stack
- **Express 4.21.1**: Web framework
- **TypeScript**: Type safety
- **Prisma ORM**: Database management
- **PostgreSQL 16**: Primary database
- **Redis 7**: Caching & sessions
- **JWT**: Authentication
- **bcrypt**: Password hashing
- **Nodemailer + Mailgun**: Email service
- **OpenAI API**: AI content generation (planned)

### DevOps Stack
- **Docker**: Containerization
- **Docker Compose**: Local development
- **GitHub Actions**: CI/CD (planned)
- **Vercel**: Frontend hosting (planned)
- **AWS/DigitalOcean**: Backend hosting (planned)

---

## API Design

### Current Endpoints
```
POST   /api/auth/register     - User registration
POST   /api/auth/login        - User login
POST   /api/auth/logout       - User logout
POST   /api/auth/refresh      - Token refresh
POST   /api/auth/verify-email - Email verification
POST   /api/auth/forgot-password - Password reset request
POST   /api/auth/reset-password  - Password reset
GET    /api/auth/me          - Current user

// Coming Next:
GET    /api/accounts         - List connected accounts
POST   /api/accounts/connect - Connect social account
DELETE /api/accounts/:id    - Disconnect account
GET    /api/posts           - List posts
POST   /api/posts           - Create post
PUT    /api/posts/:id       - Update post
DELETE /api/posts/:id       - Delete post
POST   /api/posts/schedule  - Schedule post
POST   /api/ai/generate     - Generate content
GET    /api/analytics       - Get analytics
```

---

## Security Architecture

### Implemented Security
- JWT with refresh token rotation
- Password hashing (bcrypt, 12 rounds)
- Email verification requirement
- Rate limiting on auth endpoints
- CORS configuration
- HTTP-only cookies for tokens
- Input validation (express-validator)
- SQL injection prevention (Prisma)
- XSS protection (React)

### Planned Security
- OAuth 2.0 for social platforms
- API key management
- Role-based access control (RBAC)
- Audit logging
- Data encryption at rest
- GDPR compliance features
- 2FA support
- Security headers (Helmet)

---

## Development Workflow

### Git Branching Strategy
```
main (production)
├── develop (staging)
│   ├── feature/auth-system ✅
│   ├── feature/dashboard ✅
│   ├── feature/social-connections (current)
│   ├── feature/content-creation
│   └── feature/analytics
```

### Environment Setup
```bash
# Development
- Frontend: http://localhost:3001
- Backend: http://localhost:5000
- PostgreSQL: localhost:5432
- Redis: localhost:6380
- MailHog: http://localhost:8025

# Environment Variables (.env)
DATABASE_URL="postgresql://..."
JWT_ACCESS_SECRET="..."
JWT_REFRESH_SECRET="..."
REDIS_URL="redis://..."
MAILGUN_API_KEY="..."
FRONTEND_URL="http://localhost:3001"
```

---

## Performance Targets

### Frontend Performance
- Lighthouse Score: >90
- First Contentful Paint: <1.5s
- Time to Interactive: <3s
- Bundle Size: <250KB (initial)

### Backend Performance
- API Response Time: <200ms (avg)
- Database Queries: <50ms
- Concurrent Users: 10,000+
- Uptime: 99.9%

### Scalability Plan
- Horizontal scaling (load balancing)
- Database read replicas
- Redis clustering
- CDN for static assets
- Queue system for heavy tasks
- Microservices architecture (future)

---

## Testing Strategy

### Current Testing
- Manual testing
- API testing with curl/Postman
- Component testing in browser

### Planned Testing
- Unit tests (Jest)
- Integration tests
- E2E tests (Playwright)
- Load testing (K6)
- Security testing
- Accessibility testing

---

## Deployment Strategy

### Phase 1: MVP (Current)
- Local development environment
- Docker-based services
- Manual testing
- Sprint-based development

### Phase 2: Beta
- Staging environment
- CI/CD pipeline
- Automated testing
- Beta user access

### Phase 3: Production
- Production environment
- Monitoring (Sentry, DataDog)
- Analytics (Mixpanel, GA)
- Customer support tools
- Backup & disaster recovery

---

## Feature Prioritization

### P0 - Critical (MVP)
✅ User authentication
✅ Dashboard
✅ Social account connections
✅ Content creation with AI
✅ Analytics and insights
✅ Team collaboration
✅ Approval workflows
✅ Notification system
⬜ Basic post creation
⬜ Simple scheduling
⬜ Real-time Socket.io integration

### P1 - Important
⬜ AI content generation
⬜ Analytics dashboard
⬜ Team collaboration
⬜ Bulk operations

### P2 - Nice to Have
⬜ Advanced AI features
⬜ MCP integration
⬜ White-label options
⬜ API for developers
⬜ Mobile app

---

## Risk Management

### Technical Risks
- Social platform API changes
- Rate limiting issues
- Scaling challenges
- Security vulnerabilities

### Mitigation Strategies
- API abstraction layer
- Caching and queuing
- Progressive enhancement
- Regular security audits

---

## Success Metrics

### Technical Metrics
- 95% uptime
- <200ms API response
- <3s page load
- Zero critical bugs

### Business Metrics
- 10,000 active users (6 months)
- 50% DAU/MAU ratio
- <5% churn rate
- 4.5+ app store rating

### User Satisfaction
- NPS score >50
- Support ticket resolution <24h
- Feature adoption >60%
- User retention >80%

---

## Session History

### Session 9 (January 2025) - Infrastructure Fixes
**Issues Resolved**:
- ✅ Fixed missing `use-toast` hook error
- ✅ Created comprehensive troubleshooting guide
- ✅ Resolved frontend compilation issues
- ✅ Both servers running successfully

**Files Created**:
- `frontend/src/hooks/use-toast.ts` - Toast notification hook
- `BMAD-METHOD/troubleshooting-guide.md` - Complete troubleshooting documentation

### Session 5 (January 2025) - Sprint 6 Completed
**Features Implemented**:
- ✅ Multi-step approval workflow system
- ✅ Team commenting with @mentions
- ✅ Real-time notification system
- ✅ Activity audit logging
- ✅ Team member management
- ✅ Workflow management UI
- ✅ Team collaboration dashboard

**Technical Achievements**:
- Event-driven architecture with EventEmitter
- Redis caching for real-time data
- Role-based access control system
- Comprehensive UI dashboards

### Session 4 (January 2025) - Sprint 5 Completed
**Features Implemented**:
- ✅ Analytics service with data aggregation
- ✅ Competitor analysis and benchmarking
- ✅ AI-powered sentiment analysis
- ✅ ROI tracking and metrics
- ✅ Predictive posting recommendations
- ✅ Interactive analytics dashboard
- ✅ A/B testing framework

**Technical Achievements**:
- Created comprehensive analytics backend service
- Built interactive dashboard with Recharts
- Implemented AI integration for predictions
- Added real-time data streaming support

## Next Steps

### Immediate (Session 6)
Priorities:
1. **Fix Environment Issues** (CRITICAL):
   - Resolve Node.js/npm installation issues
   - Get backend server running properly
   - Test collaboration features

2. **Complete Real-time Features**:
   - Socket.io frontend integration
   - Live notifications and updates
   - Real-time comment updates
   - Typing indicators

3. **Sprint 4**: Scheduling & Calendar
   - Visual calendar interface
   - Drag-and-drop scheduling
   - Queue management
   - Optimal time algorithms

4. **Enhanced Collaboration**:
   - @mentions autocomplete
   - Rich text editor for comments
   - Workflow templates
   - File attachments

### Short-term (Next 2 Sessions)
1. Complete remaining core sprints
2. Fix TypeScript compilation issues
3. Add comprehensive testing
4. Performance optimization

### Medium-term (Next Month)
1. MCP integration
2. Mobile responsiveness
3. Beta testing with users
4. Security audit

### Long-term (3 Months)
1. Public API development
2. Mobile app development
3. Enterprise features
4. Production deployment