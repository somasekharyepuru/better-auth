-- Data Migration: Add default color to existing "Personal" life areas
-- This migration sets the default indigo color (#4F46E5) for all "Personal" 
-- life areas that don't have a color set.
--
-- This is a safe, idempotent migration:
-- - Only updates records where color IS NULL
-- - Only updates life areas named exactly 'Personal'
-- - Can be run multiple times without issues

UPDATE "life_area"
SET "color" = '#4F46E5',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "name" = 'Personal'
  AND "color" IS NULL;
