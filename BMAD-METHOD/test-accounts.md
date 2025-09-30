# AllIN Platform - Test Accounts & Demo Data

## 🚀 Quick Start - Login Instructions

### How to Access the Platform
1. **Open Browser**: Navigate to http://localhost:3001
2. **Click Login**: Find the "Login" button on the homepage
3. **Enter Credentials**: Use one of the test accounts below
4. **Submit**: Click "Sign in" button
5. **Explore**: You'll be redirected to the dashboard

### ⚠️ Important Notes
- **Frontend Only**: Backend is not required for demo login
- **Case Sensitive**: Passwords are case-sensitive
- **Client-Side Auth**: Uses localStorage for session management
- **Debug Mode**: Check browser console (F12) for login debugging

---

## 🔐 Test User Accounts

### Administrator Account (RECOMMENDED)
```
Email: admin@allin.demo
Password: Admin123!@#
Role: Super Administrator
Permissions: Full system access
Status: ✅ WORKING
```

### Agency Owner Account
```
Email: agency@allin.demo
Password: Agency123!@#
Role: Agency Owner
Permissions:
  - Manage all client accounts
  - Create team members
  - Access all analytics
  - Billing management
```

### Social Media Manager Account
```
Email: manager@allin.demo
Password: Manager123!@#
Role: Social Media Manager
Permissions:
  - Create and schedule posts
  - Access analytics
  - Manage content calendar
  - Use AI tools
```

### Content Creator Account
```
Email: creator@allin.demo
Password: Creator123!@#
Role: Content Creator
Permissions:
  - Create content drafts
  - Use AI generation tools
  - Upload media
  - Submit for approval
```

### Client Account (Read-Only)
```
Email: client@allin.demo
Password: Client123!@#
Role: Client
Permissions:
  - View analytics
  - View scheduled posts
  - Approve content
  - Read-only access
```

### Team Member Account
```
Email: team@allin.demo
Password: Team123!@#
Role: Team Member
Permissions:
  - Assigned tasks only
  - Limited analytics access
  - Comment on posts
  - Collaborate on content
```

---

## 🏢 Demo Company Profiles

### Primary Test Company
```
Company: TechStart Solutions
Industry: Technology/SaaS
Description: Innovative SaaS platform for productivity
Social Accounts:
  - Twitter/X: @techstartsolutions
  - LinkedIn: TechStart Solutions
  - Facebook: TechStartSolutions
  - Instagram: @techstart_solutions
```

### Secondary Test Company
```
Company: GreenEarth Wellness
Industry: Health & Wellness
Description: Sustainable wellness products and services
Social Accounts:
  - Instagram: @greenearth_wellness
  - Facebook: GreenEarthWellness
  - Pinterest: GreenEarthWellness
  - TikTok: @greenearthwell
```

### E-commerce Test Account
```
Company: StyleHub Fashion
Industry: E-commerce/Fashion
Description: Trendy fashion and accessories online
Social Accounts:
  - Instagram: @stylehub_fashion
  - Facebook: StyleHubFashion
  - Pinterest: StyleHubFashion
  - Twitter/X: @stylehubfash
```

---

## 📱 Social Media Platform Test Credentials

### Facebook/Meta Test App
```
App ID: test_facebook_app_123456
App Secret: fb_secret_test_key_789xyz
Test Page ID: 123456789012345
Test User Token: EAAtest...token...xyz
```

### Twitter/X Test App
```
API Key: twitter_api_key_test_123
API Secret: twitter_secret_test_456
Bearer Token: AAAAAtest...bearer...token
Access Token: test-access-token-789
Access Secret: test-access-secret-xyz
```

### LinkedIn Test App
```
Client ID: linkedin_client_test_123
Client Secret: linkedin_secret_test_456
Test Company ID: 12345678
Test Page URN: urn:li:organization:12345678
```

