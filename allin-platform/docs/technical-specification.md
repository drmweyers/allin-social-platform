# Technical Specification Document
# AllIN Platform - Version 3.0

## Document Information
- **Version**: 3.0
- **Date**: January 2025
- **Status**: Architecture Review Phase
- **Based on**: PRD v2.3
- **Author**: Architect Agent (BMAD Method)

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Database Design](#database-design)
4. [API Specifications](#api-specifications)
5. [Security Architecture](#security-architecture)
6. [Integration Architecture](#integration-architecture)
7. [Performance Architecture](#performance-architecture)
8. [Deployment Architecture](#deployment-architecture)
9. [Testing Strategy](#testing-strategy)
10. [Implementation Phases](#implementation-phases)

---

## 1. Executive Summary

### Purpose
This technical specification provides the comprehensive architecture for AllIN Platform, incorporating:
- Multi-platform social media management (including TikTok)
- n8n workflow automation integration
- BYOK (Bring Your Own Key) for AI providers
- MCP (Model Context Protocol) integration
- Enterprise-grade security and scalability

### Key Technical Decisions
- **Architecture Pattern**: Microservices with event-driven communication
- **API Design**: RESTful with GraphQL for complex queries
- **Security**: Zero-knowledge encryption for API keys
- **Scaling**: Horizontal scaling with Kubernetes
- **Integration**: Webhook-based event system for n8n

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Client Layer                                │
├──────────────────────┬──────────────────────┬──────────────────────┤
│   Web Application    │   Mobile Apps        │   MCP Clients        │
│   (Next.js PWA)      │   (React Native)     │   (Claude, etc)      │
└──────────┬───────────┴──────────┬───────────┴──────────┬───────────┘
           │                      │                       │
           └──────────────────────┼───────────────────────┘
                                  │
┌─────────────────────────────────▼───────────────────────────────────┐
│                         API Gateway Layer                           │
│                     (Kong / AWS API Gateway)                        │
├──────────────────────────────────────────────────────────────────────┤
│  • Rate Limiting           • Authentication                         │
│  • Load Balancing          • Request Routing                        │
│  • API Versioning          • Response Caching                       │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │
┌─────────────────────────────────▼───────────────────────────────────┐
│                      Microservices Layer                            │
├────────────────┬────────────────┬────────────────┬─────────────────┤
│  Auth Service  │  Content       │  Social        │  Analytics      │
│                │  Service       │  Service       │  Service        │
├────────────────┼────────────────┼────────────────┼─────────────────┤
│  AI Service    │  Scheduling    │  n8n           │  MCP            │
│                │  Service       │  Integration   │  Service        │
├────────────────┼────────────────┼────────────────┼─────────────────┤
│  Team Service  │  Notification  │  Workflow      │  API Key        │
│                │  Service       │  Service       │  Vault Service  │
└────────────────┴────────────────┴────────────────┴─────────────────┘
                                  │
┌─────────────────────────────────▼───────────────────────────────────┐
│                       Event Bus (Apache Kafka)                      │
├──────────────────────────────────────────────────────────────────────┤
│  • Event Streaming         • Message Queuing                        │
│  • Event Sourcing          • CQRS Implementation                    │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │
┌─────────────────────────────────▼───────────────────────────────────┐
│                         Data Layer                                  │
├────────────────┬────────────────┬────────────────┬─────────────────┤
│  PostgreSQL    │  Redis         │  MongoDB       │  S3/MinIO       │
│  (Primary DB)  │  (Cache)       │  (Analytics)   │  (File Storage) │
├────────────────┼────────────────┼────────────────┼─────────────────┤
│  Elasticsearch │  ClickHouse    │  HashiCorp     │  Vector DB      │
│  (Search)      │  (Time Series) │  Vault (Keys)  │  (AI Embeddings)│
└────────────────┴────────────────┴────────────────┴─────────────────┘
                                  │
┌─────────────────────────────────▼───────────────────────────────────┐
│                    External Integrations                            │
├────────────────┬────────────────┬────────────────┬─────────────────┤
│  Social APIs   │  AI Providers  │  n8n Instance  │  Email/SMS      │
│  (FB, IG, X,   │  (OpenAI,      │  (Self-hosted  │  (Mailgun,      │
│   LinkedIn,    │   Anthropic,   │   or Cloud)    │   Twilio)       │
│   TikTok)      │   Google, etc) │                │                 │
└────────────────┴────────────────┴────────────────┴─────────────────┘
```

### 2.2 Service Architecture Details

#### Auth Service
```yaml
Responsibilities:
  - User authentication (JWT)
  - Session management
  - OAuth 2.0 flows
  - Role-based access control
  - Multi-factor authentication

Technology:
  - Node.js + Express
  - Passport.js for OAuth
  - JWT for tokens
  - Redis for sessions

APIs:
  - POST /auth/register
  - POST /auth/login
  - POST /auth/refresh
  - POST /auth/logout
  - GET  /auth/me
  - POST /auth/mfa/setup
  - POST /auth/mfa/verify
```

#### Content Service
```yaml
Responsibilities:
  - Post creation and management
  - Draft system
  - Template management
  - Media handling
  - Content optimization

Technology:
  - Node.js + Express
  - Sharp for image processing
  - FFmpeg for video processing
  - Bull for job queues

APIs:
  - POST   /content/posts
  - GET    /content/posts
  - PUT    /content/posts/:id
  - DELETE /content/posts/:id
  - POST   /content/drafts
  - GET    /content/templates
  - POST   /content/media/upload
```

#### Social Service
```yaml
Responsibilities:
  - Platform connections
  - Publishing to social media
  - Account management
  - Platform-specific features

Technology:
  - Node.js + Express
  - Platform SDKs
  - OAuth clients
  - WebSocket for real-time

APIs:
  - GET    /social/accounts
  - POST   /social/accounts/connect
  - DELETE /social/accounts/:id
  - POST   /social/publish
  - GET    /social/platforms
  - POST   /social/tiktok/upload
```

#### n8n Integration Service
```yaml
Responsibilities:
  - n8n API communication
  - Workflow management
  - Event publishing
  - Webhook handling
  - Automation monitoring

Technology:
  - Node.js + Express
  - WebSocket for real-time
  - Redis for event queue
  - Webhook verification

APIs:
  - POST   /n8n/connect
  - GET    /n8n/workflows
  - POST   /n8n/webhooks/:event
  - GET    /n8n/executions
  - POST   /n8n/trigger
  - GET    /n8n/monitor/dashboard
```

#### API Key Vault Service
```yaml
Responsibilities:
  - Secure key storage
  - Encryption/decryption
  - Key rotation
  - Access control
  - Audit logging

Technology:
  - HashiCorp Vault
  - AES-256 encryption
  - HSM integration (production)
  - Audit log streaming

APIs:
  - POST   /vault/keys/store
  - GET    /vault/keys/:id
  - PUT    /vault/keys/:id/rotate
  - DELETE /vault/keys/:id
  - GET    /vault/audit/logs
```

---

## 3. Database Design

### 3.1 Enhanced Schema

```sql
-- Existing tables (enhanced)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    mfa_secret VARCHAR(255),
    mfa_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    plan VARCHAR(50) NOT NULL, -- starter, professional, team, enterprise
    n8n_api_key_id UUID REFERENCES api_keys(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- New tables for n8n integration
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    provider VARCHAR(100) NOT NULL, -- openai, anthropic, google, n8n, etc
    key_name VARCHAR(255) NOT NULL,
    encrypted_key TEXT NOT NULL,
    key_hint VARCHAR(20), -- Last 4 characters for identification
    is_active BOOLEAN DEFAULT TRUE,
    usage_limit_monthly DECIMAL(10,2),
    usage_current DECIMAL(10,2) DEFAULT 0,
    last_used_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE n8n_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    workflow_id VARCHAR(255) NOT NULL, -- n8n workflow ID
    workflow_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    trigger_events JSONB, -- Array of events this workflow listens to
    last_execution_id VARCHAR(255),
    last_execution_status VARCHAR(50),
    last_executed_at TIMESTAMP,
    execution_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE n8n_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES n8n_workflows(id),
    execution_id VARCHAR(255) NOT NULL, -- n8n execution ID
    status VARCHAR(50) NOT NULL, -- running, success, error, waiting
    started_at TIMESTAMP NOT NULL,
    finished_at TIMESTAMP,
    error_message TEXT,
    data JSONB, -- Execution data/results
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE automation_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    event_type VARCHAR(100) NOT NULL, -- post_published, engagement_threshold, etc
    event_data JSONB NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    workflow_ids JSONB, -- Array of triggered workflow IDs
    created_at TIMESTAMP DEFAULT NOW()
);

-- Enhanced social accounts for TikTok
CREATE TABLE social_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    platform VARCHAR(50) NOT NULL, -- facebook, instagram, twitter, linkedin, tiktok
    account_id VARCHAR(255) NOT NULL,
    account_name VARCHAR(255),
    account_avatar VARCHAR(500),
    access_token_encrypted TEXT,
    refresh_token_encrypted TEXT,
    token_expires_at TIMESTAMP,
    platform_specific_data JSONB, -- For TikTok: open_id, union_id, etc
    is_active BOOLEAN DEFAULT TRUE,
    last_synced_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Workflow monitoring dashboard
CREATE TABLE workflow_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES n8n_workflows(id),
    date DATE NOT NULL,
    executions_total INTEGER DEFAULT 0,
    executions_success INTEGER DEFAULT 0,
    executions_error INTEGER DEFAULT 0,
    average_duration_ms INTEGER,
    total_cost DECIMAL(10,4),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(workflow_id, date)
);

-- API key usage tracking
CREATE TABLE api_key_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id UUID REFERENCES api_keys(id),
    date DATE NOT NULL,
    requests_count INTEGER DEFAULT 0,
    tokens_used INTEGER DEFAULT 0,
    cost DECIMAL(10,4),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(api_key_id, date)
);

-- Indexes for performance
CREATE INDEX idx_api_keys_org ON api_keys(organization_id);
CREATE INDEX idx_n8n_workflows_org ON n8n_workflows(organization_id);
CREATE INDEX idx_automation_events_org ON automation_events(organization_id, created_at);
CREATE INDEX idx_social_accounts_platform ON social_accounts(organization_id, platform);
CREATE INDEX idx_workflow_metrics_date ON workflow_metrics(workflow_id, date);
```

---

## 4. API Specifications

### 4.1 n8n Integration APIs

#### Connect n8n Instance
```http
POST /api/v1/n8n/connect
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "api_key": "n8n_api_key_here",
  "instance_url": "https://n8n.example.com", // Optional for self-hosted
  "name": "Production n8n Instance"
}

Response: 201 Created
{
  "id": "uuid",
  "status": "connected",
  "workflows_count": 15,
  "instance_info": {
    "version": "1.0.0",
    "type": "self-hosted"
  }
}
```

#### Trigger Workflow
```http
POST /api/v1/n8n/workflows/{workflow_id}/trigger
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "event_type": "post_published",
  "event_data": {
    "post_id": "uuid",
    "platform": "instagram",
    "content": "...",
    "metrics": {...}
  }
}

Response: 202 Accepted
{
  "execution_id": "n8n_exec_123",
  "status": "triggered",
  "estimated_completion": "2024-01-20T10:30:00Z"
}
```

#### Monitor Workflows
```http
GET /api/v1/n8n/monitor/dashboard
Authorization: Bearer {jwt_token}

Response: 200 OK
{
  "summary": {
    "active_workflows": 12,
    "total_executions_today": 145,
    "success_rate": 0.94,
    "average_duration_ms": 2340
  },
  "workflows": [
    {
      "id": "uuid",
      "name": "Competitor Monitoring",
      "status": "active",
      "last_execution": {
        "id": "exec_123",
        "status": "success",
        "timestamp": "2024-01-20T10:00:00Z"
      },
      "metrics": {
        "executions_24h": 24,
        "success_rate": 0.96,
        "average_duration_ms": 1500
      }
    }
  ],
  "recent_executions": [...],
  "alerts": [...]
}
```

### 4.2 API Key Management APIs

#### Store API Key
```http
POST /api/v1/keys/store
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "provider": "openai",
  "key_name": "Production GPT-4 Key",
  "api_key": "sk-...",
  "usage_limit_monthly": 100.00,
  "models": ["gpt-4", "dall-e-3"]
}

Response: 201 Created
{
  "id": "uuid",
  "provider": "openai",
  "key_name": "Production GPT-4 Key",
  "key_hint": "...abc123",
  "is_active": true,
  "models_available": ["gpt-4", "dall-e-3"],
  "usage_limit_monthly": 100.00
}
```

#### Rotate API Key
```http
PUT /api/v1/keys/{key_id}/rotate
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "new_api_key": "sk-new-key..."
}

Response: 200 OK
{
  "id": "uuid",
  "status": "rotated",
  "rotated_at": "2024-01-20T10:00:00Z",
  "next_rotation": "2024-04-20T10:00:00Z"
}
```

### 4.3 TikTok Integration APIs

#### Connect TikTok Account
```http
POST /api/v1/social/tiktok/connect
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "auth_code": "tiktok_oauth_code",
  "redirect_uri": "https://app.allin.com/callback/tiktok"
}

Response: 201 Created
{
  "id": "uuid",
  "platform": "tiktok",
  "account_name": "@username",
  "followers": 50000,
  "capabilities": ["video", "live", "stories"],
  "is_verified": true
}
```

#### Publish to TikTok
```http
POST /api/v1/social/tiktok/publish
Authorization: Bearer {jwt_token}
Content-Type: multipart/form-data

{
  "account_id": "uuid",
  "video": <binary>,
  "caption": "Check out our new product! #trending",
  "privacy_level": "public",
  "allow_comments": true,
  "allow_duet": true,
  "music_id": "tiktok_music_id" // Optional
}

Response: 201 Created
{
  "post_id": "tiktok_video_id",
  "status": "published",
  "url": "https://www.tiktok.com/@username/video/123",
  "metrics": {
    "initial_views": 0,
    "shares": 0,
    "likes": 0
  }
}
```

---

## 5. Security Architecture

### 5.1 API Key Encryption System

```
┌──────────────────────────────────────────────────────────┐
│                   Client Application                      │
│  (Sends API key only during initial configuration)        │
└─────────────────────┬────────────────────────────────────┘
                      │ HTTPS/TLS 1.3
                      ▼
┌──────────────────────────────────────────────────────────┐
│                    API Gateway                            │
│  • Rate limiting                                          │
│  • Request validation                                     │
│  • JWT verification                                       │
└─────────────────────┬────────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────────┐
│              API Key Vault Service                        │
│                                                           │
│  1. Receive API key                                      │
│  2. Generate unique encryption key (DEK)                 │
│  3. Encrypt API key with DEK                            │
│  4. Encrypt DEK with Master Key (KEK)                   │
│  5. Store encrypted key + encrypted DEK                  │
│                                                           │
└─────────────────────┬────────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────────┐
│                 HashiCorp Vault                          │
│                                                           │
│  • Master Key Management (KEK)                           │
│  • Hardware Security Module (HSM) backed                 │
│  • Key rotation policies                                 │
│  • Audit logging                                         │
│  • Zero-knowledge architecture                           │
│                                                           │
└──────────────────────────────────────────────────────────┘

Encryption Flow:
1. API Key → AES-256-GCM → Encrypted API Key
2. Data Encryption Key (DEK) → RSA-4096 → Encrypted DEK
3. Store: Encrypted API Key + Encrypted DEK + Metadata
4. Retrieval: Decrypt DEK with KEK → Decrypt API Key with DEK
```

### 5.2 Zero-Knowledge Architecture

```yaml
Principles:
  - Platform never stores plain-text API keys
  - Encryption keys are derived from user credentials
  - Keys are encrypted at rest and in transit
  - Audit logs don't contain sensitive data
  - Memory is cleared after key operations

Implementation:
  - Client-side key derivation (PBKDF2)
  - End-to-end encryption for key transmission
  - Secure key deletion (cryptographic erasure)
  - Memory protection (no swap, secure allocation)
  - Time-limited key access tokens
```

### 5.3 Access Control Matrix

| Role | API Keys | n8n Workflows | Social Accounts | Analytics | Team |
|------|----------|---------------|-----------------|-----------|------|
| Owner | Full | Full | Full | Full | Full |
| Admin | Manage | Manage | Manage | View | Manage |
| Manager | View | Manage | Manage | View | View |
| Publisher | Use | Trigger | Use | View | - |
| Viewer | - | View | View | View | - |

---

## 6. Integration Architecture

### 6.1 n8n Event Bus Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    AllIN Platform Events                   │
├────────────────────────────────────────────────────────────┤
│  • Post Published       • Engagement Threshold            │
│  • Account Connected    • Campaign Started                │
│  • User Action         • Analytics Updated                │
└──────────────────────┬─────────────────────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────────────────────┐
│                 Event Processing Pipeline                   │
│                                                            │
│  1. Event Validation                                      │
│  2. Event Enrichment (add metadata)                       │
│  3. Event Filtering (check subscriptions)                 │
│  4. Event Transformation (format for n8n)                 │
│  5. Event Routing (to appropriate workflows)              │
│                                                            │
└──────────────────────┬─────────────────────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────────────────────┐
│                    Apache Kafka                            │
│                                                            │
│  Topics:                                                   │
│  • social.posts.published                                 │
│  • social.engagement.metrics                              │
│  • automation.workflow.triggers                           │
│  • system.notifications                                   │
│                                                            │
└─────────┬──────────────────────────────┬───────────────────┘
          │                              │
          ▼                              ▼
┌─────────────────────┐        ┌────────────────────────────┐
│   n8n Webhook       │        │   Internal Services        │
│   Dispatcher        │        │   (Analytics, etc)         │
└─────────────────────┘        └────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────────────────────────┐
│                    n8n Instance                            │
│                                                            │
│  Workflows:                                                │
│  • Competitor Monitoring                                   │
│  • Influencer Discovery                                   │
│  • Content Amplification                                  │
│  • Lead Generation                                        │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### 6.2 Webhook Security

```yaml
Webhook Validation:
  - HMAC-SHA256 signature verification
  - Timestamp validation (prevent replay attacks)
  - IP allowlisting for n8n instances
  - Rate limiting per webhook endpoint
  - Payload size limits

Webhook Endpoints:
  - POST /webhooks/n8n/{event_type}
  - Headers:
    - X-N8N-Signature: HMAC signature
    - X-N8N-Timestamp: Unix timestamp
    - X-N8N-Workflow-ID: Workflow identifier
```

---

## 7. Performance Architecture

### 7.1 Caching Strategy

```yaml
Cache Layers:
  1. CDN (CloudFlare):
     - Static assets
     - Public API responses
     - TTL: 1 hour - 1 day

  2. Redis Cache:
     - Session data
     - API responses
     - Social media data
     - TTL: 5 minutes - 1 hour

  3. Application Cache:
     - Computed values
     - Frequently accessed data
     - TTL: 1 - 5 minutes

Cache Keys:
  - user:{user_id}:profile
  - org:{org_id}:settings
  - social:{account_id}:posts
  - n8n:{workflow_id}:metrics
  - api_key:{key_id}:usage
```

### 7.2 Database Optimization

```yaml
Strategies:
  - Read replicas for analytics queries
  - Partitioning for time-series data
  - Materialized views for dashboards
  - Connection pooling (pgBouncer)
  - Query optimization with indexes

Partitioning:
  - automation_events: By month
  - workflow_metrics: By month
  - api_key_usage: By month
  - social_posts: By year
```

### 7.3 Scaling Architecture

```yaml
Horizontal Scaling:
  - Kubernetes deployment
  - Auto-scaling based on CPU/memory
  - Load balancing with NGINX
  - Service mesh (Istio) for microservices

Vertical Scaling:
  - Database: Up to 32 cores, 128GB RAM
  - Redis: Cluster mode with 6 nodes
  - Kafka: 3 brokers minimum

Rate Limiting:
  - API Gateway: 1000 req/min per user
  - Social APIs: Platform-specific limits
  - n8n webhooks: 100 req/min per workflow
  - AI APIs: Based on subscription tier
```

---

## 8. Deployment Architecture

### 8.1 Container Architecture

```yaml
Docker Images:
  - allin/frontend:latest (Next.js)
  - allin/api-gateway:latest (Kong)
  - allin/auth-service:latest
  - allin/content-service:latest
  - allin/social-service:latest
  - allin/n8n-service:latest
  - allin/ai-service:latest
  - allin/vault-service:latest

Docker Compose Services:
  - frontend
  - backend
  - postgres
  - redis
  - kafka
  - vault
  - nginx
```

### 8.2 Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: allin-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: allin-backend
  template:
    metadata:
      labels:
        app: allin-backend
    spec:
      containers:
      - name: backend
        image: allin/backend:latest
        ports:
        - containerPort: 5000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

### 8.3 CI/CD Pipeline

```yaml
GitHub Actions Workflow:
  1. Code Push:
     - Lint code
     - Run unit tests
     - Security scan (Snyk)

  2. Pull Request:
     - Integration tests
     - Build Docker images
     - Deploy to staging

  3. Merge to Main:
     - Build production images
     - Push to registry
     - Deploy to production
     - Run smoke tests

  4. Post-Deployment:
     - Health checks
     - Performance tests
     - Rollback if needed
```

---

## 9. Testing Strategy

### 9.1 Test Coverage Requirements

```yaml
Unit Tests: 80%
  - Services
  - Controllers
  - Utilities
  - Models

Integration Tests: 70%
  - API endpoints
  - Database operations
  - External services
  - Webhooks

E2E Tests: Core Flows
  - User registration/login
  - Social account connection
  - Post creation/scheduling
  - n8n workflow triggering
  - API key management
```

### 9.2 n8n Integration Testing

```yaml
Test Scenarios:
  1. Webhook Delivery:
     - Verify webhook reception
     - Test signature validation
     - Check retry mechanism
     - Validate timeout handling

  2. Workflow Execution:
     - Trigger test workflows
     - Monitor execution status
     - Verify data transformation
     - Check error handling

  3. Performance Testing:
     - Load test webhooks (1000 req/s)
     - Concurrent workflow execution
     - Database connection pooling
     - Memory leak detection

  4. Security Testing:
     - API key encryption verification
     - Access control validation
     - Audit log completeness
     - Penetration testing
```

---

## 10. Implementation Phases

### Phase 1: Foundation Enhancement (Week 1-2)
```yaml
Tasks:
  - Update database schema
  - Implement API key vault service
  - Create n8n integration service skeleton
  - Add TikTok to social platforms
  - Setup Kafka event bus

Deliverables:
  - Updated Prisma schema
  - API key management endpoints
  - Basic n8n connection
  - TikTok OAuth flow
```

### Phase 2: n8n Integration (Week 3-4)
```yaml
Tasks:
  - Implement webhook endpoints
  - Create event publishing system
  - Build workflow monitoring dashboard
  - Implement automation triggers
  - Add workflow management UI

Deliverables:
  - Complete n8n integration
  - Monitoring dashboard
  - 5 basic automation workflows
  - Event tracking system
```

### Phase 3: Advanced Features (Week 5-6)
```yaml
Tasks:
  - Implement advanced use cases
  - Add AI agent orchestration
  - Create MCP server
  - Build analytics enhancements
  - Performance optimization

Deliverables:
  - 10+ automation workflows
  - MCP integration
  - AI agents deployed
  - Performance benchmarks met
```

### Phase 4: Security & Testing (Week 7-8)
```yaml
Tasks:
  - Security audit
  - Penetration testing
  - Load testing
  - Documentation
  - Bug fixes

Deliverables:
  - Security report
  - Test coverage >80%
  - API documentation
  - Deployment guide
```

---

## Appendices

### A. Technology Stack Summary
- **Frontend**: Next.js 14.2, React 18, TypeScript
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL 16, Redis 7, MongoDB
- **Message Queue**: Apache Kafka
- **Container**: Docker, Kubernetes
- **Security**: HashiCorp Vault, JWT
- **Monitoring**: Prometheus, Grafana
- **CI/CD**: GitHub Actions

### B. API Rate Limits
| Tier | API Calls/min | Webhooks/min | AI Requests/day |
|------|---------------|--------------|-----------------|
| Starter | 60 | 10 | 100 |
| Professional | 300 | 50 | 500 |
| Team | 600 | 100 | 2000 |
| Enterprise | Unlimited | Unlimited | Unlimited |

### C. Compliance Requirements
- GDPR (EU)
- CCPA (California)
- SOC 2 Type II
- ISO 27001
- PCI DSS (payment processing)

---

## Document Control
- **Version**: 3.0
- **Last Updated**: January 2025
- **Next Review**: February 2025
- **Status**: Ready for Implementation