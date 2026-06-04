System Design Document
MOA_PORTAL – Ministry of Agriculture Portal
Version: 1.0
Date: 2026-05-10
Status: Draft
Confidentiality: Internal

Table of Contents
Introduction

High‑Level Architecture

Technology Choices & Justification

Frontend Architecture
4.1 Next.js Shell & App Routing
4.2 Dynamic Sidebar & Dashboard
4.3 Admin Console
4.4 DMS Frontend
4.5 State Management

Backend Architecture
5.1 NestJS Modular Breakdown
5.2 GraphQL Federation
5.3 Core Services
5.4 Background Job Processing

Data Layer
6.1 PostgreSQL Schema
6.2 MinIO Object Storage
6.3 Elasticsearch Indexing

Authentication & Authorization
7.1 Authentication Flow
7.2 OpenFGA ReBAC Model
7.3 Middleware & Route Protection
7.4 NestJS GraphQL Guards

Real‑Time Collaboration (DMS)

Universal Search Implementation

Extensibility & Future App Integration

Deployment & Infrastructure
11.1 Kubernetes Overview
11.2 Service Scaling & Networking

Performance & Caching

Security Considerations

Logging, Monitoring & Auditing

Conclusion

1. Introduction
This document describes the technical system design for MOA_PORTAL, the Ministry of Agriculture’s centralized, secure, and extensible digital workspace. The design translates the requirements from the Software Requirements Specification (SRS) and Product Requirements Document (PRD) into a concrete architecture. It covers frontend and backend components, data storage, real‑time collaboration, authorization, search, deployment, and the integration patterns for future Ministry applications.

2. High‑Level Architecture
MOA_PORTAL follows a modular monorepo approach with a Next.js frontend shell and a NestJS backend exposing a GraphQL API. All services (including the built‑in Document Management System) run as separate packages inside the monorepo but are deployed as a unified application on Kubernetes.

text
┌───────────────────────────────────────────────────────────┐
│                      Client Browser                        │
└──────────────┬────────────────────────────────────────────┘
               │ HTTPS (TLS 1.3)
               ▼
┌───────────────────────────────────────────────────────────┐
│                     Next.js Shell                          │
│  ┌───────────┐  ┌───────────┐  ┌───────────────────────┐  │
│  │ Auth      │  │ Sidebar   │  │ App Content Area       │  │
│  │ Middleware│  │ (Dynamic) │  │  (DMS, Admin, etc.)    │  │
│  └───────────┘  └───────────┘  └───────────────────────┘  │
└──────────────┬────────────────────────────────────────────┘
               │ GraphQL (over HTTP)
               ▼
┌───────────────────────────────────────────────────────────┐
│                    NestJS API Gateway                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Auth     │  │ App      │  │ DMS      │  │ Search   │  │
│  │ Module   │  │ Registry │  │ Module   │  │ Module   │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
│       │             │             │             │         │
└───────┼─────────────┼─────────────┼─────────────┼─────────┘
        │             │             │             │
  ┌─────▼──┐   ┌──────▼──┐  ┌──────▼──┐  ┌──────▼──────┐
  │OpenFGA │   │PostgreSQL│  │  MinIO  │  │Elasticsearch│
  └────────┘   └─────────┘  └─────────┘  └─────────────┘
                     ▲
                     │ BullMQ (Redis)
┌────────────────────┴─────────────────────────────────────┐
│              Background Workers                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────┐ │
│  │DMS Indexer│  │Notification│  │Future App Workers  │ │
│  └────────────┘  └────────────┘  └────────────────────┘ │
└─────────────────────────────────────────────────────────┘
3. Technology Choices & Justification
The stack is locked per the SRS. Every choice serves a specific purpose:

