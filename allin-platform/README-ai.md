# AllIN Platform AI Support System

## Overview

The AllIN Platform AI Support System provides intelligent documentation retrieval and AI-powered responses for customer support. It uses RAG (Retrieval-Augmented Generation) with vector similarity search to deliver accurate, contextual answers based on our comprehensive knowledge base.

## Architecture

```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   Frontend UI       │    │   Backend API       │    │   Vector Database   │
│                     │    │                     │    │                     │
│ • Support Dashboard │◄──►│ • RAG Service       │◄──►│ • PostgreSQL        │
│ • Chat Widget       │    │ • AI Routes         │    │ • pgvector          │
│ • Search Interface  │    │ • Auth Middleware   │    │ • Embeddings        │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
                                       │
                                       ▼
                           ┌─────────────────────┐
                           │   External APIs     │
                           │                     │
                           │ • OpenAI GPT-4      │
                           │ • OpenAI Embeddings │
                           │ • Anthropic Claude  │
                           └─────────────────────┘
```

## Features

### 📚 Knowledge Base Management
- **Comprehensive Documentation**: 9 core knowledge base files covering all aspects of the platform
- **Vector Embeddings**: OpenAI text-embedding-3-small for semantic search
- **Incremental Updates**: Smart ingestion pipeline that only processes changed files
- **Link Validation**: Automated checking for broken internal links

### 🤖 AI-Powered Support
- **Intelligent Retrieval**: Hybrid search combining vector similarity and keyword matching
- **Contextual Responses**: GPT-4 powered answers with source citations
- **Confidence Scoring**: Built-in confidence assessment with escalation recommendations
- **Permission Filtering**: Content filtered based on user roles and subscription plans

### 💬 User Interfaces
- **Support Dashboard**: Full-featured support interface at `/dashboard/support`
- **Chat Widget**: Embeddable assistant widget for any page
- **Knowledge Search**: Dedicated search interface with expandable results

### 📊 Analytics & Monitoring
- **Query Analytics**: Track response quality, confidence, and escalation rates
- **Performance Metrics**: Monitor response times and system usage
- **Feedback Loop**: User feedback collection for continuous improvement

## Getting Started

### 1. Prerequisites

```bash
# Required
- PostgreSQL 12+ with pgvector extension
- Node.js 18+
- OpenAI API key

# Optional
- Redis (for caching and sessions)
- Anthropic API key (for enhanced AI capabilities)
```

### 2. Database Setup

```bash
# Install pgvector extension
psql -d your_database -c "CREATE EXTENSION IF NOT EXISTS vector"

# Run Prisma migrations
npm run migrate
```

### 3. Environment Configuration

Copy the environment template and configure your settings:

```bash
cp .env.example .env
```

**Required Variables:**
```bash
DATABASE_URL="postgresql://user:pass@localhost:5432/allin_platform"
OPENAI_API_KEY="sk-your-openai-key"
JWT_SECRET="your-secure-jwt-secret"
```

### 4. Generate Knowledge Base

Run the ingestion pipeline to process documentation:

```bash
# Build the knowledge base from markdown files
npm run ingest:kb

# Force re-ingestion of all files
npm run ingest:kb -- --force

# Validate documentation links
npm run check:links
```

### 5. Start the Application

```bash
# Development
npm run dev

# Production
npm run build
npm run start
```

## Knowledge Base Ingestion

### How It Works

The ingestion pipeline processes markdown files in `docs/ai-knowledgebase/`:

1. **File Discovery**: Scans for all `.md` files
2. **Content Parsing**: Extracts sections, headings, and metadata
3. **Intelligent Chunking**: Splits content into ~800 token chunks with 120 token overlap
4. **Embedding Generation**: Creates vector embeddings using OpenAI
5. **Database Storage**: Stores chunks with metadata in PostgreSQL

### Content Structure

```
docs/ai-knowledgebase/
├── 00-index.md              # Navigation and overview
├── 10-architecture.md       # System design and tech stack
├── 20-domain-glossary.md    # Terms, entities, constraints
├── 30-user-journeys.md      # Workflows and edge cases
├── 40-features-and-APIs.md  # Endpoint documentation
├── 50-config-and-flags.md   # Settings and feature flags
├── 60-troubleshooting.md    # Common issues and solutions
├── 70-faq.md               # Frequently asked questions
├── 80-security-and-privacy.md # Data protection and compliance
└── 90-future-roadmap.md    # Known limitations and plans
```

### Updating the Knowledge Base

```bash
# After updating markdown files
npm run ingest:kb

# Check for broken links
npm run check:links
```

The system automatically detects file changes and only re-processes modified content.

## API Endpoints

### Retrieval API

**POST** `/api/ai/retrieve`
```json
{
  "query": "How do I help a user with login issues?",
  "k": 5,
  "category": "troubleshooting",
  "minScore": 0.7
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "chunk_id",
        "path": "60-troubleshooting.md",
        "title": "Authentication Issues",
        "section": "Login Problems",
        "content": "...",
        "category": "troubleshooting",
        "score": 0.95,
        "citations": ["src/services/auth.service.ts:45"]
      }
    ]
  }
}
```

### Answer Generation API

**POST** `/api/ai/answer`
```json
{
  "query": "How do I reset a user's password?",
  "userId": "user_123",
  "userRole": "support_staff",
  "featureContext": "support_dashboard"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "answer": "To reset a user's password...",
    "confidence": 0.92,
    "sources": [...],
    "escalateToHuman": false,
    "responseTime": 1250
  }
}
```

### Other Endpoints

