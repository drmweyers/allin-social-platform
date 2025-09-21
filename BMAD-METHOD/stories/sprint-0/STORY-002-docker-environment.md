# Story 002: Docker Environment Setup
**Sprint**: 0 - Infrastructure Setup
**Points**: 5
**Priority**: CRITICAL
**Type**: Infrastructure

## Story Description
As a developer, I need to set up a complete Docker environment with PostgreSQL, Redis, MailHog, and pgAdmin so that all developers have a consistent local development environment that mirrors production infrastructure.

## Acceptance Criteria
- [ ] Docker Compose configuration created with all required services
- [ ] PostgreSQL 16 running and accessible
- [ ] Redis 7 running for caching and queues
- [ ] MailHog configured for email testing
- [ ] pgAdmin available for database management
- [ ] All services start with single command
- [ ] Data persistence configured with volumes
- [ ] Health checks implemented for all services
- [ ] Documentation for Docker usage

## Technical Details

### Step 1: Create Docker Directory Structure
```bash
# From project root
mkdir -p docker/postgres/init
mkdir -p docker/redis
mkdir -p docker/nginx
```

### Step 2: Create Main Docker Compose File

#### File: `/docker/docker-compose.yml`
```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:16-alpine
    container_name: allin_postgres
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: allin_db
      POSTGRES_USER: allin_user
      POSTGRES_PASSWORD: allin_password
      PGDATA: /var/lib/postgresql/data/pgdata
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./postgres/init:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U allin_user -d allin_db"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - allin_network

  # Redis Cache & Queue
  redis:
    image: redis:7-alpine
    container_name: allin_redis
    restart: unless-stopped
    ports:
      - "6380:6379"
    command: redis-server --appendonly yes --requirepass allin_redis_password
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - allin_network

  # MailHog for Email Testing
  mailhog:
    image: mailhog/mailhog:latest
    container_name: allin_mailhog
    restart: unless-stopped
    ports:
      - "1025:1025"  # SMTP server
      - "8025:8025"  # Web UI
    networks:
      - allin_network

  # pgAdmin for Database Management
  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: allin_pgadmin
    restart: unless-stopped
    ports:
      - "5050:80"
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@allin.local
      PGADMIN_DEFAULT_PASSWORD: admin_password
      PGADMIN_CONFIG_SERVER_MODE: 'False'
      PGADMIN_CONFIG_MASTER_PASSWORD_REQUIRED: 'False'
    volumes:
      - pgadmin_data:/var/lib/pgadmin
    depends_on:
      - postgres
    networks:
      - allin_network

  # Redis Commander (Optional - Redis GUI)
  redis-commander:
    image: rediscommander/redis-commander:latest
    container_name: allin_redis_commander
    restart: unless-stopped
    environment:
      - REDIS_HOSTS=local:redis:6379:0:allin_redis_password
    ports:
      - "8081:8081"
    depends_on:
      - redis
    networks:
      - allin_network

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
  pgadmin_data:
    driver: local

networks:
  allin_network:
    driver: bridge
```

### Step 3: Create Development Docker Compose Override

#### File: `/docker/docker-compose.dev.yml`
```yaml
version: '3.8'

services:
  # Development-specific overrides
  postgres:
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: allin_dev
      POSTGRES_USER: dev_user
      POSTGRES_PASSWORD: dev_password

  # Development logging
  redis:
    command: redis-server --appendonly yes --loglevel debug

  # Additional dev tools
  adminer:
    image: adminer:latest
    container_name: allin_adminer
    restart: unless-stopped
    ports:
      - "8080:8080"
    depends_on:
      - postgres
    networks:
      - allin_network
```

### Step 4: Create PostgreSQL Initialization Script

#### File: `/docker/postgres/init/01-init.sql`
```sql
-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS content;
CREATE SCHEMA IF NOT EXISTS analytics;

-- Set default search path
ALTER DATABASE allin_db SET search_path TO public, auth, content, analytics;

-- Create enum types (these will be managed by Prisma, but good for reference)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('ADMIN', 'MANAGER', 'PUBLISHER', 'CONTRIBUTOR', 'VIEWER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE platform AS ENUM ('FACEBOOK', 'INSTAGRAM', 'TWITTER', 'LINKEDIN', 'TIKTOK', 'YOUTUBE', 'PINTEREST');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE post_status AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SCHEDULED', 'PUBLISHING', 'PUBLISHED', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE plan_type AS ENUM ('STARTER', 'PROFESSIONAL', 'TEAM', 'ENTERPRISE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create indexes for better performance (Prisma will handle most of these)
-- These are examples of what might be needed

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE allin_db TO allin_user;
GRANT ALL ON SCHEMA public TO allin_user;
GRANT ALL ON SCHEMA auth TO allin_user;
GRANT ALL ON SCHEMA content TO allin_user;
GRANT ALL ON SCHEMA analytics TO allin_user;

-- Create read-only user for analytics (optional)
CREATE USER allin_readonly WITH PASSWORD 'readonly_password';
GRANT CONNECT ON DATABASE allin_db TO allin_readonly;
GRANT USAGE ON SCHEMA public, analytics TO allin_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public, analytics TO allin_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public, analytics GRANT SELECT ON TABLES TO allin_readonly;
```

### Step 5: Create Docker Helper Scripts

#### File: `/docker/scripts/backup.sh`
```bash
#!/bin/bash
# Database backup script

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
DB_CONTAINER="allin_postgres"
DB_NAME="allin_db"
DB_USER="allin_user"

mkdir -p $BACKUP_DIR

echo "Starting backup of $DB_NAME..."
docker exec -t $DB_CONTAINER pg_dump -U $DB_USER -d $DB_NAME > "$BACKUP_DIR/backup_$TIMESTAMP.sql"

if [ $? -eq 0 ]; then
    echo "Backup completed: backup_$TIMESTAMP.sql"

    # Keep only last 7 days of backups
    find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
else
    echo "Backup failed!"
    exit 1
fi
```

