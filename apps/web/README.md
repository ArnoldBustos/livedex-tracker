# Livedex Tracker Web

React/Vite frontend for the Livedex Tracker workspace. This app provides the upload, manual-entry, profile switching, and dex dashboard experience that talks to the local Express API.

For full setup, local credentials, and workspace commands, see the [root README](../../README.md).

## Useful Commands

```sh
pnpm --filter web dev
pnpm --filter web lint
pnpm --filter web build
```

The web app expects `VITE_API_BASE_URL` to point at the API, usually `http://localhost:4000` for local development.
