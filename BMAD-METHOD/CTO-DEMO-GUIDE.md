# CTO Quick Guide - Client Demo Preparation

## When User Says: "Prepare me for a client demo"

### Your Response Template

"I'll prepare the AllIN platform for your client demo. Here's what I'm doing:

1. **Starting Docker containers** (this takes about 30 seconds)
2. **Loading comprehensive demo data** (creates 15 users, 3 organizations, 100+ posts)
3. **Verifying login credentials** work
4. **Opening the login page** in your browser

Let me execute these steps now..."

---

## Step-by-Step CTO Process

### Step 1: Start Docker Environment

```bash
cd "C:\Users\drmwe\Claude\social Media App\allin-platform"
docker-compose --profile dev up -d
```

**What to tell user:**
"Starting Docker containers... This will take about 30-60 seconds. The platform runs on ports 7000-7099 to avoid conflicts with other development applications."

### Step 2: Wait for Services to Initialize

```bash
# Wait 30 seconds, then check services are running
timeout 30 cmd /c "echo Waiting for services to start..."
docker ps
```

**What to tell user:**
"Waiting for services to initialize... Backend and frontend are starting up."

### Step 3: Verify Backend is Healthy

```bash
# Check backend logs for dev user seeding
docker logs allin-backend-dev --tail 50
```

**What to look for:**
```
============================================================
✓ DEV USER SEEDED
  Email: dev@example.com
  Password: DevPassword123!
  Role: ADMIN
  Status: ACTIVE
============================================================
```

**What to tell user:**
"Backend is healthy and ready. Dev credentials are auto-created and available."

### Step 4: Load Demo Data (OPTIONAL - Ask User First)

**Ask user:**
"Would you like me to load comprehensive demo data? This includes:
- 15 diverse user profiles
- 3 organizations (Agency, E-commerce, Startup)
- 9 social media account connections
- 100+ published posts with engagement
- 30+ scheduled posts

This is recommended for full feature demos. Should I proceed? (yes/no)"

**If user says yes:**
```bash
docker exec allin-backend-dev npm run seed:demo
```

**What to tell user:**
"Loading comprehensive demo data... This takes about 30 seconds and creates realistic, interconnected data for showcasing all platform features."

**If user says no:**
"No problem! You can use the quick dev login (dev@example.com) for a basic platform overview demo."

### Step 5: Verify Login Works

```bash
# Test dev login endpoint
curl -X POST http://localhost:7000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"dev@example.com\",\"password\":\"DevPassword123!\"}"
```

**What to look for:**
- Response with `"success":true`
- Valid `accessToken` and `refreshToken`

**What to tell user:**
"Login endpoint verified - all credentials are working correctly."

### Step 6: Provide Demo Credentials

**What to tell user:**

"✅ Your platform is ready for the client demo!

**Login URL:** http://localhost:7001/auth/login

**For Quick Demo (5-10 minutes):**
- Email: dev@example.com
- Password: DevPassword123!
- Use this to show basic platform features

**For Full Demo (20-30 minutes):** [Only if seed:demo was run]
- Email: sarah.agency@demo.com
- Password: Demo123!
- Role: Agency Owner (Power User)
- Shows: Multi-organization management, team collaboration, 100+ posts, scheduling

**Alternative Demo Accounts:** [Only if seed:demo was run]
- mike.creator@demo.com (Content Creator - Very Active)
- jessica.manager@demo.com (Social Media Manager)
- alex.newbie@demo.com (New User - Onboarding Flow)

**All demo passwords are:** Demo123!

Would you like me to open the login page in your browser now?"

### Step 7: Open Browser (If User Agrees)

```bash
start http://localhost:7001/auth/login
```

### Step 8: Provide Demo Scenario Suggestions

**What to tell user:**

"Here are three demo scenarios you can use:

**Scenario 1: Quick Platform Overview (5-10 min)**
- Login: dev@example.com
- Show: Dashboard, social accounts, content creation
- Best for: Initial interest meetings

