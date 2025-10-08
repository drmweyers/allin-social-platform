# AllIN Platform - Port Reference

**IMPORTANT**: These ports are standardized for the AllIN Social Media Management Platform to avoid conflicts with other applications in `C:\Users\drmwe\Claude\`.

## Port Assignments (7000-7099 Range)

### Application Ports
- **Backend API**: `7000`
  - URL: http://localhost:7000
  - Health Check: http://localhost:7000/health
  - API Docs: http://localhost:7000/api-docs

- **Frontend**: `7001`
  - URL: http://localhost:7001
  - Login Page: http://localhost:7001/auth/login

### Infrastructure Ports
- **PostgreSQL (with pgvector)**: `7432`
  - Connection: localhost:7432
  - Database: allin
  - User: postgres
  - Password: postgres

- **Redis**: `7379`
  - Connection: localhost:7379

- **Mailhog (Email Testing)**:
  - SMTP Server: `1025` (unchanged)
  - Web UI: `8025` (unchanged)
  - URL: http://localhost:8025

- **pgAdmin (Database Management)**: `5050` (unchanged)
  - URL: http://localhost:5050
  - Email: admin@allin.com
  - Password: admin

## Docker Commands

### Start All Services
```bash
cd "C:\Users\drmwe\Claude\social Media App\allin-platform"
docker-compose --profile dev up -d
```

### Stop All Services
```bash
docker-compose --profile dev down
```

### View Logs
```bash
docker-compose logs -f backend-dev
docker-compose logs -f frontend-dev
```

## Environment Variables

The following environment variables must be set in the root `.env` file:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:7432/allin?schema=public

# Redis
REDIS_URL=redis://localhost:7379

# API
API_PORT=7000
FRONTEND_URL=http://localhost:7001
```

## Master Test Credentials

These credentials are permanent and should NEVER be changed:

- **Admin**: `admin@allin.demo` / `AdminPass123`
- **Agency**: `agency@allin.demo` / `AgencyPass123`
- **Manager**: `manager@allin.demo` / `ManagerPass123`
- **Creator**: `creator@allin.demo` / `CreatorPass123`
- **Client**: `client@allin.demo` / `ClientPass123`
- **Team**: `team@allin.demo` / `TeamPass123`

---

**Last Updated**: 2025-10-07
**Port Range Reserved**: 7000-7099
