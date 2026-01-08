# Modern Multi-stage Build with Performance Optimizations
# Using BuildKit for faster builds and better caching

# Stage 1: Dependencies - Cached separately for faster rebuilds
FROM node:20-alpine AS deps
WORKDIR /app

# Copy only package files for better layer caching
COPY package*.json ./

# Install dependencies with optimizations
RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline --no-audit --omit=dev && \
    npm cache clean --force

# Stage 2: Build Dependencies (includes dev dependencies)
FROM node:20-alpine AS build-deps
WORKDIR /app

COPY package*.json ./

# Install all dependencies including dev dependencies
RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline --no-audit && \
    npm cache clean --force

# Stage 3: Frontend Builder
FROM node:20-alpine AS frontend-builder
WORKDIR /app

# Copy node_modules from build-deps
COPY --from=build-deps /app/node_modules ./node_modules
COPY package*.json ./

# Copy source files
COPY src ./src
COPY public ./public
COPY index.html ./
COPY vite.config.ts ./
COPY tsconfig*.json ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY components.json ./

# Build with optimizations
ENV NODE_ENV=production
ENV VITE_BUILD_ANALYZE=false

RUN npm run build && \
    # Remove source maps in production for smaller size
    find dist -name "*.map" -type f -delete && \
    # Verify build output
    ls -lh dist/

# Stage 4: Nginx Static Server (Ultra-fast for frontend)
FROM nginx:alpine AS frontend-server

# Install Brotli for better compression
RUN apk add --no-cache brotli

# Copy optimized Nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built frontend
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

# Pre-compress static assets for faster delivery
RUN find /usr/share/nginx/html -type f \( -name "*.js" -o -name "*.css" -o -name "*.html" -o -name "*.svg" \) \
    -exec gzip -9 -k {} \; && \
    find /usr/share/nginx/html -type f \( -name "*.js" -o -name "*.css" -o -name "*.html" -o -name "*.svg" \) \
    -exec brotli -9 -k {} \;

# Stage 5: Backend Production
FROM node:20-alpine AS backend-server
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./

# Copy server code
COPY server ./server

# Create uploads directory
RUN mkdir -p uploads logs && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3001

# Health check
HEALTHCHECK --interval=15s --timeout=3s --start-period=30s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server/index.js"]

# Stage 6: Development
FROM node:20-alpine AS development
WORKDIR /app

# Install development tools
RUN apk add --no-cache git

COPY --from=build-deps /app/node_modules ./node_modules
COPY . .

EXPOSE 8080 3001

CMD ["npm", "run", "dev"]
