# MOA Portal Deployment Guide

This repository supports two aligned runtime modes:

- Local development with `pnpm run dev`
- Containerized deployment with Docker Compose (production profile)

Both modes can be fronted by the same Nginx configuration template at `infrastructure/nginx/nginx.conf.template`.

## Prerequisites

- Node.js 20+
- PNPM 9.12.1+
- Docker + Docker Compose

## Environment Variables

Copy `.env.example` to `.env` and adjust values as needed.

Key variables:

- `JWT_SECRET` - shared secret used by auth token signing/verification.
- `MOA_SERVER_GRAPHQL_URL` - shell-to-server GraphQL endpoint.
- `NGINX_SERVER_NAME` - hostname used in generated Nginx TLS certificate subject/SNI.

## Local Development (`pnpm run dev`)

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Start development services:

   ```bash
   pnpm run dev
   ```

3. Verify endpoints:

   - Shell: `http://localhost:3000/login`
   - Server health: `http://localhost:4000/health`
   - GraphQL: `http://localhost:4000/graphql`

4. Optional: front local dev with the same Nginx config (dev-proxy profile):

   ```bash
   cd infrastructure/docker
   docker compose --profile dev-proxy up -d --build nginx-dev
   ```

   Access through Nginx:

   - HTTP redirect endpoint: `http://localhost:8080` (redirects to HTTPS)
   - HTTPS entrypoint: `https://localhost:8443` (self-signed cert)
   - Nginx health: `https://localhost:8443/nginx-health`

## Docker Production Profile

From `infrastructure/docker`:

```bash
docker compose --profile prod build
docker compose --profile prod up -d
docker compose --profile prod ps
```

Endpoints via Nginx:

- `https://localhost/`
- `https://localhost/graphql`
- `https://localhost/nginx-health`

## Nginx Configuration Features

`infrastructure/nginx/nginx.conf.template` includes:

- Reverse proxy to shell and GraphQL server
- Static file serving (`/static/`)
- TLS termination (self-signed cert auto-generated if missing)
- Gzip compression
- Security headers (HSTS, X-Frame-Options, X-Content-Type-Options, etc.)
- Upstream blocks configured for load-balancing capability (`least_conn`)

## Health Checks and Networking

Docker services include health checks:

- Server: `/health`
- Shell: `/login`
- Nginx: `/nginx-health`

Network isolation:

- `backend` network is internal-only.
- `edge` network is public-facing for Nginx ingress.

## Testing Protocol

Run these checks after startup in either mode:

```bash
curl -i http://localhost:4000/health
curl -i -X POST http://localhost:4000/graphql \
  -H 'content-type: application/json' \
  --data '{"query":"{ applications { slug nameEn } }"}'
curl -i http://localhost:3000/login
```

For Nginx HTTPS endpoints (self-signed cert), use:

```bash
curl -k -i https://localhost/nginx-health
curl -k -i https://localhost:8443/nginx-health
```

## Hot Reload Check (Local Dev)

1. Keep `pnpm run dev` running.
2. Edit a shell page file (for example `apps/shell/src/app/login/page.tsx`).
3. Refresh `http://localhost:3000/login` and confirm changes appear without manual restart.
