# Production Dockerfile for BeastLife AI Creative Studio
FROM node:22-bookworm-slim

# Install system dependencies (FFmpeg is required for 1080x1920 video rendering)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies (including devDependencies needed for build)
RUN npm install

# Copy application source code
COPY . .

# Generate Prisma client and build frontend & bundled backend server
RUN npm run build

# Ensure required runtime asset storage directories exist
RUN mkdir -p public/generated public/uploads storage/temp

# Environment configuration
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Push database schema on start if not initialized, then launch server
CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/server.cjs"]
