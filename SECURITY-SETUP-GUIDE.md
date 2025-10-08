# 🔐 AllIN Platform - Security Setup Guide

**Last Updated**: October 8, 2025
**Purpose**: Complete guide to configure secure secrets and encryption for production deployment

---

## 🚨 **CRITICAL: Read This First**

The AllIN platform requires several secure secrets to function properly. **NEVER** use default values or commit secrets to version control.

### **Security Issues Fixed**:
- ✅ Removed hardcoded JWT secret fallbacks (CVSS 9.1)
- ✅ Added token encryption configuration (CVSS 8.9)
- ✅ Implemented secure crypto APIs (CVS 7.5)
- ✅ Added OAuth state validation (CVSS 7.1)

---

## 📋 **Quick Start - Generate All Secrets**

### **Step 1: Generate Secure Secrets**

Run this command to generate ALL required secrets at once:

```bash
cd allin-platform/backend
node -e "
const crypto = require('crypto');
console.log('# ==== COPY THESE TO YOUR .env FILE ====');
console.log('');
console.log('JWT_SECRET=' + crypto.randomBytes(64).toString('hex'));
console.log('JWT_REFRESH_SECRET=' + crypto.randomBytes(64).toString('hex'));
console.log('ENCRYPTION_KEY=' + crypto.randomBytes(32).toString('hex'));
console.log('SESSION_SECRET=' + crypto.randomBytes(32).toString('hex'));
console.log('');
console.log('# ==== END OF SECRETS ====');
"
```

### **Step 2: Create Your .env File**

```bash
# Copy the example file
cp .env.example .env

# Edit the file and paste your generated secrets
# On Windows: notepad .env
# On Mac/Linux: nano .env
```

### **Step 3: Add Your Generated Secrets**

Replace these placeholder values in your `.env` file with the secrets generated in Step 1:

```env
# JWT Configuration (REQUIRED - Replace these!)
JWT_SECRET=your_generated_jwt_secret_here
JWT_REFRESH_SECRET=your_generated_refresh_secret_here

# Token Encryption (REQUIRED - Replace this!)
ENCRYPTION_KEY=your_generated_encryption_key_here

# Session Secret (REQUIRED - Replace this!)
SESSION_SECRET=your_generated_session_secret_here
```

### **Step 4: Verify Configuration**

```bash
# Start the backend
npm run dev

# You should see NO warnings about missing secrets
# Look for: "✓ All security secrets configured"
```

---

## 🔑 **Detailed Secret Requirements**

### **1. JWT_SECRET** (Required)
**Purpose**: Signs JWT access tokens for user authentication
**Length**: 64 bytes (128 hex characters)
**Security Level**: Critical

```bash
# Generate
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**⚠️ NEVER**:
- Use values shorter than 64 bytes
- Reuse across environments
- Commit to version control
- Share via insecure channels

### **2. JWT_REFRESH_SECRET** (Required)
**Purpose**: Signs refresh tokens for session renewal
**Length**: 64 bytes (128 hex characters)
**Security Level**: Critical

```bash
# Generate
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Must be different from JWT_SECRET!**

### **3. ENCRYPTION_KEY** (Required)
**Purpose**: Encrypts OAuth tokens stored in database
**Length**: 32 bytes (64 hex characters)
**Security Level**: Critical

```bash
# Generate
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Used for**:
- Twitter OAuth tokens
- Instagram OAuth tokens
- LinkedIn OAuth tokens
- TikTok OAuth tokens

### **4. SESSION_SECRET** (Recommended)
**Purpose**: Signs session cookies
**Length**: 32 bytes (64 hex characters)
**Security Level**: High

```bash
# Generate
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🌍 **Environment-Specific Configuration**

### **Development Environment**

**File**: `.env` (local only, gitignored)

```env
NODE_ENV=development
JWT_SECRET=<generated_secret>
JWT_REFRESH_SECRET=<generated_secret>
ENCRYPTION_KEY=<generated_key>
PORT=7000
FRONTEND_URL=http://localhost:7001
```

### **Staging Environment**

