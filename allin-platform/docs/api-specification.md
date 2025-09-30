# API Specification Document
# AllIN Platform API v1.0

## Base URL
```
Production: https://api.allin.com/v1
Staging: https://staging-api.allin.com/v1
Development: http://localhost:5000/api/v1
```

## Authentication
All API requests require JWT authentication unless specified otherwise.

```http
Authorization: Bearer {jwt_token}
```

---

## 1. n8n Integration APIs

### 1.1 Connect n8n Instance
Establish connection with n8n instance using API key.

```http
POST /api/v1/n8n/connect
```

#### Request
```json
{
  "api_key": "string", // Required: n8n API key
  "instance_url": "string", // Optional: for self-hosted instances
  "name": "string" // Required: friendly name for this connection
}
```

#### Response (201 Created)
```json
{
  "id": "uuid",
  "name": "Production n8n",
  "status": "connected",
  "instance_info": {
    "version": "1.0.0",
    "type": "self-hosted",
    "url": "https://n8n.example.com"
  },
  "workflows_count": 15,
  "active_workflows": 12,
  "connected_at": "2024-01-20T10:00:00Z"
}
```

### 1.2 List Workflows
Get all available n8n workflows for the organization.

```http
GET /api/v1/n8n/workflows
```

#### Query Parameters
- `active` (boolean): Filter by active status
- `page` (integer): Page number (default: 1)
- `limit` (integer): Items per page (default: 20)