Technology	Role	Why
Turborepo	Monorepo orchestrator	Efficient builds, dependency graphs across packages.
Next.js 14 (App Router)	Frontend framework	Server‑side rendering, middleware, nested layouts for shell + apps.
Tailwind CSS + Shadcn UI	Styling & components	Rapid, consistent, accessible UI; easy theming for MOA branding.
dnd kit	Dashboard drag‑and‑drop	Accessible, lightweight, supports customisable widget layouts.
TipTap	Rich text editor (DMS)	Extensible, collaborative‑ready, works with Yjs.
NestJS	Backend server	Structured modules, decorators, native GraphQL support, guards.
GraphQL (Apollo Federation)	API layer	Flexible queries, subgraph composition for future apps.
PostgreSQL + Drizzle ORM	Database	Relational consistency, type‑safe queries, migration tools.
MinIO	Object storage	S3‑compatible, self‑hosted, AES‑256 encryption at rest.
OpenFGA	Authorization	Relationship‑based access control (ReBAC), fast checks, decoupled.
Elasticsearch	Full‑text search	Scalable indexing, fuzzy search, aggregations, permission filtering.
BullMQ + Redis	Job queues	Reliable background processing for indexing, notifications.
Yjs + WebSocket server	Real‑time collaboration	CRDT‑based, offline‑first, syncs documents seamlessly.
4. Frontend Architecture
4.1 Next.js Shell & App Routing
The portal is a single Next.js application using the App Router. The folder structure:

text
apps/
  shell/                  # Next.js shell
    src/
      app/
        layout.tsx        # Root layout (HTML, providers, auth)
        page.tsx          # Dashboard (customisable)
        apps/
          [slug]/         # Dynamic app loader
            page.tsx      # Checks permission, renders app component
        admin/
          page.tsx        # Admin console (protected)
      middleware.ts       # Route interception, 403/404
      providers/
        AuthProvider.tsx
        PermissionProvider.tsx
  dms/                    # DMS package (exported components & pages)
    src/
      pages/              # Actual DMS pages (folders, documents, editor)
      components/
      graphql/            # DMS-specific hooks/mutations
  admin/                  # Admin panel package (optional, could be in shell)
  shared/                 # Shared UI, auth utils, OpenFGA client
The shell’s layout.tsx renders the header, dynamic sidebar, and a <main> slot that loads the child content. The route /apps/[slug] uses the applications table to resolve which app package to load. If the user lacks permission, middleware blocks it before rendering.

4.2 Dynamic Sidebar & Dashboard
Sidebar: After login, the shell calls a GraphQL query myApps to fetch the user’s user_applications. The sidebar iterates over the result and renders navigation links. Applications not in the list are never rendered.

Dashboard: Utilises dnd kit to allow rearranging of widgets (recent DMS files, app shortcut cards). The layout is saved to a user_preferences JSONB column or a dedicated table via a GraphQL mutation.

4.3 Admin Console
The /admin route is protected by middleware (only users with an admin role or a dedicated admin application assignment can access). It includes:

App registration form (calls registerApplication mutation).

User assignment interface (batch assignment, search users).

Application list with status toggles.

Universal search configuration per app.

4.4 DMS Frontend
The DMS frontend is a standalone package that exports its page tree. Key components:

FileExplorer: Hierarchical tree view, drag‑and‑drop move.

Pre‑signed uploader: Requests a pre‑signed URL from the DMS API, then uploads directly to MinIO (via fetch or axios).

Version history panel: Shows all versions, with restore/download buttons.

Check‑out/in: Status indicator, lock/unlock controls.

Collaborative editor: TipTap editor integrated with y-websocket provider pointing to the Yjs WebSocket server.

4.5 State Management
Authentication state: React Context (AuthProvider) holding user object, token, and permission vector. Persisted in an HTTP‑only cookie (for JWT) or session.

Permission caching: After login, the list of permitted app slugs is stored in memory and a lightweight context. Navigation and middleware use this to avoid extra API calls on every render.

Apollo Client: GraphQL client with cache normalisation. Queries for apps, DMS content, and search results are cached and optimistically updated where possible.

5. Backend Architecture
5.1 NestJS Modular Breakdown
The NestJS server is a federated GraphQL gateway. Each business domain lives in its own module:

