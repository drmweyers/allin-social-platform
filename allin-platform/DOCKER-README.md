# AllIN Platform - Docker Infrastructure Guide

## Overview

The AllIN Social Media Management Platform uses Docker Compose for orchestrating multiple services across development, production, and monitoring environments.

## Service Architecture

### Core Services (Always Available)
- **PostgreSQL** (pgvector/pgvector:pg16) - Database with vector search support
- **Redis** (redis:7-alpine) - Caching and session store

### Development Profile (`dev`)
- **backend-dev** - Backend API with hot-reload
- **frontend-dev** - Next.js frontend with hot-reload
- **mailhog** - Email testing interface
- **pgadmin** - Database administration tool

### Production Profile (`prod`)
- **backend-prod** - Optimized backend API
- **frontend-prod** - Optimized Next.js frontend
- **nginx** - Reverse proxy with SSL/TLS support

### Monitoring Profile (`monitoring`)
- **prometheus** - Metrics collection
- **grafana** - Metrics visualization and dashboards
- **node-exporter** - System metrics
- **cadvisor** - Container metrics

## Quick Start Commands

### Development Environment

```bash
# Start core services + development stack
docker-compose --profile dev up -d

# View logs
docker-compose --profile dev logs -f

# Stop all services
docker-compose --profile dev down

# Rebuild and restart
docker-compose --profile dev up -d --build
```

### Production Environment

```bash
# Start core services + production stack
docker-compose --profile prod up -d

# View logs
docker-compose --profile prod logs -f

# Stop all services
docker-compose --profile prod down
```

### With Monitoring

```bash
# Development + Monitoring
docker-compose --profile dev --profile monitoring up -d

# Production + Monitoring
docker-compose --profile prod --profile monitoring up -d
```

### Database Management Tools

```bash
# Start just database tools (pgAdmin)
docker-compose --profile tools up -d postgres redis pgadmin

# Access pgAdmin at http://localhost:5050
# Email: admin@allin.com
# Password: admin
```

## Service Endpoints

### Development
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Docs**: http://localhost:5000/api-docs
- **MailHog UI**: http://localhost:8025
- **pgAdmin**: http://localhost:5050

### Production (via Nginx)
- **Application**: http://localhost (port 80)
- **API**: http://localhost/api
- **HTTPS**: https://localhost (port 443, requires SSL certificates)

### Monitoring
- **Grafana**: http://localhost:3001 (admin/admin)
- **Prometheus**: http://localhost:9090
- **cAdvisor**: http://localhost:8080
- **Node Exporter**: http://localhost:9100

### Database
- **PostgreSQL**: localhost:5433
  - User: postgres
  - Password: postgres
  - Database: allin

- **Redis**: localhost:6380

## Volume Management

### List Volumes
```bash
docker volume ls | grep allin
```

### Backup Database
```bash
# Create backup
docker exec allin-postgres pg_dump -U postgres allin > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
docker exec -i allin-postgres psql -U postgres allin < backup.sql
```

### Clean Up Volumes (WARNING: Deletes all data)
```bash
docker-compose down -v
```

## Resource Limits

All services have CPU and memory limits configured:

| Service | CPU Limit | Memory Limit |
|---------|-----------|--------------|
| PostgreSQL | 2 cores | 2GB |
| Redis | 1 core | 512MB |
| Backend (Dev) | 2 cores | 2GB |
| Backend (Prod) | 4 cores | 4GB |
| Frontend (Dev) | 2 cores | 2GB |
| Frontend (Prod) | 2 cores | 2GB |
| Nginx | 1 core | 512MB |
| Prometheus | 1 core | 1GB |
| Grafana | 1 core | 1GB |

## Health Checks

All services include health checks. View health status:

```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
```

Healthy services will show `(healthy)` in their status.

## Troubleshooting

### Services won't start
```bash
# Check logs
docker-compose logs [service-name]

# Check health
docker inspect allin-[service-name] | grep -A 10 Health
```

