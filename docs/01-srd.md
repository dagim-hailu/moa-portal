Software Requirements Specification (SRS)
MOA_PORTAL – Ministry of Agriculture Portal
Document Version: 1.0
Date: 2026-05-10
Status: Draft
Confidentiality: Internal

Table of Contents
Introduction
1.1 Purpose
1.2 Scope
1.3 Definitions & Acronyms

Overall Description
2.1 Product Perspective
2.2 User Characteristics
2.3 Operating Environment
2.4 Design & Implementation Constraints

System Features & Functional Requirements
3.1 Core Portal Shell & App Framework
3.1.1 Single Authenticated Entry & Dynamic Shell
3.1.2 Application Registry & Admin Management
3.1.3 Authorization & Dynamic Access Control
3.1.4 Universal Search (Optional / Configurable)
3.2 Built‑in Application: Document Management System (DMS)
3.3 Future Application Extensibility

External Interface Requirements
4.1 User Interface
4.2 Navigation & Routing
4.3 Universal Search Interface
4.4 Admin Console

Non‑Functional Requirements
5.1 Performance
5.2 Security & Encryption
5.3 Availability & Fault Isolation

Technical Architecture & Stack
6.1 Locked Production Stack
6.2 Monorepo Strategy
6.3 API & Data Flow

Database Design & Data Management
7.1 Core Permission Schema
7.2 DMS‑Specific Storage
7.3 Search Indexing

Security & Authorization Requirements
8.1 Authentication
8.2 Fine‑Grained Authorization
8.3 Route & API Protection
8.4 Data Encryption

Other Requirements

1. Introduction
1.1 Purpose
This document specifies the software requirements for MOA_PORTAL, the centralized digital workspace for the Ministry of Agriculture (MOA). MOA_PORTAL serves as a secure application hub, providing a unified entry point for all ministerial staff. It ships with a built-in Document Management System (DMS) and an extensible app framework that allows administrators to register and manage additional line-of-business applications (e.g., crop monitoring, livestock tracking, subsidy management) in the future. All access is governed by a strict, relationship-based authorization model: users see and interact only with the applications and data explicitly assigned to their role.

1.2 Scope
The initial delivery (v1.0) includes:

Core Portal Shell & App Framework – Single sign‑on, dynamic sidebar navigation, application registration, user‑app assignment, and middleware‑based route protection.

Built‑in Document Management System (DMS) – Hierarchical document libraries, file uploads via pre‑signed URLs, version control, check‑out/in locking, real‑time collaborative editing, and full‑text search.

Extensibility Foundation – Clear contracts and isolation patterns so that future MOA‑specific applications can be developed as separate packages, registered by an administrator, and immediately subjected to the portal’s permission model.

The platform does not contain any other business applications beyond the DMS; examples like crop management or subsidy tracking are representative of what can be added later.

1.3 Definitions & Acronyms
Term / Acronym	Description
MOA_PORTAL	Ministry of Agriculture Portal – the product.
Shell	Persistent UI wrapper (header, sidebar, content area) that hosts registered applications.
Application / App	A separately developed, routable functional module registered in the applications table. The DMS is the first such app; future MOA apps follow the same model.
Authorization Vector	The set of application IDs a user is permitted to access.
OpenFGA	Fine‑grained authorization engine (ReBAC) used to validate relationships between users, applications, and resources.
MinIO	S3‑compatible object storage for DMS file blobs and versions.
Yjs	CRDT library enabling real‑time collaborative document editing within the DMS.
BullMQ	Redis‑backed job queue for background indexing and future cross‑app hooks.
Elasticsearch	Distributed search engine indexing DMS content and, optionally, other app data for universal search.
2. Overall Description
2.1 Product Perspective
MOA_PORTAL is a greenfield platform that consolidates access to multiple agricultural IT systems under one roof. It provides the mandatory shell, the first built‑in application (DMS), and administrative tooling to register future apps. All components share a unified authentication, authorization, and search infrastructure. The system will be deployed as Docker containers on the Ministry’s Kubernetes cluster.

2.2 User Characteristics
Ministry Staff (End Users) – Agricultural officers, extension workers, administrators, and policy makers who use the DMS to store, share, and collaborate on official documents. They may later be assigned additional apps.

Portal Administrators – IT administrators responsible for managing the application registry, assigning user permissions, and configuring global settings.

Application Developers – Internal MOA teams or third‑party contractors who will build future agriculture‑specific applications on top of the portal’s framework.

2.3 Operating Environment
Client: Modern web browsers (Chrome, Firefox, Safari, Edge) on desktops and tablets.

