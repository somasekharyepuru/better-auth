# ============================================================
# Multi-stage Dockerfile for Auth Backend (NestJS)
# ============================================================
# Stages:
#   - development: Hot-reload with NestJS watch mode
#   - production: Optimized production build
# ============================================================

# Development Stage
FROM node:20-alpine AS development

WORKDIR /app

# Install dependencies for Prisma and line endings
RUN apk add --no-cache openssl dos2unix

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies)
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps

# Copy Prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy NestJS config files
COPY nest-cli.json ./
COPY tsconfig.json ./

# Copy application files
COPY . .

# Fix line endings and make wait script executable
RUN dos2unix wait-for-db.sh && chmod +x wait-for-db.sh

# Expose port
EXPOSE 3000

# Override base image entrypoint to prevent node:20-alpine's docker-entrypoint.sh
# from incorrectly wrapping 'sh' with 'node'
ENTRYPOINT ["/bin/sh", "/app/wait-for-db.sh"]

# Development command with hot-reload (NestJS watch mode)
CMD ["npm", "run", "start:dev"]

# ============================================================
# Production Build Stage
# ============================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies for Prisma
RUN apk add --no-cache openssl

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps

# Copy Prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy NestJS config files
COPY nest-cli.json ./
COPY tsconfig.json ./

# Copy source files
COPY . .

# Build TypeScript with NestJS CLI
RUN npm run build

# ============================================================
# Production Runtime Stage
# ============================================================
FROM node:20-alpine AS production

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache openssl dos2unix

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --legacy-peer-deps --omit=dev || npm install --legacy-peer-deps --omit=dev

# Copy Prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Copy wait script
COPY wait-for-db.sh ./
RUN dos2unix wait-for-db.sh && chmod +x wait-for-db.sh

# Set environment
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Override base image entrypoint (same reason as development stage)
ENTRYPOINT ["/bin/sh", "/app/wait-for-db.sh"]

# Production command
CMD ["node", "dist/main.js"]
