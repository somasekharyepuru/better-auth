# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Daymark is a personal productivity platform featuring daily planning, time blocking, and productivity tools. It consists of three main components:
- **Backend**: NestJS API with Better Auth authentication
- **Frontend**: Next.js 15 web application
- **Mobile**: React Native app (separate mobile/ directory)

## Architecture

### Backend Architecture (NestJS)
The backend uses a modular NestJS architecture with Better Auth for authentication:

**Core Modules**:
- `auth/` - Better Auth integration with custom middleware for session management
- `days/` - Daily planning entity (core Daymark feature)
- `priorities/`, `discussion-items/`, `time-blocks/`, `quick-notes/`, `daily-review/` - Daily planning components
- `calendar/` - Calendar sync (Google, Microsoft, CalDAV) with queue-based sync
- `eisenhower/`, `decision-log/` - Productivity tools
- `focus-suite/` - Pomodoro and focus features
- `life-areas/` - Context filters for organizing life domains
- `organization/` - Team and member management
- `settings/` - User preferences

**Key Technical Details**:
- Authentication is handled via `AuthMiddleware` which extracts `userId` from Better Auth session cookies and attaches it to requests
- No decorators like `@UseGuards` - authentication is via middleware that sets `req.userId`
- Prisma ORM for PostgreSQL with migrations in `prisma/migrations/`
- BullMQ for background job processing (calendar sync, webhooks)
- Redis required for BullMQ queues
- Rate limiting: 60 req/min via `@nestjs/throttler`
- Security: Helmet, compression, CORS configured in `main.ts`

**Database Schema** (`prisma/schema.prisma`):
- Better Auth tables: `user`, `session`, `account`, `verification`, `twoFactor`, `organization`, `member`, `invitation`
- Daymark tables: `day`, `top_priority`, `discussion_item`, `time_block`, `quick_note`, `daily_review`, `life_area`, `eisenhower_task`, `decision_entry`, `user_settings`
- Calendar tables: `calendar_account`, `calendar_event`, `calendar_sync_log`

### Frontend Architecture (Next.js 15)
App Router with route groups for protected routes:

**Route Structure**:
- `app/(dashboard)/` - Protected routes requiring authentication
  - `dashboard/` - Main planning interface
  - `profile/` - User profile & 2FA
  - `settings/` - App settings
  - `tools/` - Pomodoro, Eisenhower Matrix, Decision Log
  - `organizations/` - Team management
- `app/login/`, `app/signup/` - Authentication flows
- `app/verify-email/`, `app/verify-2fa/` - Verification flows

**Key Files**:
- `lib/auth-client.ts` - Better Auth React client with plugins (emailOTP, organization, twoFactor)
- `lib/daymark-api.ts` - API client for backend communication
- `components/daymark/` - Dashboard components
- `components/calendar/` - Calendar integration UI
- `components/focus/` - Pomodoro and focus components

## Development Commands

### Backend Commands

```bash
# Development
cd backend
npm install                    # Install dependencies
npm run start:dev              # Start with hot reload (port 3002)
npm run start:debug            # Start with debugger

# Database
npm run db:generate            # Generate Prisma client
npm run db:migrate             # Create and run migrations (dev)
npm run db:migrate:deploy      # Run migrations (production)
npm run db:studio              # Open Prisma Studio GUI
npm run db:seed                # Seed database with test data

# Better Auth
npm run ba:generate            # Generate Better Auth types

# Build & Production
npm run build                  # Build for production
npm run start:prod             # Run production build
npm run lint                   # Run ESLint
npm run format                 # Format code with Prettier

# Testing
npm test                       # Run unit tests
npm run test:watch             # Run tests in watch mode
npm run test:cov               # Run tests with coverage
npm run test:e2e               # Run e2e tests

# Docker
docker-compose up -d           # Start dev environment (DB + backend)
docker-compose -f docker-compose.prod.yml up -d --build  # Production
docker-compose exec backend npx prisma migrate dev       # Run migrations in container
```

### Frontend Commands

```bash
# Development
cd frontend
npm install                    # Install dependencies
npm run dev                    # Start dev server (port 3000)

# Build & Production
npm run build                  # Build for production
npm run start                  # Run production build
npm run lint                   # Run Next.js linter
```

### Full Stack Development

Start both backend and frontend:
```bash
# Terminal 1 - Backend
cd backend && docker-compose up -d && npm run start:dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

## Testing

### Running Backend Tests
```bash
cd backend
npm test                       # All tests
npm test -- --testPathPattern=auth  # Specific module
npm run test:cov               # With coverage
```

### Calendar Sync Testing
The calendar module has extensive queue-based sync. To test:
```bash
# Check calendar sync logs
docker-compose logs -f backend | grep -i calendar

