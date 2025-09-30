# AllIN Platform Troubleshooting Guide

## Authentication Issues

### Login Problems

#### "Invalid credentials" Error
**Error Code**: `AUTH_001`

**Common Causes**:
1. Incorrect email/password combination
2. Account not yet verified
3. Account suspended or inactive

**Solutions**:
1. **Verify email address**: Check for typos, ensure exact case match
2. **Check account status**: Look up user in database
   ```sql
   SELECT email, status, emailVerified FROM users WHERE email = 'user@example.com';
   ```
3. **Password reset**: If user forgot password
   - Send to `POST /api/auth/forgot-password`
   - Check email delivery logs
4. **Account verification**: If `emailVerified` is `null`
   - Resend verification email
   - Check spam/junk folders

**Implementation Reference**: `src/services/auth.service.ts:45-67`

#### "Account not verified" Error
**Error Code**: `AUTH_002`

**Diagnosis**:
```sql
SELECT id, email, emailVerified, status, createdAt
FROM users
WHERE email = 'user@example.com';
```

**Solutions**:
1. **Resend verification email**:
   ```bash
   POST /api/auth/resend-verification
   Content-Type: application/json
   {
     "email": "user@example.com"
   }
   ```
2. **Manual verification** (admin only):
   ```sql
   UPDATE users
   SET emailVerified = NOW(), status = 'ACTIVE'
   WHERE email = 'user@example.com';
   ```
3. **Check email service**:
   - Verify Mailgun configuration
   - Check email delivery logs
   - Test with different email providers

#### JWT Token Issues
**Error Code**: `AUTH_004`

**Symptoms**:
- "Token expired" messages
- Automatic logouts
- 401 Unauthorized responses

**Diagnosis**:
1. **Check token validity**:
   ```typescript
   // In browser console
   localStorage.getItem('sessionToken')
   // Should return valid JWT token
   ```
2. **Verify token expiration**:
   ```bash
   # Decode JWT payload (base64)
   echo "JWT_PAYLOAD_HERE" | base64 -d
   ```

**Solutions**:
1. **Refresh token flow**:
   ```bash
   POST /api/auth/refresh
   Content-Type: application/json
   {
     "refreshToken": "user_refresh_token_here"
   }
   ```
2. **Clear session and re-login**:
   ```javascript
   localStorage.clear()
   // Redirect to login page
   ```
3. **Check server configuration**:
   - Verify `JWT_SECRET` environment variable
   - Check `JWT_EXPIRES_IN` setting
   - Ensure system clock synchronization

### Session Management Issues

#### Frequent Logouts
**Causes**:
- Short session timeout
- Redis connection issues
- Browser security settings

**Solutions**:
1. **Increase session duration**:
   ```bash
   # In .env
   SESSION_MAX_AGE="604800000"  # 7 days
   JWT_EXPIRES_IN="24h"
   REFRESH_TOKEN_EXPIRES_IN="7d"
   ```
2. **Check Redis connectivity**:
   ```bash
   redis-cli ping
   # Should return PONG
   ```
3. **Browser troubleshooting**:
   - Check if cookies are enabled
   - Verify domain matches
   - Check for security extensions blocking cookies

#### "Session expired" on active users
**Investigation**:
1. **Check Redis session storage**:
   ```bash
   redis-cli
   KEYS "session:*"
   GET "session:user_session_token"
   ```
2. **Review session middleware**: `src/middleware/auth.ts:12-24`
3. **Check server logs** for session-related errors

## Social Media Connection Issues

### OAuth Connection Failures

#### Facebook/Instagram Connection
**Error Patterns**:
- "OAuth flow failed"
- "Insufficient permissions"
- "App not approved for production"

**Solutions**:
1. **Verify App Configuration**:
   - Facebook Developer Console → App Settings
   - Check App ID and Secret in environment variables
   - Ensure valid redirect URIs
2. **Permission Scope Issues**:
   ```typescript
   // Required scopes for Facebook
   const requiredScopes = [
     'pages_manage_posts',
     'pages_read_engagement',
     'instagram_basic',
     'instagram_content_publish'
   ]
   ```
3. **App Review Status**:
   - Check if app is in development vs production mode
   - Verify business verification status
   - Review rejected permissions

**Reference**: OAuth implementation in `src/services/oauth.service.ts` (currently disabled)

#### Twitter API Connection
**Common Issues**:
- API v1.1 vs v2 endpoint confusion
- Rate limiting on connection attempts
- Elevated access requirements

**Solutions**:
1. **Verify API Version**:
   ```bash
   # Check Twitter API v2 access
   curl -H "Authorization: Bearer $TWITTER_BEARER_TOKEN" \
        "https://api.twitter.com/2/users/me"
   ```
