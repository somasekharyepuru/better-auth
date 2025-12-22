# Daymark - Personal Productivity Platform

A comprehensive personal productivity app built with NestJS (backend) and Next.js (frontend), featuring daily planning, time blocking, and productivity tools.

## 🎯 Overview

Daymark helps you organize each day with focused priorities, time-blocked schedules, and reflection tools. Built with secure authentication using Better Auth.

## 📁 Project Structure

```
daymark/
├── backend/          # NestJS API with Better Auth
├── frontend/         # Next.js 15 web application
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL (via Docker)

### Backend Setup

```bash
cd backend

# Start with Docker (recommended)
docker-compose up -d

# Or manually
npm install
npm run start:dev
```

**Backend URL**: `http://localhost:3002`

### Frontend Setup

```bash
cd frontend

npm install
npm run dev
```

**Frontend URL**: `http://localhost:3000`

## ✨ Features

### 📅 Daily Planning (Daymark Core)

- **Top Priorities** - Set up to 3-5 key priorities per day
- **Discussion Items** - Track topics to discuss with others
- **Time Blocks** - Visual schedule with Deep Work, Meetings, Personal blocks
- **Quick Notes** - Daily scratchpad for thoughts
- **Daily Review** - End-of-day reflection (What went well / What didn't)
- **Carry Forward** - Move incomplete priorities to the next day

### 🛠️ Productivity Tools

| Tool | Description |
|------|-------------|
| **Pomodoro Timer** | Focus sessions with configurable work/break intervals |
| **Eisenhower Matrix** | Task prioritization by urgency and importance |
| **Decision Log** | Track decisions with context and outcomes |

### 🔐 Authentication

- Email/Password with OTP verification
- Two-Factor Authentication (TOTP)
- OAuth (Google, Microsoft)
- Organization & member management

### ⚡ Security (Production Ready)

- `helmet` - HTTP security headers
- `@nestjs/throttler` - Rate limiting (60 req/min)
- `compression` - Response compression
- RBAC with 5 roles: Owner, Admin, Manager, Member, Viewer

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | NestJS, Prisma, PostgreSQL, Better Auth |
| **Frontend** | Next.js 15, React 19, TailwindCSS |
| **Auth** | Better Auth (email OTP, 2FA, organizations) |
| **Deployment** | Docker (backend), Netlify (frontend) |

## 📊 API Endpoints

### Days & Planning
- `GET /api/days/:date` - Get day with all related data
- `POST /api/days/:date/priorities` - Create priority
- `PUT /api/priorities/:id` - Update priority
- `PATCH /api/priorities/:id/complete` - Toggle completion

### Tools
- `GET/POST/PUT/DELETE /api/eisenhower` - Matrix tasks
- `GET/POST/PUT/DELETE /api/decisions` - Decision log entries

### Health
- `GET /health` - Application health
- `GET /health/ready` - Readiness (DB + email service)

## 🔧 Environment Variables

### Backend (`backend/.env`)

```bash
# Database
DATABASE_URL=postgresql://postgres:password@db:5432/auth_service

# Auth (CRITICAL: generate with `openssl rand -base64 32`)
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=http://localhost:3002

# Email Service
N8N_WEBHOOK_URL=https://your-n8n-instance/webhook/email

# CORS (production: your domain only)
CORS_ORIGIN=http://localhost:3000
```

### Frontend (`frontend/.env`)

```bash
NEXT_PUBLIC_AUTH_URL=http://localhost:3002
```

## 🚢 Deployment

### Production Backend (Docker)

```bash
cd backend
docker-compose -f docker-compose.prod.yml up -d
```

### Production Frontend (Netlify)

```bash
cd frontend
npm run build
# Deploy to Netlify (netlify.toml configured)
```

## 📚 Documentation

- [API Documentation](./backend/working-api.md)
- [Production Checklist](./backend/PRODUCTION_CHECKLIST.md)
- [Organization System](./backend/ORGANIZATION_SYSTEM.md)
- [Design System](./frontend/DESIGN_SYSTEM.md)

---

**Built with ❤️ using NestJS, Next.js, and Better Auth**
