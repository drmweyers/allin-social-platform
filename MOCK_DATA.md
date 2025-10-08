# Comprehensive Mock Data System

## Overview

The AllIN platform includes a comprehensive mock data seeding system designed for **client demonstrations** and **feature testing**. This system creates realistic, interconnected data that showcases all platform features.

## Quick Start

### Generate Demo Data

```bash
cd allin-platform/backend
npm run seed:demo
```

This will create:
- ✅ 15 diverse user profiles with realistic data
- ✅ 3 organizations with different team structures
- ✅ 9 social media account connections across multiple platforms
- ✅ 100+ published posts with engagement metrics
- ✅ 30+ scheduled posts in the content calendar

### Reset and Reseed Database

```bash
cd allin-platform/backend
npm run seed:reset
```

⚠️ **WARNING**: This command will **DELETE ALL DATA** and reseed with fresh demo data. Use with caution!

## What Gets Created

### 1. User Profiles (15 Total)

| Type | Email | Description |
|------|-------|-------------|
| **Power User** | sarah.agency@demo.com | Agency owner with high activity across all features |
| **Content Creator** | mike.creator@demo.com | Very active user creating lots of content |
| **Social Media Manager** | jessica.manager@demo.com | Moderate activity, manages scheduled posts |
| **New User** | alex.newbie@demo.com | Recently joined, minimal activity (edge case) |
| **Others** | *11 additional users* | Varied roles and activity levels for realistic testing |

### 2. Organizations (3 Total)

#### Digital Reach Agency
- **Type**: Marketing Agency
- **Team Size**: 5 members
- **Focus**: Full-service digital marketing
- **Connected Platforms**: Twitter, Instagram, LinkedIn, Facebook
- **Owner**: sarah.agency@demo.com