### Instagram Test Account
```
Business Account ID: ig_business_test_123
Access Token: IGQVtest...token...xyz
User ID: 17841400000000000
```

---

## 🎯 Demo Content Library

### Pre-loaded Post Templates

#### Tech Company Posts
1. **Product Launch**
   - Title: "Introducing our latest feature!"
   - Content: "We're excited to announce [Feature Name] - designed to help you [Benefit]. Learn more at our website!"
   - Hashtags: #Innovation #TechNews #ProductLaunch

2. **Customer Success Story**
   - Title: "Client Success Spotlight"
   - Content: "See how [Company] increased productivity by 40% using our platform!"
   - Hashtags: #CustomerSuccess #CaseStudy #Results

#### Wellness Brand Posts
1. **Motivational Monday**
   - Title: "Start your week right!"
   - Content: "Your wellness journey begins with a single step. What's your goal this week?"
   - Hashtags: #MotivationalMonday #WellnessJourney #HealthyLiving

2. **Product Highlight**
   - Title: "Featured Product"
   - Content: "Discover the benefits of our organic [Product]! 🌿 Now 20% off!"
   - Hashtags: #OrganicLiving #NaturalWellness #HealthyChoices

#### Fashion Brand Posts
1. **New Collection**
   - Title: "Spring Collection Drop!"
   - Content: "Fresh styles for the new season! 🌸 Shop the collection now!"
   - Hashtags: #NewArrivals #SpringFashion #StyleInspo

2. **Outfit of the Day**
   - Title: "OOTD Inspiration"
   - Content: "Style tip: Pair our [Item] with [Item] for the perfect casual look!"
   - Hashtags: #OOTD #FashionTips #StyleGuide

---

## 🤖 AI Agent Test Scenarios

### Content Creator Agent Tests
```
Prompt: "Create a LinkedIn post about remote work productivity"
Expected: Professional post with tips and business-focused hashtags

Prompt: "Generate Instagram caption for coffee shop photo"
Expected: Casual, engaging caption with relevant emojis and hashtags
```

### Analytics Advisor Agent Tests
```
Query: "What's my best performing content type?"
Expected: Analysis of post types with engagement metrics

Query: "When should I post for maximum engagement?"
Expected: Optimal posting times based on audience activity
```

### Campaign Manager Agent Tests
```
Command: "Create a holiday campaign for December"
Expected: Full campaign plan with content calendar and budget

Command: "Optimize current campaign for better ROI"
Expected: Recommendations for improving campaign performance
```

### Engagement Optimizer Agent Tests
```
Input: "My engagement is dropping, what should I do?"
Expected: Actionable recommendations to boost engagement

Input: "Analyze hashtag performance"
Expected: Hashtag analysis with suggestions for improvement
```

### Strategy Planner Agent Tests
```
Request: "Create Q1 social media strategy"
Expected: Comprehensive quarterly strategy with goals and KPIs

Request: "Competitor analysis for top 3 competitors"
Expected: Detailed competitive analysis with opportunities
```

---

## 📊 Sample Analytics Data

### Performance Metrics (Last 30 Days)
```json
{
  "overview": {
    "total_posts": 45,
    "total_reach": 125000,
    "total_engagement": 8500,
    "engagement_rate": 6.8,
    "follower_growth": 1250,
    "click_through_rate": 3.2
  },
  "platforms": {
    "instagram": {
      "posts": 15,
      "reach": 45000,
      "engagement": 3500,
      "followers": 5200
    },
    "facebook": {
      "posts": 10,
      "reach": 35000,
      "engagement": 2000,
      "followers": 8500
    },
    "linkedin": {
      "posts": 12,
      "reach": 30000,
      "engagement": 2200,
      "followers": 3200
    },
    "twitter": {
      "posts": 8,
      "reach": 15000,
      "engagement": 800,
      "followers": 4100
    }
  }
}
```

