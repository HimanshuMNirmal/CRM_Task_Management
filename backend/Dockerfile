# ==============================================================================
# Multi-stage Dockerfile for CRM Task Management Backend
# Base image: Node.js 20 on lightweight Alpine Linux
# ==============================================================================

# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm ci

# Copy TypeScript configuration and source code
COPY tsconfig*.json ./
COPY src/ ./src/

# Compile TypeScript to JavaScript in /dist
RUN npm run build

# ==============================================================================
# Stage 2: Production runner stage
# ==============================================================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install wget for healthcheck
RUN apk add --no-cache wget

# Copy package definitions and install production-only dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled JavaScript output from builder stage
COPY --from=builder /app/dist ./dist

# Create uploads directory and set permissions for non-root 'node' user
RUN mkdir -p uploads && chown -R node:node /app

# Run with non-root security context
USER node

EXPOSE 5000

# Health check matching Express /api/health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:5000/api/health || exit 1

CMD ["node", "dist/server.js"]
