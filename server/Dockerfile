FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_URL=postgres://cookbook:cookbook@postgres:5432/cookbook
ENV SQLITE_MIGRATION_SOURCE=/app/data/recipe-book.db

COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/migrations ./migrations

RUN mkdir -p /app/data

EXPOSE 3000

CMD ["node", "dist/server.js"]