### Sample Campaign Data
```json
{
  "campaign": "Summer Sale 2024",
  "status": "active",
  "budget": 5000,
  "spent": 2750,
  "roi": 3.5,
  "conversions": 125,
  "impressions": 500000,
  "clicks": 15000,
  "ctr": 3.0
}
```

---

## 🔧 Database Seeding Commands

### Seed Test Data
```bash
# Navigate to backend
cd allin-platform/backend

# Run database seed
npx prisma db seed

# Or use the custom seed script
npm run seed:demo
```

### Reset Database with Test Data
```bash
# Reset and reseed database
npx prisma migrate reset --force
npx prisma db seed
```

---

## 📝 Testing Checklist

### User Authentication Flow
- [ ] Register new account
- [ ] Email verification
- [ ] Login with credentials
- [ ] Password reset
- [ ] OAuth login (Google/Facebook)
- [ ] Two-factor authentication
- [ ] Session management
- [ ] Logout

### Content Management
- [ ] Create text post
- [ ] Upload images
- [ ] Upload videos
- [ ] Add emojis
- [ ] Add hashtags
- [ ] Save as draft
- [ ] Schedule post
- [ ] Edit scheduled post
- [ ] Delete post

### AI Features
- [ ] Generate content with AI
- [ ] Get hashtag suggestions
- [ ] Optimize posting time
- [ ] Analyze content sentiment
- [ ] Generate image captions
- [ ] Create content variations
- [ ] Campaign suggestions

### Analytics
- [ ] View dashboard metrics
- [ ] Generate custom reports
- [ ] Export data (CSV/PDF)
- [ ] Compare date ranges
- [ ] View competitor analysis
- [ ] Track campaigns
- [ ] Monitor engagement

### Team Collaboration
- [ ] Invite team members
- [ ] Assign roles
- [ ] Set permissions
- [ ] Approval workflow
- [ ] Comments and feedback
- [ ] Activity log
- [ ] Notifications

### Integrations
- [ ] Connect Facebook
- [ ] Connect Instagram
- [ ] Connect Twitter/X
- [ ] Connect LinkedIn
- [ ] Connect TikTok
- [ ] Webhook testing
- [ ] API access

---

## 🚀 Quick Start Testing Guide

### 1. Initial Setup
```bash
# Start all services
docker-compose --profile dev up -d

# Run database migrations
cd backend && npx prisma migrate deploy

# Seed test data
npm run seed:demo

# Start development servers
npm run dev
```

### 2. Login as Admin
- Navigate to http://localhost:3001
- Click "Login"
- Use credentials: admin@allin.demo / Admin123!@#
- Explore full admin dashboard

### 3. Test Key Features
1. **Create Content**: Go to Create → Write post → Use AI
2. **Schedule Post**: Select date/time → Add to queue
3. **View Analytics**: Dashboard → Analytics → Overview
4. **Manage Team**: Settings → Team → Invite member
5. **Run Campaign**: Campaigns → New → Set parameters

### 4. Test AI Agents
1. Open AI Command Center
2. Try natural language commands
3. Test each agent's capabilities
4. Review generated content

### 5. Mobile Testing
- Open browser developer tools
- Toggle device toolbar
- Test responsive design
- Verify touch interactions

---

## 📌 Important Notes

1. **Test Environment Only**: These credentials are for testing/demo purposes only
2. **Reset Data**: Run seed script to reset to default state
3. **API Limits**: Test accounts may have rate limits
4. **Social Platforms**: Use sandbox/test modes for actual posting
5. **Security**: Never use these credentials in production

---

## 🛠️ Troubleshooting

### Common Issues

**Issue**: Cannot login with test accounts
**Solution**: Run database seed script to create accounts

**Issue**: No data showing in analytics
**Solution**: Run seed:demo to populate sample data

**Issue**: AI features not working
**Solution**: Check API keys in .env file

**Issue**: Cannot connect social accounts
**Solution**: Use test/sandbox credentials provided above

---

_Last Updated: January 2025_
_Version: 1.0.0_