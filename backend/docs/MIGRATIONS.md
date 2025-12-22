# Prisma Migrations Guide

This document explains how to work with database migrations in Daymark.

## 📁 Migration Structure

```
prisma/
├── schema.prisma           # Source of truth for database schema
└── migrations/
    ├── migration_lock.toml # Provider lock file
    └── YYYYMMDDHHMMSS_name/
        └── migration.sql   # SQL file for migration
```

## 🚀 Quick Reference

| Command | Purpose |
|---------|---------|
| `npm run db:migrate` | Run migrations in development |
| `npm run db:migrate:deploy` | Deploy migrations in production |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:studio` | Open Prisma Studio GUI |

---

## Adding New Schema Changes

### Step 1: Modify the Schema

Edit `prisma/schema.prisma` to add your new field, model, or change:

```prisma
model UserSettings {
  // ... existing fields
  
  // Add new field
  newFeatureEnabled Boolean @default(true)
}
```

### Step 2: Create the Migration

```bash
npm run db:migrate
```

Prisma will prompt you to name the migration. Use descriptive names like:
- `add_new_feature_setting`
- `add_life_area_table`
- `remove_deprecated_field`

This command:
1. Compares `schema.prisma` to current database
2. Generates SQL migration in `migrations/YYYYMMDDHHMMSS_name/migration.sql`
3. Applies the migration to your local database
4. Regenerates the Prisma client

### Step 3: Commit the Migration

```bash
git add prisma/migrations prisma/schema.prisma
git commit -m "feat: add newFeatureEnabled setting"
```

---

## Production Deployment

⚠️ **Always use `migrate deploy` in production, never `migrate dev`**

```bash
# Production (applies pending migrations, no prompts)
npm run db:migrate:deploy
```

The `deploy` command:
- Never prompts for input
- Never creates new migrations
- Only applies existing migrations that haven't been run yet
- Safe for CI/CD pipelines

---

## Common Scenarios

### Fresh Clone Setup

After cloning the repository:

```bash
cd backend
npm install
npm run db:generate    # Generate Prisma client
npm run db:migrate     # Apply all migrations
```

### Syncing with Latest Changes

If someone else added migrations:

```bash
git pull
npm run db:migrate
```

### Resetting Development Database

⚠️ **This destroys all data!**

```bash
npx prisma migrate reset
```

### Viewing Migration Status

```bash
npx prisma migrate status
```

---

## Migration Best Practices

### ✅ DO

1. **Small, focused migrations** - One change per migration
2. **Descriptive names** - `add_user_avatar` not `update1`
3. **Test locally first** - Always run `migrate dev` before pushing
4. **Include default values** - For new NOT NULL columns
5. **Commit migrations with schema** - They should always be in sync

### ❌ DON'T

1. **Never edit migration files** - After they've been applied/committed
2. **Never delete migrations** - That have been deployed to production
3. **Never use `migrate dev`** - In production
4. **Never commit orphan SQL files** - Only files in timestamped folders

---

## Handling Breaking Changes

For changes that require data transformation:

### Adding a Required Field

```prisma
// Option 1: Add with default value
newField String @default("default_value")

// Option 2: Add as optional first, then make required later
newField String?
```

### Renaming a Column

1. Add new column
2. Create data migration to copy data
3. Remove old column
4. Rename new column to old name

### Deleting a Table/Column

1. Remove code references first
2. Deploy code changes
3. Then create migration to remove schema

---

## Troubleshooting

### "Migration failed to apply cleanly"

```bash
# Check for drift
npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma

# Reset in development only
npx prisma migrate reset
```

### "Schema drift detected"

The database doesn't match the expected state. In development:

```bash
npx prisma migrate reset
```

### "Cannot apply migration"

Check if:
1. Migration order is correct (timestamps are chronological)
2. No circular dependencies
3. Referenced tables/columns exist

---

## Migration Naming Convention

Use lowercase with underscores:

| Change Type | Example Name |
|-------------|--------------|
| Add table | `add_comments_table` |
| Add column | `add_user_avatar` |
| Remove column | `remove_deprecated_flag` |
| Add index | `add_email_index` |
| Multiple changes | `add_notifications_feature` |

---

## Database provider lock

The `migration_lock.toml` file locks the database provider:

```toml
provider = "postgresql"
```

Never change this after initial setup unless switching databases entirely.
