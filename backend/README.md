# Auth Backend (NestJS)

Authentication backend service built with NestJS and Better Auth.

## Features

- Email/Password authentication
- Social OAuth (Google, Microsoft)
- Email OTP verification
- Two-Factor Authentication (2FA)
- Admin panel features
- Organization management with roles and permissions
- Single organization model

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment template:
```bash
cp .env.example .env
```

3. Update `.env` with your configuration:
- Database connection string
- Better Auth secret (generate with `openssl rand -base64 32`)
- OAuth client IDs and secrets
- N8N webhook URL for email service

4. Generate Prisma client:
```bash
npm run db:generate
```

5. Run database migrations:
```bash
npm run db:migrate
```

6. Start the development server:
```bash
npm run start:dev
```

The server will run on `http://localhost:3000` by default.

## API Endpoints

- `/api/auth/*` - Better Auth endpoints (handled automatically)
- `/health` - Health check endpoint
- `/ready` - Readiness check endpoint (checks DB and mail service)

## Organization Model

This implementation uses a single organization model where:
- All users belong to one default organization
- Roles determine permissions: `owner`, `admin`, `member`
- Organization creation is restricted to admins only

## Database

Uses PostgreSQL with Prisma ORM. The schema includes:
- Better Auth core tables (User, Session, Account, Verification, TwoFactor)
- Organization plugin tables (Organization, Member, Invitation)

