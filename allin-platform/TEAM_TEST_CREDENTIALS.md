# TEAM FEATURE TEST CREDENTIALS

## Overview
This document contains test credentials specifically for the new dashboard features: Inbox, Media Library, Team Management, and Settings. These credentials are for testing purposes only and should NEVER be modified or used in production.

## Team Management Test Accounts

### Administrator Account
- **Email:** admin.team@allin.demo
- **Password:** TeamAdmin123!@#
- **Role:** Administrator
- **Permissions:** Full system access including team management
- **Purpose:** Testing admin-level team management features
- **Organization:** AllIn Test Organization

### Editor Account #1
- **Email:** editor1.team@allin.demo
- **Password:** TeamEditor123!
- **Role:** Editor
- **Permissions:** Content creation, editing, publishing, analytics viewing
- **Purpose:** Testing editor role limitations and capabilities
- **Department:** Marketing
- **Location:** New York, NY

### Editor Account #2
- **Email:** editor2.team@allin.demo
- **Password:** TeamEditor456!
- **Role:** Editor
- **Permissions:** Content creation, editing, publishing, analytics viewing
- **Purpose:** Testing multi-editor collaboration
- **Department:** Design
- **Location:** Los Angeles, CA

### Viewer Account #1
- **Email:** viewer1.team@allin.demo
- **Password:** TeamViewer123!
- **Role:** Viewer
- **Permissions:** Read-only access to content and analytics
- **Purpose:** Testing viewer role restrictions
- **Department:** Analytics
- **Location:** Remote

### Viewer Account #2
- **Email:** viewer2.team@allin.demo
- **Password:** TeamViewer456!
- **Role:** Viewer
- **Permissions:** Read-only access to content and analytics
- **Purpose:** Testing viewer role restrictions
- **Department:** Sales
- **Location:** Chicago, IL

### Pending Invitation Account
- **Email:** pending.user@allin.demo
- **Password:** (Not set - pending activation)
- **Role:** Editor (assigned but not activated)
- **Status:** Pending invitation
- **Purpose:** Testing invitation and activation flow
- **Invited By:** admin.team@allin.demo

### Suspended Account
- **Email:** suspended.user@allin.demo
- **Password:** SuspendedUser123!
- **Role:** Editor
- **Status:** Suspended
- **Purpose:** Testing account suspension and reactivation
- **Reason:** Test suspension for role behavior testing

## Organization Settings Test Data

### Test Organization
- **Name:** AllIn Test Organization
- **Description:** Test organization for feature development and testing
- **Website:** https://test.allin.demo
- **Industry:** Technology
- **Size:** 51-200 employees
- **Timezone:** America/New_York
- **Language:** English
- **Currency:** USD

## Social Media Account Test Data

### Connected Test Accounts
- **Facebook:** AllIn Test Page (@allintestpage) - 1,250 followers
- **Instagram:** @allintest - 890 followers
- **Twitter/X:** @AllInTest - 560 followers
- **LinkedIn:** AllIn Test Company - 340 followers
- **YouTube:** AllIn Test Channel - 120 subscribers
- **TikTok:** @allintest - 45 followers

### Disconnected Test Accounts
- **LinkedIn Company Page:** (Available for connection testing)
- **YouTube Brand Account:** (Available for connection testing)
- **TikTok Business:** (Available for connection testing)

## Inbox Test Messages

### High Priority Messages
1. **Instagram Comment:** "Love this post! When will you be releasing the new features?"
   - From: @sarahjohnson
   - Engagement: 5 likes, 2 replies
   - Priority: High
   - Status: Unread

2. **Facebook Message:** "Interested in enterprise features for my business"
   - From: Business Owner
   - Priority: High
   - Status: Unread

### Medium Priority Messages
1. **Twitter Mention:** "@allin_app This looks amazing! Tell us more about pricing?"
   - From: @techreviewer
   - Engagement: 12 likes, 3 replies, 1 share
   - Priority: Medium
   - Status: Read

2. **LinkedIn Comment:** "Great insights on social media automation!"
   - From: Marketing Pro
   - Engagement: 8 likes, 1 reply, 2 shares
   - Priority: Medium
   - Status: Replied

## Media Library Test Assets

### Sample Files
1. **hero-banner-2024.jpg** (2.5MB)
   - Type: Image
   - Dimensions: 1920x1080
   - Folder: Campaign Assets
   - Tags: banner, hero, marketing
   - Usage: 15 times

2. **product-demo-video.mp4** (45MB)
   - Type: Video
   - Dimensions: 1920x1080
   - Folder: Campaign Assets
   - Tags: product, demo, video
   - Usage: 8 times