2. **Check Rate Limits**:
   ```bash
   # Get rate limit status
   curl -H "Authorization: Bearer $TWITTER_BEARER_TOKEN" \
        "https://api.twitter.com/1.1/application/rate_limit_status.json"
   ```

#### LinkedIn API Issues
**Typical Problems**:
- Company page vs personal profile confusion
- Scope limitations
- Content publishing restrictions

**Debugging Steps**:
1. **Verify Token Scopes**:
   ```bash
   curl -H "Authorization: Bearer $LINKEDIN_TOKEN" \
        "https://api.linkedin.com/v2/me"
   ```
2. **Check Publishing Permissions**:
   - Ensure `w_member_social` scope for personal posts
   - Verify `w_organization_social` for company pages

### Token Expiration & Refresh

#### Automatic Token Refresh Failures
**Symptoms**:
- Posts failing to publish after working previously
- "Token expired" errors
- Social accounts showing "EXPIRED" status

**Diagnosis**:
```sql
SELECT
  id, platform, username, status, tokenExpiry, lastSyncAt
FROM social_accounts
WHERE status = 'EXPIRED' OR tokenExpiry < NOW();
```

**Solutions**:
1. **Manual Token Refresh**:
   ```bash
   PUT /api/social/accounts/{accountId}/refresh
   Authorization: Bearer user_jwt_token
   ```
2. **Bulk Token Refresh** (admin):
   ```typescript
   // Run refresh job for all expired tokens
   npm run refresh-tokens
   ```
3. **Re-authorization Flow**:
   - Guide user through complete OAuth flow again
   - Update stored tokens and permissions

#### Platform-Specific Token Issues
**Facebook/Instagram**:
- Tokens expire after 60 days
- Long-lived tokens can be extended
- Page tokens need separate refresh

**Twitter**:
- OAuth 1.0a tokens don't expire
- OAuth 2.0 tokens expire in 2 hours
- Refresh tokens valid for 6 months

**LinkedIn**:
- Access tokens expire after 60 days
- No refresh token mechanism
- Requires complete re-authorization

## Content Publishing Problems

### Post Publishing Failures

#### "Content violates platform guidelines"
**Error Code**: `CONTENT_003`

**Investigation Steps**:
1. **Review content for violations**:
   - Spam keywords
   - Excessive hashtags
   - Prohibited content types
   - Copyright issues
2. **Platform-specific checks**:
   ```typescript
   // Check content length limits
   const limits = {
     twitter: 280,
     instagram: 2200,
     linkedin: 3000,
     facebook: 63206
   }
   ```
3. **Image content analysis**:
   - Check for prohibited imagery
   - Verify image dimensions
   - Ensure proper file formats

**Solutions**:
1. **Content modification**:
   - Reduce hashtag count (Instagram: max 30)
   - Remove flagged keywords
   - Modify image content
2. **Manual review process**:
   - Submit content for platform review
   - Wait for approval before republishing
3. **AI content filtering**:
   ```bash
   POST /api/ai/analyze-content
   {
     "content": "post content here",
     "platform": "instagram"
   }
   ```

#### Platform Rate Limiting
**Error Code**: `SOCIAL_003`

**Symptoms**:
- "Rate limit exceeded" messages
- Temporary publishing failures
- Delayed post scheduling

**Rate Limit Monitoring**:
```typescript
// Check current rate limit status
const rateLimitStatus = await checkPlatformRateLimit(platform, accountId)
console.log({
  limit: rateLimitStatus.limit,
  remaining: rateLimitStatus.remaining,
  resetTime: rateLimitStatus.resetTime
})
```

**Solutions**:
1. **Automatic retry with backoff**:
   - Queue failed posts for retry
   - Exponential backoff timing
   - Respect rate limit reset times
2. **Distribute publishing across time**:
   - Spread posts throughout day
   - Use optimal time recommendations
   - Implement intelligent queuing
3. **Multiple account strategy**:
   - Use multiple pages/accounts
   - Load balance across accounts
   - Implement account rotation

### Scheduled Post Issues

#### Posts Not Publishing at Scheduled Time
**Investigation**:
1. **Check job queue status**:
   ```bash
   # Bull queue monitoring
   curl http://localhost:5000/api/admin/queue/status
   ```
2. **Verify scheduled post records**:
   ```sql
   SELECT id, scheduledFor, status, publishAttempts, lastError
   FROM scheduled_posts
   WHERE status = 'PENDING' AND scheduledFor < NOW()
   ORDER BY scheduledFor DESC;
   ```
3. **Check background job processing**:
   ```bash
   # View job logs
   pm2 logs queue-worker
   ```

