#!/bin/bash

# AllIN Platform - Production Deployment Script
# This script handles the complete production deployment process

set -e  # Exit on any error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENVIRONMENT=${1:-production}
SKIP_TESTS=${2:-false}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if required commands exist
    command -v docker >/dev/null 2>&1 || error "Docker is not installed"
    command -v docker-compose >/dev/null 2>&1 || error "Docker Compose is not installed"
    command -v node >/dev/null 2>&1 || error "Node.js is not installed"
    command -v npm >/dev/null 2>&1 || error "npm is not installed"
    command -v git >/dev/null 2>&1 || error "Git is not installed"
    
    # Check if Docker is running
    docker info >/dev/null 2>&1 || error "Docker is not running"
    
    # Check if environment file exists
    if [ ! -f "$PROJECT_ROOT/.env.$ENVIRONMENT" ]; then
        error "Environment file .env.$ENVIRONMENT not found"
    fi
    
    log "Prerequisites check passed ✅"
}

# Backup current deployment
backup_current_deployment() {
    log "Creating backup of current deployment..."
    
    BACKUP_DIR="$PROJECT_ROOT/backups/$(date +'%Y%m%d_%H%M%S')"
    mkdir -p "$BACKUP_DIR"
    
    # Backup database
    if docker ps | grep -q allin-postgres-prod; then
        log "Backing up database..."
        docker exec allin-postgres-prod pg_dump -U allin_user allin_prod > "$BACKUP_DIR/database_backup.sql"
    fi
    
    # Backup uploaded files and logs
    if [ -d "$PROJECT_ROOT/uploads" ]; then
        cp -r "$PROJECT_ROOT/uploads" "$BACKUP_DIR/"
    fi
    
    if [ -d "$PROJECT_ROOT/logs" ]; then
        cp -r "$PROJECT_ROOT/logs" "$BACKUP_DIR/"
    fi
    
    log "Backup created at $BACKUP_DIR ✅"
}

# Run security checks
run_security_checks() {
    log "Running security checks..."
    
    cd "$PROJECT_ROOT"
    
    # Check for vulnerabilities
    info "Checking for npm vulnerabilities..."
    npm audit --audit-level high || warn "Vulnerabilities found - review before continuing"
    
    # Check for secrets in code
    info "Scanning for potential secrets..."
    if command -v grep >/dev/null 2>&1; then
        grep -r "password\|secret\|key" --include="*.ts" --include="*.js" . | grep -v node_modules | grep -v ".git" || true
    fi
    
    log "Security checks completed ✅"
}

