# AllIN Platform User Journeys

## Account Setup & Onboarding

### New User Registration Journey

#### Happy Path
1. **Landing Page** → Click "Sign Up" or "Start Free Trial"
2. **Registration Form**
   - Enter email, password, name
   - Accept terms of service
   - Submit form
3. **Email Verification**
   - Check email for verification link
   - Click verification link
   - Account status: `PENDING` → `ACTIVE`
4. **Plan Selection**
   - Choose plan: Starter/Professional/Team/Enterprise
   - Enter payment details (if not trial)
5. **Onboarding Wizard**
   - Connect first social media account
   - Set basic preferences
   - Complete profile setup

**API Endpoints Used**:
- `POST /api/auth/register` - Initial registration
- `POST /api/auth/verify-email` - Email verification
- `GET /api/auth/me` - Get user profile

#### Edge Cases
**Email Already Exists**:
- Form shows error: "Account with this email already exists"
- Redirect to login page with "Forgot password?" option

**Weak Password**:
- Real-time validation shows requirements
- Must have: 8+ chars, uppercase, lowercase, number

**Email Verification Timeout**:
- Verification token expires after 24 hours
- User can request new verification email
- `POST /api/auth/resend-verification`

### Social Account Connection

#### Happy Path
1. **Dashboard** → "Connect Account" button
2. **Platform Selection** → Choose Facebook/Instagram/Twitter/LinkedIn/TikTok
3. **OAuth Flow**
   - Redirect to platform authorization
   - User grants permissions
   - Callback with authorization code
4. **Account Setup**
   - Select specific pages/profiles to manage
   - Configure posting preferences
   - Test connection with sample post

**Implementation**: `src/services/oauth.service.ts` (disabled in current version)

#### Common Issues
**Insufficient Permissions**:
- User only grants basic read permissions
- Show clear message: "Need posting permissions to publish content"
- Guide user through re-authorization with correct scopes

**Platform Account Suspended**:
- OAuth succeeds but API calls fail
- Show warning: "This account appears to be restricted"
- Suggest contacting platform support

**Multiple Pages/Profiles**:
- Facebook users often manage multiple pages
- Show selection interface for business pages
- Allow connecting multiple pages as separate accounts

## Content Creation Workflows

### AI Content Generation

#### Simple Post Creation
1. **Content Creator** → Click "Generate Content"
2. **AI Prompt Form**
   - Enter topic: "Summer sale announcement"
   - Select platform: Instagram
   - Choose tone: "Friendly"
   - Click "Generate"
3. **AI Processing**
   - System calls `aiService.generateContent()`
   - Returns optimized content with hashtags
4. **Review & Edit**
   - User reviews generated content
   - Makes manual adjustments
   - Selects media (optional)
5. **Publish or Schedule**
   - Immediate: Click "Publish Now"
   - Later: Select date/time and "Schedule"

**API Flow**:
```typescript
POST /api/ai/generate-content
{
  platform: "instagram",
  topic: "Summer sale announcement",
  tone: "friendly",
  includeHashtags: true
}
```

#### Bulk Content Generation
1. **Campaign Planner** → "Create Campaign"
2. **Campaign Setup**
   - Name: "July Summer Sale"
   - Duration: July 1-31
   - Platforms: Instagram, Facebook, Twitter
3. **AI Batch Generation**
   - Enter master prompt
   - AI generates variations for each platform
   - Creates 30 days of content
4. **Review Dashboard**
   - Grid view of all generated content
   - Bulk edit capabilities
   - Individual post adjustments
5. **Bulk Scheduling**
   - Auto-schedule to optimal times
   - Manual override specific posts
   - Launch campaign

### Manual Content Creation

#### Traditional Post Creation
1. **Dashboard** → "Create Post"
2. **Content Editor**
   - Write post text (platform character limits shown)
   - Add media (drag & drop or file picker)
   - Add hashtags with suggestions
