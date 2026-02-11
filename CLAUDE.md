# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Daymark is a personal productivity platform with three sub-projects in a monorepo:
- **backend/** - NestJS 11 REST API (PostgreSQL, Prisma, Better Auth, Redis/BullMQ)
- **frontend/** - Next.js 15 App Router (React 19, TailwindCSS 3, Better Auth client)
- **mobile/** - React Native via Expo 54 (early stage)

## Common Commands

### Backend (`cd backend`)
```bash
npm run start:dev          # Dev server with watch (port 3002)
npm run build              # Production build
npm run lint               # ESLint with auto-fix
npm run format             # Prettier
npm run test               # Jest unit tests
npm run test:watch         # Jest watch mode
npm run test:e2e           # E2E tests (test/jest-e2e.json config)
npm run db:migrate         # Prisma migrate dev
npm run db:migrate:deploy  # Deploy migrations (prod)
npm run db:generate        # Regenerate Prisma client after schema changes
npm run db:studio          # Prisma Studio GUI
npm run db:seed            # Seed database (ts-node prisma/seed.ts)
npm run ba:generate        # Generate Better Auth types
docker-compose up -d       # Start PostgreSQL + Redis (dev)
```

### Frontend (`cd frontend`)
```bash
npm run dev    # Dev server (port 3000)
npm run build  # Production build
npm run lint   # Next.js ESLint
```

### Running a single backend test
```bash
cd backend && npx jest --testPathPattern="path/to/file.spec.ts"
```

## Architecture

### Backend Structure

NestJS modular architecture. Each feature is a self-contained module in `src/`:

- **auth/** - Better Auth config (`auth.config.ts`), middleware, module. Auth handler is registered directly on Express in `main.ts` at `/api/auth` before NestJS routes.
- **calendar/** - Largest module. Google/Microsoft calendar sync with OAuth, webhook handlers, BullMQ job queues, rate limiting, conflict detection, and audit logging. Has its own `providers/`, `queue/`, `services/`, `webhook/`, `rate-limit/`, and `types/` subdirectories.
- **days/** - Core daily planning entity. A Day aggregates priorities, time blocks, discussion items, quick notes, and daily review.
- **priorities/** - Top 3-5 daily goals with carry-forward support.
- **time-blocks/** - Schedule management. Includes `focus-session.controller.ts` for Pomodoro-style sessions.
- **time-block-types/** - User-customizable block type categories.
- **eisenhower/** - Eisenhower Matrix (urgency/importance task management).
- **decision-log/** - Decision tracking with focus session linking.
- **organization/** - Multi-tenant organization support with RBAC (Owner/Admin/Manager/Member/Viewer).
- **settings/** - User preferences including Pomodoro durations and calendar settings.
- **prisma/** - Prisma service module.
- **config/** - NestJS ConfigModule setup.
- **health/** - Health check endpoints (`/health`, `/health/ready`).
- **mail/** - Email via N8N webhook integration.

Key patterns:
- `bodyParser: false` in `main.ts` is required for Better Auth
- CORS middleware is manually applied before Better Auth handler, then NestJS CORS for remaining routes
- Global `ValidationPipe` with whitelist, transform, and forbidNonWhitelisted
- Rate limiting via `@nestjs/throttler` (60 req/min)
- Helmet security headers in production only

### Database

PostgreSQL with Prisma ORM. Schema at `backend/prisma/schema.prisma` (~29 models).

Better Auth manages its own tables: `user`, `session`, `account`, `verification`, `twoFactor`, `organization`, `member`, `invitation`.

Application tables: `Day`, `TopPriority`, `DiscussionItem`, `TimeBlock`, `TimeBlockType`, `QuickNote`, `DailyReview`, `FocusSession`, `UserSettings`, `EisenhowerTask`, `DecisionEntry`, `LifeArea`, `CalendarConnection`, `CalendarToken`, `CalendarSource`, `EventMapping`, `CalendarConflict`, `SyncAuditLog`.

After changing `schema.prisma`, run `npm run db:migrate` then `npm run db:generate`.

### Frontend Structure

Next.js 15 App Router with route groups:

- **app/(dashboard)/** - Protected routes (dashboard, calendar, settings, profile, tools, organizations). Layout includes sidebar and header with auth guard.
- **app/login/, signup/, verify-email/, verify-2fa/** - Auth pages.
- **app/api/auth/[...auth_slug]/route.ts** - Proxies auth requests to backend.

Key libraries:
- **lib/daymark-api.ts** - Centralized API client with all endpoint functions and TypeScript types. This is the single interface to the backend.
- **lib/focus-context.tsx** - Global focus timer state (React Context). Single source of truth for Pomodoro timer. Persists to localStorage (`daymark_focus_state`) and syncs sessions to backend.
- **lib/auth-client.ts** - Better Auth client instance.
- **lib/settings-context.tsx** - User settings state and persistence.
- **lib/life-areas-context.tsx** - Life area categorization state.
- **lib/time-block-types-context.tsx** - Custom time block types state.

State management uses React Context API (not Redux). Four main contexts: Focus, Settings, LifeAreas, TimeBlockTypes.

UI components in `components/ui/` are hand-rolled (not shadcn). Feature components organized by domain: `components/daymark/`, `components/calendar/`, `components/focus/`, `components/dashboard/`.

### Authentication

Better Auth with email/password, OTP verification, TOTP 2FA, and OAuth (Google, Microsoft). Organization system with 5-role RBAC. Calendar sync uses separate OAuth credentials from auth OAuth (different client IDs for `GOOGLE_CLIENT_ID` vs `GOOGLE_CALENDAR_CLIENT_ID`).

### Calendar Sync

Webhook-based sync with Google and Microsoft calendars. Uses BullMQ queues for async processing. Calendar tokens are encrypted with `CALENDAR_TOKEN_SECRET`. Cross-calendar conflict detection prevents blocking loops.

## Environment

Backend `.env` requires: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `CORS_ORIGIN`, `FRONTEND_URL`, `REDIS_HOST`, `REDIS_PORT`, `N8N_WEBHOOK_URL`. OAuth vars for Google/Microsoft (both auth and calendar-specific).

Frontend `.env` requires: `NEXT_PUBLIC_AUTH_URL` (points to backend, e.g., `http://localhost:3002`).

## Deployment

- Backend: Docker (`docker-compose.yml` for dev, `docker-compose.prod.yml` for production)
- Frontend: Netlify with `@netlify/plugin-nextjs` (config in `netlify.toml`, uses pnpm)
