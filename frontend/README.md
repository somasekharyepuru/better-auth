# Auth Frontend (Next.js)

Authentication frontend built with Next.js 15 and Better Auth.

## Features

- Login/Signup pages
- Email verification
- Password reset
- Protected dashboard with role-based permissions
- Organization context support

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` file:
```env
NEXT_PUBLIC_AUTH_URL=http://localhost:3000
```

3. Start the development server:
```bash
npm run dev
```

The application will run on `http://localhost:3001` by default.

## Pages

- `/` - Home page
- `/login` - Login page
- `/signup` - Sign up page
- `/verify-email` - Email verification page
- `/forgot-password` - Password reset page
- `/dashboard` - Protected dashboard (requires authentication)

## Authentication

The frontend uses Better Auth client to connect to the backend API. The client is configured with:
- Organization plugin support
- Automatic session management
- Role-based permission checks

## Permissions

The dashboard displays user permissions based on their role:
- `owner` - Full access
- `admin` - Management access (no org deletion)
- `member` - Read-only access

