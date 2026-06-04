05 – Features Breakdown
MOA_PORTAL – Ministry of Agriculture Portal
Version: 1.0
Date: 2026-05-10
Status: Draft
Confidentiality: Internal

Table of Contents
Introduction

Feature Organisation

Core Portal Shell & App Framework
3.1 Authentication & Unified Login
3.2 Dynamic Left Sidebar
3.3 Customisable Dashboard
3.4 Universal Search
3.5 Error Pages & Middleware Protection

Application Registry & Admin Management
4.1 Register New Application
4.2 Manage User‑Application Assignments
4.3 Application Status & Lifecycle

Authorization & Dynamic Access Control
5.1 Next.js Middleware Enforcement
5.2 NestJS GraphQL Guards
5.3 OpenFGA Relationship Tuples

Built‑in Document Management System (DMS)
6.1 Hierarchical Folder Structure
6.2 File Upload with Pre‑signed URLs
6.3 Version Control & History
6.4 Check‑Out / Check‑In Locking
6.5 Real‑Time Collaborative Editing
6.6 DMS Search & Elasticsearch Indexing
6.7 Cross‑App Resource Linking

Future Application Extensibility
7.1 App Package Template & Conventions
7.2 Search Integration Contract
7.3 Background Job Queue Contract

Cross‑Cutting Features
8.1 Internationalisation (i18n)
8.2 Audit Logging
8.3 Fault Isolation & Resilience

1. Introduction
This document provides a detailed breakdown of every feature delivered in MOA_PORTAL v1.0. Each feature is described with a unique identifier, a short user‑story format, and a set of acceptance criteria to guide development and testing.
The breakdown follows the structure: Core Shell, Admin & App Registry, Authorization, Built‑in DMS, and Extensibility Foundation.

2. Feature Organisation
Features are grouped into capability areas. Each area maps to a section of the portal architecture and can be developed and tested incrementally.

Area	Key Components
Core Portal Shell	Login, dynamic sidebar, dashboard, universal search, error pages
Application Registry	Admin CRUD for apps, user assignment, status management
Authorization & Access Control	Middleware, GraphQL guards, OpenFGA integration
Document Management System	Folders, upload, versions, locking, collaborative editing, search
Extensibility	Developer contracts, index‑registration, queue isolation
Cross‑Cutting	i18n, audit logs, fault isolation
3. Core Portal Shell & App Framework
3.1 Authentication & Unified Login
Feature ID: CORE-001

User Story: As a Ministry staff member, I want to log in once using my credentials so that I can access all my authorised applications without re‑entering my password.

Description:
The portal presents a single login page, validates credentials against the users table, and issues a JWT stored in an HTTP‑only secure cookie. After successful authentication, the shell fetches the user’s application permissions and renders the sidebar.

Acceptance Criteria:

A unified login page is served at /login and is the only entry point for unauthenticated users.

Login accepts email (or staff ID) and password; validates against bcrypt‑hashed values in PostgreSQL.

On success, a signed JWT is stored in a Secure; HttpOnly; SameSite=Strict cookie.

Upon redirect to /, the shell calls myApps GraphQL query to populate the sidebar.

Invalid credentials show a client‑side inline error message; users stay on the login page.

“Forgot password” link is present (functionality out of scope but UI placeholder exists).

Language selection (English / Amharic) available on the login page.

3.2 Dynamic Left Sidebar
Feature ID: CORE-002

User Story: As an end user, I want to see only the applications I am allowed to use in the sidebar, so that I can navigate quickly and without clutter.

Description:
After authentication, the sidebar renders a navigation list from the user’s user_applications mapping. Applications not assigned are absent from the DOM. The active application is highlighted.

Acceptance Criteria:

Sidebar shows a list of apps, each with icon and name, fetched from myApps query.

If the user has zero applications, a message “No applications assigned. Contact your administrator.” is displayed.

Clicking an app navigates to /apps/[slug] and highlights that item.

The sidebar never renders applications the user is not authorised for—no placeholder or locked icon.

When admin changes user permissions, the sidebar updates within a second (via cache invalidation or subscription).

If an app is set to inactive, it is removed from all users’ sidebars immediately.

3.3 Customisable Dashboard
Feature ID: CORE-003

User Story: As an end user, I want to arrange widgets on my landing page so that I can quickly see my most important information.

Description:
The dashboard (/) displays draggable widgets (e.g., quick‑access shortcuts, recent DMS files). Layout changes are persisted per user.

Acceptance Criteria:

Widgets can be rearranged using drag‑and‑drop (dnd kit).

A “Customise” button opens a palette to add/remove available widgets.

