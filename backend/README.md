# Auth Backend (NestJS)

A standalone authentication service built with **NestJS** and **Better Auth**.

## Features

- 🔐 **Better Auth Integration** - Full-featured authentication with email/password, social providers, 2FA
- 🏢 **Organization Management** - Multi-tenant support with roles and permissions
- 📧 **Email Queue** - BullMQ-powered email processing with Redis
- 📝 **Audit Logging** - Comprehensive security event tracking
- 🔒 **Rate Limiting** - Built-in protection against brute force attacks
- 📱 **Mobile Support** - Expo mobile app integration with @better-auth/expo
- 🐳 **Docker Ready** - Multi-stage Dockerfile with development and production targets

## Tech Stack

- **Framework**: NestJS 10
- **Authentication**: Better Auth with @thallesp/nestjs-better-auth
- **Database**: PostgreSQL with Prisma ORM
- **Queue**: BullMQ with Redis
- **Logging**: Winston with daily rotation

## Project Structure

\`\`\`
src/
├── main.ts                      # NestJS bootstrap
├── app.module.ts                # Root module
├── auth/
│   └── auth.config.ts           # Better Auth configuration
├── audit/
│   ├── audit.module.ts
│   ├── audit.service.ts
│   ├── audit.controller.ts
│   └── audit.middleware.ts
├── email-queue/
│   ├── email-queue.module.ts
│   └── email-queue.service.ts
├── health/
│   ├── health.module.ts
│   └── health.controller.ts
├── common/
│   ├── logger.service.ts
│   ├── mobile-auth.middleware.ts
│   └── request-context.middleware.ts
└── prisma/
    └── schema.prisma
\`\`\`

## Quick Start

### Development (Docker)

\`\`\`bash
# Start all services
docker compose up

# Or rebuild
docker compose up --build
\`\`\`

### Development (Local)

\`\`\`bash
# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run db:migrate

# Start development server
npm run start:dev
\`\`\`

### Production

\`\`\`bash
# Build
npm run build

# Start
npm run start:prod
\`\`\`

## Environment Variables

Copy \`.env.example\` to \`.env\` and configure:

\`\`\`env
# Required
BETTER_AUTH_SECRET=your-32-char-secret
DATABASE_URL=postgresql://user:pass@localhost:5432/auth

# Optional
REDIS_URL=redis://localhost:6379
N8N_WEBHOOK_URL=https://your-n8n/webhook/email
MOBILE_API_KEY=your-mobile-api-key
\`\`\`

## API Endpoints

### Authentication (via Better Auth)
- \`POST /api/auth/sign-up/email\` - Register with email
- \`POST /api/auth/sign-in/email\` - Login with email
- \`POST /api/auth/sign-out\` - Logout
- \`GET /api/auth/session\` - Get current session
- \`POST /api/auth/verify-otp\` - Verify OTP
- \`POST /api/auth/forgot-password\` - Request password reset

### Audit (Admin only)
- \`GET /api/audit/logs\` - Query audit logs
- \`GET /api/audit/logs/:id\` - Get specific log
- \`GET /api/audit/logs/user/:userId\` - Get user's logs
- \`GET /api/audit/logs/org/:orgId\` - Get organization's logs

### Health
- \`GET /health\` - Health check
- \`GET /ready\` - Readiness check
- \`GET /queue-stats\` - Email queue statistics

## Docker Commands

\`\`\`bash
# Development
npm run docker:up

# Production
npm run docker:prod

# View logs
npm run docker:logs

# Stop
npm run docker:down
\`\`\`

## License

MIT
