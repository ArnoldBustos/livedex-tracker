# Architecture Overview

Livedex Tracker is a pnpm workspace with three application layers:

- `apps/web`: Vite, React, and TypeScript frontend for upload, manual entry, auth screens, saved-profile switching, and the dex dashboard.
- `apps/api`: Express and TypeScript API for auth, uploads, save parsing, dex profile data, and Prisma persistence.
- `packages/shared`: shared dex data/types used across workspace packages.

Local development uses Docker Compose Postgres and Prisma. Uploaded save files are parsed by generation-specific parser modules before the API stores an upload record, save profile metadata, and imported dex snapshot data.

The current frontend talks to the API through small client modules in `apps/web/src/lib/api`. Dashboard state is owned in `App.tsx`, while larger UI surfaces are split into upload, profile, dashboard, and layout components.
