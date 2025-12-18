#!/bin/sh

echo "Waiting for database connection and applying schema..."

max_tries=30
tries=0

# Wait for database to be ready
# Note: docker-compose healthcheck ensures DB is ready, but we wait a bit more for Prisma
echo "Waiting for database to be ready..."
sleep 2

# Verify database connection by attempting a simple Prisma operation
tries=0
while [ $tries -lt 10 ]; do
  # Try to introspect schema (lightweight operation)
  if echo "SELECT 1" | npx prisma db execute --stdin > /dev/null 2>&1 || npx prisma db pull --force > /dev/null 2>&1; then
    echo "✅ Database connection verified!"
    break
  fi
  tries=$((tries + 1))
  if [ $tries -lt 10 ]; then
    echo "Database connection attempt $tries/10... retrying in 1 second..."
    sleep 1
  fi
done

if [ $tries -eq 10 ]; then
  echo "⚠️  WARNING: Could not verify database connection, but proceeding..."
  echo "   (Database healthcheck passed, Prisma may need more time)"
fi

# Check for migrations
has_migrations=false
if [ -d "prisma/migrations" ] && [ "$(ls -A prisma/migrations 2>/dev/null)" ]; then
  has_migrations=true
  echo "Found Prisma migrations directory"
fi

# Apply schema
tries=0
if [ "$has_migrations" = true ]; then
  echo "Applying Prisma migrations (safe - preserves data)..."
  while [ $tries -lt $max_tries ]; do
    if npx prisma migrate deploy; then
      echo "✅ Migrations applied successfully!"
      break
    fi
    tries=$((tries + 1))
    echo "Migration attempt $tries/$max_tries failed. Retrying in 2 seconds..."
    sleep 2
  done
  
  if [ $tries -eq $max_tries ]; then
    echo "ERROR: Failed to apply migrations after $max_tries attempts"
    echo "⚠️  WARNING: Database may be in inconsistent state"
    exit 1
  fi
else
  echo "⚠️  WARNING: No migrations found. Using db push (development only)."
  echo "⚠️  For production, create migrations first: npm run db:migrate"
  
  # Only use db push in development, and without --accept-data-loss
  # This will fail if there are schema changes that would cause data loss
  tries=0
  while [ $tries -lt $max_tries ]; do
    if npx prisma db push; then
      echo "✅ Schema pushed successfully!"
      break
    fi
    tries=$((tries + 1))
    echo "Schema push attempt $tries/$max_tries failed. Retrying in 2 seconds..."
    sleep 2
  done
  
  if [ $tries -eq $max_tries ]; then
    echo "ERROR: Failed to push schema after $max_tries attempts"
    echo "⚠️  This may indicate schema conflicts. Create migrations instead."
    exit 1
  fi
fi

# Generate Prisma Client (in case it wasn't generated during build)
echo "Ensuring Prisma Client is up to date..."
npx prisma generate

echo "✅ Database is ready!"
echo "Starting application..."
exec "$@"