**File**: `.env.staging` (NOT committed)

```env
NODE_ENV=staging
JWT_SECRET=<different_generated_secret>
JWT_REFRESH_SECRET=<different_generated_secret>
ENCRYPTION_KEY=<different_generated_key>
PORT=7000
FRONTEND_URL=https://staging.yourdomain.com
```

### **Production Environment**

**File**: Managed by secrets vault (AWS Secrets Manager, Azure Key Vault, etc.)

```env
NODE_ENV=production
JWT_SECRET=<production_generated_secret>
JWT_REFRESH_SECRET=<production_generated_secret>
ENCRYPTION_KEY=<production_generated_key>
PORT=7000
FRONTEND_URL=https://yourdomain.com
FORCE_HTTPS=true
TRUST_PROXY=true
```

**⚠️ Production Requirements**:
- Store secrets in secure vault
- Rotate secrets every 90 days
- Use different secrets than dev/staging
- Enable all security headers
- Force HTTPS

---

## 🔒 **OAuth Platform Configuration**

### **Required for Social Media Integration**

Each platform requires OAuth credentials. Get them from:

#### **Twitter OAuth 2.0**
1. Go to: https://developer.twitter.com/en/portal/dashboard
2. Create new app or use existing
3. Enable OAuth 2.0
4. Set callback URL: `http://localhost:7000/api/oauth/twitter/callback`
5. Copy Client ID and Client Secret

```env
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret
TWITTER_CALLBACK_URL=http://localhost:7000/api/oauth/twitter/callback
```

#### **Instagram OAuth**
1. Go to: https://developers.facebook.com/
2. Create Meta App
3. Add Instagram Basic Display
4. Set redirect URI: `http://localhost:7000/api/oauth/instagram/callback`

```env
INSTAGRAM_CLIENT_ID=your_instagram_client_id
INSTAGRAM_CLIENT_SECRET=your_instagram_client_secret
INSTAGRAM_CALLBACK_URL=http://localhost:7000/api/oauth/instagram/callback
```

#### **LinkedIn OAuth**
1. Go to: https://www.linkedin.com/developers/
2. Create new app
3. Request OAuth 2.0 access
4. Set redirect URL: `http://localhost:7000/api/oauth/linkedin/callback`

```env
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
LINKEDIN_CALLBACK_URL=http://localhost:7000/api/oauth/linkedin/callback
```

#### **TikTok OAuth**
1. Go to: https://developers.tiktok.com/
2. Create application
3. Enable Login Kit
4. Set redirect URI: `http://localhost:7000/api/oauth/tiktok/callback`

```env
TIKTOK_CLIENT_KEY=your_tiktok_client_key
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret
TIKTOK_CALLBACK_URL=http://localhost:7000/api/oauth/tiktok/callback
```

---

## ✅ **Security Verification Checklist**

Before deploying to production:

### **Secrets Configuration**
- [ ] JWT_SECRET is 64 bytes (128 hex chars)
- [ ] JWT_REFRESH_SECRET is 64 bytes (128 hex chars)
- [ ] ENCRYPTION_KEY is 32 bytes (64 hex chars)
- [ ] All secrets are different from each other
- [ ] Secrets are different per environment
- [ ] .env file is in .gitignore
- [ ] No secrets in source code

### **OAuth Configuration**
- [ ] Twitter OAuth credentials configured
- [ ] Instagram OAuth credentials configured
- [ ] LinkedIn OAuth credentials configured
- [ ] TikTok OAuth credentials configured
- [ ] All callback URLs match your domain
- [ ] OAuth apps approved/verified on platforms

### **Security Headers**
- [ ] ENABLE_HELMET=true
- [ ] CORS_ORIGIN configured correctly
- [ ] FORCE_HTTPS=true (production only)
- [ ] TRUST_PROXY=true (if behind load balancer)

### **Production Deployment**
- [ ] NODE_ENV=production
- [ ] Secrets stored in vault (not .env file)
- [ ] SSL/TLS certificate configured
- [ ] Rate limiting enabled
- [ ] Monitoring configured
- [ ] Backup encryption keys securely

