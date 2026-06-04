Project Structure
MOA_PORTAL – Ministry of Agriculture Portal
Version: 1.0
Date: 2026-05-10
Status: Draft
Confidentiality: Internal

Table of Contents
Overview

Monorepo Root

Workspace Packages
3.1 Shell (apps/shell)
3.2 DMS (apps/dms)
3.3 Admin Console (apps/admin)
3.4 Shared Library (packages/shared)
3.5 Server (apps/server)

Development & Build Configuration

Environment Variables

Deployment & Infrastructure

1. Overview
MOA_PORTAL is organized as a Turborepo monorepo. All source code, configuration, and infrastructure definitions are co‑located under a single version‑controlled repository. This structure promotes code sharing, consistent tooling, and atomic deployments of the Next.js frontend shell, NestJS backend, built‑in DMS, and future applications.

The monorepo is divided into:

apps/ – Runnable applications (shell, DMS, admin, server).

packages/ – Shared libraries (UI, auth utilities, OpenFGA client, Drizzle schemas).

config/ – Shared TypeScript, ESLint, Tailwind, and build configurations.

infrastructure/ – Kubernetes manifests, Dockerfiles, Helm charts.

2. Monorepo Root
text
MOA_PORTAL/
├── .github/                    # CI / CD pipelines
├── apps/                       # Application packages
├── packages/                   # Shared libraries
├── config/                     # Shared tooling configs
├── infrastructure/             # Deployment manifests
├── package.json                # Root Turborepo setup
├── pnpm-workspace.yaml         # PNPM workspace definition
├── turbo.json                  # Turborepo pipeline configuration
├── tsconfig.base.json          # Base TypeScript configuration
├── .env.example                # Environment variable template
├── .gitignore
├── LICENSE
└── README.md
Key root files:

