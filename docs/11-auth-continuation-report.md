# Auth Continuation Report

## Summary

- Protected `/au-free` routes now require a valid authenticated session.
- Signup now validates `fullName`, `username`, `email`, and password complexity on both client and server.
- Login now accepts either email or username.
- Roles are now persisted on the user record instead of being inferred from hardcoded email addresses.
- Access now uses short-lived access cookies plus rotating refresh cookies.

## Test Accounts

- `admin@moa.gov.et` / username `admin` / password `admin123` / role `admin`
- `supervisor@moa.gov.et` / username `supervisor` / password `supervisor123` / role `supervisor`
- `user@moa.gov.et` / username `portal.user` / password `user123` / role `user`

## Verification

- `pnpm --filter @moa/server test`
- `pnpm --filter @moa/shared test`
- `pnpm --filter @moa/shell typecheck`
- `pnpm --filter @moa/server typecheck`
- `pnpm --filter @moa/shared typecheck`

## Issues Encountered

1. No Git checkout metadata was present under `/home/dhz/PROJECTS/MOA_PORTAL`, so a real `git pull` could not be executed.
   Resolution: continued from the on-disk codebase state and documented the limitation.

2. `packages/shared/src/auth/index.js` was a stale generated artifact shadowing the updated TypeScript source during tests.
   Resolution: removed the stale file so Vitest resolves the current `index.ts`.

3. The legacy AU Free template under `apps/shell/src/au-free` includes dormant MUI/React Router code that is not installed or mounted in the shell workspace.
   Resolution: added the protected, integrated Next-facing AU Free entry points under `apps/shell/src/au-free/next`, and excluded the unintegrated legacy subtree from shell typecheck until its missing dependencies are intentionally added.

## Role Access Matrix

- `user`: can open `/au-free` and `/au-free/account`
- `supervisor`: can also open `/au-free/users` and `/au-free/starter`
- `admin`: can open all of the above plus `/au-free/admin` and existing `/admin` routes

## Notes

- Existing `apps/[slug]` application assignment checks remain in place.
- Refresh flow is handled through `/api/auth/refresh` and is triggered by middleware when an access token is missing or expired but a refresh token still exists.
