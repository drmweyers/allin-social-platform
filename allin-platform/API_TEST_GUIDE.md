# AllIN Platform - API Testing Guide

## ✅ Solution Summary

**Issue**: The passwords containing special characters `!@#` were causing JSON parsing errors when sent via curl commands due to shell escaping issues.

**Root Cause**: Command-line shells interpret special characters differently, requiring proper escaping.

**Solution**: All test accounts are working correctly! The issue was only with command-line escaping, not the backend implementation.

## 🔐 Test Accounts (Verified Working)

All accounts have been tested and confirmed working:

| Role         | Email              | Password      | Status |
|--------------|--------------------|---------------|--------|
| Admin        | admin@allin.demo   | Admin123!@#   | ✅ Working |
| Agency Owner | agency@allin.demo  | Agency123!@#  | ✅ Working |
| Manager      | manager@allin.demo | Manager123!@# | ✅ Working |
| Creator      | creator@allin.demo | Creator123!@# | ✅ Working |
| Client       | client@allin.demo  | Client123!@#  | ✅ Working |
| Team         | team@allin.demo    | Team123!@#    | ✅ Working |

## 🚀 Testing Methods

### Method 1: Web Browser (Recommended)

1. Navigate to: http://localhost:3002/login
2. Enter email and password from the table above
3. Click "Sign In"
4. You'll be redirected to the dashboard

### Method 2: PowerShell (Windows)

```powershell
# Test Admin Account
$body = @{
    email = "admin@allin.demo"
    password = "Admin123!@#"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method Post -Body $body -ContentType "application/json"
```

### Method 3: curl with Proper Escaping

#### Windows Command Prompt
```cmd
# Use escaped double quotes for Windows
curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@allin.demo\",\"password\":\"Admin123!@#\"}"
```

#### Windows PowerShell
```powershell
# Use single quotes in PowerShell
curl.exe -X POST http://localhost:5000/api/auth/login -H 'Content-Type: application/json' -d '{"email":"admin@allin.demo","password":"Admin123!@#"}'
```

#### Git Bash / WSL
```bash
# Use single quotes to avoid shell interpretation
curl -X POST http://localhost:5000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@allin.demo","password":"Admin123!@#"}'
```

### Method 4: Using Test Scripts

#### Node.js Test Script
```bash
# Navigate to backend directory
cd allin-platform/backend

# Install axios if not already installed
npm install axios

# Run test script
node test-accounts.js
```

#### PowerShell Test Script
```powershell
# Navigate to backend directory
cd allin-platform/backend

# Run PowerShell test script
.\test-login.ps1
```

## 📊 Verification Results

### Backend Logs Show Success
```
2025-09-22 21:26:02 [info]: POST /api/auth/login HTTP/1.1 200 721 - admin@allin.demo
2025-09-22 21:26:02 [info]: POST /api/auth/login HTTP/1.1 200 703 - agency@allin.demo
2025-09-22 21:26:03 [info]: POST /api/auth/login HTTP/1.1 200 708 - manager@allin.demo
2025-09-22 21:26:03 [info]: POST /api/auth/login HTTP/1.1 200 706 - creator@allin.demo
2025-09-22 21:26:03 [info]: POST /api/auth/login HTTP/1.1 200 701 - client@allin.demo
2025-09-22 21:26:03 [info]: POST /api/auth/login HTTP/1.1 200 695 - team@allin.demo
```

## 🔌 API Endpoints

### Authentication
- **Login**: `POST http://localhost:5000/api/auth/login`
- **Logout**: `POST http://localhost:5000/api/auth/logout`
- **Current User**: `GET http://localhost:5000/api/auth/me`
- **Register**: `POST http://localhost:5000/api/auth/register`

### Health & Status
- **Health Check**: `GET http://localhost:5000/api/health`
- **API Docs**: `http://localhost:5000/api-docs`

## 📝 Example API Responses

### Successful Login Response
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id",
    "email": "admin@allin.demo",
    "name": "Admin User",
    "role": "ADMIN",
    "status": "active"
  }
}
```

### Using the Token for Authenticated Requests
```bash
# Store token from login response
TOKEN="your_jwt_token_here"

# Use token in Authorization header
curl -H "Authorization: Bearer $TOKEN" http://localhost:5000/api/auth/me
```

## 🛠️ Troubleshooting

### Issue: "Bad escaped character in JSON"
**Solution**: Use single quotes around the JSON data in curl commands or use the provided test scripts.

### Issue: "Invalid credentials"
**Solution**: Ensure you're using the exact email and password from the test accounts table, including the special characters `!@#`.

### Issue: "Cannot connect to server"
**Solution**: 
1. Ensure backend is running: `npm run dev` in the backend directory
2. Check the server is on port 5000: http://localhost:5000/api/health
3. Check for port conflicts

## 🎯 Quick Test Commands

### Windows PowerShell - Test All Accounts
```powershell
@(
    @{Email="admin@allin.demo"; Password="Admin123!@#"},
    @{Email="agency@allin.demo"; Password="Agency123!@#"},
    @{Email="manager@allin.demo"; Password="Manager123!@#"},
    @{Email="creator@allin.demo"; Password="Creator123!@#"},
    @{Email="client@allin.demo"; Password="Client123!@#"},
    @{Email="team@allin.demo"; Password="Team123!@#"}
) | ForEach-Object {
    $body = @{email = $_.Email; password = $_.Password} | ConvertTo-Json
    Write-Host "Testing: $($_.Email)"
    Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method Post -Body $body -ContentType "application/json" | Out-Null
    Write-Host "✅ Success" -ForegroundColor Green
}
```

## ✨ Summary

All test accounts are fully functional and working correctly. The password escaping issue only affects command-line tools due to how shells interpret special characters. When using the web interface or properly formatted API requests, all accounts authenticate successfully.

---

**Last Verified**: September 22, 2025
**Backend Status**: ✅ Running on port 5000
**Frontend Status**: ✅ Running on port 3002
**Database**: ✅ Connected
**Redis**: ✅ Connected