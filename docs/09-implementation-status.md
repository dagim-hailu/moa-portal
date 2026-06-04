# MOA_PORTAL Implementation Status

## Completed
- Monorepo skeleton with Turborepo and PNPM workspaces is in place.
- `apps/shell` implements login, shell layout, sidebar, dashboard, app container routes, settings, and 403/404 handling.
- `apps/server` exposes GraphQL resolvers for auth, app registry, assignments, audit events, and DMS operations.
- `apps/dms` provides frontend components for document library and collaboration editor placeholders.
- `packages/shared` includes JWT helpers, i18n dictionaries (English/Amharic), theme tokens, and core Drizzle schemas.
- Unit and integration-style tests exist for shared auth/i18n and server resolver workflows.

## Security/Auth Notes
- Login now issues an HttpOnly JWT cookie via `POST /api/auth/login`.
- Shell middleware validates JWT on protected routes and enforces app-level route access.
- Logout is available via `GET /api/auth/logout` and clears auth cookies.

## Test Commands
```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Docker Commands
```bash
cd infrastructure/docker
docker compose build
docker compose up -d
```

Services:
- Shell: http://localhost:3000
- Server GraphQL: http://localhost:4000/graphql

## Remaining Scope Boundary
- Current backend uses in-memory mock state to satisfy development flow and tests.
- Production integrations (PostgreSQL persistence, OpenFGA tuple sync, MinIO upload signing, BullMQ workers, Elasticsearch indexing, Yjs websocket server) should be connected in the next implementation phase.
