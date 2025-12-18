FROM node:20-alpine

WORKDIR /app

# Install dependencies for Prisma
RUN apk add --no-cache openssl

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml* ./

# Install dependencies
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps

# Copy Prisma schema
COPY prisma ./prisma

# Generate Prisma Client
RUN npx prisma generate

# Copy application files
COPY . .

# Make wait script executable
RUN chmod +x wait-for-db.sh

# Expose port
EXPOSE 3000

# Default command (can be overridden in docker-compose)
CMD ["./wait-for-db.sh", "npm", "run", "start:dev"]

