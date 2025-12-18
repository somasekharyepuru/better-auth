# Data Safety & Migration Guide

## ⚠️ Important: Data Protection

This Docker setup is designed to **preserve your data**. Here's how it works:

## Database Persistence

✅ **Database data is persisted** in a Docker volume:
- Volume name: `postgres_data`
- Location: Docker-managed volume (persists even if container is removed)
- **Data survives**: Container restarts, rebuilds, and updates

## Migration Strategy

### Production Mode (Recommended)
Uses **Prisma Migrations** - Safe, preserves data:

1. **Create migrations** (before first deploy):
   ```bash
   docker-compose exec backend npm run db:migrate
   ```

2. **On container start**: Automatically runs `prisma migrate deploy`
   - ✅ Safe: Only applies new migrations
   - ✅ Preserves: All existing data
   - ✅ Idempotent: Safe to run multiple times

### Development Mode (Fallback)
If no migrations exist, uses `prisma db push`:
- ⚠️ **Warning**: Only for development
- ✅ **Safe**: Will fail if schema changes would cause data loss
- ❌ **No `--accept-data-loss`**: Removed to prevent accidental data loss

## Initial Setup

### First Time Setup

1. **Create initial migration** (outside Docker or in container):
   ```bash
   # Option 1: From host
   cd auth-backend
   npm run db:migrate
   
   # Option 2: In running container
   docker-compose exec backend npm run db:migrate
   ```

2. **Start Docker**:
   ```bash
   docker-compose up -d
   ```

3. **Migrations will auto-apply** on container start

### Subsequent Deployments

1. **Create new migration** (when schema changes):
   ```bash
   docker-compose exec backend npm run db:migrate
   ```

2. **Restart container**:
   ```bash
   docker-compose restart backend
   ```

3. **Migrations auto-apply** on startup

## Data Loss Prevention

### ✅ Safe Operations
- `prisma migrate deploy` - Only applies new migrations
- `prisma migrate dev` - Creates new migrations (development)
- Container restarts - Data persists in volume
- Rebuilds - Data persists in volume

### ⚠️ Dangerous Operations
- `docker-compose down -v` - **DELETES ALL DATA** (removes volume)
- `prisma migrate reset` - **DELETES ALL DATA** (drops database)
- `prisma db push --accept-data-loss` - **CAN CAUSE DATA LOSS**

### 🔒 Protected Operations
The following operations will **fail** if they would cause data loss:
- `prisma db push` (without --accept-data-loss flag)
- Schema changes that conflict with existing data

## Backup Strategy

### Manual Backup
```bash
# Backup database
docker-compose exec db pg_dump -U postgres auth_service > backup.sql

# Restore database
docker-compose exec -T db psql -U postgres auth_service < backup.sql
```

### Automated Backup (Recommended)
Set up a cron job or scheduled task to backup the database volume.

## Migration Files

Migration files are stored in `prisma/migrations/`:
- ✅ **Persisted**: Mounted as volume in docker-compose
- ✅ **Version controlled**: Should be committed to git
- ✅ **Safe**: Can be reviewed before applying

## Troubleshooting

### Migration Fails
If migrations fail:
1. Check logs: `docker-compose logs backend`
2. Check migration status: `docker-compose exec backend npx prisma migrate status`
3. Fix migration files if needed
4. Retry: `docker-compose restart backend`

### Schema Conflicts
If you get schema conflict errors:
1. Create a new migration: `docker-compose exec backend npm run db:migrate`
2. Review the migration file
3. Restart: `docker-compose restart backend`

### Data Loss Prevention
If you see warnings about potential data loss:
1. **STOP** - Don't proceed
2. Review the schema changes
3. Create a proper migration that handles data migration
4. Test in development first

## Best Practices

1. ✅ **Always create migrations** for schema changes
2. ✅ **Review migrations** before applying
3. ✅ **Test migrations** in development first
4. ✅ **Backup database** before major changes
5. ✅ **Use `migrate deploy`** in production
6. ❌ **Never use `--accept-data-loss`** in production
7. ❌ **Never use `db push`** in production

## Verification

Check that data is safe:
```bash
# Check database connection
docker-compose exec backend npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM \"user\";"

# Check migration status
docker-compose exec backend npx prisma migrate status

# View database
docker-compose exec backend npm run db:studio
```