**Solutions**:
1. **Restart queue workers**:
   ```bash
   pm2 restart queue-worker
   ```
2. **Manual publishing trigger**:
   ```bash
   POST /api/admin/posts/{postId}/publish-now
   ```
3. **Queue cleanup**:
   ```typescript
   // Remove stuck jobs
   await publishingQueue.clean(1000, 'failed')
   await publishingQueue.clean(1000, 'stuck')
   ```

#### Timezone Issues
**Common Problems**:
- Posts publishing at wrong times
- Confusion between user and server timezones
- Daylight saving time complications

**Debugging**:
```sql
-- Check timezone data
SELECT
  id, scheduledFor, timezone,
  scheduledFor AT TIME ZONE timezone AS local_time
FROM scheduled_posts
WHERE id = 'post_id';
```

**Solutions**:
1. **Standardize on UTC**:
   - Store all times in UTC
   - Convert to user timezone in frontend
   - Clear timezone handling in APIs
2. **Validate timezone input**:
   ```typescript
   // Validate IANA timezone
   const isValidTimezone = Intl.supportedValuesOf('timeZone').includes(userTimezone)
   ```

## AI Content Generation Issues

### AI Service Connectivity

#### OpenAI API Errors
**Common Error Codes**:
- 401: Invalid API key
- 429: Rate limit exceeded
- 500: OpenAI service error

**Debugging Steps**:
1. **Test API connectivity**:
   ```bash
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer $OPENAI_API_KEY"
   ```
2. **Check rate limits**:
   ```typescript
   // Monitor usage in application
   const usage = await openai.usage.get()
   console.log('Current usage:', usage)
   ```
3. **Verify API key permissions**:
   - Check OpenAI dashboard
   - Verify billing status
   - Ensure correct project assignment

**Solutions**:
1. **API key rotation**:
   ```bash
   # Update environment variable
   OPENAI_API_KEY="new-api-key-here"
   ```
2. **Implement fallback models**:
   ```typescript
   // Graceful degradation
   if (openai.status === 'error') {
     return await anthropic.generateContent(prompt)
   }
   ```

#### Anthropic Claude API Issues
**Error Handling**:
```typescript
try {
  const response = await anthropic.messages.create({
    model: 'claude-3-sonnet-20240229',
    messages: [{ role: 'user', content: prompt }]
  })
} catch (error) {
  if (error.status === 529) {
    // Overloaded, retry later
    throw new AppError('AI service temporarily unavailable', 503)
  }
}
```

### Content Quality Issues

#### Poor Quality AI Output
**Symptoms**:
- Generic, robotic-sounding content
- Inappropriate tone or style
- Missing platform optimization

**Improvements**:
1. **Enhance prompts**:
   ```typescript
   const improvedPrompt = `
   Create an engaging ${platform} post about ${topic}.
   Tone: ${tone}
   Target audience: ${audience}
   Brand voice: ${brandVoice}
   Include relevant hashtags and platform-specific optimization.
   Make it sound natural and authentic.
   `
   ```
2. **Content filtering**:
   ```bash
   POST /api/ai/improve-content
   {
     "content": "original content",
     "goal": "increase engagement",
     "platform": "instagram"
   }
   ```

#### AI Credit Exhaustion
**Monitoring**:
```sql
-- Check user AI usage
SELECT
  u.email,
  u.plan,
  COUNT(ai.id) as credits_used_this_month
FROM users u
LEFT JOIN ai_generations ai ON u.id = ai.user_id
  AND ai.created_at >= DATE_TRUNC('month', CURRENT_DATE)
WHERE u.id = 'user_id'
GROUP BY u.id;
```

**Solutions**:
1. **Usage notifications**:
   - Send alerts at 80% usage
   - Offer upgrade options
   - Implement graceful limits
2. **Credit reset automation**:
   ```typescript
   // Monthly credit reset job
   cron.schedule('0 0 1 * *', async () => {
     await resetMonthlyCredits()
   })
   ```

## Database & Performance Issues

### Database Connection Problems

#### "Too many connections" Error
**Symptoms**:
- Connection timeouts
- Database unavailable errors
- Slow query performance

**Investigation**:
```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- See connection details
SELECT datname, usename, client_addr, state
FROM pg_stat_activity
WHERE state = 'active';
```

**Solutions**:
1. **Optimize connection pooling**:
   ```typescript
   // Prisma connection pool configuration
   const prisma = new PrismaClient({
     datasources: {
       db: {
         url: process.env.DATABASE_URL + "?connection_limit=20&pool_timeout=10"
       }
     }
   })
   ```
2. **Close inactive connections**:
   ```sql
   -- Kill idle connections
   SELECT pg_terminate_backend(pid)
   FROM pg_stat_activity
   WHERE state = 'idle' AND state_change < NOW() - INTERVAL '1 hour';
   ```

