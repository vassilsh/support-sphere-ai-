# Stage 1: Build step
FROM node:20-alpine AS builder

# Install system build tools required to compile native C++ modules like better-sqlite3
RUN apk add --no-cache make gcc g++ python3

WORKDIR /app

# 1. Copy all project files from the host machine first
COPY . .

# 2. CRITICAL: Purge any host-compiled node_modules that leaked in from the host machine
RUN rm -rf node_modules

# 3. Clean install directly inside Alpine so better-sqlite3 compiles for musl
RUN npm ci

# Generate the Prisma 7 client types inside the builder stage
RUN npx prisma generate

# Compile TypeScript to JavaScript
RUN npm run build

# Prune devDependencies to keep node_modules strictly production-ready
RUN npm prune --production


# Stage 2: Production runtime step
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./

# Copy the native musl-compiled node_modules directly from the builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

EXPOSE 3001
CMD ["node", "dist/server.js"]
