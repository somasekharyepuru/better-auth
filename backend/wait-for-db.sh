#!/bin/sh

# =============================================================================
# DATABASE MIGRATION SCRIPT
# Industry-standard approach:
#   - Development (NODE_ENV=development): Auto-create and apply migrations
#   - Production (NODE_ENV=production): Only apply existing migrations (safe)
# =============================================================================

echo "🔄 Waiting for database connection and applying schema..."

max_tries=30
tries=0

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 2

# Verify database connection
tries=0
while [ $tries -lt 10 ]; do
  if echo "SELECT 1" | npx prisma db execute --stdin > /dev/null 2>&1; then
    echo "✅ Database connection verified!"
    break
  fi
  tries=$((tries + 1))
  if [ $tries -lt 10 ]; then
    echo "   Connection attempt $tries/10... retrying in 1 second..."
    sleep 1
  fi
done

if [ $tries -eq 10 ]; then
  echo "⚠️  WARNING: Could not verify database connection, but proceeding..."
fi

# Check environment
NODE_ENV=${NODE_ENV:-development}
echo "📍 Environment: $NODE_ENV"

# Check if migrations directory exists
has_migrations=false
if [ -d "prisma/migrations" ] && [ "$(ls -A prisma/migrations 2>/dev/null)" ]; then
  has_migrations=true
  migration_count=$(ls -d prisma/migrations/*/ 2>/dev/null | wc -l | tr -d ' ')
  echo "📁 Found $migration_count existing migration(s)"
fi

# =============================================================================
# MIGRATION STRATEGY
# =============================================================================

if [ "$NODE_ENV" = "production" ]; then
  # PRODUCTION: Only apply existing migrations (safe, never auto-creates)
  echo "🏭 Production mode: Applying existing migrations only..."
  
  if [ "$has_migrations" = true ]; then
    tries=0
    while [ $tries -lt $max_tries ]; do
      if npx prisma migrate deploy; then
        echo "✅ Migrations applied successfully!"
        break
      fi
      tries=$((tries + 1))
      echo "   Migration attempt $tries/$max_tries failed. Retrying in 2 seconds..."
      sleep 2
    done
    
    if [ $tries -eq $max_tries ]; then
      echo "❌ ERROR: Failed to apply migrations after $max_tries attempts"
      exit 1
    fi
  else
    echo "❌ ERROR: No migrations found in production mode!"
    echo "   Production requires committed migrations. Run 'prisma migrate dev' locally first."
    exit 1
  fi

else
  # DEVELOPMENT: Auto-create migrations if schema changed
  echo "🛠️  Development mode: Checking for schema changes..."
  
  # Check if schema is out of sync with database
  if npx prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-schema-datasource prisma/schema.prisma --exit-code > /dev/null 2>&1; then
    echo "✅ Schema is in sync with database"
    
    # Still apply any pending migrations
    if [ "$has_migrations" = true ]; then
      npx prisma migrate deploy 2>/dev/null || true
    fi
  else
    echo "🔄 Schema has changed, creating/applying migration..."
    
    # Generate timestamp for migration name
    timestamp=$(date +%Y%m%d%H%M%S)
    migration_name="auto_${timestamp}"
    
    tries=0
    while [ $tries -lt $max_tries ]; do
      # Use migrate dev with --name to auto-create and apply
      if npx prisma migrate dev --name "$migration_name" --skip-generate; then
        echo "✅ Migration created and applied: $migration_name"
        break
      fi
      tries=$((tries + 1))
      echo "   Migration attempt $tries/$max_tries failed. Retrying in 2 seconds..."
      sleep 2
    done
    
    if [ $tries -eq $max_tries ]; then
      echo "⚠️  WARNING: Auto-migration failed, falling back to db push..."
      npx prisma db push --accept-data-loss || {
        echo "❌ ERROR: Both migrate dev and db push failed"
        exit 1
      }
    fi
  fi
fi

# Generate Prisma Client
echo "🔧 Ensuring Prisma Client is up to date..."
npx prisma generate

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✅ Database is ready!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Starting application..."
exec "$@"