#### Response (200 OK)
```json
{
  "workflows": [
    {
      "id": "uuid",
      "workflow_id": "n8n_workflow_123",
      "name": "Competitor Monitoring",
      "description": "Monitors competitor mentions across social media",
      "is_active": true,
      "trigger_events": ["post_published", "mention_detected"],
      "execution_count": 145,
      "last_executed_at": "2024-01-20T09:30:00Z",
      "last_execution_status": "success"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

### 1.3 Trigger Workflow
Manually trigger a workflow execution.

```http
POST /api/v1/n8n/workflows/{workflow_id}/trigger
```

#### Request
```json
{
  "event_type": "string", // Required: Type of event
  "event_data": {}, // Required: Event payload
  "priority": "string" // Optional: high, normal, low (default: normal)
}
```

#### Response (202 Accepted)
```json
{
  "execution_id": "exec_abc123",
  "workflow_id": "uuid",
  "status": "triggered",
  "queued_at": "2024-01-20T10:00:00Z",
  "estimated_completion": "2024-01-20T10:02:00Z"
}
```

### 1.4 Get Workflow Executions
Get execution history for a workflow.

```http
GET /api/v1/n8n/workflows/{workflow_id}/executions
```

#### Query Parameters
- `status` (string): Filter by status (running, success, error)
- `from` (datetime): Start date
- `to` (datetime): End date
- `limit` (integer): Items per page

#### Response (200 OK)
```json
{
  "executions": [
    {
      "id": "uuid",
      "execution_id": "n8n_exec_123",
      "status": "success",
      "started_at": "2024-01-20T10:00:00Z",
      "finished_at": "2024-01-20T10:00:45Z",
      "duration_ms": 45000,
      "data": {
        "items_processed": 25,
        "actions_taken": 10
      }
    }
  ]
}
```

### 1.5 Monitoring Dashboard
Get comprehensive monitoring data for all workflows.

```http
GET /api/v1/n8n/monitor/dashboard
```

#### Response (200 OK)
```json
{
  "summary": {
    "total_workflows": 15,
    "active_workflows": 12,
    "executions_24h": 450,
    "success_rate": 0.94,
    "average_duration_ms": 2340,
    "alerts_active": 2
  },
  "workflows": [...],
  "recent_executions": [...],
  "performance_metrics": {
    "cpu_usage": 0.45,
    "memory_usage": 0.62,
    "queue_depth": 12
  },
  "alerts": [
    {
      "id": "alert_123",
      "type": "workflow_failure",
      "message": "Workflow 'Lead Generation' failed 3 times",
      "severity": "high",
      "created_at": "2024-01-20T09:45:00Z"
    }
  ]
}
```

---

## 2. API Key Management APIs

### 2.1 Store API Key
Securely store an API key for external services.

```http
POST /api/v1/keys
```

#### Request
```json
{
  "provider": "string", // Required: openai, anthropic, google, etc.
  "key_name": "string", // Required: Friendly name
  "api_key": "string", // Required: The actual API key
  "models": ["string"], // Optional: Available models
  "usage_limit_monthly": 100.00, // Optional: Monthly spending limit
  "expires_at": "2024-12-31T23:59:59Z" // Optional: Expiration date
}
```

#### Response (201 Created)
```json
{
  "id": "uuid",
  "provider": "openai",
  "key_name": "Production GPT-4",
  "key_hint": "...abc123", // Last 4 characters
  "models": ["gpt-4", "dall-e-3"],
  "is_active": true,
  "usage_limit_monthly": 100.00,
  "created_at": "2024-01-20T10:00:00Z"
}
```

### 2.2 List API Keys
Get all API keys for the organization.

```http
GET /api/v1/keys
```

#### Response (200 OK)
```json
{
  "keys": [
    {
      "id": "uuid",
      "provider": "openai",
      "key_name": "Production GPT-4",
      "key_hint": "...abc123",
      "is_active": true,
      "usage_current": 45.67,
      "usage_limit_monthly": 100.00,
      "last_used_at": "2024-01-20T09:30:00Z"
    }
  ]
}
```

### 2.3 Update API Key
Update an existing API key.

```http
PUT /api/v1/keys/{key_id}
```

#### Request
```json
{
  "key_name": "string", // Optional
  "api_key": "string", // Optional: New key value
  "is_active": boolean, // Optional
  "usage_limit_monthly": 150.00 // Optional
}
```

### 2.4 Rotate API Key
Rotate an API key for security.

```http
POST /api/v1/keys/{key_id}/rotate
```

#### Request
```json
{
  "new_api_key": "string" // Required: New API key
}
```

#### Response (200 OK)
```json
{
  "id": "uuid",
  "status": "rotated",
  "rotated_at": "2024-01-20T10:00:00Z",
  "key_hint": "...xyz789"
}
```

### 2.5 Get API Key Usage
Get usage statistics for an API key.

```http
GET /api/v1/keys/{key_id}/usage
```

#### Query Parameters
- `from` (date): Start date
- `to` (date): End date
- `granularity` (string): day, week, month

#### Response (200 OK)
```json
{
  "usage": [
    {
      "date": "2024-01-20",
      "requests_count": 150,
      "tokens_used": 45000,
      "cost": 4.50
    }
  ],
  "summary": {
    "total_requests": 4500,
    "total_tokens": 1350000,
    "total_cost": 135.00
  }
}
```

---

## 3. TikTok Integration APIs

### 3.1 Connect TikTok Account
Connect a TikTok account using OAuth.

```http
POST /api/v1/social/tiktok/connect
```

#### Request
```json
{
  "auth_code": "string", // Required: OAuth authorization code
  "redirect_uri": "string" // Required: OAuth redirect URI
}
```

#### Response (201 Created)
```json
{
  "id": "uuid",
  "platform": "tiktok",
  "account_id": "tiktok_user_123",
  "account_name": "Brand Account",
  "account_handle": "@brandhandle",
  "account_avatar": "https://...",
  "followers_count": 50000,
  "is_verified": true,
  "capabilities": ["video", "live", "stories"],
  "connected_at": "2024-01-20T10:00:00Z"
}
```

### 3.2 Upload TikTok Video
Upload and publish a video to TikTok.

```http
POST /api/v1/social/tiktok/videos
Content-Type: multipart/form-data
```

#### Request (Form Data)
- `account_id` (string): Required - Social account ID
- `video` (file): Required - Video file (MP4, max 287MB)
- `caption` (string): Required - Video caption (max 2200 chars)
- `cover_image` (file): Optional - Custom thumbnail
- `privacy_level` (string): public, friends, private (default: public)
- `allow_comments` (boolean): Default true
- `allow_duet` (boolean): Default true
- `allow_stitch` (boolean): Default true
- `music_id` (string): Optional - TikTok music ID
- `hashtags` (array): Optional - Array of hashtags
- `schedule_time` (datetime): Optional - Schedule publication

#### Response (201 Created)
```json
{
  "id": "uuid",
  "platform_post_id": "tiktok_video_123",
  "status": "published",
  "url": "https://www.tiktok.com/@brandhandle/video/123",
  "caption": "Check out our new product!",
  "hashtags": ["#newproduct", "#trending"],
  "published_at": "2024-01-20T10:00:00Z",
  "metrics": {
    "views": 0,
    "likes": 0,
    "comments": 0,
    "shares": 0
  }
}
```

### 3.3 Get TikTok Analytics
Get analytics for TikTok posts.

```http
GET /api/v1/social/tiktok/analytics
```

#### Query Parameters
- `account_id` (string): Required - Social account ID
- `from` (date): Start date
- `to` (date): End date
- `metrics` (array): Specific metrics to retrieve

#### Response (200 OK)
```json
{
  "account_metrics": {
    "followers_count": 50000,
    "followers_growth": 500,
    "total_views": 1000000,
    "engagement_rate": 0.045
  },
  "posts": [
    {
      "post_id": "tiktok_video_123",
      "published_at": "2024-01-19T15:00:00Z",
      "metrics": {
        "views": 50000,
        "likes": 2250,
        "comments": 150,
        "shares": 75,
        "completion_rate": 0.65,
        "average_watch_time": 15
      }
    }
  ],
  "trending": {
    "sounds": [...],
    "hashtags": [...],
    "effects": [...]
  }
}
```

---

## 4. Automation Event APIs

### 4.1 Create Event
Create an automation event that can trigger n8n workflows.

```http
POST /api/v1/events
```

#### Request
```json
{
  "event_type": "string", // Required: Event type identifier
  "event_data": {}, // Required: Event payload
  "trigger_workflows": boolean // Optional: Auto-trigger workflows (default: true)
}
```

#### Response (201 Created)
```json
{
  "id": "uuid",
  "event_type": "post_published",
  "created_at": "2024-01-20T10:00:00Z",
  "triggered_workflows": ["workflow_123", "workflow_456"],
  "status": "processing"
}
```

### 4.2 List Events
Get automation events for the organization.

```http
GET /api/v1/events
```

#### Query Parameters
- `event_type` (string): Filter by event type
- `processed` (boolean): Filter by processed status
- `from` (datetime): Start date
- `to` (datetime): End date
- `page` (integer): Page number
- `limit` (integer): Items per page

#### Response (200 OK)
```json
{
  "events": [
    {
      "id": "uuid",
      "event_type": "engagement_threshold",
      "event_data": {
        "post_id": "uuid",
        "platform": "instagram",
        "engagement_rate": 0.08
      },
      "processed": true,
      "workflow_ids": ["workflow_123"],
      "created_at": "2024-01-20T10:00:00Z"
    }
  ],
  "pagination": {...}
}
```

---

## 5. Webhook Endpoints

### 5.1 n8n Webhook Receiver
Receive webhooks from n8n workflows.

```http
POST /webhooks/n8n/{event_type}
```

#### Headers
```http
X-N8N-Signature: HMAC-SHA256 signature
X-N8N-Timestamp: Unix timestamp
X-N8N-Workflow-ID: Workflow identifier
```

#### Request
```json
{
  "workflow_id": "string",
  "execution_id": "string",
  "event_type": "string",
  "data": {} // Workflow-specific data
}
```

#### Response (200 OK)
```json
{
  "status": "received",
  "event_id": "uuid"
}
```

---

## 6. Error Responses

### Standard Error Format
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}, // Optional: Additional error details
    "request_id": "uuid" // For support reference
  }
}
```