Layout is saved to the backend (user preferences table or JSONB column) and restored on next login.

At least three widget types available in v1: “Quick Access” (shortcuts to permitted apps), “Recent Documents”, “Announcements” (static text, admin‑configurable).

Widgets gracefully handle missing data (e.g., no recent documents) by showing an empty state.

3.4 Universal Search
Feature ID: CORE-004

User Story: As an end user, I want to search across all my permitted applications from a single box in the header so that I can find documents, tasks, or other items quickly.

Description:
A persistent search bar in the header queries Elasticsearch and OpenFGA. Results are categorised per application and only show items the user can actually access.

Acceptance Criteria:

Search input is permanently visible in the header; also accessible via Ctrl+K.

Typing triggers a GraphQL search query after a 300 ms debounce.

Results are grouped by application with app icon, title, snippet, and link.

Only permitted apps’ indexes are searched (based on user’s assignments).

Every result must pass a resource‑level OpenFGA post‑filter (user must be able to view the underlying item).

Clicking a result navigates directly to the item within the corresponding app.

Administrators can enable/disable search per application in the admin console.

Search respects Amharic character input and stemming.

3.5 Error Pages & Middleware Protection
Feature ID: CORE-005

User Story: As a security‑conscious user, when I try to access a forbidden application by URL, I should see a clear access‑denied message, not a broken page.

Description:
Next.js middleware intercepts all requests. If a user requests an app route they are not allowed to see, they receive a 403 page inside the shell. Inactive/unregistered apps return 404.

Acceptance Criteria:

Middleware runs on every request under /apps/[slug].

For active apps the user lacks permission for → 403 Forbidden page displayed.

For inactive apps → 404 Not Found page displayed, even if the user previously had access.

Both pages retain the shell header and sidebar, with a “Go to Dashboard” link.

No application‑specific data is loaded or leaked in either error case.

4. Application Registry & Admin Management
4.1 Register New Application
Feature ID: ADMIN-001

User Story: As an IT administrator, I want to register a new application so that it can be assigned to users and appear in the portal.

Description:
An admin console at /admin provides a form to create a new applications row: slug, name (English/Amharic), route path, active status, and search enablement.

Acceptance Criteria:

Form validates slug uniqueness, required fields, and route format (/apps/...).

On successful creation, the application appears in the admin list immediately.

The application does not appear for any user until explicitly assigned.

Amharic name field stored separately for i18n display.

The admin action is logged to the audit trail.

4.2 Manage User‑Application Assignments
Feature ID: ADMIN-002

User Story: As an IT administrator, I want to assign or revoke an application for multiple users at once so that I can efficiently manage permissions.

Description:
From the admin console, an admin can select an application and see a two‑panel interface: available users (not assigned) and assigned users. Batch selection and search enable large‑scale changes.

Acceptance Criteria:

Admin can search users by name or email to filter the available list.

Assigning a user writes a user_applications row and an OpenFGA tuple (user:U → viewer → application:X).

Revoking a user removes both the DB row and the OpenFGA tuple.

Sidebar of affected users updates within 1 second (real‑time or next navigation).

Bulk assignment by department/group is supported via a future CSV import (v1 may just have checkbox batch).

4.3 Application Status & Lifecycle
Feature ID: ADMIN-003

User Story: As an IT administrator, I want to temporarily disable an application without deleting it, so that I can perform maintenance or phase it out.

Description:
The admin table includes an “Active” toggle. When toggled off, the application disappears from all users’ sidebars and all its routes return 404 (even if assigned).

Acceptance Criteria:

Toggling off an active application immediately removes it from all users’ views.

The application remains in the database and prior assignments are preserved.

Reactivating restores the app for assigned users.

Inactive apps cannot be accessed by direct URL (404 middleware).

5. Authorization & Dynamic Access Control
5.1 Next.js Middleware Enforcement
Feature ID: AUTH-001

User Story: As a platform architect, I want every route under /apps/ to be protected by middleware so that unauthorised URL access is blocked.

Description:
The middleware inspects the URL slug, looks up the user’s permission cache (from Redis or context), and returns 403/404 accordingly. It does not load any app bundle before the check.

Acceptance Criteria:

Middleware runs on every route change (edge runtime).

Permission check uses cached user‑app list; cache TTL ≤ 30 seconds.

If the slug is unknown (not in applications table), return 404.

All middleware logic must be unit‑tested.

5.2 NestJS GraphQL Guards
Feature ID: AUTH-002

User Story: As a backend developer, I want GraphQL resolvers to be protected so that unauthorised users cannot query data from apps they shouldn’t see.