text
server/
  src/
    modules/
      auth/               # Login, logout, token validation
      application/        # CRUD for applications, user_applications
      dms/                # DMS subgraph: files, folders, versions, locks
      search/             # Search resolver that queries Elasticsearch
      admin/              # Admin utilities (maybe combined with application)
    guards/
      auth.guard.ts       # JWT validation
      application.guard.ts # Permission check via OpenFGA
    services/
      openfga.service.ts  # OpenFGA client wrapper
      elasticsearch.service.ts
      minio.service.ts
    queue/
      dms-indexer.processor.ts
      notification.processor.ts
5.2 GraphQL Federation
The portal exposes a single /graphql endpoint. Apollo Federation composes subgraphs:

Core subgraph: User, Application, UserApplication types, queries for app list and admin operations.

DMS subgraph: Document, Folder, Version types, mutations for upload, checkout, etc.

Search subgraph: SearchResult union type, search query with permission filtering.

Each subgraph can be developed independently (as separate packages) and federated at build time or via managed federation. In v1.0 the gateway is monolithic but structured for easy extraction.

5.3 Core Services
Service	Responsibility
AuthService	Validates credentials against users table, issues JWT (or session ID).
ApplicationService	Manages applications and user_applications CRUD; writes OpenFGA tuples when assignments change.
DMSService	Core DMS logic: folder hierarchy, pre‑signed URL generation, version creation, lock management, triggering indexing jobs.
SearchService	Constructs Elasticsearch queries, post‑filters results using OpenFGA for each hit, returns mutable results.
5.4 Background Job Processing
BullMQ queues handle asynchronous tasks:

dms‑indexer: On file.uploaded event, extracts text (if needed), pushes to Elasticsearch. On file.deleted, removes from index.

future‑notifications: For apps like task managers, appointment reminders etc. Queues are separated per app (dms, todo, etc.) by queue prefix.

Redis is used as the backing store for BullMQ and also for caching permission tuples (see Section 12).

6. Data Layer
6.1 PostgreSQL Schema
The core schema (users, applications, user_applications) is defined in the SRS. Additional tables for the DMS (and future apps) are created within the same PostgreSQL database but logically separated per app (prefix dms_, todo_, etc.).

DMS Schema (high‑level)

sql
-- dms_spaces: top-level workspaces
CREATE TABLE dms_spaces (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_by UUID REFERENCES users(id),
  ...
);

-- dms_libraries: document libraries within spaces
CREATE TABLE dms_libraries (
  id UUID PRIMARY KEY,
  space_id UUID REFERENCES dms_spaces(id),
  name VARCHAR(255) NOT NULL,
  ...
);

-- dms_folders: hierarchical (parent_id self-reference)
CREATE TABLE dms_folders (
  id UUID PRIMARY KEY,
  library_id UUID REFERENCES dms_libraries(id),
  parent_id UUID REFERENCES dms_folders(id),
  name VARCHAR(255) NOT NULL,
  ...
);

-- dms_files: file metadata
CREATE TABLE dms_files (
  id UUID PRIMARY KEY,
  folder_id UUID REFERENCES dms_folders(id),
  name VARCHAR(255) NOT NULL,
  current_version INT DEFAULT 1,
  locked_by UUID REFERENCES users(id),
  locked_at TIMESTAMP,
  ...
);