Server: Linux containers (Docker) orchestrated by Kubernetes.

Network: HTTPS (TLS 1.3) for all communications; may be deployed on the Ministry’s intranet or a private cloud.

2.4 Design & Implementation Constraints
The tech stack is locked to the components listed in Section 6.1; no substitutions allowed.

All applications (built‑in DMS and future MOA apps) must be registered in the applications table and respect the same access‑control contracts.

The portal is a single Next.js application; apps are loaded as separate route segments (/apps/[slug]) within the monorepo, not as micro‑frontends.

3. System Features & Functional Requirements
3.1 Core Portal Shell & App Framework
3.1.1 Single Authenticated Entry & Dynamic Shell
FR‑CS‑01 – A unified login page (branded with MOA identity) must be the sole entry point. After successful authentication, the portal fetches the user’s assigned applications (authorization vector).

FR‑CS‑02 – The left sidebar renders navigation items only for applications present in the user’s user_applications mapping. Forbidden applications are completely absent from the DOM—no icon, label, or route is rendered.

FR‑CS‑03 – The dashboard area allows users to customize their landing page layout by dragging and dropping widgets (e.g., app shortcut cards, recent DMS files). Layout preferences are persisted per user.

3.1.2 Application Registry & Admin Management
FR‑REG‑01 – Administrators can register a new application by providing:

Unique slug (e.g., crop-monitor, subsidy-tracker)

Display name

Base route path (e.g., /apps/crop-monitor)

Active/inactive flag

Whether universal search is enabled for this app (see 3.1.4).

Data is stored in the applications table.

FR‑REG‑02 – Administrators can assign applications to users by adding entries to the user_applications table. Assignment can be individual or batch (e.g., by department).

FR‑REG‑03 – Administrators can revoke an application from a user; the app disappears immediately from the sidebar, and all its routes and APIs become inaccessible.

FR‑REG‑04 – The admin console displays the list of registered apps, their active status, and the number of assigned users.

FR‑REG‑05 – An application can be toggled inactive to hide it from all users (even those assigned). Inactive apps return a 404 if accessed directly.

3.1.3 Authorization & Dynamic Access Control
FR‑AUTH‑01 – Middleware Protection: Next.js middleware inspects every request. If the path maps to a registered app (e.g., /apps/subsidy-tracker) and the user does not have that application in their user_applications, the middleware returns HTTP 403 Forbidden.

FR‑AUTH‑02 – API‑Level Guard: NestJS GraphQL guards examine the operation name. Queries/mutations targeting an app’s resolver must verify the user’s permissions before database access. Unauthorized operations are denied.

FR‑AUTH‑03 – Authorization decisions leverage OpenFGA, which stores relationship tuples: user:[id] → has_access → application:[slug]. The user_applications table serves as the source of truth; OpenFGA caches the tuple for performance.

FR‑AUTH‑04 – Changes to user‑app assignments (additions/revocations) must take effect within one second, either through cache invalidation or event‑driven updates.

FR‑AUTH‑05 – The portal must not leak any information about an app’s existence to unauthorized users (sidebar, search autocomplete, error messages).

3.1.4 Universal Search (Optional / Configurable)
FR‑SRCH‑01 – The shell header contains a persistent search input that queries an Elasticsearch index. This feature can be globally enabled/disabled and configured per application by the administrator.

FR‑SRCH‑02 – When enabled, the search scope includes indexes of all permitted applications for the current user. In v1.0, this spans DMS content only; future apps will register their own index mappings.

FR‑SRCH‑03 – Search results are pre‑filtered by the user’s authorization vector and additionally post‑filtered using OpenFGA to guarantee the user can view the resource.

FR‑SRCH‑04 – Results display in a dropdown categorised by application (app icon + title), including a snippet and direct link.

FR‑SRCH‑05 – Administrators can configure per‑app searchable fields (title, description, metadata) during app registration.

3.2 Built‑in Application: Document Management System (DMS)
The DMS is the first application shipped with the portal, pre‑registered as dms and ready to manage MOA’s official documents.

FR‑DMS‑01 – Hierarchical Folder Structure
Supports nested directories: Site Spaces → Document Libraries → Folders → Files. Users can create, rename, move, and delete nodes subject to DMS‑specific permissions.

FR‑DMS‑02 – File Upload with Pre‑signed URLs
Files are uploaded directly to MinIO using pre‑signed URLs generated by the DMS API. Workflow: request link → upload to MinIO → notify DMS → file record created → BullMQ indexing job triggered.

