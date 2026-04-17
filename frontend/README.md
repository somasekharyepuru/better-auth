# Auth Frontend

Standalone Next.js authentication UI powered by Better Auth.

## Features

- Email/password authentication
- Email verification with OTP
- Social login (Google, Apple)
- Two-factor authentication (TOTP)
- Password reset flow
- Organization invitations
- Dark mode support

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file
cp env.example .env.local

# 3. Update NEXT_PUBLIC_AUTH_URL to point to your auth-backend

# 4. Start development server
npm run dev
```

The app will be available at http://localhost:3001

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/login` | Sign in page |
| `/signup` | Sign up page |
| `/forgot-password` | Password reset request |
| `/reset-password` | Password reset with OTP |
| `/verify-email` | Email verification |
| `/verify-2fa` | Two-factor authentication |
| `/dashboard` | Protected dashboard |
| `/accept-invitation/[id]` | Organization invitation |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_AUTH_URL` | Auth backend URL | `http://localhost:3000` |

## Integration with Auth Backend

This frontend is designed to work with the `auth-backend` service. Make sure:

1. `auth-backend` is running on port 3000
2. CORS is configured to allow `http://localhost:3001`
3. `NEXT_PUBLIC_AUTH_URL` points to the correct backend URL