#### Slow Query Performance
**Identification**:
```sql
-- Find slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

**Optimization**:
1. **Add missing indexes**:
   ```sql
   -- Common indexes for AllIN platform
   CREATE INDEX CONCURRENTLY idx_posts_user_created
   ON posts(user_id, created_at);

   CREATE INDEX CONCURRENTLY idx_social_accounts_status
   ON social_accounts(status) WHERE status = 'ACTIVE';
   ```
2. **Optimize queries**:
   ```typescript
   // Use selective fields instead of SELECT *
   const posts = await prisma.post.findMany({
     select: {
       id: true,
       content: true,
       createdAt: true,
       // Only select needed fields
     },
     where: { userId: userId }
   })
   ```

### Redis Cache Issues

#### Redis Connection Failures
**Symptoms**:
- Session errors
- Cache misses
- Performance degradation

**Debugging**:
```bash
# Test Redis connectivity
redis-cli ping

# Check Redis status
redis-cli info server

# Monitor Redis commands
redis-cli monitor
```

**Solutions**:
1. **Connection retry logic**:
   ```typescript
   const redis = new Redis({
     host: process.env.REDIS_HOST,
     port: process.env.REDIS_PORT,
     retryDelayOnFailover: 100,
     maxRetriesPerRequest: 3,
     lazyConnect: true
   })
   ```
2. **Graceful degradation**:
   ```typescript
   // Fallback to database if Redis unavailable
   if (!redis.isConnected) {
     return await getFromDatabase(key)
   }
   ```

## Frontend Integration Issues

### API Communication Problems

#### CORS Errors
**Error Message**: "Access to fetch at 'API_URL' from origin 'FRONTEND_URL' has been blocked by CORS policy"

**Solutions**:
1. **Configure CORS properly**:
   ```typescript
   // Backend CORS configuration
   app.use(cors({
     origin: process.env.FRONTEND_URL.split(','),
     credentials: true,
     optionsSuccessStatus: 200
   }))
   ```
2. **Check environment variables**:
   ```bash
   # Ensure frontend URL is correct
   FRONTEND_URL="http://localhost:3000,https://app.allin-platform.com"
   CORS_ORIGIN="http://localhost:3000,https://app.allin-platform.com"
   ```

#### API Response Format Issues
**Problem**: Frontend expecting different response format

**Standardization**:
```typescript
// Ensure consistent response format
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  meta?: {
    page?: number
    limit?: number
    total?: number
  }
}
```

## System Monitoring & Logs

### Log Analysis

#### Finding Relevant Logs
```bash
# Filter logs by error level
grep "ERROR" /var/log/allin-platform/app.log

# Search for specific user issues
grep "user_id:123abc" /var/log/allin-platform/app.log

# Monitor real-time logs
tail -f /var/log/allin-platform/app.log | grep "AUTH"
```

#### Common Log Patterns
- **Authentication**: `[AUTH]` prefix in logs
- **Social Publishing**: `[SOCIAL]` prefix
- **AI Generation**: `[AI]` prefix
- **Queue Processing**: `[QUEUE]` prefix

### Health Check Endpoints

#### System Health
```bash
# Check overall system health
curl http://localhost:5000/api/health

# Expected response
{
  "status": "ok",
  "services": {
    "database": "connected",
    "redis": "connected",
    "ai_services": "available",
    "social_apis": "operational"
  },
  "timestamp": "2025-01-XX...",
  "uptime": 86400
}
```

#### Service-Specific Health
```bash
# Database connectivity
curl http://localhost:5000/api/health/database

# External API status
curl http://localhost:5000/api/health/external-apis
```

## Emergency Procedures

### Service Recovery

#### Complete System Restart
```bash
# Stop all services
pm2 stop all

# Restart database connections
pm2 restart allin-backend

# Restart queue workers
pm2 restart queue-worker

# Check status
pm2 status
```

#### Database Recovery
```bash
# In case of database corruption
pg_dump allin_platform > backup_$(date +%Y%m%d).sql

# Restore from backup if needed
psql allin_platform < backup_YYYYMMDD.sql
```

### Escalation Procedures

#### When to Escalate to Engineering
1. **Data loss or corruption**
2. **Security breaches**
3. **System-wide outages**
4. **Performance degradation >30 minutes**
5. **Multiple user reports of same issue**

#### Emergency Contacts
- **Platform Issues**: Technical team via Slack #allin-alerts
- **Security Issues**: Security team immediately
- **Customer Impact**: Customer success team
- **External Dependencies**: Check status pages of OpenAI, Facebook, etc.