**Scenario 2: Full Feature Demo (20-30 min)**
- Login: sarah.agency@demo.com
- Show: Multi-org management, team roles, content calendar, analytics
- Best for: Serious prospects, product demos

**Scenario 3: Onboarding Flow (10-15 min)**
- Login: alex.newbie@demo.com
- Show: New user experience, account setup, guided tour
- Best for: User experience demonstrations

See DEMO.md for detailed demo scripts and talking points."

---

## CTO Troubleshooting Guide

### Problem: "Login isn't working"

**Diagnosis Steps:**
```bash
# 1. Check backend logs
docker logs allin-backend-dev --tail 100 | grep "DEV USER"

# 2. Verify backend is running
docker ps | grep backend

# 3. Test backend health
curl http://localhost:7000/health
```

**Solutions:**

**If backend not running:**
```bash
docker restart allin-backend-dev
# Wait 30 seconds
docker logs allin-backend-dev --tail 50
```

**If dev user not seeded:**
```bash
docker exec allin-backend-dev npm run seed:dev
```

**If database issues:**
```bash
docker exec allin-backend-dev npx prisma db push
docker restart allin-backend-dev
```

**What to tell user:**
"I found the issue - [specific problem]. I'm fixing it now by [specific solution]. Please wait 30 seconds..."

---

### Problem: "No data showing in dashboard"

**Diagnosis:**
User likely needs demo data loaded.

**Solution:**
```bash
docker exec allin-backend-dev npm run seed:demo
```

**What to tell user:**
"You need demo data to see posts, organizations, and engagement metrics. I'm loading comprehensive demo data now - this takes about 30 seconds."

---

### Problem: "Docker containers won't start"

**Diagnosis Steps:**
```bash
# Check if Docker Desktop is running
docker ps

# Check for port conflicts
netstat -ano | findstr :7000
netstat -ano | findstr :7001
```

**Solutions:**

**If Docker not running:**
```powershell
Start-Process 'C:\Program Files\Docker\Docker\Docker Desktop.exe'
# Wait 60 seconds for Docker to start
```

**What to tell user:**
"Docker Desktop wasn't running. I'm starting it now - this takes about 60 seconds. Then I'll start the AllIN containers."

**If port conflicts:**
```bash
# Stop conflicting services
docker-compose --profile dev down

# Or identify and kill conflicting process
# Get PID from netstat output, then:
taskkill /PID <pid> /F
```

**What to tell user:**
"There's a port conflict with another application. I'm resolving it now..."

---

### Problem: "Want to reset and start fresh"

**Solution:**
```bash
# Complete reset
docker exec allin-backend-dev npm run seed:reset
```

**What to tell user:**
"I'm resetting the database and loading fresh demo data. This takes about 45 seconds and gives you a clean slate for the demo."

---

## CTO Pre-Demo Checklist

When preparing for a demo, verify all these items:

```bash
# 1. Docker is running
docker ps

# 2. Backend is healthy
docker logs allin-backend-dev --tail 20 | grep "Server running"

# 3. Frontend is accessible
curl -I http://localhost:7001

# 4. Dev credentials work
curl -X POST http://localhost:7000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"dev@example.com\",\"password\":\"DevPassword123!\"}"

# 5. Database is accessible
docker exec allin-backend-dev npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM users;"
```

**Checklist for user:**

"Pre-demo verification complete:
- ✅ Docker containers running
- ✅ Backend healthy on port 7000
- ✅ Frontend accessible on port 7001
- ✅ Dev credentials verified
- ✅ Database accessible
- ✅ [Demo data loaded / Not loaded]

You're ready for the client demo!"

---

## CTO Demo Data Management

### When to Load Demo Data

**Load demo data if user says:**
- "I need to show the full platform"
- "Client wants to see analytics"
- "Need to demonstrate multi-organization features"
- "Want to show team collaboration"
- "Preparing for a comprehensive demo"

**Don't load demo data if user says:**
- "Quick login test"
- "Just need to check something"
- "5-minute overview"
- "Show basic features"

