# TEST CREDENTIALS - DO NOT CHANGE

## Super Administrator Account
These credentials are for testing purposes only and should NEVER be modified.

### Primary Test Account
- **Email:** admin@allin.demo
- **Password:** Admin123!@#
- **Role:** Super Administrator
- **Permissions:** Full system access
- **Purpose:** E2E testing, development, and system verification

### Additional Test Accounts

#### Demo User
- **Email:** demo@allin.com
- **Password:** DemoPassword123!
- **Role:** Standard User
- **Permissions:** Basic user access

#### Test User Template
- **Email Pattern:** test.{timestamp}@allin.com
- **Password:** TestPassword123!
- **Role:** Standard User
- **Purpose:** Registration testing

## Important Notes
- These credentials are hardcoded for testing environments only
- They should NEVER be used in production
- All test scripts should reference this file for credentials
- DO NOT modify these credentials as it will break existing tests

## API Testing
For API testing, use the admin credentials with Bearer token authentication:
```
POST /api/auth/login
{
  "email": "admin@allin.demo",
  "password": "Admin123!@#"
}
```

Response will include a JWT token for subsequent API calls.