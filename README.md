# Livedex Tracker

Local web app for tracking Pokemon save progress. The repo is a pnpm workspace with an Express/Prisma API, a Vite React web app, and a Dockerized Postgres database for local development.

## Requirements

- Node.js
- pnpm `10.0.0`
- Docker Desktop with Docker Compose

Check your local tools:

```sh
node --version
pnpm --version
docker info
docker compose version
```

## First-Time Setup

From the repo root:

```sh
pnpm install
```

Create local env files:

```sh
cp .env.example apps/api/.env
printf 'VITE_API_BASE_URL="http://localhost:4000"\n' > apps/web/.env
```

Start Postgres:

```sh
pnpm docker:up
```

Initialize the local database:

```sh
pnpm db:setup
```

## Run The App

Start the API in one terminal:

```sh
pnpm dev:api
```

Start the web app in another terminal:

```sh
pnpm dev:web
```

Local URLs:

- Web: `http://localhost:5173`
- API: `http://localhost:4000`
- API health check: `http://localhost:4000/health`
- Postgres: `localhost:5433`

Local dev sign-in:

- Email: `dev@example.com`
- Password: `devpassword1234`

Verbose parser/upload diagnostics are off by default. To debug save parsing, set this in `apps/api/.env` before starting the API:

```env
ENABLE_PARSE_DEBUG_LOGS="true"
```

## Useful Commands

```sh
pnpm docker:up       # Start local Postgres
pnpm docker:down     # Stop local Postgres without deleting data
pnpm db:setup        # Generate Prisma client, sync schema, seed data, and create the dev account
pnpm local:check     # Run lint and build
pnpm lint            # Run lint
pnpm build           # Build API and web
```

## Reset Local Development

If the local database gets messy and you want a clean default state, run:

```sh
pnpm local:reset
```

This is destructive for local Docker data. It stops the compose stack, deletes the Postgres volume, starts Postgres again, syncs the Prisma schema, seeds Pokemon species, and recreates the local dev account.

Do not use `pnpm local:reset` if you need to preserve local save/profile data.