- **POST** `/api/ai/feedback` - Submit response quality feedback
- **POST** `/api/ai/escalate` - Escalate to human support
- **GET** `/api/ai/analytics` - Support system analytics (admin only)
- **GET** `/api/ai/knowledge-stats` - Knowledge base statistics

## Frontend Integration

### Support Dashboard

Full-featured support interface:

```typescript
// Access at /dashboard/support
import SupportAssistantPage from '@/app/dashboard/support/page'
```

Features:
- AI-powered chat interface
- Knowledge base search
- Source attribution and confidence scoring
- Feedback and escalation mechanisms

### Chat Widget

Embeddable assistant widget:

```typescript
import InternalAssistant from '@/components/support/InternalAssistant'

// Usage
<InternalAssistant
  context="billing_page"
  userRole={user.role}
  position="bottom-right"
/>
```

### Knowledge Search

Standalone search component:

```typescript
import KnowledgeSearchBox from '@/components/support/KnowledgeSearchBox'

// Usage
<KnowledgeSearchBox
  onResultSelect={(chunk) => console.log(chunk)}
  placeholder="Search for billing information..."
/>
```

## Evaluation & Testing

### Retrieval Testing

Test the quality of document retrieval:

```bash
npm run eval:retrieval
```

Tests defined in `eval/retrieval-tests.yaml`:
```yaml
tests:
  - query: "How do I help a user who can't log in?"
    expected_docs: ["60-troubleshooting.md"]
    expected_sections: ["Login Problems"]
    min_score: 0.8
```

### Answer Quality Testing

Evaluate AI response quality:

```bash
npm run eval:answers
```

Gold standard answers in `eval/answer-quality.yaml`:
```yaml
tests:
  - query: "What are the different user roles?"
    expected_answer: "AllIN Platform has several user roles..."
    evaluation_criteria:
      - accuracy
      - completeness
      - clarity
```

### Running All Tests

```bash
npm run test:ai
```

## Performance Optimization

### Vector Search Optimization

```sql
-- Ensure proper indexing for vector searches
CREATE INDEX CONCURRENTLY ON ai_documents USING ivfflat (embedding vector_cosine_ops);

-- Optimize for specific query patterns
CREATE INDEX ON ai_documents (category) WHERE category IS NOT NULL;
CREATE INDEX ON ai_documents (path, chunk_index);
```

### Caching Strategy

- **Redis**: Cache frequent queries and responses
- **Application**: In-memory caching for embeddings
- **CDN**: Static asset caching for frontend components

### Rate Limiting

- **Standard endpoints**: 100 requests per 15 minutes
- **AI endpoints**: Credit-based limiting per user plan
- **Search endpoints**: 20 requests per minute

## Security Considerations

### Data Protection

- **Content Filtering**: Automatic redaction of sensitive information
- **Access Control**: Role-based content filtering
- **Audit Logging**: Complete query and response tracking

### API Security

- **Authentication**: JWT token validation
- **Authorization**: Role-based access control
- **Input Validation**: Comprehensive request validation
- **Rate Limiting**: DDoS protection and abuse prevention

## Troubleshooting

### Common Issues

#### Knowledge Base Not Loading
```bash
# Check ingestion status
npm run ingest:kb

# Verify database connection
psql $DATABASE_URL -c "SELECT COUNT(*) FROM ai_documents;"

# Check for errors
npm run check:links
```

#### Low Quality Responses
```bash
# Re-run ingestion with force flag
npm run ingest:kb -- --force

# Check embedding quality
npm run eval:retrieval

# Verify OpenAI API key
curl -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models
```

#### pgvector Extension Issues
```sql
-- Install extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify installation
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Check version
SELECT vector_version();
```

### Performance Issues

#### Slow Vector Searches
```sql
-- Add vector index
CREATE INDEX CONCURRENTLY ON ai_documents USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM ai_documents ORDER BY embedding <=> '[1,2,3...]' LIMIT 5;
```

#### High Memory Usage
- Reduce `RAG_TOP_K` in environment variables
- Implement result caching
- Use pagination for large result sets

## Monitoring & Analytics

### Key Metrics

- **Response Quality**: Average confidence scores
- **User Satisfaction**: Feedback ratings and escalation rates
- **System Performance**: Response times and error rates
- **Knowledge Coverage**: Query success rates by category

### Monitoring Setup

```bash
# Enable metrics collection
ENABLE_METRICS="true"
METRICS_INTERVAL="60000"

# Set up error tracking
SENTRY_DSN="your-sentry-dsn"
```

### Analytics Dashboard

Access analytics at `/api/ai/analytics` (admin only):

```json
{
  "totalQueries": 1250,
  "avgConfidence": 0.85,
  "escalationRate": 0.12,
  "responseTime": 850,
  "topCategories": [
    {"category": "troubleshooting", "count": 450},
    {"category": "faq", "count": 320}
  ]
}
```

## Contributing

### Adding New Knowledge

1. Create/update markdown files in `docs/ai-knowledgebase/`
2. Follow the established naming convention (`XX-category.md`)
3. Run `npm run check:links` to validate
4. Ingest with `npm run ingest:kb`
5. Test with `npm run eval:retrieval`

### Improving AI Responses

1. Update system prompts in `src/services/rag.service.ts`
2. Enhance content filtering logic
3. Add new evaluation tests
4. Monitor confidence scores and user feedback

### Adding New Features

1. Follow the established API patterns
2. Add comprehensive tests
3. Update documentation
4. Consider security implications

## License

This AI Support System is part of the AllIN Platform and is proprietary software.

---

**Need Help?**

- 📧 Technical Support: dev@allin-platform.com
- 📚 Documentation: [Internal Wiki](./docs/)
- 💬 Team Chat: #allin-ai-support on Slack