# Monitor BullMQ queues (if Bull Board is enabled)
# Navigate to http://localhost:3002/queues
```

## Important Patterns & Conventions

### Backend Patterns

**Authentication**:
- Extract userId from requests: `const userId = (req as any).userId`
- Better Auth sessions are stored in database with cookie-based tokens
- Session token format: `token.signature` (only `token` part is stored in DB)

**Database Access**:
- Always use Prisma via dependency injection: `constructor(private prisma: PrismaService)`
- Include related data with Prisma `include` option to avoid N+1 queries
- User-scoped queries must filter by `userId` to prevent data leakage

**Validation**:
- Use `class-validator` DTOs with `ValidationPipe`
- DTOs in `dto/` subdirectories for each module
- `whitelist: true` and `forbidNonWhitelisted: true` to prevent injection

**Error Handling**:
- Use NestJS built-in exceptions: `NotFoundException`, `BadRequestException`, etc.
- Structured logging with Pino logger

### Frontend Patterns

**Data Fetching**:
- Use `lib/daymark-api.ts` helper functions for API calls
- API calls include credentials for session cookies: `credentials: 'include'`
- Handle loading and error states explicitly

**Forms**:
- React Hook Form + Zod for validation
- Pattern: `const form = useForm<T>({ resolver: zodResolver(schema) })`

**Authentication State**:
- Better Auth hooks: `useSession()` returns `{ data: session, isPending, error }`
- Redirect to `/login` if not authenticated in protected routes

## Critical Environment Variables

### Backend (.env)
```bash
DATABASE_URL=postgresql://postgres:password@db:5432/auth_service
BETTER_AUTH_SECRET=<generate with: openssl rand -base64 32>
BETTER_AUTH_URL=http://localhost:3002
CORS_ORIGIN=http://localhost:3000
N8N_WEBHOOK_URL=<email service webhook>
REDIS_HOST=localhost
REDIS_PORT=6379

# OAuth (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
```

### Frontend (.env)
```bash
NEXT_PUBLIC_AUTH_URL=http://localhost:3002
```

## Common Development Workflows

### Adding a New API Endpoint
1. Create/update module in `backend/src/<module>/`
2. Define DTO in `<module>/dto/`
3. Add controller method with validation
4. Extract userId from request: `const userId = (req as any).userId`
5. Use Prisma service for database access
6. Update frontend API client in `frontend/lib/daymark-api.ts`

### Database Schema Changes
1. Edit `backend/prisma/schema.prisma`
2. Run `npm run db:migrate` (creates migration + applies)
3. Commit migration files in `prisma/migrations/`
4. Update DTOs and services to match new schema
5. Generate types: `npm run db:generate`

### Adding Calendar Provider
The calendar module supports Google, Microsoft, and CalDAV:
1. OAuth flow in `calendar/calendar-oauth.controller.ts`
2. Provider implementations in `calendar/providers/`
3. Sync logic in `calendar/services/calendar-sync.service.ts`
4. Background jobs in `calendar/queue/`
5. See `backend/calendar.md` for full PRD

## Production Considerations

Before deploying, review `backend/PRODUCTION_CHECKLIST.md`. Critical items:
- Generate secure `BETTER_AUTH_SECRET`
- Configure HTTPS for `BETTER_AUTH_URL`
- Restrict `CORS_ORIGIN` to production domain only
- Create database migrations
- Configure email service webhook (N8N)
- Set up Redis for BullMQ queues
- Enable security middleware (Helmet)

## Known Issues & Gotchas

1. **Better Auth Session Cookies**: The cookie format is `token.signature` but only the `token` part is stored in the database. See `auth.middleware.ts` for implementation.

2. **CORS Configuration**: Better Auth handler must be registered BEFORE NestJS CORS middleware. See `main.ts` lines 82-94.

3. **Calendar Sync**: Requires Redis for BullMQ queues. Calendar sync runs in background jobs, not synchronously.

4. **Organization Model**: Currently uses single organization per deployment. See `ORGANIZATION_SYSTEM.md`.

5. **Email Service**: Requires external N8N webhook for sending emails (OTP, invitations). The app will fail readiness checks if webhook is unreachable.

6. **Rate Limiting**: Global rate limit is 60 req/min. Adjust in `app.module.ts` if needed for specific endpoints.

## Documentation References

- `backend/working-api.md` - Complete API endpoint reference
- `backend/PRODUCTION_CHECKLIST.md` - Production deployment guide
- `backend/ORGANIZATION_SYSTEM.md` - Organization & RBAC details
- `backend/calendar.md` - Calendar integration PRD
- `backend/docs/CALENDAR_SYNC_SETUP.md` - Calendar setup guide
- `frontend/DESIGN_SYSTEM.md` - UI component patterns (if exists)
- `frontend/PROFILE_MANAGEMENT_GUIDE.md` - Profile & 2FA implementation