3. **Platform Selection**
   - Multi-select platforms
   - Preview for each platform
   - Platform-specific optimizations
4. **Publishing Options**
   - Immediate publishing
   - Specific date/time scheduling
   - Add to posting queue

#### Template-Based Creation
1. **Templates Library** → Browse available templates
2. **Template Selection** → Choose relevant template
3. **Variable Input**
   - Fill in template variables (company name, product, etc.)
   - AI suggestions for variable content
4. **Customization**
   - Adjust generated content
   - Modify for specific platforms
5. **Save & Publish**
   - Save as new template (optional)
   - Publish or schedule

## Scheduling & Queue Management

### Queue-Based Scheduling

#### Setting Up Posting Queues
1. **Schedule Manager** → "Create Queue"
2. **Queue Configuration**
   - Name: "Daily Instagram Posts"
   - Timezone: User's local timezone
   - Platforms: Select target platforms
3. **Time Slot Definition**
   - Monday-Friday: 9 AM, 2 PM, 6 PM
   - Weekend: 11 AM, 4 PM
   - AI suggestions based on analytics
4. **Queue Activation**
   - Enable queue for automatic posting
   - Set content requirements per slot

**Database Model**: `PostingQueue` → `QueueTimeSlot[]`

#### Adding Content to Queue
1. **Content Creation** → Complete post creation
2. **Scheduling Options** → Select "Add to Queue"
3. **Queue Selection** → Choose target queue
4. **Position Assignment**
   - Auto-assign to next available slot
   - Manual position selection
   - Priority override options
5. **Confirmation**
   - Preview scheduled times
   - Confirm queue placement

### Optimal Time Scheduling

#### AI-Suggested Times
1. **Schedule Post** → Select "Use Optimal Times"
2. **AI Analysis**
   - Analyze past performance data
   - Consider audience activity patterns
   - Calculate engagement probability
3. **Time Recommendations**
   - Show top 3 recommended times
   - Explain reasoning (e.g., "65% of your audience is active")
   - Allow manual override
4. **Schedule Confirmation**
   - Confirm selected time
   - Add to publishing queue

**Implementation**: `OptimalPostingTime` model with ML scoring

#### Custom Scheduling
1. **Schedule Post** → "Custom Time"
2. **Date/Time Picker**
   - Calendar interface
   - Timezone selection
   - Recurring pattern options
3. **Platform Coordination**
   - Stagger times across platforms
   - Account for platform time zones
   - Avoid conflicting schedules
4. **Advanced Options**
   - Retry logic for failures
   - Auto-reschedule if platform down
   - Engagement monitoring

## Team Collaboration

### Multi-User Workflows

#### Content Approval Process
1. **Content Creator** (Member role)
   - Creates draft content
   - Submits for approval
   - Status: `DRAFT` → `PENDING_APPROVAL`
2. **Content Manager** (Editor/Admin role)
   - Reviews submitted content
   - Adds comments/feedback
   - Approves or requests changes
3. **Publishing Decision**
   - Approved content → Schedule for publishing
   - Rejected content → Return to creator with notes
   - Status tracking through workflow

#### Team Assignment System
1. **Project Manager** → Assign content tasks
2. **Task Creation**
   - Assign to specific team member
   - Set deadline and priority
   - Include content guidelines
3. **Collaborative Editing**
   - Multiple users can edit drafts
   - Version history tracking
   - Comment system for feedback
4. **Review & Approval Chain**
   - Hierarchical approval system
   - Parallel review for urgent content
   - Final publishing authority

### Agency Client Management

#### Client Workspace Setup
1. **Agency Admin** → "Add Client"
2. **Client Organization**
   - Create separate organization
   - Invite client users as viewers
   - Configure permissions and access
3. **Brand Guidelines**
   - Upload brand assets
   - Set tone and style guidelines
   - Configure approval workflows