#### TrendyWear Fashion
- **Type**: E-commerce Brand
- **Team Size**: 3 members
- **Focus**: Sustainable fashion with social responsibility
- **Connected Platforms**: Instagram, Facebook, TikTok
- **Owner**: Agency member (user #6)

#### InnovateTech Startup
- **Type**: B2B SaaS Startup
- **Team Size**: 2 members (small team edge case)
- **Focus**: Productivity tools for businesses
- **Connected Platforms**: LinkedIn, Twitter
- **Owner**: Agency member (user #9)

### 3. Social Media Accounts (9 Total)

| Organization | Platforms | Follower Range | Status |
|--------------|-----------|----------------|--------|
| Digital Reach Agency | Twitter, Instagram, LinkedIn, Facebook | 5K - 50K | Active |
| TrendyWear Fashion | Instagram, Facebook, TikTok | 10K - 100K | Active |
| InnovateTech Startup | LinkedIn, Twitter | 1K - 5K | Active |

### 4. Posts (100+ Total)

**Content Distribution**:
- 📱 Platform posts from all connected accounts
- 📊 Realistic engagement metrics (likes, comments, shares)
- 📅 Published dates spread over last 90 days
- 🏷️ Hashtags and mentions included
- 📈 Engagement decay over time (older posts have less engagement)

**Sample Content Types**:
- Product launches
- Monday motivation
- Behind-the-scenes
- Quick tips
- Job postings
- Blog post shares
- Community thank yous
- Weekend vibes
- Industry insights
- Customer testimonials

### 5. Scheduled Posts (30+ Total)

- 📅 Scheduled for next 30 days
- 🏢 Distributed across first 5 social accounts
- ⏰ Various scheduling times
- 📝 Ready-to-publish content

## Login Credentials

### Password for All Demo Users

```
Demo123!
```

### Sample Demo User Logins

```
Email: sarah.agency@demo.com
Password: Demo123!
Role: Admin (Agency Owner)
Activity: Power User - High

Email: mike.creator@demo.com
Password: Demo123!
Role: User (Content Creator)
Activity: Very Active

Email: jessica.manager@demo.com
Password: Demo123!
Role: User (Social Media Manager)
Activity: Moderate

Email: alex.newbie@demo.com
Password: Demo123!
Role: User (New User)
Activity: Minimal (Edge Case)
```

## Access Points

- **Frontend**: http://localhost:7001
- **Login Page**: http://localhost:7001/auth/login
- **Backend API**: http://localhost:7000
- **MailHog UI**: http://localhost:8025
- **pgAdmin**: http://localhost:5050

## Advanced Usage

### Run Demo Seed in Docker Container

```bash
docker exec allin-backend-dev npm run seed:demo
```

### Manually Run Demo Seed Script

```bash
cd allin-platform/backend
npx ts-node prisma/demo-seed.ts
```

### Check Seeding Output

The script provides detailed output showing:
```
🌱 Starting comprehensive demo data seeding...

👥 Creating 15 diverse user profiles...
✅ Created 15 users

🏢 Creating 3 organizations with teams...
✅ Created 3 organizations with team members

📱 Creating social media account connections...
✅ Created 9 social account connections

📝 Creating 100+ posts with realistic engagement...
✅ Created 112 published posts with engagement metrics

📅 Creating scheduled posts for content calendar...
✅ Created 34 scheduled posts

============================================================
✅ DEMO DATA SEEDING COMPLETED SUCCESSFULLY
============================================================
📊 Summary:
   • 15 diverse user profiles created
   • 3 organizations with team structures
   • 9 social media account connections
   • 112 published posts with engagement metrics
   • 34 scheduled posts in content calendar

🔐 All demo users have password: Demo123!

📧 Sample demo user logins:
   • sarah.agency@demo.com (Agency Owner - Power User)
   • mike.creator@demo.com (Content Creator - Very Active)
   • jessica.manager@demo.com (Social Media Manager)
   • alex.newbie@demo.com (New User - Edge Case)
============================================================
```

## Features Demonstrated

### ✅ User Management
- Diverse user profiles with different activity levels
- New users (edge case) vs power users
- Verified and unverified email addresses

### ✅ Organization Management
- Different organization types (agency, e-commerce, startup)
- Various team sizes (2 members to 5+ members)
- Different member roles (Owner, Admin, Member)

### ✅ Social Media Integration
- Multiple platform connections (Twitter, Instagram, LinkedIn, Facebook, TikTok)
- Realistic follower counts and statistics
- Different platform focuses based on business type

### ✅ Content Management
- Published posts with engagement metrics
- Scheduled posts for future publishing
- Content variety (product launches, tips, testimonials, etc.)
- Hashtags and mentions

### ✅ Analytics & Reporting
- Engagement metrics (likes, comments, shares, reach, impressions)
- Time-decay engagement (recent posts have more engagement)
- Platform-specific statistics

### ✅ Team Collaboration
- Multi-member organizations
- Different access levels
- Shared content and accounts

## Data Characteristics

### Realistic Timestamps
- **Past Activity**: Posts distributed over last 90 days
- **Future Scheduling**: Scheduled posts for next 30 days
- **Login History**: Varied last login times

### Interconnected Data
- Users belong to organizations
- Organizations own social accounts
- Social accounts have posts
- Posts have realistic engagement

### Edge Cases Included
- New users with minimal activity
- Small teams (2 members)
- Unverified email addresses
- Partial user profiles

### Data Quality Variety
- Complete profiles with all fields filled
- Incomplete profiles (missing optional fields)
- Different engagement levels (high performers vs low performers)

## Customization

### Modify Number of Posts

Edit `demo-seed.ts` line ~245:
```typescript
const numPosts = faker.number.int({ min: 8, max: 15 });
// Change to: { min: 20, max: 40 } for more posts
```

### Modify Number of Users

Edit `demo-seed.ts` line ~104:
```typescript
for (let i = 0; i < 11; i++) {
// Change to: for (let i = 0; i < 20; i++) {
```

### Change Demo Password

Edit `demo-seed.ts` line ~31:
```typescript
const DEMO_PASSWORD = 'Demo123!';
// Change to your preferred password
```

### Add More Platforms

Edit `demo-seed.ts` line ~221:
```typescript
const platforms: SocialPlatform[] = ['TWITTER', 'INSTAGRAM', 'LINKEDIN', 'FACEBOOK'];
// Add: 'TIKTOK', 'PINTEREST', 'YOUTUBE'
```

## Troubleshooting

### "Table does not exist" Error

Run database migrations first:
```bash
cd allin-platform/backend
npx prisma db push
```

### Seeding Fails Midway

Reset and try again:
```bash
npm run seed:reset
```

### Want to Keep Dev User

The dev user (dev@example.com) is created automatically on server startup and is **separate** from demo data. Running `seed:demo` will not affect the dev user.

### Clear Only Demo Data

Currently, you must use `seed:reset` which clears everything. To selectively delete:
```sql
-- Connect to database and run:
DELETE FROM posts WHERE userId IN (SELECT id FROM users WHERE email LIKE '%@demo.com');
DELETE FROM users WHERE email LIKE '%@demo.com';
-- etc.
```

## Best Practices

### For Client Demos
1. Run `npm run seed:reset` before demo to ensure fresh data
2. Use sarah.agency@demo.com to showcase power user features
3. Use alex.newbie@demo.com to show onboarding flow
4. Point out scheduled posts calendar to show planning features

### For Development Testing
1. Use `npm run seed:demo` to add data without wiping dev user
2. Test with different user roles (owner, admin, member)
3. Test edge cases with new user (alex.newbie@demo.com)
4. Verify analytics with varied engagement levels

### For QA Testing
1. Use demo data to test all user workflows
2. Verify permissions across different roles
3. Test scheduled post execution
4. Validate social platform integrations

## Integration with Dev Login

The demo data system is **completely separate** from the persistent dev login system:

- **Dev Login** (`dev@example.com`): Automatically created on every server startup
- **Demo Data**: Manually created when you run `npm run seed:demo`
- **Coexistence**: Both systems work together without conflicts

Run both for complete testing:
```bash
# Server startup creates dev@example.com automatically
docker-compose --profile dev up -d

# Then add demo data
docker exec allin-backend-dev npm run seed:demo
```

---

**Last Updated**: October 7, 2025
**Version**: 1.0
**Status**: ✅ PRODUCTION READY - Comprehensive demo data system fully implemented
