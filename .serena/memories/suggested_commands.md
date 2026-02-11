# Suggested Commands

## Backend (cd backend)
| Command | Description |
|---------|-------------|
| `npm run start:dev` | Dev server with watch (port 3002) |
| `npm run build` | Production build |
| `npm run lint` | ESLint with auto-fix |
| `npm run format` | Prettier formatting |
| `npm run test` | Jest unit tests |
| `npm run test:watch` | Jest watch mode |
| `npm run test:e2e` | E2E tests |
| `npx jest --testPathPattern="path"` | Run single test file |
| `npm run db:migrate` | Prisma migrate dev |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:studio` | Prisma Studio GUI |
| `npm run db:seed` | Seed database |
| `npm run ba:generate` | Generate Better Auth types |
| `docker-compose up -d` | Start PostgreSQL + Redis |

## Frontend (cd frontend)
| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server (port 3000) |
| `npm run build` | Production build |
| `npm run lint` | Next.js ESLint |

## System (macOS/Darwin)
| Command | Description |
|---------|-------------|
| `git status/diff/log` | Git operations |
| `ls`, `find`, `grep` | File system operations |

## After Schema Changes
```bash
cd backend && npm run db:migrate && npm run db:generate
```
