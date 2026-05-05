# Recipe Book App

A full-stack web application for managing recipes and shopping lists, built with modern web technologies.

## Features

- **Recipe Management**: Create, edit, and organize recipes with ingredients and steps
- **Shopping Lists**: Generate shopping lists from recipes and manage grocery items
- **User Authentication**: Secure user registration and login
- **Responsive Design**: Mobile-friendly interface built with SvelteKit
- **API Documentation**: Interactive Swagger UI for backend endpoints

## Tech Stack

### Frontend

- **SvelteKit**: Modern framework for building web applications
- **TypeScript**: Type-safe JavaScript
- **Sass**: CSS preprocessor for styling
- **Vite**: Fast build tool and development server

### Backend

- **Node.js**: JavaScript runtime
- **Express**: Web framework for API
- **TypeScript**: Type-safe server code
- **Drizzle ORM**: Type-safe SQL query builder for SQLite
- **Better Auth**: Authentication library
- **SQLite**: Lightweight database

## Prerequisites

- Node.js (version 18 or higher)
- npm or yarn

## Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd html-training
   ```

2. Install dependencies for both client and server:

   ```bash
   # Install server dependencies
   cd server
   npm install

   # Install client dependencies
   cd ../client
   npm install
   ```

3. Set up the database:

   ```bash
   # Generate database migrations
   cd ../server
   npm run db:generate

   # Create environment file (optional, defaults will be used)
   cp .env.example .env  # If .env.example exists, otherwise create .env with:
   # NODE_ENV=development
   # PORT=3000
   # DATABASE_FILE=./data/recipe-book.db
   # CORS_ORIGIN=http://localhost:5173
   # BETTER_AUTH_SECRET=your-secret-key-here
   # ADMIN_EMAILS=mymail@local.com
   ```

## Running the Application

1. Start the backend server:

   ```bash
   cd server
   npm run dev
   ```

   The server will start on `http://localhost:3000`

2. Start the frontend client (in a new terminal):

   ```bash
   cd client
   npm run dev
   ```

   The client will start on `http://localhost:5173`

3. Open your browser and navigate to `http://localhost:5173`

## Docker

The project includes production-oriented Docker setup for:

- `server`: Express API with SQLite stored on a persistent Docker volume
- `client`: SvelteKit app built with `@sveltejs/adapter-node`
- `caddy`: reverse proxy that serves the frontend and forwards `/api`, `/docs`, and `/openapi.json`

For HTTPS/domain deployments, keep:

- `PUBLIC_API_BASE_URL=""` so the browser uses same-origin `/api`
- `INTERNAL_API_BASE_URL=http://server:3000` so SvelteKit SSR can reach the backend over the Docker network

### Start with Docker Compose

```bash
cp .env.example .env
docker compose up --build
```

The app will be available at `http://localhost`.

### Stop and remove containers

```bash
docker compose down
```

To remove the SQLite volume too:

```bash
docker compose down -v
```

### Important environment values

The compose file now reads its deployment settings from the repo root `.env` file.

Recommended workflow:

1. Keep `docker-compose.yml` and `deploy/Caddyfile` in git.
2. Keep secrets and per-server values only in `.env`.
3. On the server:

```bash
git pull
cp .env.example .env   # only on first setup
nano .env              # edit domain, secret and ports if needed
docker compose up -d --build
```

For domain + HTTPS deployment, the most important `.env` values are:

- `APP_ORIGIN=https://your-domain.tld`
- `CADDY_SITE_ADDRESS=your-domain.tld, www.your-domain.tld`
- `BETTER_AUTH_SECRET=<long-random-secret>`
- `PUBLIC_API_BASE_URL=`
- `INTERNAL_API_BASE_URL=http://server:3000`

SQLite data is persisted in the `server_data` Docker volume and mounted inside the backend container at `/app/data`.

## API Documentation

When the server is running, visit `http://localhost:3000/docs` to view the interactive API documentation powered by Swagger UI.

## Development

### Available Scripts

#### Server

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run typecheck` - Run TypeScript type checking
- `npm run db:generate` - Generate database migrations
- `npm run db:studio` - Open Drizzle Studio for database management

#### Client

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run check` - Run SvelteKit type checking

### Project Structure

```
├── client/          # SvelteKit frontend
├── server/          # Express backend
│   ├── src/
│   │   ├── auth/    # Authentication logic
│   │   ├── db/      # Database schema and client
│   │   ├── modules/ # Feature modules (recipes, shopping-lists)
│   │   └── shared/  # Shared utilities
│   └── drizzle/     # Database migrations
└── .gitignore       # Git ignore rules
```

## License

This project is for educational purposes.
