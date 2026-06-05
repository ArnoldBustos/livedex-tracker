# API Routes

The API is mounted from `apps/api/src/app.ts` and groups routes by feature module.

## Health

- `GET /health`: returns API health information for local checks.

## Auth

Auth routes are implemented with Better Auth plus local helper endpoints. The web app uses these routes for email/password sign-in, sign-up, session lookup, and sign-out through `apps/web/src/lib/api/auth.ts`.

## Uploads

Upload routes accept save files plus save identity metadata, run parser detection, create or update save profiles, and return the imported dex snapshot used by the dashboard.

## Dex

Dex routes serve the dex template and save-profile-specific dex data. They also support entry override updates for standard and shiny collection state.

For exact request and response shapes, use the TypeScript controller, route, and frontend API client files as the source of truth.
