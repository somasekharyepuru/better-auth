# Daymark - Project Overview

## Purpose
Personal productivity platform (Daymark) - monorepo with 3 sub-projects.

## Tech Stack
- **Backend**: NestJS 11, PostgreSQL, Prisma ORM, Better Auth, Redis/BullMQ, TypeScript
- **Frontend**: Next.js 15 (App Router), React 19, TailwindCSS 3, Better Auth client, TypeScript
- **Mobile**: React Native / Expo 54 (early stage)

## Monorepo Structure
```
dev/
├── backend/          # NestJS REST API (port 3002)
│   ├── src/
│   │   ├── auth/           # Better Auth config
│   │   ├── calendar/       # Google/Microsoft calendar sync (largest module)
│   │   ├── days/           # Core daily planning entity
│   │   ├── priorities/     # Daily goals with carry-forward
│   │   ├── time-blocks/    # Schedule management + Pomodoro
│   │   ├── time-block-types/ # Custom block categories
│   │   ├── eisenhower/     # Eisenhower Matrix tasks
│   │   ├── decision-log/   # Decision tracking
│   │   ├── organization/   # Multi-tenant RBAC
│   │   ├── settings/       # User preferences
│   │   ├── focus-suite/    # Focus session features
│   │   ├── quick-notes/    # Quick notes
│   │   ├── daily-review/   # Daily review
│   │   ├── discussion-items/ # Discussion items
│   │   ├── life-areas/     # Life area categorization
│   │   ├── prisma/         # Prisma service
│   │   ├── config/         # NestJS config
│   │   ├── health/         # Health checks
│   │   └── mail/           # Email via N8N
│   └── prisma/schema.prisma  # ~29 models
├── frontend/         # Next.js App Router (port 3000)
│   ├── app/
│   │   ├── (dashboard)/    # Protected routes (sidebar layout)
│   │   ├── login/signup/verify-*/  # Auth pages
│   │   └── api/auth/       # Auth proxy to backend
│   ├── components/         # UI & feature components
│   ├── lib/               # API client, contexts, auth
│   └── types/             # TypeScript types
└── mobile/           # Expo app (early stage)
```

## Key Architecture Notes
- Auth: Better Auth with email/password, OTP, TOTP 2FA, OAuth (Google, Microsoft)
- Calendar sync: Webhook-based with BullMQ queues, separate OAuth credentials
- State: React Context API (Focus, Settings, LifeAreas, TimeBlockTypes)
- UI: Hand-rolled components (not shadcn)
- `bodyParser: false` in main.ts required for Better Auth
- Frontend uses pnpm, backend uses npm
