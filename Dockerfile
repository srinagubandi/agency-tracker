# ─── Stage 1: Build React frontend (Vite) ────────────────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package.json ./

# Install dependencies
RUN npm install

# Copy frontend source
COPY frontend/ ./

# Build the Vite app
RUN npm run build

# ─── Stage 2: Backend + serve frontend ────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Install backend dependencies
COPY backend/package.json ./
RUN npm install --omit=dev

# Copy backend source
COPY backend/src/ ./src/

# Copy built frontend into backend's public folder (Vite outDir is 'build')
COPY --from=frontend-builder /app/frontend/build ./public

# Create uploads directory (will be overridden by Railway Volume mount)
RUN mkdir -p /app/uploads

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1

# Copy startup script
COPY backend/start.sh ./start.sh
RUN chmod +x ./start.sh

# Start: migrate + seed + server
CMD ["sh", "start.sh"]
