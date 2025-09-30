# PowerShell Script for Testing AllIN Login Accounts
# Handles special characters in passwords properly

$API_URL = "http://localhost:5000/api/auth/login"

Write-Host "`n" -NoNewline
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "AllIN Test Account Login Script" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test accounts array
$testAccounts = @(
    @{Email="admin@allin.demo"; Password="Admin123!@#"; Role="Admin"},
    @{Email="agency@allin.demo"; Password="Agency123!@#"; Role="Agency Owner"},
    @{Email="manager@allin.demo"; Password="Manager123!@#"; Role="Manager"},
    @{Email="creator@allin.demo"; Password="Creator123!@#"; Role="Creator"},
    @{Email="client@allin.demo"; Password="Client123!@#"; Role="Client"},
    @{Email="team@allin.demo"; Password="Team123!@#"; Role="Team"}
)

# Function to test login
function Test-Login {
    param(
        [string]$Email,
        [string]$Password,
        [string]$Role
    )
    
    Write-Host "Testing $Role account: $Email" -ForegroundColor Cyan
    
    $body = @{
        email = $Email
        password = $Password
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri $API_URL -Method Post -Body $body -ContentType "application/json"
        
        if ($response.token) {
            Write-Host "  ✓ Login successful!" -ForegroundColor Green
            Write-Host "  Token: $($response.token.Substring(0, 20))..." -ForegroundColor Gray
            Write-Host "  User Role: $($response.user.role)" -ForegroundColor Gray
            return $true
        }
    }
    catch {
        Write-Host "  × Login failed!" -ForegroundColor Red
        $errorMessage = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
        if ($errorMessage) {
            Write-Host "  Error: $($errorMessage.error)" -ForegroundColor Red
        } else {
            Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
        }
        return $false
    }
    Write-Host ""
}

# Check if backend is running
Write-Host "Checking backend server..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -Method Get
    Write-Host "✓ Backend server is running" -ForegroundColor Green
    Write-Host "  Status: $($health.status)" -ForegroundColor Gray
    Write-Host "  Database: $($health.database)" -ForegroundColor Gray
    Write-Host "  Redis: $($health.redis)" -ForegroundColor Gray
    Write-Host ""
}
catch {
    Write-Host "× Backend server is not running!" -ForegroundColor Red
    Write-Host "Please start the backend first with: npm run dev" -ForegroundColor Yellow
    exit 1
}

# Test all accounts
$successCount = 0
$failCount = 0

foreach ($account in $testAccounts) {
    $result = Test-Login -Email $account.Email -Password $account.Password -Role $account.Role
    if ($result) {
        $successCount++
    } else {
        $failCount++
    }
    Write-Host ""
}

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✓ Successful logins: $successCount/$($testAccounts.Count)" -ForegroundColor Green
Write-Host "× Failed logins: $failCount/$($testAccounts.Count)" -ForegroundColor Red
Write-Host ""

if ($successCount -eq $testAccounts.Count) {
    Write-Host "🎉 All test accounts are working correctly!" -ForegroundColor Green
} else {
    Write-Host "⚠️ Some test accounts failed. Please check the errors above." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Access Points" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host 'Frontend Login: http://localhost:3002/login' -ForegroundColor White
Write-Host 'Dashboard: http://localhost:3002/dashboard' -ForegroundColor White
Write-Host 'API Health: http://localhost:5000/api/health' -ForegroundColor White
Write-Host 'API Docs: http://localhost:5000/api-docs' -ForegroundColor White
Write-Host ""