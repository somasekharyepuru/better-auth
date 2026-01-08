# Calendar Sync System Setup Guide

Production-grade calendar synchronization supporting Google, Microsoft, and Apple calendars with bidirectional real-time sync.

---

## Quick Start

### One Command to Start Everything

```bash
cd backend
docker-compose up -d
```

This starts:
- **PostgreSQL** (port 5432)
- **Redis** (port 6379)
- **Backend** (port 3002) - waits for db & redis health checks

---

## Environment Variables

Add these to your `.env`:

```env
# Redis (for BullMQ queues & rate limiting)
REDIS_URL=redis://localhost:6379

# Calendar OAuth (separate from login OAuth - different scopes)
GOOGLE_CALENDAR_CLIENT_ID=your-google-calendar-client-id
GOOGLE_CALENDAR_CLIENT_SECRET=your-google-calendar-client-secret
MICROSOFT_CALENDAR_CLIENT_ID=your-microsoft-calendar-client-id
MICROSOFT_CALENDAR_CLIENT_SECRET=your-microsoft-calendar-client-secret

# Token encryption (generate with: openssl rand -hex 16)
CALENDAR_TOKEN_SECRET=your-32-character-secret-key-here

# Webhook URL (must be publicly accessible for Google/Microsoft)
WEBHOOK_BASE_URL=https://your-domain.com
```

---

## OAuth Provider Setup

### Google Calendar

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create project or select existing
3. Enable **Google Calendar API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure OAuth consent screen (External or Internal)
6. Application type: **Web application**
7. Add authorized redirect URIs:
   - `http://localhost:3000/api/calendar/oauth/google/callback` (dev)
   - `https://your-domain.com/api/calendar/oauth/google/callback` (prod)
8. Copy **Client ID** and **Client Secret**

**Required Scopes:**
- `https://www.googleapis.com/auth/calendar`
- `https://www.googleapis.com/auth/calendar.events`

---

### Microsoft Graph

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to **Azure Active Directory** → **App registrations**
3. **New registration**:
   - Name: `Daymark Calendar`
   - Supported account types: **Accounts in any organizational directory and personal Microsoft accounts**
4. Add redirect URIs:
   - `http://localhost:3000/api/calendar/oauth/microsoft/callback` (dev)
   - `https://your-domain.com/api/calendar/oauth/microsoft/callback` (prod)
5. Go to **Certificates & secrets** → **New client secret**
6. Copy **Application (client) ID** and **Secret Value**

**Required API Permissions** (Microsoft Graph):
- `Calendars.ReadWrite`
- `User.Read`
- `offline_access`

---

### Apple Calendar (No OAuth)

Apple uses **app-specific passwords** instead of OAuth:

