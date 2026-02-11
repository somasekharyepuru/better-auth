# Task Completion Checklist

## After Code Changes
1. **Lint**: Run `npm run lint` in affected sub-project
2. **Format**: Run `npm run format` (backend only, frontend uses eslint)
3. **Test**: Run `npm run test` for affected modules
4. **Build**: Run `npm run build` to verify no compilation errors

## After Schema Changes (backend)
1. `npm run db:migrate` - Create migration
2. `npm run db:generate` - Regenerate Prisma client
3. Update related DTOs/services if needed

## After Auth Changes
1. `npm run ba:generate` - Regenerate Better Auth types

## Before Commit
1. Verify lint passes
2. Verify tests pass
3. Verify build succeeds
4. Check `git diff` for unintended changes