### Demo Data Commands Reference

```bash
# Load comprehensive demo data (keeps existing dev user)
docker exec allin-backend-dev npm run seed:demo

# Complete reset (deletes everything, reseeds)
docker exec allin-backend-dev npm run seed:reset

# Manually run dev seeding only
docker exec allin-backend-dev npm run seed:dev

# View database contents
docker exec allin-backend-dev npx prisma studio
# Opens browser UI at http://localhost:5555
```

---

## CTO Response Templates

### User: "Prepare me for a client demo"

```
I'll prepare your AllIN platform for the client demo. Here's my plan:

1. Start Docker containers (30 seconds)
2. Verify services are healthy
3. Load comprehensive demo data with 15 users, 3 orgs, 100+ posts (30 seconds)
4. Verify login credentials
5. Provide demo scenarios

Total time: About 2 minutes

Starting now...

[Execute steps]

✅ Demo preparation complete!

Login URL: http://localhost:7001/auth/login

Recommended Demo Account:
- Email: sarah.agency@demo.com
- Password: Demo123!
- Role: Agency Owner

This account showcases:
- Multi-organization management
- Team collaboration (5 team members)
- 100+ published posts with engagement
- 30+ scheduled posts
- All platform features

Alternative accounts and scenarios are in DEMO.md.

Should I open the login page for you?
```

---

### User: "I need to login quickly"

```
Quick login credentials (always available):

Email: dev@example.com
Password: DevPassword123!

URL: http://localhost:7001/auth/login

These credentials are permanently available and auto-created every time Docker starts.

Should I verify the backend is running first?
```

---

### User: "What demo scenarios can I show?"

```
I recommend one of these three scenarios based on your meeting:

**Scenario 1: Quick Overview (5-10 minutes)**
Login: dev@example.com / DevPassword123!
Show: Dashboard, social accounts, basic content creation
Best for: Initial interest meetings, time-constrained demos

**Scenario 2: Full Feature Demo (20-30 minutes)**
Login: sarah.agency@demo.com / Demo123!
Show: Multi-org management, team roles, content calendar, analytics, scheduling
Best for: Serious prospects, decision-makers

**Scenario 3: New User Onboarding (10-15 minutes)**
Login: alex.newbie@demo.com / Demo123!
Show: First-time user experience, account setup, guided tour
Best for: User experience focus, training demos

For Scenario 2 or 3, I need to load demo data first. Which scenario are you planning?
```

---

### User: "Login isn't working"

```
Let me diagnose the login issue. I'm checking:

1. Is Docker running?
2. Is the backend healthy?
3. Are dev credentials created?
4. Is the database accessible?

[Run diagnostic commands]

Found the issue: [specific problem]

Fixing now: [specific solution]

[Execute fix]

✅ Fixed! You can now login with:
Email: dev@example.com
Password: DevPassword123!

Should I test the login for you?
```

---

## Quick Reference Card for CTO

**Essential Commands:**
```bash
# Start platform
docker-compose --profile dev up -d

# Load demo data
docker exec allin-backend-dev npm run seed:demo

# Reset everything
docker exec allin-backend-dev npm run seed:reset

# Check logs
docker logs allin-backend-dev --tail 50

# Restart backend
docker restart allin-backend-dev

# Test login
curl -X POST http://localhost:7000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"dev@example.com\",\"password\":\"DevPassword123!\"}"
```

**Essential URLs:**
- Frontend: http://localhost:7001
- Backend: http://localhost:7000
- Login: http://localhost:7001/auth/login

**Essential Credentials:**
- Dev: dev@example.com / DevPassword123!
- Demo: sarah.agency@demo.com / Demo123!

**Documentation:**
- Full demo guide: `DEMO.md`
- Dev login guide: `DEV_LOGIN.md`
- Mock data guide: `MOCK_DATA.md`
- CTO instructions: `CLAUDE.md`

---

**Last Updated:** October 7, 2025
**Status:** ✅ PRODUCTION READY
**Purpose:** CTO reference for all client demo preparations
