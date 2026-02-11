# Code Style & Conventions

## Backend (NestJS/TypeScript)
- **Parser**: @typescript-eslint with Prettier
- **Rules**: No explicit-any (warn), no unused vars except `_`-prefixed (warn)
- **Pattern**: NestJS modular - each feature is a self-contained module
- **Naming**: camelCase for files/functions, PascalCase for classes/interfaces
- **Testing**: Jest with `.spec.ts` suffix
- **Structure**: controller → service → prisma pattern

## Frontend (Next.js/TypeScript)
- **Framework**: Next.js 15 App Router with React 19
- **Styling**: TailwindCSS 3
- **State**: React Context API (not Redux)
- **Forms**: react-hook-form + zod validation
- **Icons**: lucide-react
- **UI**: Hand-rolled components (not shadcn) in `components/ui/`
- **Feature components**: organized by domain in `components/`

## General
- TypeScript strict mode
- No comments in code unless specifically asked
- Minimal boilerplate
- Clean code principles
