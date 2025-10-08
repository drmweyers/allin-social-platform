# 🎯 AllIN Platform - Client Demo Guide

## Quick Start for Client Demos

**⚡ FASTEST PATH TO DEMO:**

```bash
# 1. Start Docker containers
cd allin-platform
docker-compose --profile dev up -d

# 2. Wait 30 seconds for services to start

# 3. Generate demo data (OPTIONAL - only if showing full features)
docker exec allin-backend-dev npm run seed:demo

# 4. Open browser and login!
# URL: http://localhost:7001/auth/login
```

---

## 🔐 **PERMANENT LOGIN CREDENTIALS** (Never Change)

### Option 1: Quick Dev Login (Always Available)

```
Email:    dev@example.com
Password: DevPassword123!
Role:     ADMIN
```

✅ **Auto-created on EVERY Docker startup**
✅ **Never deleted or changed**
✅ **Works immediately after container starts**

### Option 2: Demo User Logins (After running seed:demo)

```
Email:    sarah.agency@demo.com
Password: Demo123!
Role:     Admin (Agency Owner)
Features: Full access, multiple organizations, team management

Email:    mike.creator@demo.com
Password: Demo123!
Role:     User (Content Creator)
Features: Active content creator, lots of posts

Email:    jessica.manager@demo.com
Password: Demo123!
Role:     User (Social Media Manager)
Features: Scheduled posts, content calendar

Email:    alex.newbie@demo.com
Password: Demo123!
Role:     User (New User)
Features: Minimal activity (shows onboarding flow)
```

---

## 📋 **Pre-Demo Checklist**

### Every Time Before a Client Demo

```bash
# 1. Ensure Docker is running
docker ps

# 2. Start AllIN platform
cd allin-platform
docker-compose --profile dev up -d

# 3. Verify services are healthy (wait 30-60 seconds)
docker ps

# 4. (OPTIONAL) Load comprehensive demo data
docker exec allin-backend-dev npm run seed:demo

# 5. Open browser to login page
start http://localhost:7001/auth/login
```

### Quick Health Check

```bash
# Check backend is responding
curl http://localhost:7000/health

# Check frontend is responding
curl http://localhost:7001

# View backend logs
docker logs allin-backend-dev --tail 50

# Should see this message:
# ============================================================
# ✓ DEV USER SEEDED
#   Email: dev@example.com
#   Password: DevPassword123!
# ============================================================
```

---

## 🎬 **Demo Scenarios**

### Scenario 1: Quick Platform Overview (5-10 minutes)

**Login:** `dev@example.com` / `DevPassword123!`

**What to Show:**
1. Dashboard overview
2. Social media account connections
3. Content creation interface
4. Basic analytics

**No prep needed** - dev user is always ready!

---

### Scenario 2: Full Feature Demo (20-30 minutes)

**Preparation:**
```bash
docker exec allin-backend-dev npm run seed:demo
```

**Login:** `sarah.agency@demo.com` / `Demo123!`

**What to Show:**
1. **Multi-Organization Management**
   - Switch between 3 different organizations
   - Show team member roles and permissions

2. **Social Media Integration**
   - Connected accounts across Twitter, Instagram, LinkedIn, Facebook
   - Platform-specific analytics

3. **Content Calendar**
   - 100+ published posts with engagement metrics
   - 30+ scheduled posts in the future
   - Content planning features

4. **Team Collaboration**
   - Multiple team members with different roles
   - Shared content and accounts

5. **Analytics Dashboard**
   - Real engagement metrics
   - Performance trends
   - Platform comparisons

---

### Scenario 3: New User Onboarding (10-15 minutes)

**Login:** `alex.newbie@demo.com` / `Demo123!`

**What to Show:**
1. New user experience
2. Account setup process
3. First-time user guidance
4. Limited data (shows clean starting point)

---

## 🔄 **Demo Data Management**

### Load Fresh Demo Data

```bash
# Generate comprehensive demo data (keeps existing dev user)
docker exec allin-backend-dev npm run seed:demo
```