FR‑DMS‑03 – Version Control
Every modification creates a new immutable version. All previous versions are retained and can be viewed, downloaded, or restored.

FR‑DMS‑04 – Check‑Out / Check‑In Locking
Users can check out a file to prevent concurrent edits. Only the locker may upload a new version; others see a read‑only status. Checking in releases the lock.

FR‑DMS‑05 – Real‑Time Collaborative Editing
Supported document types offer a TipTap‑based rich text editor with real‑time collaboration via Yjs. Multiple users can edit simultaneously, with live cursor presence and conflict‑free merging.

FR‑DMS‑06 – Search & Indexing
DMS content (file names, folder names, full‑text extracted content) is indexed in Elasticsearch via a BullMQ worker. Indexing must complete within 5 seconds of upload.

FR‑DMS‑07 – Cross‑App Referencing (Future‑Ready)
Document/folder links can be stored as standardized resource links that other future apps can embed (e.g., a crop inspection app attaching a policy document). Portal shell resolves the link and enforces permissions.

3.3 Future Application Extensibility
MOA_PORTAL is designed to host additional agricultural applications (e.g., crop health, livestock management, subsidy distribution). The following contracts must be met:

Registration – Any new app must be added to the applications table via the admin console, and users assigned through user_applications.

Route Convention – Apps mount under /apps/[slug]. The shell loads the app’s component only if permission is granted.

Authorization – Middleware and GraphQL guards automatically protect new routes and resolvers once the app is registered. OpenFGA tuples are extended accordingly.

Search Integration – New apps can provide an indexing mapper to push content (titles, metadata) into Elasticsearch, tagged with the app slug.

Background Jobs – Apps define their own BullMQ queues (isolated by naming convention).

UI Isolation – Each app is a separate monorepo package that renders inside the shell’s content area. Errors in one app must not crash the shell or other apps.

Database Isolation – Apps use their own tables/schemas within the shared PostgreSQL; cross‑app data access is forbidden except via explicit authorization.

Detailed requirements for each future application will be defined in their respective SRS addenda.

4. External Interface Requirements
4.1 User Interface
All UI is built with Tailwind CSS and Shadcn UI, maintaining the Ministry’s corporate design language.

The interface must meet WCAG 2.1 AA accessibility standards (keyboard navigation, focus management, color contrast).

Dashboard drag‑and‑drop uses dnd kit for accessible, smooth interactions.

4.2 Navigation & Routing
The left sidebar updates dynamically after login to show only permitted apps, without full‑page reload.

Direct URL entry to an unauthorized app route results in a 403 error page rendered inside the shell.

Inactive or unknown routes return a 404 error page.

4.3 Universal Search Interface
A persistent search bar at the top, available on all pages.

Results appear in real‑time as the user types (300 ms debounce), categorized by app.

Clicking a result navigates directly to the resource; the route guard provides a second layer of permission enforcement.

4.4 Admin Console
Dedicated route (/admin) accessible only to users with the portal administrator role.

Provides forms to register new applications, manage user‑app assignments, and configure universal search.

Styled consistently with the rest of the portal.

5. Non‑Functional Requirements
5.1 Performance
NFR‑P01 – Core shell (header, sidebar, content container) must paint within 1.5 seconds on a 4G network.

NFR‑P02 – Universal search results must return in < 300 ms for 95% of queries.

NFR‑P03 – DMS file indexing in Elasticsearch must complete within 5,000 milliseconds of upload finalisation.

NFR‑P04 – Admin operations (app registration, user assignment) must complete API calls in < 200 ms.

5.2 Security & Encryption
NFR‑S01 – All data in transit must use TLS 1.3.

NFR‑S02 – PostgreSQL volume stores shall be encrypted at rest using AES‑256.

NFR‑S03 – MinIO buckets must enforce server‑side encryption for objects at rest.

5.3 Availability & Fault Isolation
NFR‑A01 – A runtime error in the DMS or any future app must not crash the portal shell; the shell remains operational and shows an error state for the affected app.

NFR‑A02 – The auth middleware and permission guards must remain available even if auxiliary services (Elasticsearch, BullMQ) are temporarily down; core routing and access control must not be impaired.

