# Daymark Backend

NestJS API for the Daymark personal productivity platform.

## Features

### Core Daymark API
- **Days** - Daily planning entity with priorities, discussions, time blocks
- **Priorities** - Top 3-5 daily goals with completion tracking
- **Time Blocks** - Schedule management (Deep Work, Meetings, Personal)
- **Quick Notes** - Daily scratchpad
- **Daily Review** - End-of-day reflection

### Productivity Tools
- **Eisenhower Matrix** - Task prioritization by urgency/importance
- **Decision Log** - Track decisions with context and outcomes

### Authentication (Better Auth)
- Email/Password with OTP verification
- Two-Factor Authentication (TOTP)
- OAuth (Google, Microsoft)
- Organization & member management
- Role-based access control (Owner, Admin, Manager, Member, Viewer)

### Security
- `helmet` - HTTP security headers
- `@nestjs/throttler` - Rate limiting (60 req/min)
- `compression` - Response compression

## Quick Start

### With Docker (Recommended)

```bash
# Start database and backend
docker-compose up -d

# Run migrations
docker-compose exec backend npx prisma migrate dev
```

### Manual Setup

```bash
# Install dependencies
npm install

# Configure environment
cp env.example .env
# Edit .env with your settings

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Start development server
npm run start:dev
```

**Server URL**: `http://localhost:3002`

## API Endpoints

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Application health |
| GET | `/health/ready` | Readiness check (DB + email) |

### Days & Planning
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/days/:date` | Get day with all data |
| GET | `/api/days/:date/progress` | Get completion progress |
| POST | `/api/days/:date/priorities` | Create priority |
| POST | `/api/days/:date/discussion-items` | Create discussion item |
| POST | `/api/days/:date/time-blocks` | Create time block |
| PUT | `/api/days/:date/quick-note` | Upsert quick note |
| PUT | `/api/days/:date/review` | Upsert daily review |
| POST | `/api/days/:date/review/carry-forward` | Carry forward incomplete priorities |

### Priorities
| Method | Endpoint | Description |
|--------|----------|-------------|
| PUT | `/api/priorities/:id` | Update priority |
| PATCH | `/api/priorities/:id/complete` | Toggle completion |
| DELETE | `/api/priorities/:id` | Delete priority |

### Eisenhower Matrix
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/eisenhower` | Get all tasks |
| POST | `/api/eisenhower` | Create task |
| PUT | `/api/eisenhower/:id` | Update task |
| DELETE | `/api/eisenhower/:id` | Delete task |
| POST | `/api/eisenhower/:id/promote` | Promote to priority |

### Decision Log
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/decisions` | Get all decisions |
| GET | `/api/decisions/:id` | Get single decision |
| POST | `/api/decisions` | Create decision |
| PUT | `/api/decisions/:id` | Update decision |
| DELETE | `/api/decisions/:id` | Delete decision |

### Settings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/settings` | Get user settings |
| PUT | `/api/settings` | Update user settings |

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://postgres:password@db:5432/auth_service
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password  # Use strong password in production!
POSTGRES_DB=auth_service

# Application
NODE_ENV=development
PORT=3002

# Auth (CRITICAL: generate with `openssl rand -base64 32`)
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=http://localhost:3002

# CORS (production: your domain only)
CORS_ORIGIN=http://localhost:3000

# Email Service
N8N_WEBHOOK_URL=https://your-n8n-instance/webhook/email

# OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## Database Schema

### Daymark Tables
- `day` - Core daily entity
- `top_priority` - Daily priorities
- `discussion_item` - Discussion topics
- `time_block` - Scheduled blocks
- `quick_note` - Daily notes
- `daily_review` - End-of-day reflection
- `user_settings` - User preferences
- `eisenhower_task` - Matrix tasks
- `decision_entry` - Decision log

### Auth Tables (Better Auth)
- `user`, `session`, `account`, `verification`, `twoFactor`
- `organization`, `member`, `invitation`

## Production Deployment

```bash
# Build and start with production Docker
docker-compose -f docker-compose.prod.yml up -d --build
```

See [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) for complete setup guide.

---

**Built with NestJS, Prisma, and Better Auth**
