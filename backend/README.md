# Personal Productivity Backend (NestJS)

Personal productivity platform backend service built with NestJS and Better Auth.

## Features

- **Secure Authentication**
  - Email/Password authentication
  - Social OAuth (Google, Microsoft)
  - Email OTP verification
  - Two-Factor Authentication (2FA)

- **User Management**
  - User profiles and settings
  - Role-based access control
  - Secure session management

- **Productivity Platform Ready**
  - Extensible architecture for task management
  - Goal tracking system foundation
  - Analytics and reporting capabilities
  - Notification system integration

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

## User Management Model

This implementation uses a user-focused model where:

- Individual users manage their personal productivity data
- Role-based permissions for administrative functions
- Secure data isolation between users
- Extensible for team collaboration features

## Database

Uses PostgreSQL with Prisma ORM. The schema includes:

- Better Auth core tables (User, Session, Account, Verification, TwoFactor)
- User management tables (Organization, Member, Invitation)
- Extensible schema ready for productivity features (tasks, goals, analytics)