### Common Error Codes
| Code | Status | Description |
|------|--------|-------------|
| `UNAUTHORIZED` | 401 | Invalid or missing authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `API_KEY_INVALID` | 400 | Invalid API key provided |
| `WORKFLOW_ERROR` | 500 | Workflow execution failed |
| `ENCRYPTION_ERROR` | 500 | Key encryption/decryption failed |

---

## 7. Rate Limiting

Rate limits are enforced per organization based on subscription tier:

| Tier | Requests/min | Webhooks/min | AI Calls/day |
|------|--------------|--------------|--------------|
| Starter | 60 | 10 | 100 |
| Professional | 300 | 50 | 500 |
| Team | 600 | 100 | 2000 |
| Enterprise | Custom | Custom | Custom |

Rate limit headers:
```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1642684800
```

---

## 8. Webhooks from AllIN

AllIN can send webhooks to n8n for various events:

### Event Types
- `post.published` - Post successfully published
- `post.failed` - Post publication failed
- `engagement.threshold` - Engagement threshold reached
- `account.connected` - Social account connected
- `account.disconnected` - Social account disconnected
- `workflow.completed` - Workflow execution completed
- `api_key.limit_reached` - API key usage limit reached

### Webhook Payload Format
```json
{
  "event": "post.published",
  "timestamp": "2024-01-20T10:00:00Z",
  "organization_id": "uuid",
  "data": {
    // Event-specific data
  }
}
```

### Webhook Security
- HMAC-SHA256 signature verification
- Retry logic with exponential backoff
- Maximum 3 retry attempts
- Webhook timeout: 10 seconds

---

## 9. SDK Support

### JavaScript/TypeScript
```javascript
import { AllINClient } from '@allin/sdk';

const client = new AllINClient({
  apiKey: 'your-api-key',
  baseURL: 'https://api.allin.com/v1'
});

// Connect n8n
const connection = await client.n8n.connect({
  apiKey: 'n8n-api-key',
  instanceUrl: 'https://n8n.example.com'
});

// Store API key
const key = await client.keys.create({
  provider: 'openai',
  keyName: 'Production',
  apiKey: 'sk-...'
});
```

### Python
```python
from allin import AllINClient

client = AllINClient(
    api_key='your-api-key',
    base_url='https://api.allin.com/v1'
)

# Trigger workflow
execution = client.n8n.trigger_workflow(
    workflow_id='workflow_123',
    event_type='custom',
    event_data={'key': 'value'}
)
```

---

## 10. Migration Guide

### Migrating from v0 to v1
1. Update authentication headers
2. Update endpoint paths
3. Handle new error format
4. Update webhook signatures

### Breaking Changes
- Authentication now uses Bearer tokens
- All endpoints prefixed with /v1
- Error responses use new format
- Webhook signatures use HMAC-SHA256

---

## Support

- API Status: https://status.allin.com
- Documentation: https://docs.allin.com
- Support: support@allin.com
- Developer Discord: https://discord.gg/allin