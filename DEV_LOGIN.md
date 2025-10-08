# Development Login Credentials

## Persistent Dev Account (NEVER CHANGES)

This account is **automatically created** every time the development server starts. You will **never** need to manually create or restore these credentials.

### Login Credentials

```
Email:    dev@example.com
Password: DevPassword123!
Role:     ADMIN
```

### Access Points

- **Frontend**: http://localhost:7001
- **Login Page**: http://localhost:7001/auth/login
- **Backend API**: http://localhost:7000

## How It Works

### Automatic Seeding on Startup

Every time you start the development server, the system automatically:

1. ✅ Checks if the dev user exists in the database
2. ✅ Creates the user if it doesn't exist
3. ✅ Updates the user if it already exists (ensuring password is correct)
4. ✅ Displays credentials in the console output

### Console Output

When the server starts, you'll see this message:

```
============================================================
✓ DEV USER SEEDED
  Email: dev@example.com
  Password: DevPassword123!
  Role: ADMIN
  Status: ACTIVE
============================================================
```

## No Manual Intervention Required

You will **NEVER** need to:

- ❌ Manually create this user
- ❌ Run database migrations for this user
- ❌ Worry about losing these credentials after code changes
- ❌ Rebuild your development environment to restore login

## When To Use

✅ **Use this account for:**
- Daily development work
- Testing authentication flows
- Admin-level feature testing
- Quick login during development

❌ **Do NOT use this account for:**
- Production environments (automatically disabled)
- Client demonstrations (use demo data instead - see MOCK_DATA.md)
- Testing specific user roles (use demo data instead)

## Additional Test Accounts

For testing different user roles and scenarios, see:
- **Demo Data**: Run `npm run seed:demo` for comprehensive mock data
- **Master Test Accounts**: See CLAUDE.md for permanent test credentials

## Troubleshooting

### "Invalid credentials" error

If you encounter login issues:

1. Check the backend console output for the "DEV USER SEEDED" message
2. Verify the server is running in development mode
3. Restart the backend server - the user will be re-created automatically

### Database was reset/cleared

No problem! Just restart the server and the dev user will be automatically created again.

### Want to test a fresh database

Simply clear your database and restart the server. The dev user will be created immediately.

## Security Notes

🔒 **Production Safety**:
- This seeding is **automatically disabled** in production environments
- The check is built into the seeding script itself
- Even if accidentally deployed, it will not run in production

⚠️ **Development Only**:
- These credentials are NOT suitable for production
- They are clearly marked as development-only
- They bypass certain security checks for development convenience

## Technical Details

### Implementation Files

- **Seeding Script**: `backend/prisma/dev-seed.ts`
- **Server Integration**: `backend/src/index.ts` (auto-imports and runs seed)
- **Runs**: BEFORE the server starts accepting HTTP requests
- **Method**: Database upsert (idempotent - safe to run multiple times)

### Environment Detection

The seeding only runs when:
```javascript
process.env.NODE_ENV === 'development' || process.env.NODE_ENV !== 'production'
```

This ensures it never runs in production, staging, or testing environments.

## Questions?

If you have any questions about the dev login system, check:
- This documentation (DEV_LOGIN.md)
- The seeding script: `backend/prisma/dev-seed.ts`
- The server startup: `backend/src/index.ts:88-96`

---

**Last Updated**: October 7, 2025
**Version**: 1.0
**Status**: ✅ PRODUCTION READY - Auto-seeding fully implemented and tested