**What This Creates:**
- ✅ 15 diverse user profiles
- ✅ 3 organizations (Agency, E-commerce, Startup)
- ✅ 9 social media account connections
- ✅ 100+ published posts with engagement
- ✅ 30+ scheduled posts

### Complete Reset (Start Fresh)

```bash
# WARNING: Deletes ALL data and reseeds
docker exec allin-backend-dev npm run seed:reset
```

**Use this when:**
- Demo data is corrupted
- Need completely fresh start
- Testing from scratch

**Note:** Dev user (`dev@example.com`) will be recreated automatically on next server restart.

### Check Current Data

```bash
# Connect to database and check user count
docker exec allin-backend-dev npx prisma studio
# Opens browser UI to view database
```

---

## 🌐 **Access Points**

### Main Application
- **Frontend**: http://localhost:7001
- **Login Page**: http://localhost:7001/auth/login
- **Backend API**: http://localhost:7000
- **API Health Check**: http://localhost:7000/health

### Development Tools
- **MailHog** (Email Testing): http://localhost:8025
- **pgAdmin** (Database UI): http://localhost:5050
  - Email: admin@allin.com
  - Password: admin

### Database Direct Access
```bash
# PostgreSQL connection
Host: localhost
Port: 7432
Database: allin
User: postgres
Password: postgres
```

---

## 🐛 **Troubleshooting**

### Problem: "Invalid credentials" on login

**Solution 1: Check dev user was created**
```bash
docker logs allin-backend-dev --tail 100 | grep "DEV USER"
# Should see the credentials message
```

**Solution 2: Manually recreate dev user**
```bash
docker exec allin-backend-dev npm run seed:dev
```

**Solution 3: Restart backend container**
```bash
docker restart allin-backend-dev
# Wait 30 seconds, then check logs
docker logs allin-backend-dev --tail 50
```

---

### Problem: "No data to show" in dashboard

**Solution: Load demo data**
```bash
docker exec allin-backend-dev npm run seed:demo
```

---

### Problem: Docker containers not starting

**Solution 1: Check Docker Desktop is running**
```powershell
docker ps
```

**Solution 2: Stop and restart containers**
```bash
cd allin-platform
docker-compose --profile dev down
docker-compose --profile dev up -d
```

**Solution 3: Check logs for errors**
```bash
docker-compose --profile dev logs
```

---

### Problem: Backend showing "Database does not exist"

**Solution: Run database migrations**
```bash
docker exec allin-backend-dev npx prisma db push
docker restart allin-backend-dev
```

---

### Problem: Port conflicts (Address already in use)

**Solution: Check if another instance is running**
```bash
# Check what's using port 7000
netstat -ano | findstr :7000

# Kill the process if needed (use PID from above)
taskkill /PID <pid> /F

# Or stop all Docker containers
docker-compose --profile dev down
```

---

## 📊 **Demo Data Overview**

### Users (15 Total)

| Email | Password | Role | Activity Level | Best For |
|-------|----------|------|----------------|----------|
| dev@example.com | DevPassword123! | Admin | N/A | Quick demos, testing |
| sarah.agency@demo.com | Demo123! | Admin | High | Full feature showcase |
| mike.creator@demo.com | Demo123! | User | Very High | Content creation demo |
| jessica.manager@demo.com | Demo123! | User | Moderate | Scheduling, planning |
| alex.newbie@demo.com | Demo123! | User | Low | Onboarding flow |
| +10 more users | Demo123! | Mixed | Varied | Team collaboration |

### Organizations (3 Total)

1. **Digital Reach Agency**
   - Type: Marketing Agency
   - Team: 5 members
   - Platforms: Twitter, Instagram, LinkedIn, Facebook
   - Best for: Enterprise/agency demos

2. **TrendyWear Fashion**
   - Type: E-commerce Brand
   - Team: 3 members
   - Platforms: Instagram, Facebook, TikTok
   - Best for: Brand/retail demos

