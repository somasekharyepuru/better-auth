# Auth Admin Dashboard

Admin dashboard for Better Auth user management built with Next.js and shadcn/ui.

## Features

| Feature | Description |
|---------|-------------|
| **User Management** | List, search, create, update, delete users |
| **Ban/Unban** | Ban users with reason, timed or permanent |
| **Role Management** | Change user roles (admin, user, custom) |
| **Password Reset** | Set new passwords for users |
| **Impersonation** | Login as any user for debugging |
| **Session Control** | View and revoke user sessions |

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env.local`:
   ```
   NEXT_PUBLIC_AUTH_URL=http://localhost:3002
   ```

3. Run development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

## Requirements

- Better Auth backend with admin plugin enabled
- User with `admin` role to access dashboard

## Pages

| Route | Description |
|-------|-------------|
| `/login` | Admin login |
| `/` | Dashboard with stats |
| `/users` | User management |
| `/settings` | Configuration |

## Tech Stack

- Next.js 15
- shadcn/ui components
- Better Auth client with admin plugin
- Tailwind CSS

## License

MIT
