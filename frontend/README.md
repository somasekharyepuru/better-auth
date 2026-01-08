# Daymark Frontend

Next.js 15 web application for the Daymark personal productivity platform.

## Features

### Dashboard
- **Daily Planning** - Priorities, discussions, and schedule in one view
- **Progress Tracking** - Visual completion indicators
- **Quick Notes** - Daily scratchpad with auto-save
- **Daily Review** - End-of-day reflection modal

### Productivity Tools
- **Pomodoro Timer** - Configurable focus sessions with break intervals
- **Eisenhower Matrix** - Drag-and-drop task prioritization
- **Decision Log** - Track and review past decisions

### User Management
- **Profile** - View and edit user information
- **Two-Factor Auth** - TOTP setup with QR code
- **Settings** - Dashboard customization and tool preferences

### Authentication
- Email/Password with OTP verification
- Social login (Google, Microsoft)
- Two-Factor Authentication
- Secure session management

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **React**: 19.1.0
- **Styling**: TailwindCSS 3.4
- **Forms**: React Hook Form + Zod
- **Auth**: Better Auth React Client
- **Icons**: Lucide React
- **Deployment**: Netlify

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp env.example .env
# Set NEXT_PUBLIC_AUTH_URL=http://localhost:3002

# Start development server
npm run dev
```

**App URL**: `http://localhost:3000`

## Project Structure

```
frontend/
├── app/
│   ├── (dashboard)/       # Protected routes
│   │   ├── dashboard/     # Main productivity dashboard
│   │   ├── profile/       # User profile & 2FA
│   │   ├── settings/      # App settings
│   │   ├── tools/         # Pomodoro, Matrix, Decisions
│   │   └── organizations/ # Team management
│   ├── login/             # Sign in
│   ├── signup/            # Registration
│   ├── verify-email/      # OTP verification
│   ├── verify-2fa/        # 2FA verification
│   ├── forgot-password/   # Password reset request
│   └── reset-password/    # Password reset form
├── components/
│   ├── ui/                # Reusable UI components
│   └── ...                # Feature components
├── lib/
│   ├── auth-client.ts     # Better Auth setup
│   ├── daymark-api.ts     # API client
│   ├── settings-api.ts    # Settings API
│   └── permissions.ts     # RBAC helpers
└── config/
    └── navigation.ts      # Navigation config
```

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/login` | Sign in |
| `/signup` | Registration |
| `/verify-email` | Email OTP verification |
| `/verify-2fa` | Two-factor verification |
| `/` | Main productivity hub (dashboard) |
| `/profile` | User profile |
| `/profile/two-factor` | 2FA setup |
| `/settings` | App settings |
| `/tools` | Tools overview |
| `/tools/pomodoro` | Pomodoro timer |
| `/tools/matrix` | Eisenhower matrix |
| `/tools/decisions` | Decision log |

## Environment Variables

```bash
# Backend API URL
NEXT_PUBLIC_AUTH_URL=http://localhost:3002

# Optional
NEXT_PUBLIC_APP_NAME=Daymark
```

## Deployment (Netlify)

The app is configured for Netlify deployment:

```bash
# Build for production
npm run build
```

Configuration in `netlify.toml`:
- Next.js plugin enabled
- Security headers configured
- Node 20 build environment

## Development

```bash
# Development with hot reload
npm run dev

# Type checking
npm run lint

# Production build
npm run build
```

---

**Built with Next.js 15, React 19, and TailwindCSS**
