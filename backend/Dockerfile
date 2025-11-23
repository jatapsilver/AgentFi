# Backend Dockerfile (multi-stage)
# Build stage
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies (use npm ci if lockfile present)
COPY package*.json ./
RUN npm ci --ignore-scripts

# Copy source
COPY . .

# Build NestJS
RUN npm run build

# Production runtime stage
FROM node:20-alpine AS runner
WORKDIR /app

# Install PostgreSQL client to allow pg_isready for DB readiness check
RUN apk add --no-cache postgresql-client

ENV NODE_ENV=production

# Copy package manifests and install only production deps
COPY package*.json ./
RUN npm ci --only=production --ignore-scripts && npm cache clean --force

# Copy built dist from build stage
COPY --from=build /app/dist ./dist

# If you need static assets (e.g., prisma schema, migrations) copy them here
# COPY --from=build /app/prisma ./prisma

EXPOSE 3000

# Health wait loop for Postgres (optional; relies on DB_HOST/DB_PORT/DB_USER env vars)
CMD ["sh", "-c", "until pg_isready -h \"${DB_HOST}\" -p \"${DB_PORT}\" -U \"${DB_USER}\"; do echo 'Waiting for PostgreSQL...'; sleep 2; done && node dist/main.js"]
