FROM node:18-alpine AS base
WORKDIR /app

# install dependencies
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci --production --silent || npm install --production --silent

# build
FROM base AS builder
COPY . .
RUN npm install --silent
RUN npm run build

# production image
FROM node:18-alpine AS release
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./package.json

EXPOSE 3010
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost:3010/api/v1/test/health || exit 1

CMD ["node", "dist/src/main"]
