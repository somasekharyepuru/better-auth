# Auth Service Backend - Docker Setup

Complete Docker setup for the auth service backend with all dependencies.

## Services

| Service | Internal Port | External Port | Purpose |
|---------|---------------|---------------|---------|
| **PostgreSQL** | 5432 | 5432 | Database |
| **Redis** | 6379 | 6379 | Email queue + caching |
| **Mailhog** | 1025, 8025 | 1025, 8025 | Email testing (dev) |
| **Backend** | 3000 | 3002 | Auth API |

## Quick Start

### 1. Setup Environment
```bash
cd auth-backend
cp .env.example .env
# Edit .env and set required values:
# - BETTER_AUTH_SECRET (32+ chars)
# - N8N_WEBHOOK_URL
```

### 2. Start Services
```bash
# Development (hot-reload)
npm run docker:dev

# Production (optimized)
npm run docker:prod

# Or using docker compose directly
docker compose up --build
```

### 3. View Logs
```bash
npm run docker:logs
```

### 4. Stop Services
```bash
npm run docker:down
```

## Access Points

| Service | URL | Notes |
|---------|-----|-------|
| Backend API | http://localhost:3002/api/auth | Auth endpoints |
| Mailhog UI | http://localhost:8025 | Email inbox |
| PostgreSQL | localhost:5432 | Direct DB access |
| Redis | localhost:6379 | Direct Redis access |

## Environment Variables

See `.env.example` for all available variables.

### Required for Production:
- `BETTER_AUTH_SECRET` - 32+ character random string
- `DATABASE_URL` - PostgreSQL connection
- `REDIS_URL` - Redis connection
- `N8N_WEBHOOK_URL` - Email webhook endpoint

### Optional:
- `MOBILE_API_KEY` - For mobile client CSRF bypass (32+ chars)
- `GOOGLE_CLIENT_ID/SECRET` - Google OAuth
- `MICROSOFT_CLIENT_ID/SECRET` - Microsoft OAuth

## Development vs Production

| Feature | Development | Production |
|---------|------------|-------------|
| **Source mounting** | ✅ Hot-reload | ❌ Built code only |
| **Mailhog** | ✅ Included | ⚠️ Use real email service |
| **Debug logs** | ✅ Enabled | ❌ Optimized |
| **Docker target** | `development` | `production` |

## Database Migrations

Migrations run automatically on startup. To run manually:

```bash
# Development
npm run db:migrate

# Production
npm run db:migrate:prod

# Push schema (dev only - no migrations)
npm run db:push
```

## Troubleshooting

### Backend won't start
```bash
# Check logs
docker compose logs backend

# Restart services
npm run docker:down
npm run docker:up
```

### Database connection issues
```bash
# Check database health
docker compose ps postgres

# View database logs
docker compose logs postgres
```

### Redis connection issues
```bash
# Check Redis health
docker compose ps redis

# Test Redis connection
docker compose exec redis redis-cli ping
```

### Reset everything
```bash
# Stop and remove all containers, volumes
npm run docker:down
docker compose down -v  # Removes volumes too!

# Then start fresh
npm run docker:up
```

## Production Deployment

1. Set `NODE_ENV=production` in `.env`
2. Set strong `BETTER_AUTH_SECRET`
3. Set real `N8N_WEBHOOK_URL` (or email service)
4. Run: `npm run docker:prod`

## Docker Commands

```bash
# Build and start
docker compose up --build

# Start in background
docker compose up -d

# View logs
docker compose logs -f

# Stop all services
docker compose down

# Stop and remove volumes
docker compose down -v

# Rebuild without cache
docker compose build --no-cache
```