3. **company-logo.svg** (89KB)
   - Type: Image (Vector)
   - Folder: Logos & Branding
   - Tags: logo, branding, vector
   - Usage: 32 times
   - Favorite: Yes

### Test Folders
- **All Media** (24 items)
- **Recently Added** (8 items)
- **Favorites** (6 items)
- **Campaign Assets** (12 items)
- **Logos & Branding** (4 items)
- **Social Templates** (8 items)

## API Testing Endpoints

### Team Management
- `GET /api/team/members` - List team members
- `POST /api/team/invite` - Invite new member
- `PATCH /api/team/members/:id` - Update member
- `DELETE /api/team/members/:id` - Remove member
- `GET /api/team/roles` - Get roles and permissions
- `GET /api/team/stats` - Team statistics

### Inbox Management
- `GET /api/inbox/messages` - List messages with filters
- `PATCH /api/inbox/messages/:id` - Update message status
- `POST /api/inbox/messages/:id/reply` - Reply to message
- `POST /api/inbox/messages/bulk-update` - Bulk actions
- `GET /api/inbox/stats` - Inbox statistics

### Media Library
- `GET /api/media/files` - List media files
- `POST /api/media/upload` - Upload new files
- `PATCH /api/media/files/:id` - Update file metadata
- `DELETE /api/media/files/:id` - Delete file
- `GET /api/media/folders` - List folders
- `POST /api/media/folders` - Create folder

### Settings
- `GET /api/settings/profile` - User profile
- `PATCH /api/settings/profile` - Update profile
- `GET /api/settings/organization` - Organization settings
- `PATCH /api/settings/organization` - Update organization
- `GET /api/settings/notifications` - Notification preferences
- `PATCH /api/settings/notifications` - Update notifications

## Authentication Headers for API Testing

When testing APIs, use the admin account to generate a JWT token:

```bash
POST /api/auth/login
{
  "email": "admin.team@allin.demo",
  "password": "TeamAdmin123!@#"
}
```

Use the returned token in subsequent requests:
```bash
Authorization: Bearer <jwt_token>
```

## Role-Based Access Testing Scenarios

### Scenario 1: Admin Full Access
- Login as admin.team@allin.demo
- Should have access to all features
- Can invite, edit, and remove team members
- Can access all media files and folders
- Can reply to all inbox messages
- Can modify organization settings

### Scenario 2: Editor Limited Access
- Login as editor1.team@allin.demo
- Can create and edit content
- Can view team members but not manage them
- Can upload and manage own media files
- Can view and reply to assigned inbox messages
- Cannot access billing or organization settings

### Scenario 3: Viewer Read-Only Access
- Login as viewer1.team@allin.demo
- Can only view content and analytics
- Cannot edit team member information
- Cannot upload media files
- Cannot reply to inbox messages
- Cannot access any settings

### Scenario 4: Cross-Role Collaboration
- Admin invites a new editor
- Editor creates content using media library
- Viewer reviews analytics and provides feedback
- Team collaborates on inbox message responses

## Important Notes

1. **DO NOT MODIFY** existing test credentials in TEST_CREDENTIALS.md
2. These team credentials are **additional** to the original test accounts
3. All passwords follow the pattern: Role + "123!" + optional characters
4. Test data is designed to demonstrate realistic usage scenarios
5. Organization data reflects a mid-size technology company
6. Social media follower counts are realistic for a growing business
7. Media library contains typical business assets
8. Inbox messages represent common customer interactions

## Security Considerations

- All test accounts use secure password patterns
- Permissions are properly segregated by role
- API endpoints enforce authentication
- File uploads have size and type restrictions
- Bulk operations have safety checks
- Admin removal prevention is implemented

## Testing Checklist

### Team Management
- [ ] Admin can invite members with different roles
- [ ] Role changes update permissions correctly
- [ ] Cannot remove the last administrator
- [ ] Pending invitations can be resent
- [ ] Suspended members cannot access features
- [ ] Bulk operations work correctly

### Inbox Management
- [ ] Messages filter by platform, type, and status
- [ ] Search works across content and metadata
- [ ] Replies update message status
- [ ] Bulk actions work on multiple messages
- [ ] Statistics reflect actual data

### Media Library
- [ ] File uploads handle multiple formats
- [ ] Folders organize content effectively
- [ ] Search works across names and tags
- [ ] Bulk operations work on multiple files
- [ ] File permissions respect user roles

### Settings
- [ ] Profile updates save correctly
- [ ] Organization settings require admin role
- [ ] Notification preferences persist
- [ ] Social account connections work
- [ ] Password changes are secure

This test credential system provides comprehensive coverage for all dashboard features while maintaining security and realistic usage patterns.