1. Users go to [appleid.apple.com](https://appleid.apple.com/)
2. Sign in → **Security** → **App-Specific Passwords**
3. Generate password for "Daymark Calendar"
4. User enters Apple ID + app-specific password in your UI

No developer setup required for Apple.

---

## Database Migration

```bash
cd backend
npx prisma migrate dev --name calendar-sync
npx prisma generate
```

---

## Webhook Setup (Production)

For webhooks to work, your server must be publicly accessible:

**Option A - ngrok (Development):**
```bash
ngrok http 3002
# Copy the https URL to WEBHOOK_BASE_URL
```

**Option B - Production:**
- Deploy to a server with HTTPS
- Set `WEBHOOK_BASE_URL=https://api.your-domain.com`

---

## Generate Token Secret

```bash
# Generate a secure 32-character secret
openssl rand -hex 16
```

---

## Docker Commands

| Command | Action |
|---------|--------|
| `docker-compose up -d` | Start all services |
| `docker-compose down` | Stop all services |
| `docker-compose logs -f backend` | View backend logs |
| `docker-compose logs -f redis` | View Redis logs |
| `docker-compose ps` | Check service status |
| `docker-compose restart backend` | Restart backend only |

---

## Local Development (without Docker backend)

If you prefer running NestJS locally:

```bash
# Start only db + redis
docker-compose up -d db redis

# Run backend locally
npm run start:dev
```

---

## Setup Checklist

| Step | Action |
|------|--------|
| ☐ | Add env variables to `.env` |
| ☐ | Start services (`docker-compose up -d`) |
| ☐ | Create Google OAuth credentials |
| ☐ | Create Microsoft OAuth credentials |
| ☐ | Run database migration |
| ☐ | Generate `CALENDAR_TOKEN_SECRET` |
| ☐ | Set up ngrok/public URL for webhooks |
| ☐ | Start frontend (`npm run dev`) |

---

## Testing the Flow

1. Navigate to `/settings/calendars`
2. Click "Connect" on Google/Microsoft
3. Complete OAuth flow
4. Calendars should appear and sync

For Apple:
1. Click "Connect" on Apple
2. Enter Apple ID and app-specific password
3. Calendars sync via polling (every 10 min)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                    │
│  /settings/calendars │ ConnectionCard │ Sync Status │ Settings          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          API LAYER (NestJS)                              │
│  CalendarModule │ WebhookController │ CalendarController                 │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          PROVIDER LAYER                                  │
│           ICalendarProvider Interface (Strategy Pattern)                 │
│    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐            │
│    │   Google     │    │  Microsoft   │    │    Apple     │            │
│    │  (webhooks)  │    │  (webhooks)  │    │  (polling)   │            │
│    └──────────────┘    └──────────────┘    └──────────────┘            │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     QUEUE LAYER (BullMQ + Redis)                         │
│  google-sync (5/sec) │ microsoft-sync (10/sec) │ apple-sync (1/sec)     │
│  webhook-process │ token-refresh │ outbound-sync │ cleanup              │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    DATA LAYER (Prisma + PostgreSQL)                      │
│  CalendarConnection │ CalendarSource │ EventMapping │ CalendarToken     │
│  CalendarConflict │ SyncAuditLog │ UserCalendarSettings                 │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Rate Limiting

| Provider  | App Limit      | User Limit  | Queue Rate  |
|-----------|----------------|-------------|-------------|
| Google    | 500/100sec     | 5/sec       | 5 jobs/sec  |
| Microsoft | 10K/10min      | 16/sec      | 10 jobs/sec |
| Apple     | Conservative   | 1/sec       | 1 job/sec   |

---

## API Endpoints

### Connection Management
```
POST   /api/calendar/connections              # Initiate OAuth
POST   /api/calendar/connections/callback     # Complete OAuth (Google/Microsoft)
POST   /api/calendar/connections/apple/complete # Complete Apple connection
GET    /api/calendar/connections              # List connections
GET    /api/calendar/connections/:id          # Get details
PUT    /api/calendar/connections/:id          # Update settings
DELETE /api/calendar/connections/:id          # Disconnect
POST   /api/calendar/connections/:id/sync     # Manual sync
```

### Calendar Sources
```
GET    /api/calendar/connections/:id/sources  # List calendars
POST   /api/calendar/connections/:id/sources/refresh # Refresh calendar list
PUT    /api/calendar/sources/:id              # Configure sync settings
```

### Settings & Status
```
GET    /api/calendar/settings                 # User settings
PUT    /api/calendar/settings                 # Update settings
GET    /api/calendar/conflicts                # List conflicts
PUT    /api/calendar/conflicts/:id            # Resolve conflict
GET    /api/calendar/status                   # Overall sync health
```

### Webhooks (Internal)
```
POST   /api/webhooks/calendar/google/:connectionId
POST   /api/webhooks/calendar/microsoft/:connectionId
```

---

## Troubleshooting

### Redis Connection Failed
```bash
# Check if Redis is running
docker-compose ps redis

# View Redis logs
docker-compose logs redis
```

### OAuth Redirect Mismatch
- Ensure redirect URIs in Google/Microsoft console match exactly
- Check for trailing slashes
- Verify http vs https

### Webhooks Not Working
- Verify `WEBHOOK_BASE_URL` is publicly accessible
- Check ngrok is running (for dev)
- View webhook logs: `docker-compose logs -f backend | grep webhook`

### Token Refresh Failing
- Check `CALENDAR_TOKEN_SECRET` is set and 32+ characters
- Verify refresh tokens are being stored (check database)