6. Technical Architecture & Stack
6.1 Locked Production Stack
Layer	Component	Selected Technology	Purpose
Monorepo	Repository Workspace	Turborepo	Unifies code management for shell and apps.
Frontend	Framework & Router	Next.js	Core layout, authentication shell, routing.
Frontend	Styling Framework	Tailwind CSS	Utility‑first, responsive design.
Frontend	UI Component Library	Shadcn UI	Standardized enterprise components.
Frontend	Drag‑and‑Drop	dnd kit	Dashboard layout customisation.
Frontend	Rich Text Editor	TipTap	Embedded editing in DMS (and future apps).
Backend	Application Server	NestJS	Structured, modular server logic.
API	API Gateway	GraphQL	Flexible, optimized data querying.
Database	Database Engine	PostgreSQL	Relational storage.
ORM	Object Relational Mapper	Drizzle ORM	Type‑safe SQL and schema migrations.
Storage	Object (Blob) Storage	MinIO	File attachments and version blobs.
Security	Fine‑Grained Auth	OpenFGA	Relationship‑based access control.
Search	Full‑Text Search Engine	Elasticsearch	Universal search indexing.
Real‑Time	Multiplayer Sync	Yjs	Collaborative document editing.
Queue	Event & Task Broker	BullMQ (Redis)	Background jobs for indexing and hooks.
6.2 Monorepo Strategy
Managed by Turborepo.

The Next.js shell is a workspace package, importing each app’s routing module.

Each application (including DMS) is a separate package under apps/ that exports pages and a GraphQL module.

Shared libraries (auth, OpenFGA client, UI primitives) reside in packages/.

6.3 API & Data Flow
All client‑server communication via GraphQL federation.

NestJS acts as the GraphQL gateway; each app contributes a subgraph schema.

Authentication tokens are validated by a shared guard before any resolver is invoked.

Background jobs (BullMQ) handle indexing, file processing, and future notifications.

Real‑time editing in DMS uses Yjs over WebSockets.

7. Database Design & Data Management
7.1 Core Permission Schema
The following tables are mandatory for the portal. They use Drizzle ORM with PostgreSQL.

typescript
import { pgTable, uuid, varchar, boolean, timestamp, unique } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const applications = pgTable('applications', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 50 }).notNull().unique(), // e.g., 'dms', 'crop-monitor'
  name: varchar('name', { length: 255 }).notNull(),
  routePath: varchar('route_path', { length: 255 }).notNull(), // e.g., '/apps/dms'
  isActive: boolean('is_active').default(true).notNull(),
  searchEnabled: boolean('search_enabled').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const userApplications = pgTable('user_applications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  applicationId: uuid('application_id').references(() => applications.id, { onDelete: 'cascade' }).notNull(),
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
}, (table) => [
  unique('user_app_unique_idx').on(table.userId, table.applicationId)
]);
7.2 DMS‑Specific Storage
File metadata stored in PostgreSQL tables owned by the DMS schema.

Actual blobs stored in MinIO buckets, object keys based on file UUID + version number.

Pre‑signed URLs expire after a configurable duration (default 5 minutes).

7.3 Search Indexing
A BullMQ worker consumes indexing events published by DMS (and future apps).

Documents are written to Elasticsearch with a prefix per app slug (e.g., dms_documents).

Administrative configuration for searchable fields is stored in an application_search_config table (added in a later migration).

8. Security & Authorization Requirements
8.1 Authentication
The portal uses a session‑based or JWT‑based authentication mechanism (configurable). The unified login page integrates with MOA’s existing identity provider if needed.

The authenticated user object is attached to every request context.

8.2 Fine‑Grained Authorization
OpenFGA stores tuples: [user:<id>] → has_access → [application:<slug>].

Assigning an application to a user writes the tuple; revocation removes it immediately.

Additional tuples may define resource‑level access within apps (e.g., DMS folder permissions).

8.3 Route & API Protection
Next.js Middleware checks /apps/[slug] against the user’s permissions. Active but forbidden apps return 403; inactive apps return 404.

NestJS GraphQL Guards call OpenFGA for each resolver to confirm the user has access to the owning app. Unauthorized calls result in a FORBIDDEN GraphQL error.

A short‑lived in‑memory cache (with event‑driven invalidation) ensures sub‑millisecond authorization checks.

8.4 Data Encryption
TLS 1.3 for all data in transit.

PostgreSQL volumes encrypted with AES‑256 at rest.

MinIO objects encrypted server‑side (SSE‑S3).

9. Other Requirements
Internationalization (i18n) – The shell and admin console must support both English and Amharic (the working language of the Ministry). Future apps can add additional languages.

Logging & Auditing – All admin operations (app registration, user assignment) are logged to an immutable audit trail. 403 denials are logged for security monitoring.

Documentation – A developer guide must explain how to add a new MOA application to the monorepo.

Testing – End‑to‑end tests (Playwright) for critical paths: login, permission enforcement, admin operations. Unit tests for OpenFGA guards and middleware logic.