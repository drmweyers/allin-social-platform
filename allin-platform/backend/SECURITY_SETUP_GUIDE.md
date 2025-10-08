# Security Setup Guide - Quick Start

## For New Developers

### First Time Setup (5 minutes)

1. **Copy the environment template:**
   ```bash
   cd allin-platform/backend
   cp .env.example .env
   ```

2. **Generate secure secrets:**
   ```bash
   # Generate all secrets at once
   node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))" >> .env
   node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(64).toString('hex'))" >> .env
   node -e "console.log('ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('hex'))" >> .env
   ```

3. **Fill in other required variables:**
   Edit `.env` and add:
   - `DATABASE_URL` - Your PostgreSQL connection string
   - `MAILGUN_API_KEY` - Your Mailgun API key
   - `MAILGUN_DOMAIN` - Your Mailgun domain
   - `OPENAI_API_KEY` - Your OpenAI API key

4. **Start the application:**
   ```bash
   npm install
   npm start
   ```

5. **Verify success:**
   You should see:
   ```
   🔍 Validating environment configuration...
   ✅ Environment configuration validated successfully
   🚀 Server running on http://localhost:5000
   ```

## Common Errors and Solutions

### Error: "JWT_SECRET environment variable is required"
**Cause:** Missing JWT_SECRET in .env file

**Solution:**
```bash
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))" >> .env
```

### Error: "JWT_SECRET must be at least 64 characters long"
**Cause:** JWT_SECRET is too short (weak security)

**Solution:** Generate a new strong secret:
```bash
# Remove old weak secret from .env first, then:
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))" >> .env
```

### Error: "WEAK SECRET DETECTED: JWT_SECRET appears to contain weak/default value"
**Cause:** Secret contains common weak patterns like 'secret', 'test', 'password'

**Solution:** Generate a cryptographically random secret:
```bash
# Remove weak secret from .env first, then:
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))" >> .env
```

### Error: "ENCRYPTION_KEY environment variable is required"
**Cause:** Missing ENCRYPTION_KEY in .env file

**Solution:**
```bash
node -e "console.log('ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('hex'))" >> .env
```

## Security Requirements

### Required Secrets (Application will NOT start without these)
- `JWT_SECRET` - Min 64 characters (128 hex chars)
- `JWT_REFRESH_SECRET` - Min 64 characters (128 hex chars)
- `ENCRYPTION_KEY` - Min 64 characters (64 hex chars for 32 bytes)
- `MAILGUN_API_KEY` - Min 10 characters
- `OPENAI_API_KEY` - Must start with 'sk-'

### Secret Strength Requirements
- Must be at least 64 characters long
- Must be randomly generated (use crypto.randomBytes)
- Cannot contain weak patterns: 'secret', 'password', 'test', 'changeme', 'default'

### DO NOT
- ❌ Use weak/predictable secrets
- ❌ Copy secrets from examples or tutorials
- ❌ Share secrets in Slack/email/chat
- ❌ Commit .env file to git
- ❌ Use the same secrets across environments

### DO
- ✅ Generate unique secrets for each environment (dev, staging, prod)
- ✅ Store production secrets in secure secrets manager
- ✅ Rotate secrets quarterly
- ✅ Use different secrets for each developer's local environment

## Production Deployment

### Step 1: Generate Production Secrets
```bash
# Generate and save to secure location (password manager, secrets vault)
echo "Production Secrets - KEEP SECURE"
echo "================================="
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('hex'))"
```

### Step 2: Configure Hosting Platform

**Heroku:**
```bash
heroku config:set JWT_SECRET="<generated-secret>"
heroku config:set JWT_REFRESH_SECRET="<generated-secret>"
heroku config:set ENCRYPTION_KEY="<generated-secret>"
```

**Vercel:**
```bash
vercel env add JWT_SECRET production
vercel env add JWT_REFRESH_SECRET production
vercel env add ENCRYPTION_KEY production
```

**AWS (Environment Variables):**
- Go to AWS Console > Service (ECS/Lambda/Elastic Beanstalk)
- Add environment variables in configuration
- Store sensitive values in AWS Secrets Manager (recommended)

**Docker Compose:**
```yaml
environment:
  - JWT_SECRET=${JWT_SECRET}
  - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
  - ENCRYPTION_KEY=${ENCRYPTION_KEY}
```

### Step 3: Verify Deployment
Check logs for:
```
✅ Environment configuration validated successfully
```

If you see errors, the application will not start - fix the configuration before proceeding.

## CI/CD Setup

### GitHub Actions Example
```yaml
env:
  JWT_SECRET: ${{ secrets.JWT_SECRET }}
  JWT_REFRESH_SECRET: ${{ secrets.JWT_REFRESH_SECRET }}
  ENCRYPTION_KEY: ${{ secrets.ENCRYPTION_KEY }}
```

### GitLab CI Example
```yaml
variables:
  JWT_SECRET: $CI_JWT_SECRET
  JWT_REFRESH_SECRET: $CI_JWT_REFRESH_SECRET
  ENCRYPTION_KEY: $CI_ENCRYPTION_KEY
```

Add secrets to your CI/CD platform's secret management:
- GitHub: Settings > Secrets and variables > Actions
- GitLab: Settings > CI/CD > Variables
- Jenkins: Credentials > System > Global credentials

## Testing

### Running Tests
Tests should use mock environment variables or test-specific secrets:

```typescript
// test-setup.ts
process.env.JWT_SECRET = 'a'.repeat(64); // 64 char minimum for testing
process.env.JWT_REFRESH_SECRET = 'b'.repeat(64);
process.env.ENCRYPTION_KEY = 'c'.repeat(64);
```

### Integration Tests
For integration tests, create a `.env.test` file:
```bash
cp .env.example .env.test
# Add test-specific secrets
```

## Troubleshooting

### Application won't start
1. Check if .env file exists: `ls -la .env`
2. Check if secrets are set: `cat .env | grep SECRET`
3. Verify secret lengths: `cat .env | grep JWT_SECRET | wc -c` (should be > 64)
4. Check application logs for specific error messages

### "Invalid token" errors
- Token was signed with different secret
- Secret was changed after tokens were issued
- Solution: Regenerate tokens or restart application

### Production secrets compromised
1. Immediately generate new secrets
2. Update environment variables in hosting platform
3. Restart application
4. Invalidate all existing sessions
5. Force all users to re-authenticate
6. Audit access logs for suspicious activity

## Security Checklist

- [ ] Generated unique secrets for each environment
- [ ] Secrets are at least 64 characters long
- [ ] Secrets stored securely (not in code, docs, or chat)
- [ ] .env file is in .gitignore
- [ ] Production secrets are in secrets manager (not plain environment variables)
- [ ] Secrets rotation policy is defined (quarterly recommended)
- [ ] CI/CD secrets are configured
- [ ] Team members know NOT to share secrets

## Need Help?

- **Security Issues:** Report to security team immediately
- **Setup Issues:** Check error messages - they include remediation steps
- **Questions:** See SECURITY_FIX_REPORT.md for detailed explanation

## Additional Resources

- [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
- [NIST SP 800-57 - Key Management](https://csrc.nist.gov/publications/detail/sp/800-57-part-1/rev-5/final)
- [Node.js Crypto Documentation](https://nodejs.org/api/crypto.html)