3. **InnovateTech Startup**
   - Type: B2B SaaS
   - Team: 2 members
   - Platforms: LinkedIn, Twitter
   - Best for: Startup/small business demos

### Content (130+ Items)

- **100+ Published Posts**: Realistic engagement metrics, varied content types
- **30+ Scheduled Posts**: Future content calendar, various scheduling times
- **Hashtags & Mentions**: Realistic social media content
- **Engagement Metrics**: Likes, comments, shares, reach, impressions

---

## 🎓 **Tips for Effective Demos**

### Before the Demo

1. ✅ **Test login 5 minutes before** - ensure credentials work
2. ✅ **Load demo data** - run `seed:demo` for full features
3. ✅ **Close unnecessary browser tabs** - focus on platform
4. ✅ **Prepare talking points** - know what features to highlight
5. ✅ **Have backup plan** - know troubleshooting steps

### During the Demo

1. 💡 **Start with quick win** - login and show dashboard
2. 💡 **Tell a story** - use realistic demo data to show use cases
3. 💡 **Show different roles** - switch between users to show permissions
4. 💡 **Highlight unique features** - AI, analytics, scheduling
5. 💡 **Encourage interaction** - let client click around

### After the Demo

1. 📝 **Ask for feedback** - what features resonated?
2. 📝 **Note questions** - what wasn't clear?
3. 📝 **Follow up** - send documentation links
4. 📝 **Reset demo** - run `seed:reset` for next client

---

## 🔒 **Security Notes**

### Demo Environment Safety

✅ **Dev credentials are safe** - only work in development mode
✅ **Auto-disabled in production** - environment check prevents use
✅ **Demo data is clearly marked** - all emails end in @demo.com
✅ **No real credentials** - all passwords are fake

### Production Deployment

When deploying to production:
- ❌ Dev user creation is **automatically disabled**
- ❌ Demo data seeding is **never run**
- ❌ Development ports are **not exposed**
- ✅ Real user authentication takes over

---

## 📞 **Quick Reference Commands**

```bash
# START DEMO ENVIRONMENT
docker-compose --profile dev up -d

# LOAD DEMO DATA
docker exec allin-backend-dev npm run seed:demo

# RESET EVERYTHING
docker exec allin-backend-dev npm run seed:reset

# CHECK BACKEND LOGS
docker logs allin-backend-dev --tail 50

# CHECK FRONTEND LOGS
docker logs allin-frontend-dev --tail 50

# STOP DEMO ENVIRONMENT
docker-compose --profile dev down

# RESTART BACKEND (if login fails)
docker restart allin-backend-dev

# OPEN LOGIN PAGE
start http://localhost:7001/auth/login

# TEST BACKEND HEALTH
curl http://localhost:7000/health

# VIEW DATABASE
docker exec allin-backend-dev npx prisma studio
```

---

## 📚 **Additional Documentation**

For more detailed information, see:

- **`DEV_LOGIN.md`** - Complete guide to persistent dev credentials
- **`MOCK_DATA.md`** - Comprehensive mock data system documentation
- **`PORT_REFERENCE.md`** - All port assignments and configurations
- **`CLAUDE.md`** - Full CTO instructions and project guidelines

---

## ✅ **Demo Readiness Checklist**

Before every client demo, verify:

- [ ] Docker Desktop is running
- [ ] Containers are started (`docker ps` shows all services)
- [ ] Backend is healthy (check logs for "DEV USER SEEDED" message)
- [ ] Frontend is accessible (http://localhost:7001 loads)
- [ ] Dev login works (`dev@example.com` / `DevPassword123!`)
- [ ] Demo data is loaded (if showing full features)
- [ ] Browser is ready (bookmarks, tabs closed)
- [ ] Talking points prepared
- [ ] Backup plan ready (know troubleshooting steps)

---

**Last Updated**: October 7, 2025
**Version**: 1.0
**Status**: ✅ DEMO READY - Complete client demo system fully operational

**🎉 YOU ARE ALWAYS READY FOR A DEMO!**

Just start Docker and login with `dev@example.com` / `DevPassword123!` - it's that simple!
