FROM node:20-alpine AS base

# Install pnpm globally
RUN npm install -g pnpm@9

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/types/package.json ./packages/types/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the API - nest builds to apps/api/dist
RUN pnpm --filter api build

# Final stage - production image
FROM node:20-alpine

WORKDIR /app

# Copy node_modules and built files
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/apps ./apps
COPY --from=base /app/packages ./packages

# Expose port
EXPOSE 3000

# Start the API from api directory
WORKDIR /app/apps/api
CMD ["node", "dist/main.js"]