# Run comprehensive tests
run_tests() {
    if [ "$SKIP_TESTS" = "true" ]; then
        warn "Skipping tests (SKIP_TESTS=true)"
        return
    fi
    
    log "Running comprehensive test suite..."
    
    cd "$PROJECT_ROOT"
    
    # Install dependencies
    info "Installing dependencies..."
    npm ci
    
    # Run linting
    info "Running linting..."
    npm run lint
    
    # Run type checking
    info "Running type checking..."
    npm run type-check
    
    # Run unit tests with coverage
    info "Running unit tests..."
    npm run test:coverage
    
    # Verify coverage threshold
    info "Checking coverage threshold..."
    COVERAGE=$(node -p "
        const fs = require('fs');
        if (fs.existsSync('coverage/coverage-summary.json')) {
            const coverage = JSON.parse(fs.readFileSync('coverage/coverage-summary.json'));
            Math.min(
                coverage.total.lines.pct,
                coverage.total.branches.pct,
                coverage.total.functions.pct,
                coverage.total.statements.pct
            );
        } else {
            0;
        }
    ")
    
    if (( $(echo "$COVERAGE < 80" | bc -l) )); then
        error "Test coverage ($COVERAGE%) is below 80% threshold"
    fi
    
    # Run integration tests
    info "Running integration tests..."
    npm run test:integration
    
    log "All tests passed ✅"
}

# Build production images
build_production_images() {
    log "Building production Docker images..."
    
    cd "$PROJECT_ROOT"
    
    # Build backend image
    info "Building backend image..."
    docker build -f backend/Dockerfile.prod -t allin-backend:latest ./backend
    
    # Build frontend image
    info "Building frontend image..."
    docker build -f frontend/Dockerfile.prod -t allin-frontend:latest ./frontend \
        --build-arg NEXT_PUBLIC_API_URL="$NEXT_PUBLIC_API_URL"
    
    log "Production images built successfully ✅"
}

# Database migration and setup
setup_database() {
    log "Setting up database..."
    
    cd "$PROJECT_ROOT"
    
    # Start database if not running
    if ! docker ps | grep -q allin-postgres-prod; then
        info "Starting database container..."
        docker-compose -f docker-compose.prod.yml up -d postgres
        sleep 10
    fi
    
    # Run migrations
    info "Running database migrations..."
    cd backend
    npm run migrate:deploy
    
    # Seed master accounts if needed
    info "Seeding master accounts..."
    npm run seed
    
    log "Database setup completed ✅"
}

# Deploy application stack
deploy_application() {
    log "Deploying application stack..."
    
    cd "$PROJECT_ROOT"
    
    # Copy environment file
    cp ".env.$ENVIRONMENT" .env
    
    # Stop existing containers gracefully
    info "Stopping existing containers..."
    docker-compose -f docker-compose.prod.yml down --timeout 30
    
    # Start the full stack
    info "Starting production stack..."
    docker-compose -f docker-compose.prod.yml up -d
    
    # Wait for services to be ready
    info "Waiting for services to start..."
    sleep 30
    
    log "Application deployed ✅"
}

# Health checks and validation
run_health_checks() {
    log "Running health checks..."
    
    local max_attempts=30
    local attempt=1
    
    # Check backend health
    info "Checking backend health..."
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost:5000/health >/dev/null 2>&1; then
            log "Backend is healthy ✅"
            break
        fi
        
        info "Attempt $attempt/$max_attempts - Backend not ready, waiting..."
        sleep 10
        ((attempt++))
    done
    
    if [ $attempt -gt $max_attempts ]; then
        error "Backend failed health check after $max_attempts attempts"
    fi
    
    # Check frontend health
    info "Checking frontend health..."
    attempt=1
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost:3000 >/dev/null 2>&1; then
            log "Frontend is healthy ✅"
            break
        fi
        
        info "Attempt $attempt/$max_attempts - Frontend not ready, waiting..."
        sleep 10
        ((attempt++))
    done
    
    if [ $attempt -gt $max_attempts ]; then
        error "Frontend failed health check after $max_attempts attempts"
    fi
    
    # Check database connectivity
    info "Checking database connectivity..."
    if docker exec allin-postgres-prod pg_isready -U allin_user >/dev/null 2>&1; then
        log "Database is healthy ✅"
    else
        error "Database health check failed"
    fi
    
    # Check Redis connectivity
    info "Checking Redis connectivity..."
    if docker exec allin-redis-prod redis-cli ping >/dev/null 2>&1; then
        log "Redis is healthy ✅"
    else
        error "Redis health check failed"
    fi
    
    log "All health checks passed ✅"
}

# Run smoke tests
run_smoke_tests() {
    log "Running smoke tests..."
    
    cd "$PROJECT_ROOT"
    
    # Test authentication with master accounts
    info "Testing authentication..."
    response=$(curl -s -X POST http://localhost:5000/api/auth/login \
        -H "Content-Type: application/json" \
        -d '{"email":"admin@allin.demo","password":"Admin123!@#"}')
    
    if echo "$response" | grep -q "token"; then
        log "Authentication test passed ✅"
    else
        error "Authentication test failed"
    fi
    
    # Test main dashboard endpoint
    info "Testing dashboard endpoint..."
    token=$(echo "$response" | jq -r '.token')
    dashboard_response=$(curl -s -H "Authorization: Bearer $token" http://localhost:5000/api/dashboard/overview)
    
    if [ "$(echo "$dashboard_response" | jq -r '.success')" = "true" ]; then
        log "Dashboard test passed ✅"
    else
        error "Dashboard test failed"
    fi
    
    log "Smoke tests completed ✅"
}

# Setup monitoring
setup_monitoring() {
    log "Setting up monitoring stack..."
    
    cd "$PROJECT_ROOT"
    
    # Start monitoring services
    info "Starting monitoring services..."
    docker-compose -f monitoring/docker-compose.monitoring.yml up -d
    
    # Wait for services
    sleep 20
    
    # Check monitoring health
    if curl -f http://localhost:9090/-/healthy >/dev/null 2>&1; then
        log "Prometheus is healthy ✅"
    else
        warn "Prometheus health check failed"
    fi
    
    if curl -f http://localhost:3000/api/health >/dev/null 2>&1; then
        log "Grafana is healthy ✅"
    else
        warn "Grafana health check failed"
    fi
    
    log "Monitoring setup completed ✅"
}

# Performance validation
run_performance_tests() {
    log "Running performance validation..."
    
    if command -v k6 >/dev/null 2>&1; then
        info "Running load tests with k6..."
        cd "$PROJECT_ROOT"
        k6 run performance/load-test.js --duration 2m --vus 10
        log "Performance tests completed ✅"
    else
        warn "k6 not installed - skipping performance tests"
    fi
}

# Generate deployment report
generate_deployment_report() {
    log "Generating deployment report..."
    
    local report_file="$PROJECT_ROOT/deployment-report-$(date +'%Y%m%d_%H%M%S').txt"
    
    cat > "$report_file" << EOF
==============================================
AllIN Platform - Production Deployment Report
==============================================

Deployment Date: $(date)
Environment: $ENVIRONMENT
Git Commit: $(git rev-parse HEAD)
Git Branch: $(git branch --show-current)

== Service Status ==
Backend: $(curl -s http://localhost:5000/health | jq -r '.status' 2>/dev/null || echo "Unknown")
Frontend: $(curl -s http://localhost:3000 >/dev/null 2>&1 && echo "Running" || echo "Down")
Database: $(docker exec allin-postgres-prod pg_isready -U allin_user >/dev/null 2>&1 && echo "Running" || echo "Down")
Redis: $(docker exec allin-redis-prod redis-cli ping 2>/dev/null || echo "Down")

== Container Status ==
$(docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}")

== Resource Usage ==
$(docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}")

== Test Coverage ==
$(node -p "
    const fs = require('fs');
    if (fs.existsSync('coverage/coverage-summary.json')) {
        const coverage = JSON.parse(fs.readFileSync('coverage/coverage-summary.json'));
        'Lines: ' + coverage.total.lines.pct + '%' + '\\n' +
        'Branches: ' + coverage.total.branches.pct + '%' + '\\n' +
        'Functions: ' + coverage.total.functions.pct + '%' + '\\n' +
        'Statements: ' + coverage.total.statements.pct + '%';
    } else {
        'Coverage data not available';
    }
" 2>/dev/null)

== URLs ==
Frontend: http://localhost:3000
Backend: http://localhost:5000
Prometheus: http://localhost:9090
Grafana: http://localhost:3000 (monitoring)

== Master Test Credentials ==
Admin: admin@allin.demo / Admin123!@#
Agency: agency@allin.demo / Agency123!@#
Manager: manager@allin.demo / Manager123!@#
Creator: creator@allin.demo / Creator123!@#
Client: client@allin.demo / Client123!@#
Team: team@allin.demo / Team123!@#

Deployment completed successfully!
EOF

    log "Deployment report generated: $report_file ✅"
    info "Review the report for post-deployment information"
}

# Main deployment workflow
main() {
    log "Starting AllIN Platform production deployment..."
    log "Environment: $ENVIRONMENT"
    log "Skip Tests: $SKIP_TESTS"
    
    # Pre-deployment checks
    check_prerequisites
    run_security_checks
    
    # Backup and testing
    backup_current_deployment
    run_tests
    
    # Build and deploy
    build_production_images
    setup_database
    deploy_application
    
    # Validation
    run_health_checks
    run_smoke_tests
    
    # Monitoring and performance
    setup_monitoring
    run_performance_tests
    
    # Final steps
    generate_deployment_report
    
    log "🎉 Production deployment completed successfully!"
    log "Access your application at: http://localhost:3000"
    log "Monitor your application at: http://localhost:9090 (Prometheus)"
    log "View dashboards at: http://localhost:3000 (Grafana)"
    
    info "Don't forget to:"
    info "1. Update DNS records if needed"
    info "2. Configure SSL certificates"
    info "3. Set up backup schedules"
    info "4. Review monitoring alerts"
    info "5. Update documentation"
}

# Error handling
trap 'error "Deployment failed at line $LINENO"' ERR

# Run main function
main "$@"