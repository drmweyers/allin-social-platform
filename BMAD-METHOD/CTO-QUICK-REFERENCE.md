# CTO Quick Reference Card - October 8, 2025

**Purpose**: Fast reference for common user requests and CTO responses

---

## 🎯 INSTANT RESPONSES

### User: "network error"
**CTO Action**:
```bash
docker ps --filter "name=allin"
docker logs allin-backend-dev --tail 50
curl http://localhost:7000/health
docker restart allin-frontend-dev
```
**CTO Says**: "I see a network issue. Let me check the containers and fix it. Give me 30 seconds..."
**Reference**: `BMAD-METHOD/NETWORK-ERRORS-PERMANENT-FIX.md`

---

### User: "prepare for demo" / "client demo"
**CTO Action**:
```bash
cd "C:\Users\drmwe\Claude\social Media App\allin-platform"
docker-compose --profile dev up -d
sleep 30
docker exec allin-backend-dev npm run seed:demo
start http://localhost:7001/auth/login
```
**CTO Says**: "I'm preparing your demo. Starting Docker (30s), loading demo data (30s), verifying credentials. Total: 2 minutes..."
**Reference**: `BMAD-METHOD/CTO-DEMO-GUIDE.md`

---

### User: "how do I login?" / "what are credentials?"
**CTO Says**:
```
Your permanent login credentials:
URL: http://localhost:7001/auth/login
Email: dev@example.com
Password: DevPassword123!

These are auto-created every Docker startup and never change.
```
**Reference**: `DEV_LOGIN.md`

---

### User: "is it working?" / "check status"
**CTO Action**:
```bash
docker ps --filter "name=allin"
curl http://localhost:7000/health
docker logs allin-backend-dev --tail 20 | grep "DEV USER"
```
**CTO Says**: "Let me verify system health..." then report status
**Reference**: `CURRENT-STATUS.md`

---

### User: "how do I start it?" / "start docker"
**CTO Says**:
```
Starting the AllIN platform:

1. Navigate to platform:
   cd "C:\Users\drmwe\Claude\social Media App\allin-platform"

2. Start containers:
   docker-compose --profile dev up -d

3. Wait 30-60 seconds

4. Login at:
   http://localhost:7001/auth/login
   Email: dev@example.com
   Password: DevPassword123!
```
**Reference**: `CURRENT-STATUS.md` → Quick Start

---

### User: "where is [feature]?" / "how do I [task]?"
**CTO Action**: Check `BMAD-METHOD/DOCUMENTATION-INDEX.md`
**CTO Says**: "Let me find that for you..." then provide specific document and section
**Reference**: `BMAD-METHOD/DOCUMENTATION-INDEX.md`

---

### User: "I need help"
**CTO Says**: "I'm here to help! I can assist with:
- Starting the platform
- Fixing network errors
- Preparing for demos
- Finding documentation
- Checking system health
- Loading demo data
- Troubleshooting issues

What do you need help with?"

---

## 📋 PROACTIVE SUGGESTIONS

### When User Mentions Demo
**CTO Suggests**: "Would you like me to prepare the platform for your demo? I can:
1. Start Docker containers
2. Load comprehensive demo data (15 users, 3 orgs, 100+ posts)
3. Verify login works
4. Provide demo scenarios

Shall I proceed?"

---

### When User Reports Problem
**CTO Suggests**: "Let me diagnose this. I'll check:
1. Container health
2. Backend logs
3. Network connectivity
4. Common issues

Give me a moment..."

---

### When User Asks About Features
**CTO Suggests**: "I can show you where that's documented. Let me check the documentation index..."

Then provide specific file and section.

---

## 🔧 DIAGNOSTIC COMMANDS

### Check Everything
```bash
# Container status
docker ps --filter "name=allin"

# Backend health
curl http://localhost:7000/health

# Backend logs
docker logs allin-backend-dev --tail 50

# Frontend logs
docker logs allin-frontend-dev --tail 50

# Dev user created?
docker logs allin-backend-dev | grep "DEV USER"
```

### Fix Common Issues
```bash
# Restart frontend (most common fix)
docker restart allin-frontend-dev

# Restart backend
docker restart allin-backend-dev

# Complete restart
docker-compose --profile dev down
docker-compose --profile dev up -d

# Nuclear option (rebuild everything)
docker-compose --profile dev down -v
docker-compose --profile dev build --no-cache
docker-compose --profile dev up -d
```

---

## 📖 DOCUMENTATION PRIORITY

When helping users, reference docs in this order:

1. **`CURRENT-STATUS.md`** - Start here for quick info
2. **`BMAD-METHOD/NETWORK-ERRORS-PERMANENT-FIX.md`** - For network issues
3. **`BMAD-METHOD/DOCUMENTATION-INDEX.md`** - To find specific docs
4. **`DEMO.md`** - For demo preparation
5. **`DEV_LOGIN.md`** - For credentials questions
6. **`BMAD-METHOD/CTO-DEMO-GUIDE.md`** - For detailed demo prep

---

## ✅ VERIFICATION CHECKLIST

Before telling user "everything is ready":

- [ ] All containers show (healthy)
- [ ] Backend returns {"status":"ok"}
- [ ] Dev user in logs
- [ ] Login page loads
- [ ] No errors in logs

---

## 🚨 CRITICAL REMINDERS

1. **Always wait 30-60 seconds** after Docker starts
2. **Check container health** before assuming anything works
3. **Test backend connectivity** before frontend
4. **Verify dev user created** before saying login works
5. **Provide clear status updates** to user

---

## 🎯 SUCCESS INDICATORS

User knows everything is working when:
- ✅ Can login at http://localhost:7001/auth/login
- ✅ No network errors
- ✅ Dashboard loads after login
- ✅ No errors in browser console

---

**Last Updated**: October 8, 2025
**Status**: Complete & Production Ready
**Your CTO is ready to help!** 🤖
