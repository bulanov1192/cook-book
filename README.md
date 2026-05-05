# Recipe Book App

Recipe and shopping-list manager built as a monorepo:

- `client/` - SvelteKit frontend
- `server/` - Express + TypeScript API
- root `docker-compose.yml` - local/prod deployment with Caddy and PostgreSQL

## Stack

- SvelteKit
- TypeScript
- Express
- Better Auth
- Drizzle ORM
- PostgreSQL
- Caddy
- Docker Compose

## Local development

### Install dependencies

```bash
cd server
npm install

cd ../client
npm install
```

### Run in development

Backend:

```bash
cd server
npm run dev
```

Frontend:

```bash
cd client
npm run dev
```

## Docker deployment

The repo is configured so the code and compose files stay in git, while server-specific values live in the root `.env`.

### First setup

```bash
cp .env.example .env
```

Important values:

- `APP_ORIGIN=https://your-domain.tld`
- `CADDY_SITE_ADDRESS=your-domain.tld, www.your-domain.tld`
- `BETTER_AUTH_SECRET=<long-random-secret>`
- `ADMIN_EMAILS=you@example.com`
- `PUBLIC_API_BASE_URL=`
- `INTERNAL_API_BASE_URL=http://server:3000`
- `DATABASE_PROVIDER=postgres`
- `DATABASE_URL=postgres://cookbook:cookbook@postgres:5432/cookbook`
- `POSTGRES_DB=cookbook`
- `POSTGRES_USER=cookbook`
- `POSTGRES_PASSWORD=<strong-password>`
- `SQLITE_MIGRATION_SOURCE=/app/data/recipe-book.db`

### Start the stack

```bash
docker compose up -d --build
```

Services:

- `postgres` - main runtime database
- `server` - API
- `client` - SvelteKit node app
- `caddy` - reverse proxy with automatic HTTPS

## Database runtime

PostgreSQL is now the main runtime database.

- application schema is created from SQL migrations in `server/migrations/`
- migrations are applied automatically when the server starts
- the current SQLite file is kept only as a migration source / fallback backup

## Migrating existing SQLite data to PostgreSQL

If you already have data in the old SQLite volume/file:

1. Bring the new stack up so Postgres is running.
2. Make sure `SQLITE_MIGRATION_SOURCE` points to the existing SQLite file.
3. Run the one-time import:

```bash
docker compose exec server npm run db:import:sqlite
```

What the import does:

- creates PostgreSQL tables if needed
- checks that target Postgres tables are empty
- copies auth tables and product tables in dependency-safe order
- preserves IDs and timestamps

Source tables copied:

- `user`
- `session`
- `account`
- `verification`
- `recipes`
- `recipe_ingredients`
- `recipe_steps`
- `tags`
- `recipe_tag_links`
- `shopping_lists`
- `shopping_list_items`

After a successful import, keep the old SQLite file around as a backup until you are fully comfortable with the new setup.

## Useful commands

From `server/`:

- `npm run dev`
- `npm run build`
- `npm start`
- `npm run typecheck`
- `npm run db:migrate`
- `npm run db:import:sqlite`
- `npm run db:generate`
- `npm run db:studio`

From `client/`:

- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run check`

## Notes

- Keep `PUBLIC_API_BASE_URL` empty so the browser uses same-origin `/api`.
- `INTERNAL_API_BASE_URL` is only for SvelteKit SSR inside Docker.
- For HTTPS, Caddy uses free certificates from Let's Encrypt automatically when the domain points to the server and ports `80` and `443` are open.
