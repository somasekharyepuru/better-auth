# Docker Setup for Auth Backend

## Quick Start with Docker

### 1. Create Environment File

```bash
cd auth-backend
cp env.example .env
```

### 2. Edit .env File

**Minimum required variables:**
```env
BETTER_AUTH_SECRET=<generate-with-openssl-rand-base64-32>
```

**Optional variables:**
```env
N8N_WEBHOOK_URL=<your-webhook-url>
GOOGLE_CLIENT_ID=<optional>
GOOGLE_CLIENT_SECRET=<optional>
MICROSOFT_CLIENT_ID=<optional>
MICROSOFT_CLIENT_SECRET=<optional>
FRONTEND_URL=http://localhost:3001
```

**Note:** `DATABASE_URL` is automatically set in docker-compose.yml to connect to the database container.

### 3. Generate Secret Key

```bash
openssl rand -base64 32
```

Copy the output to `BETTER_AUTH_SECRET` in `.env`.

### 4. Start Everything

```bash
docker-compose up -d
```

This will:
- Start PostgreSQL database
- Build and start the NestJS backend
- Run database migrations automatically
- Expose backend on port 3000

### 5. View Logs

```bash
# All services
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Database only
docker-compose logs -f db
```

## Common Commands

### Start Services
```bash
docker-compose up -d
```

### Stop Services
```bash
docker-compose down
```

### Stop and Remove Volumes (⚠️ Deletes Database)
```bash
docker-compose down -v
```

### Rebuild After Code Changes
```bash
docker-compose up -d --build
```

### Run Database Migrations Manually
```bash
docker-compose exec backend npm run db:migrate
```

### Access Database
```bash
# Using psql
docker-compose exec db psql -U postgres -d auth_service

# Or connect from host
psql -h localhost -p 5432 -U postgres -d auth_service
```

### Run Prisma Studio
```bash
docker-compose exec backend npm run db:studio
# Then open http://localhost:5555 in your browser
```

### View Backend Logs
```bash
docker-compose logs -f backend
```

## Development Workflow

### Hot Reload
The backend runs with `npm run start:dev` which enables hot reload. Code changes are automatically reflected.

### Database Migrations

### First Time Setup
**IMPORTANT**: Create initial migration before starting:

```bash
# From host (recommended)
cd auth-backend
npm install
npm run db:migrate

# Or in container after first start
docker-compose exec backend npm run db:migrate
```

### Automatic Migration Application
Migrations run automatically on container start via `wait-for-db.sh`:
- Uses `prisma migrate deploy` (safe, preserves data)
- Only applies new migrations
- Idempotent (safe to run multiple times)

### Creating New Migrations
When you change the Prisma schema:

```bash
docker-compose exec backend npm run db:migrate
```

This creates a new migration file that will be auto-applied on next restart.

**⚠️ See [DATA_SAFETY.md](./DATA_SAFETY.md) for important data protection information.**

### Prisma Client Generation
If you modify the Prisma schema:

```bash
docker-compose exec backend npm run db:generate
```

## Ports

- **Backend**: `http://localhost:3000`
- **Database**: `localhost:5432`
- **Prisma Studio**: `http://localhost:5555` (when running)

## Environment Variables

All environment variables from `.env` are loaded automatically. The `DATABASE_URL` is automatically configured to connect to the `db` service.

## Troubleshooting

### Backend won't start
```bash
# Check logs
docker-compose logs backend

# Rebuild
docker-compose up -d --build
```

### Database connection errors
```bash
# Check database is healthy
docker-compose ps

# Check database logs
docker-compose logs db
```

### Migration errors
```bash
# Reset database (⚠️ deletes all data)
docker-compose down -v
docker-compose up -d
```

### Port already in use
Edit `docker-compose.yml` to change ports:
```yaml
ports:
  - "3001:3000"  # Change 3001 to available port
```

### Clear everything and start fresh
```bash
docker-compose down -v
docker-compose up -d --build
```

## Production Build

For production, modify the Dockerfile CMD and use:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

(You'll need to create a production docker-compose file)

## Network

Services communicate via the `auth-network` bridge network. The backend connects to the database using the service name `db`.