#### File: `/docker/scripts/restore.sh`
```bash
#!/bin/bash
# Database restore script

if [ -z "$1" ]; then
    echo "Usage: ./restore.sh <backup_file>"
    exit 1
fi

BACKUP_FILE=$1
DB_CONTAINER="allin_postgres"
DB_NAME="allin_db"
DB_USER="allin_user"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "Warning: This will replace all data in $DB_NAME!"
read -p "Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

echo "Restoring database from $BACKUP_FILE..."
docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME < "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "Restore completed successfully!"
else
    echo "Restore failed!"
    exit 1
fi
```

### Step 6: Create Docker Environment File

#### File: `/docker/.env`
```env
# PostgreSQL
POSTGRES_DB=allin_db
POSTGRES_USER=allin_user
POSTGRES_PASSWORD=allin_password

# Redis
REDIS_PASSWORD=allin_redis_password

# pgAdmin
PGADMIN_DEFAULT_EMAIL=admin@allin.local
PGADMIN_DEFAULT_PASSWORD=admin_password

# Ports (change if conflicts exist)
POSTGRES_PORT=5432
REDIS_PORT=6380
MAILHOG_SMTP_PORT=1025
MAILHOG_UI_PORT=8025
PGADMIN_PORT=5050
```

### Step 7: Create Makefile for Easy Commands

#### File: `/docker/Makefile`
```makefile
.PHONY: up down restart logs ps clean backup restore

# Start all services
up:
	docker-compose up -d

# Stop all services
down:
	docker-compose down

# Restart all services
restart:
	docker-compose restart

# View logs
logs:
	docker-compose logs -f

# Show running containers
ps:
	docker-compose ps

# Clean up (remove containers and volumes)
clean:
	docker-compose down -v

# Backup database
backup:
	./scripts/backup.sh

# Restore database
restore:
	@read -p "Enter backup file path: " file; \
	./scripts/restore.sh $$file

# Enter PostgreSQL shell
psql:
	docker exec -it allin_postgres psql -U allin_user -d allin_db

# Enter Redis CLI
redis-cli:
	docker exec -it allin_redis redis-cli -a allin_redis_password

# Development environment
dev:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Production-like environment
prod:
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Step 8: Create Docker Ignore File

#### File: `/docker/.dockerignore`
```
# Ignore data directories
postgres/data/
redis/data/
pgadmin/data/

# Ignore backups
backups/

# Ignore logs
*.log

# Ignore temporary files
*.tmp
*.swp
.DS_Store
```

### Step 9: Update Root Package.json Scripts
```json
{
  "scripts": {
    "docker:up": "cd docker && docker-compose up -d",
    "docker:down": "cd docker && docker-compose down",
    "docker:restart": "cd docker && docker-compose restart",
    "docker:logs": "cd docker && docker-compose logs -f",
    "docker:clean": "cd docker && docker-compose down -v",
    "docker:ps": "cd docker && docker-compose ps",
    "db:backup": "cd docker && ./scripts/backup.sh",
    "db:restore": "cd docker && ./scripts/restore.sh",
    "db:shell": "docker exec -it allin_postgres psql -U allin_user -d allin_db",
    "redis:shell": "docker exec -it allin_redis redis-cli -a allin_redis_password"
  }
}
```

## Implementation Notes

1. **Security**: Default passwords are for development only - change in production
2. **Ports**: All services use non-standard ports to avoid conflicts
3. **Volumes**: Data persists between container restarts
4. **Networks**: All services on same network for inter-communication
5. **Health Checks**: Ensure services are ready before dependent services start

## Testing Instructions

1. **Start Services**:
```bash
npm run docker:up
```

2. **Verify All Services Running**:
```bash
npm run docker:ps
```

3. **Test PostgreSQL**:
```bash
npm run db:shell
# Then run: \l (list databases)
# Exit with: \q
```

4. **Test Redis**:
```bash
npm run redis:shell
# Then run: ping
# Should return: PONG
# Exit with: exit
```

5. **Test MailHog**:
- Open http://localhost:8025 in browser
- Should see MailHog UI

6. **Test pgAdmin**:
- Open http://localhost:5050 in browser
- Login with admin@allin.local / admin_password
- Add server with:
  - Host: postgres
  - Port: 5432
  - Username: allin_user
  - Password: allin_password

## Troubleshooting

1. **Port Conflicts**: Change ports in docker-compose.yml if needed
2. **Permission Issues**: Make scripts executable: `chmod +x docker/scripts/*.sh`
3. **Volume Issues**: Clean and restart: `npm run docker:clean && npm run docker:up`
4. **Network Issues**: Ensure Docker Desktop is running and has network access

## Dependencies
- Docker Desktop or Docker Engine
- Docker Compose v2+

## Blocking Issues
- Ensure Docker is installed and running before proceeding

## Next Steps
After completing this story, proceed to:
- STORY-003: Next.js application setup
- STORY-004: Express backend setup
- STORY-005: Prisma schema and database setup

## Time Estimate
- Docker setup: 30 minutes
- Configuration: 45 minutes
- Testing: 30 minutes
- Total: 1.75 hours

## Notes for Dev Agent
- Ensure all shell scripts have LF line endings
- Make backup/restore scripts executable
- Test each service individually before marking complete
- Document any port changes if conflicts occur