4. **Reporting Setup**
   - White-label report templates
   - Automated report scheduling
   - Client dashboard access

#### Client Collaboration
1. **Client Access**
   - View-only dashboard access
   - Comment on draft content
   - Approve/reject content
2. **Feedback Loop**
   - Client comments on content
   - Agency revises based on feedback
   - Approval before publishing
3. **Performance Reviews**
   - Monthly performance reports
   - Strategy adjustment meetings
   - Goal tracking and optimization

## Analytics & Reporting

### Performance Monitoring

#### Daily Analytics Review
1. **Dashboard Login** → Analytics overview
2. **Performance Metrics**
   - Today's post performance
   - Engagement rate trends
   - Follower growth
   - Top performing content
3. **Platform Comparison**
   - Cross-platform performance
   - Best/worst performing platforms
   - Optimization recommendations
4. **Action Items**
   - Boost high-performing content
   - Reschedule underperforming posts
   - Adjust content strategy

#### Weekly/Monthly Reports
1. **Report Generation**
   - Automated weekly/monthly reports
   - Custom date range selection
   - Platform-specific deep dives
2. **Performance Analysis**
   - Trend identification
   - Goal achievement tracking
   - Competitive benchmarking
3. **Strategic Planning**
   - Content strategy adjustments
   - Budget allocation recommendations
   - Growth opportunity identification

### Custom Report Creation

#### Agency Reporting
1. **Report Builder** → Select client
2. **Template Selection**
   - White-label agency template
   - Custom branding application
   - Client-specific metrics
3. **Data Configuration**
   - Date range selection
   - Platform inclusion/exclusion
   - Metric prioritization
4. **Generation & Delivery**
   - PDF/Excel export
   - Automated email delivery
   - Client portal access

## Error Handling & Edge Cases

### Content Publishing Failures

#### Platform API Errors
**Scenario**: Instagram API returns 400 error during publishing

**User Experience**:
1. User sees notification: "Post failed to publish to Instagram"
2. Error details: "Platform temporarily unavailable"
3. Options presented:
   - "Retry Now" → Immediate retry
   - "Retry Later" → Add to retry queue
   - "Edit Post" → Modify content and retry
   - "Cancel" → Mark as failed

**Technical Implementation**:
- Automatic retry with exponential backoff
- Error logging for debugging
- User notification system
- Manual intervention options

#### Content Violations
**Scenario**: Platform rejects content for policy violation

**User Experience**:
1. Clear error message: "Content violates platform guidelines"
2. Specific issue explanation when available
3. Suggested corrections
4. Option to edit and resubmit

#### Rate Limit Exceeded
**Scenario**: Too many posts in short timeframe

**User Experience**:
1. Warning before hitting limits
2. Automatic queuing for later posting
3. Clear explanation of platform limits
4. Suggested optimal timing

### Account Connection Issues

#### OAuth Token Expiration
**Detection**: Regular token validation
**User Notification**: "Social account needs reconnection"
**Resolution**: One-click reconnection process
**Prevention**: Automatic token refresh when possible

#### Permission Changes
**Scenario**: User revokes permissions on platform
**Detection**: API call failures
**Response**: Clear explanation and re-authorization flow
**Fallback**: Graceful degradation of features

#### Platform Account Suspension
**Detection**: Specific API error codes
**Response**:
- Clear communication about suspension
- Guidance on platform appeal process
- Temporary removal from posting queues
- Preservation of content for future reconnection

### Data Loss Prevention

#### Draft Auto-Save
- Automatic saving every 30 seconds
- Local storage backup
- Recovery on browser crash
- Version history maintenance

#### Schedule Backup
- Daily export of scheduled posts
- Recovery procedures for system failures
- Manual backup download options
- Disaster recovery protocols

#### Media Asset Protection
- Redundant storage systems
- Automatic backup verification
- File integrity checking
- Recovery procedures for corrupted files