-- dms_versions: immutable versions
CREATE TABLE dms_versions (
  id UUID PRIMARY KEY,
  file_id UUID REFERENCES dms_files(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  minio_object_key VARCHAR(500) NOT NULL,
  size BIGINT,
  created_by UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(file_id, version_number)
);
All access to these tables goes through Drizzle ORM, enabling type‑safe queries and automatic migrations.

6.2 MinIO Object Storage
Buckets: One bucket for DMS (moa-dms). Object key format: {file_id}/{version_number}.

Pre‑signed URLs: Generated with minio-js client. Expiry 5 minutes. The client uploads directly, bypassing the NestJS server to scale file transfers.

Encryption: Server‑side encryption (SSE‑S3) enabled. Access to MinIO is restricted via network policies to only the backend services.

6.3 Elasticsearch Indexing
Indexes are named with an application prefix: dms_files, dms_folders, and later todo_tasks, etc.

Index mapping (DMS example)

json
{
  "dms_files": {
    "properties": {
      "id": { "type": "keyword" },
      "name": { "type": "text", "analyzer": "standard" },
      "content": { "type": "text" },
      "created_by": { "type": "keyword" },
      "app_slug": { "type": "keyword" }, // 'dms'
      "resource_type": { "type": "keyword" },
      "created_at": { "type": "date" }
    }
  }
}
A BullMQ worker (DmsIndexerProcessor) listens to events from the DMS service, transforms the document into the above format, and indexes it. Deletion events trigger the removal.

7. Authentication & Authorization
7.1 Authentication Flow
User submits credentials to /api/auth/login.

NestJS AuthService verifies against users table (password hashed with bcrypt).

On success, a JWT is issued (signed with RS256) containing userId, email, and a role claim (optional). The JWT is stored in an HTTP‑only, Secure, SameSite=Strict cookie.

The Next.js middleware reads the cookie, validates the JWT, and attaches the user info to the request context.

For GraphQL calls, the Apollo client sends the JWT in an Authorization header as well.

7.2 OpenFGA ReBAC Model
The authorization model is written in OpenFGA DSL:

text
type user
type application
  relations
    define viewer: [user] or admin
type admin
  relations
    define member: [user]
Authorization tuples:

When an admin assigns app X to user U, a tuple [application:X] viewer [user:U] is written.

When revoked, the tuple is deleted.

An admin relation can grant global admin rights: [application:admin] member [user:AdminUser].

Resource‑level permissions inside DMS (e.g., folder access) will follow a similar pattern: folder → editor/reader.

Check points: The system checks (user:U, viewer, application:X) for app access, and (user:U, editor, folder:F) for folder editing, etc.

7.3 Middleware & Route Protection
Next.js Middleware (middleware.ts):

Parse URL: /apps/{slug}/....

If the path starts with /apps/, extract the slug.

Look up the authenticated user’s assigned apps (from a cached set stored in the session or via a fast OpenFGA check).

If the slug is not in the set and the application is active → respond with 403.

If the application is inactive → respond with 404.

All other routes pass through (with exceptions for /admin which also requires admin role).

7.4 NestJS GraphQL Guards
AuthGuard (global): Validates JWT and attaches req.user.

ApplicationGuard (custom decorator): For operations belonging to a specific app (e.g., DMS mutations), the guard extracts the app slug (from resolver context or argument) and calls OpenFGA to check (user:userId, viewer, application:slug). If denied, throws a ForbiddenException.

To minimise latency, OpenFGA checks are cached in Redis (TTL 30‑60 seconds). When an admin changes assignments, an event is published, and the cache for that user is invalidated.

8. Real‑Time Collaboration (DMS)
The DMS collaborative editor uses Yjs + y‑websocket. A dedicated WebSocket server (integrated into the NestJS app or as a separate Node.js process) maintains Y.js document states.

Rooms: Each DMS file corresponds to a room named dms:{fileId}.

Authentication: The WebSocket connection handshake carries the JWT; the server verifies it and ensures the user has editor access to the file (via OpenFGA).

Persistence: The Y.js document is stored in PostgreSQL (as a binary update) or periodically persisted to MinIO as a snapshot. The authoritative version is always the latest file version in MinIO; the Yjs state is the collaborative delta.

Cursors & Awareness: The y-websocket provider propagates cursor positions and user awareness.

9. Universal Search Implementation
Query entry: The frontend’s SearchBar calls a search(query: String!, apps: [String!]) GraphQL query.

Resolver flow:

Determine the list of apps the user has access to (if apps parameter is empty, use all permitted apps from their permission vector).
Build a multi‑index Elasticsearch query targeting {app}_files, {app}_folders, etc.
Send request to Elasticsearch.
Collect hits, and for each hit (which contains the resource ID and owner app), run a batch OpenFGA check to ensure the user can actually view the resource (fine‑grained check beyond app‑level access).
Return results categorised by app.
Performance: OpenFGA checks are batched and results are cached; typical search latency < 300 ms.

10. Extensibility & Future App Integration
To add a new Ministry application (e.g., a Crop Monitoring System), developers follow these steps:

Create a new package in the monorepo under apps/crop-monitor/, exporting a set of Next.js pages and a NestJS GraphQL module.

Register the app using the Admin Console: slug crop-monitor, route /apps/crop-monitor, search enabled.

Implement subgraph for the new app, which will be composed into the gateway (federation).

Middleware & Guards automatically protect routes and GraphQL operations once the app is registered and users assigned.

Search: The app emits events (or directly calls a shared service) to index its content into Elasticsearch with prefix crop-monitor_. The app provides a mapper to the universal search service.

Database: The app creates its own tables (using Drizzle migrations) within the shared PostgreSQL. Cross‑app joins are discouraged; communication happens through APIs.

Background Jobs: The app can define its own BullMQ queues, isolated by naming convention.

This ensures no changes to the shell are required; the portal remains stable.

11. Deployment & Infrastructure
11.1 Kubernetes Overview
All components are containerised and deployed on a Kubernetes cluster (on‑premise or Ministry cloud). The cluster runs:

Next.js Pods – 2‑3 replicas for the frontend.

NestJS Pods – 2‑3 replicas for GraphQL backend.

PostgreSQL – StatefulSet with PersistentVolume (AES‑256 encrypted).

MinIO – Tenant-based MinIO operator or external S3‑compatible storage.

Elasticsearch – ECK (Elastic Cloud on Kubernetes) or external cluster.

Redis – For BullMQ and caching.

OpenFGA – Deployed as per official Helm chart, backed by PostgreSQL.

BullMQ Workers – Separate Deployments for each queue (DMS indexer, etc.) that can scale independently.

11.2 Service Scaling & Networking
Horizontal Pod Autoscaler (HPA) on CPU/memory for Next.js and NestJS.

Ingress controller (NGINX) terminates TLS and routes traffic.

Service mesh (optional) for internal encryption and observability.

Network policies restrict direct access to databases, MinIO, and Elasticsearch to backend pods only.

12. Performance & Caching
Permission caching: User‑app permission vectors are cached in Redis with a key user:{userId}:apps. Middleware and guards use this cache with a short TTL (30s). Invalidation happens on admin changes via Pub/Sub.

OpenFGA check caching: The OpenFGA client SDK caches check responses; combined with Redis, repeated checks for the same user‑app pair avoid network calls.

GraphQL caching: Apollo server uses persisted queries and response caching where appropriate.

Next.js: Static generation of admin console shell parts, ISR for infrequently changed dashboard content.

Elasticsearch: Optimised queries, query result caching at ES level.

13. Security Considerations
TLS 1.3 enforced on all external endpoints; internal traffic can use mTLS if required.

HTTP‑only, Secure, SameSite cookies for JWTs prevent XSS token theft.

Content Security Policy (CSP) headers to mitigate XSS risks.

Row‑level security in PostgreSQL? Not strictly necessary because all queries go through Drizzle ORM with application‑level authorization, but DMS data relies on OpenFGA for fine‑grained access.

MinIO buckets are private; pre‑signed URLs expire quickly and are scoped to the single object.

Audit logging of all access control changes (admin actions) and forbidden attempts is stored in a logging system (ELK stack or similar).

14. Logging, Monitoring & Auditing
Structured logging with correlation IDs across Next.js and NestJS (via Pino or Winston).

Metrics: Prometheus endpoints exposed for API latency, error rates, OpenFGA check durations.

Audit trail: All admin mutations (registerApplication, assignUserToApplication, revokeAccess) are logged to a dedicated audit_logs table in PostgreSQL with user ID, timestamp, and operation details.

Health checks: Kubernetes liveness/readiness probes on all services.

15. Conclusion
This system design provides a scalable, secure, and extensible foundation for MOA_PORTAL. By enforcing a strict separation of concerns and leveraging industry‑standard tools (Next.js, NestJS, OpenFGA, GraphQL Federation), the Ministry can securely unify its workforce onto a single platform, add future agricultural applications rapidly, and maintain high performance and compliance.