---

## 🚨 **Security Best Practices**

### **Secret Management**

**DO**:
✅ Generate new secrets for each environment
✅ Use cryptographically secure random generation
✅ Store production secrets in secure vault
✅ Rotate secrets every 90 days
✅ Use environment variables, not config files
✅ Audit secret access logs

**DON'T**:
❌ Commit secrets to version control
❌ Share secrets via email/chat
❌ Reuse secrets across environments
❌ Use weak/short secrets
❌ Store secrets in plain text files
❌ Log secret values

### **OAuth Security**

**DO**:
✅ Validate state parameter (CSRF protection)
✅ Use PKCE for authorization code flow
✅ Encrypt tokens before database storage
✅ Implement token refresh logic
✅ Set appropriate token expiration
✅ Validate redirect URIs

**DON'T**:
❌ Store tokens in plain text
❌ Skip state validation
❌ Use implicit flow
❌ Expose client secrets in frontend
❌ Trust user input without validation

---

## 🔄 **Secret Rotation Guide**

### **When to Rotate Secrets**

- Every 90 days (recommended)
- After team member departure
- After suspected compromise
- After security audit findings
- When changing hosting providers

### **Rotation Process**

1. **Generate New Secrets**
```bash
node -e "
const crypto = require('crypto');
console.log('NEW_JWT_SECRET=' + crypto.randomBytes(64).toString('hex'));
console.log('NEW_JWT_REFRESH_SECRET=' + crypto.randomBytes(64).toString('hex'));
console.log('NEW_ENCRYPTION_KEY=' + crypto.randomBytes(32).toString('hex'));
"
```

2. **Update Production Secrets Vault**
   - Add new secrets with temporary names
   - Test with canary deployment
   - Switch all instances to new secrets
   - Monitor for errors

3. **Deprecate Old Secrets**
   - Keep old secrets active for 24 hours
   - Allow existing sessions to expire
   - Remove old secrets from vault
   - Document rotation in changelog

---

## 📞 **Troubleshooting**

### **"Missing required environment variable" Error**

**Solution**: Ensure all required secrets are in your `.env` file:
```bash
# Check which secrets are missing
grep -E "JWT_SECRET|JWT_REFRESH_SECRET|ENCRYPTION_KEY" .env
```

### **"Invalid token" Errors After Restart**

**Cause**: JWT_SECRET changed, invalidating existing tokens
**Solution**: Users need to log in again (expected behavior)

### **"Encryption failed" for OAuth Tokens**

**Cause**: ENCRYPTION_KEY not set or invalid
**Solution**:
```bash
# Generate new encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Add to .env file
echo "ENCRYPTION_KEY=<generated_key>" >> .env
```

### **OAuth Callback Failures**

**Cause**: Callback URL mismatch
**Solution**: Ensure URLs in .env match those configured in OAuth apps

---

## 📖 **Additional Resources**

- **OWASP Secrets Management**: https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html
- **OAuth 2.0 Security Best Practices**: https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics
- **Node.js Security Best Practices**: https://nodejs.org/en/docs/guides/security/

---

## 🎯 **Quick Commands Reference**

```bash
# Generate all secrets
node -e "const c=require('crypto');console.log('JWT_SECRET='+c.randomBytes(64).toString('hex'));console.log('JWT_REFRESH_SECRET='+c.randomBytes(64).toString('hex'));console.log('ENCRYPTION_KEY='+c.randomBytes(32).toString('hex'));"

# Create .env from example
cp .env.example .env

# Verify .env file exists
ls -la .env

# Check if secrets are configured
grep "JWT_SECRET" .env | head -1

# Test backend with new secrets
npm run dev
```

---

**✅ Security Setup Complete**: Once all secrets are configured, your platform will have enterprise-grade security for authentication and OAuth integration.

**Next Steps**: Proceed with frontend OAuth UI development (Week 2)

---

**🤖 Generated with [Claude Code](https://claude.com/claude-code) - Security Configuration Guide**