### Backend can't connect to database
```bash
# Ensure PostgreSQL is healthy
docker-compose ps postgres

# Check database logs
docker-compose logs postgres

# Verify connection from backend
docker exec allin-backend-dev nc -zv postgres 5432
```

### Port conflicts
If you see "port already in use" errors, change the port mappings in docker-compose.yml:

```yaml
ports:
  - "NEW_PORT:CONTAINER_PORT"
```

### Clear everything and start fresh
```bash
# Stop all services
docker-compose --profile dev --profile prod --profile monitoring down

# Remove all volumes (deletes data!)
docker-compose down -v

# Remove all containers
docker-compose rm -f

# Start fresh
docker-compose --profile dev up -d --build
```

## SSL/TLS Configuration (Production)

1. Place SSL certificates in `nginx/ssl/`:
   - `cert.pem` - SSL certificate
   - `key.pem` - Private key

2. Uncomment SSL server block in `nginx/nginx.conf`

3. Update server_name with your domain

4. Restart nginx:
   ```bash
   docker-compose restart nginx
   ```

## Monitoring Setup

### Accessing Grafana Dashboards

1. Navigate to http://localhost:3001
2. Login with admin/admin
3. Add Prometheus data source (already configured)
4. Import dashboards or create custom ones

### Key Metrics to Monitor

- **System Metrics** (node-exporter):
  - CPU usage
  - Memory usage
  - Disk I/O
  - Network traffic

- **Container Metrics** (cAdvisor):
  - Container CPU/memory
  - Container network
  - Container filesystem

- **Application Metrics** (Backend API):
  - Request rate
  - Response time
  - Error rate
  - Active connections

## Network Configuration

All services run on the `allin-network` bridge network with subnet `172.20.0.0/16`.

Service-to-service communication uses container names:
- Backend connects to `postgres:5432` and `redis:6379`
- Frontend connects to `backend-dev:5000` or `backend-prod:5000`
- Nginx proxies to `backend-prod:5000` and `frontend-prod:3000`

## Environment Variables

Key environment variables (set in `.env`):

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/allin?schema=public

# Redis
REDIS_URL=redis://redis:6379

# API Configuration
API_PORT=5000
FRONTEND_URL=http://localhost:3000

# Production API URL
NEXT_PUBLIC_API_URL=http://localhost/api
```

## Development Workflow

1. Start development environment:
   ```bash
   docker-compose --profile dev up -d
   ```

2. Code changes are automatically detected (hot-reload enabled)

3. View logs to debug:
   ```bash
   docker-compose logs -f backend-dev frontend-dev
   ```

4. Run tests:
   ```bash
   # Inside backend container
   docker exec -it allin-backend-dev npm test

   # Inside frontend container
   docker exec -it allin-frontend-dev npm test
   ```

5. Stop when done:
   ```bash
   docker-compose --profile dev down
   ```

## Production Deployment Checklist

- [ ] SSL certificates configured in `nginx/ssl/`
- [ ] Environment variables set in `.env`
- [ ] Database migrations run
- [ ] Static assets built
- [ ] Health checks passing
- [ ] Monitoring configured
- [ ] Backups scheduled
- [ ] Resource limits appropriate for load
- [ ] Security headers configured in Nginx
- [ ] Rate limiting configured

## Useful Commands

```bash
# View resource usage
docker stats

# Execute command in container
docker exec -it allin-backend-dev sh

# View container logs
docker logs -f allin-backend-dev

# Inspect container
docker inspect allin-backend-dev

# Prune unused resources
docker system prune -a

# Update images
docker-compose pull
docker-compose up -d --build

# Scale services (production)
docker-compose --profile prod up -d --scale backend-prod=3
```

## Support and Documentation

- Docker Compose docs: https://docs.docker.com/compose/
- PostgreSQL docs: https://www.postgresql.org/docs/
- Redis docs: https://redis.io/documentation
- Nginx docs: https://nginx.org/en/docs/
- Prometheus docs: https://prometheus.io/docs/
- Grafana docs: https://grafana.com/docs/