Description:
An ApplicationGuard checks the operation’s owning app (via metadata) and calls OpenFGA to verify the user’s access. Denied operations throw FORBIDDEN.

Acceptance Criteria:

Each resolver (query/mutation) can be decorated with @AppSlug('dms').

The guard extracts the authenticated user and calls OpenFGA with user:<id> viewer application:<slug>.

If check returns false → throw ForbiddenError.

Guard works seamlessly across federated subgraphs.

Performance: OpenFGA check < 5 ms; cache hit in Redis further reduces latency.

5.3 OpenFGA Relationship Tuples
Feature ID: AUTH-003

User Story: As an administrator, when I assign an app to a user, the authorization system should reflect the change instantly using OpenFGA.

Description:
All application‑level authorisation is represented as tuples in OpenFGA. The system synchronises user_applications rows with OpenFGA writes/deletes. Caching ensures fast reads.

Acceptance Criteria:

On user assignment, a tuple [application:<slug>] viewer [user:<id>] is written.

On revocation, the tuple is deleted.

OpenFGA store uses PostgreSQL as backend for persistence.

A Redis‑backed cache with event‑driven invalidation sits in front of OpenFGA checks for minimal latency.

6. Built‑in Document Management System (DMS)
6.1 Hierarchical Folder Structure
Feature ID: DMS-001

User Story: As a document controller, I want to organise files into Site Spaces, Libraries, and Folders so that documents are easy to locate.

Description:
A server‑side tree structure model with dms_spaces, dms_libraries, dms_folders. Users can create, rename, move, and delete folders via the UI.

Acceptance Criteria:

Nested folders displayed as an indented tree or table view.

Create/Rename/Delete operations require appropriate permissions (OpenFGA resource‑level checks for future but initially app‑level access is enough).

Breadcrumb navigation reflects the hierarchy.

Empty folders display a placeholder message.

6.2 File Upload with Pre‑signed URLs
Feature ID: DMS-002

User Story: As a field officer, I want to upload large agricultural reports without being limited by server‑side file size restrictions, so that my work is uninterrupted.

Description:
The client requests a pre‑signed URL from the DMS API, uploads directly to MinIO, then notifies the server to create a file record and kick off indexing.

Acceptance Criteria:

Upload flow: POST to dmsRequestUpload mutation → receives pre‑signed PUT URL → client uploads file to MinIO → POST dmsConfirmUpload mutation.

Pre‑signed URL expires in 5 minutes.

Progress bar shown during upload.

On success, a new dms_files record and initial version are created.

A BullMQ job is enqueued to index the file in Elasticsearch.

File size limited per bucket policy (e.g., 500 MB); configurable.

Error handling for expired URL or MinIO failure shows a user‑friendly message.

6.3 Version Control & History
Feature ID: DMS-003

User Story: As a policy analyst, I want to see all previous versions of a document and be able to restore an old version, so that no information is ever lost.

Description:
Every upload creates a new dms_versions row. The UI shows a chronological list with download and restore actions.

Acceptance Criteria:

Version panel lists each version with number, creator, timestamp, and size.

“Download” button retrieves the file from MinIO (via pre‑signed link or backend proxy).

“Restore” promotes a previous version as the new current version (increments version number).

Restore is audit‑logged.

6.4 Check‑Out / Check‑In Locking
Feature ID: DMS-004

User Story: As an editor, I want to lock a file while I’m making changes so that nobody else can overwrite my work.

Description:
Users can check out a file, which writes their user ID into locked_by and a timestamp. Others see a read‑only indicator and cannot upload new versions. Check‑in releases the lock.

Acceptance Criteria:

“Check Out” button sets lock; only the locker can upload new versions.

Lock state is visible to all users: lock icon + locker name.

Lock can be released by the locker (check‑in) or forcibly by an admin (admin override in v1 optional).

A file that is checked out prevents collaboration editing (save disabled).

6.5 Real‑Time Collaborative Editing
Feature ID: DMS-005

User Story: As a team member, I want to co‑edit a document with my colleagues in real time, seeing their changes as they type.

Description:
An integrated TipTap editor with Yjs syncs document state via a WebSocket server. Multiple users can edit simultaneously with live cursors and awareness.

Acceptance Criteria:

Editor loads for text‑based documents (initially .md, .txt, or Rich Text).

Multiple users in the same document see each other’s cursors and selections.

Edits are conflict‑free (CRDT).

WebSocket connection is authenticated with the portal JWT.

On disconnect/reconnect, the document syncs automatically.

A “Save” action triggers a new version creation (manual or auto‑save on close).

6.6 DMS Search & Elasticsearch Indexing
Feature ID: DMS-006