pnpm-workspace.yaml: Lists the workspace packages (apps/*, packages/*).

turbo.json: Defines build, lint, test pipelines; caching; dependency ordering.

tsconfig.base.json: Shared TypeScript compiler options; each package extends this.

3. Workspace Packages
3.1 Shell (apps/shell)
The Next.js 14 (App Router) frontend responsible for global layout, authentication, dynamic sidebar, dashboard, and app routing.

text
apps/shell/
├── next.config.js              # Next.js configuration (i18n, rewrites)
├── tailwind.config.ts          # Tailwind + MOA branding tokens
├── postcss.config.js
├── tsconfig.json
├── package.json
├── public/
│   ├── moa-logo.svg
│   └── favicon.ico
└── src/
    ├── app/
    │   ├── layout.tsx          # Root layout: header, sidebar, main slot
    │   ├── page.tsx            # Dashboard page (server component wrapper)
    │   ├── login/
    │   │   └── page.tsx        # Login page
    │   ├── apps/
    │   │   └── [slug]/
    │   │       └── page.tsx    # Dynamic app loader; permission check
    │   ├── admin/
    │   │   └── page.tsx        # Admin console (protected)
    │   └── error.tsx           # Global error boundary
    ├── middleware.ts            # Route interception, 403/404
    ├── components/              # Shared UI components
    │   ├── Header.tsx
    │   ├── Sidebar.tsx
    │   ├── SearchBar.tsx
    │   ├── WidgetGrid.tsx
    │   └── ErrorState.tsx
    ├── providers/               # React context providers
    │   ├── AuthProvider.tsx
    │   ├── PermissionProvider.tsx
    │   └── ApolloProvider.tsx
    ├── hooks/
    │   ├── usePermissions.ts
    │   └── useSearch.ts
    ├── styles/
    │   └── globals.css
    └── lib/
        └── graphql/
            └── client.ts       # Apollo Client setup
3.2 DMS (apps/dms)
The built‑in Document Management application. Exports Next.js pages and a GraphQL subgraph module for the NestJS server.

text
apps/dms/
├── package.json
├── tsconfig.json
├── src/
│   ├── frontend/               # Next.js pages & components (can be imported by shell)
│   │   ├── pages/
│   │   │   ├── DocumentLibrary.tsx
│   │   │   ├── FilePreview.tsx
│   │   │   └── CollaborativeEditor.tsx
│   │   ├── components/
│   │   │   ├── FolderTree.tsx
│   │   │   ├── UploadButton.tsx
│   │   │   ├── VersionHistory.tsx
│   │   │   └── CheckoutBadge.tsx
│   │   └── hooks/
│   │       ├── useDocuments.ts
│   │       └── useCollaboration.ts
│   ├── graphql/                # DMS subgraph (schema + resolvers)
│   │   ├── dms.graphql         # SDL for DMS types
│   │   ├── resolvers.ts
│   │   └── permissions.ts     # DMS-specific auth checks
│   ├── services/
│   │   ├── dms.service.ts
│   │   ├── minio.service.ts
│   │   └── indexing.service.ts
│   └── db/
│       ├── schema.ts           # Drizzle ORM schema for DMS tables
│       └── migrations/
└── config/
    └── app.config.ts           # App metadata: slug, search config, etc.
3.3 Admin Console (apps/admin)
(Optional separation; could also reside within shells admin route, but a separate package allows independent development.)

text
apps/admin/
├── package.json
├── tsconfig.json
└── src/
    ├── frontend/
    │   ├── pages/
    │   │   ├── AppRegistry.tsx
    │   │   ├── UserAssignment.tsx
    │   │   └── AuditLogs.tsx
    │   └── components/
    │       ├── AppForm.tsx
    │       ├── AssignmentPanel.tsx
    │       └── StatusToggle.tsx
    └── graphql/
        ├── admin.graphql
        └── resolvers.ts
3.4 Shared Library (packages/shared)
Reusable code across all workspaces: UI primitives, auth utilities, Drizzle schemas, OpenFGA client.

text
packages/shared/
├── package.json
├── tsconfig.json
├── src/
│   ├── ui/                     # Re-exported Shadcn UI components, custom MOA themes
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── index.ts
│   ├── auth/
│   │   ├── jwt.ts              # JWT verification helpers
│   │   └── permissions.ts      # Utility to check permissions
│   ├── db/
│   │   ├── core-schema.ts      # Drizzle schema for users, applications, user_applications
│   │   └── client.ts           # Drizzle DB client factory
│   ├── openfga/
│   │   ├── client.ts           # OpenFGA client wrapper
│   │   └── tuples.ts           # Tuple creation helpers
│   ├── queue/
│   │   └── common-events.ts    # BullMQ event types
│   └── utils/
│       ├── i18n.ts
│       └── constants.ts
└── config/
    └── eslint-preset.js
3.5 Server (apps/server)
The NestJS Application Server that serves the federated GraphQL gateway and background workers.

text
apps/server/
├── package.json
├── tsconfig.json
├── nest-cli.json
└── src/
    ├── main.ts                 # Bootstrap: Gateway + Microservice (for workers)
    ├── modules/
    │   ├── auth/
    │   │   ├── auth.module.ts
    │   │   ├── auth.resolver.ts
    │   │   └── auth.service.ts
    │   ├── application/
    │   │   ├── application.module.ts
    │   │   ├── application.resolver.ts
    │   │   └── application.service.ts
    │   ├── dms/
    │   │   ├── dms.module.ts   # Loads DMS subgraph from apps/dms
    │   │   └── dms.gateway.ts  # Federation integration
    │   └── search/
    │       ├── search.module.ts
    │       ├── search.resolver.ts
    │       └── search.service.ts
    ├── guards/
    │   ├── auth.guard.ts
    │   └── application.guard.ts # Uses OpenFGA to verify app access
    ├── services/
    │   ├── openfga.service.ts
    │   ├── elasticsearch.service.ts
    │   └── minio.service.ts
    ├── queue/
    │   ├── dms-indexer.processor.ts
    │   └── notification.processor.ts
    └── common/
        ├── decorators/
        │   └── app-slug.decorator.ts
        └── filters/
            └── http-exception.filter.ts
4. Development & Build Configuration
Package scripts: Each apps/* and packages/* defines its own dev, build, lint, test. Turborepo orchestrates them.

Example turbo.json pipeline:

json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "test": {}
  }
}
Dependency management: PNPM with pnpm-lock.yaml. Workspace protocol used for internal packages ("@moa/shared": "workspace:*").

5. Environment Variables
Each package may consume environment variables, but they are centralized in the root .env.example:

env
# Core
NODE_ENV=development
PORT=3000

# PostgreSQL
DATABASE_URL=postgres://user:pass@localhost:5432/moa_portal

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=...
MINIO_SECRET_KEY=...
MINIO_BUCKET=moa-dms

# Redis / BullMQ
REDIS_URL=redis://localhost:6379

# Elasticsearch
ELASTICSEARCH_URL=http://localhost:9200

# OpenFGA
OPENFGA_API_URL=http://localhost:8080
OPENFGA_STORE_ID=...

# Auth
JWT_SECRET=...
JWT_EXPIRES_IN=24h

# i18n
DEFAULT_LOCALE=en
These are injected into the respective services via Kubernetes Secrets in production.

6. Deployment & Infrastructure
The infrastructure/ folder contains everything needed to deploy on Kubernetes:

text
infrastructure/
├── docker/
│   ├── Dockerfile.shell         # Next.js production Dockerfile
│   ├── Dockerfile.server       # NestJS production Dockerfile
│   └── Dockerfile.worker       # BullMQ worker Dockerfile
├── kubernetes/
│   ├── namespace.yaml
│   ├── secrets.yaml            # Sealed secrets or references
│   ├── configmap.yaml
│   ├── deployments/
│   │   ├── shell.yaml
│   │   ├── server.yaml
│   │   ├── worker-dms-indexer.yaml
│   │   └── redis.yaml
│   ├── services/
│   │   ├── shell-service.yaml
│   │   ├── server-service.yaml
│   │   └── elasticsearch-service.yaml
│   ├── ingress.yaml            # TLS termination, routing rules
│   └── statefulsets/
│       └── postgres.yaml
└── helm/
    └── moa-portal/
        ├── Chart.yaml
        ├── values.yaml
        └── templates/          # Helm chart for easy upgrades
Build pipeline (CI) compiles each app, runs tests, builds Docker images, and pushes to a container registry. Deployment is staged: Alpha → Beta → GA as defined in the PRD.