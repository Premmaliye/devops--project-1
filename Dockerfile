# ==========================================
# Stage 1: Build & Dependencies
# ==========================================
FROM node:22-alpine AS dependencies

WORKDIR /usr/src/app

# Install dependencies needed for potential native builds
RUN apk add --no-cache libc6-compat

COPY package*.json ./

# Install full dependencies (including dev for testing if needed)
RUN npm ci

# Prune dev dependencies for production artifact
RUN npm prune --omit=dev

# ==========================================
# Stage 2: Final Production Runner
# ==========================================
FROM node:22-alpine AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Install curl or wget for healthcheck (wget is pre-installed in Alpine)
RUN apk --no-cache add ca-certificates

# Copy production node_modules from dependencies stage
COPY --from=dependencies /usr/src/app/node_modules ./node_modules
COPY package*.json ./
COPY src/ ./src/
COPY public/ ./public/

# Run as non-privileged user 'node' (built into node images)
USER node

EXPOSE 3000

# Docker native health check using the /health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "src/server.js"]