User Story: As a user, I want to search for documents by name or content, and get results in under a second.

Description:
DMS documents and folders are indexed in Elasticsearch by a BullMQ worker. The internal DMS search (within the app) and the global search use the same index.

Acceptance Criteria:

On file upload/update, a worker processes the file (extracts text if needed) and indexes into dms_files.

Full‑text search across file name, metadata, and extracted content.

Indexing completes within 5 seconds.

DMS app has its own search bar that queries the same index with scope limited to DMS and user’s visible folders (post‑filtered).

Deleted files are removed from the index.

6.7 Cross‑App Resource Linking
Feature ID: DMS-007

User Story: As a user, I want to paste a link to a DMS folder inside a future task app so that I can quickly jump to the related documents.

Description:
Provides a standardised resource link format (e.g., moa://dms/folders/{id}). The shell handles link clicks and navigates to the target app with permission checks.

Acceptance Criteria:

DMS folders and files have a “Copy Link” action that copies a deep link.

When rendered inside another app (future), the shell resolves the link and renders a clickable badge.

If the user lacks permission, the badge shows “Access Denied” instead of navigating.

7. Future Application Extensibility
7.1 App Package Template & Conventions
Feature ID: EXT-001

User Story: As a developer, I want a standardised scaffold for new applications so that I can build MOA tools faster.

Description:
The monorepo includes a template package that exports Next.js pages, GraphQL module, and indexing hook. Developers copy it to start a new app.

Acceptance Criteria:

Template includes: apps/app-template/ with example route, a NestJS module stub, a placeholder index mapper, and configuration file for app slug.

New app can be registered via admin console and immediately inherits auth guards without extra code.

Documentation (README) explains all steps to create and register an app.

7.2 Search Integration Contract
Feature ID: EXT-002

User Story: As a developer, I want my new app’s searchable content to appear in the universal search by implementing a simple contract.

Description:
Apps publish indexing events to a shared BullMQ queue. The portal’s universal indexer consumes these events and routes them to the correct Elasticsearch index.

Acceptance Criteria:

App emits events with type search.index containing appSlug, resourceId, title, description, metadata.

A central worker picks up the event and writes to Elasticsearch index {appSlug}_resources.

The app can also provide a custom mapping to the search service for advanced field configuration.

7.3 Background Job Queue Contract
Feature ID: EXT-003

User Story: As a developer, I want my app to have its own BullMQ queue for background processing, isolated from other apps.

Description:
Queues are named by convention: {app-slug}-queue. The portal’s Redis instance is shared but namespaced. Workers are deployed as separate scalable workloads.

Acceptance Criteria:

App can define a processor file that is mounted as a worker deployment.

Queue configuration (concurrency, retry) is specified in the app’s package config.

Jobs are handled in isolation; a failing job in one queue does not affect other queues.

8. Cross‑Cutting Features
8.1 Internationalisation (i18n)
Feature ID: CROSS-001

User Story: As a Ministry employee, I want to use the portal in Amharic, so that I can work in my preferred language.

Description:
All static text in the shell, admin console, and DMS is externalised into locale files. Language switcher in header toggles between English and Amharic.

Acceptance Criteria:

Language switch instantly re‑renders the UI without page reload.

Default language is English; Amharic available after selection.

All buttons, labels, error messages, and placeholders support Amharic.

Admin application name/description fields have separate Amharic inputs.

Number and date formatting follows locale.

8.2 Audit Logging
Feature ID: CROSS-002

User Story: As a compliance officer, I want an audit trail of all administrative actions, so that I can review permission changes.

Description:
All mutations involving app registration, user assignment, role changes, and DMS check‑out/in are logged to a dedicated audit_logs table.

Acceptance Criteria:

Each log entry contains: timestamp, user ID, action type, target resource (app, file, etc.), and a JSON detail.

Logs are immutable once written.

Admin console includes a read‑only view of audit logs (filterable).

Logs are exported to central logging system for security monitoring.

8.3 Fault Isolation & Resilience
Feature ID: CROSS-003

User Story: As an operator, I want that if a future app crashes, the portal shell and DMS continue to function, so that critical document access is not interrupted.

Description:
Each app is loaded as a React component inside the shell with an error boundary. Backend subgraphs are composed with fallbacks; failure in one subgraph does not crash the gateway.

Acceptance Criteria:

Shell’s error boundary catches rendering errors from app components and displays an “App Unavailable” message within the content area.

Gateway returns partial responses if a subgraph is down (using Apollo Federation error handling).

Health checks for each app are separate; the overall portal is still reported as healthy if non‑DMS apps fail.