Master Prompt for Cursor AI – MOA_PORTAL Implementation
You are an expert full‑stack developer and UX engineer building MOA_PORTAL, the Ministry of Agriculture’s centralized digital workspace. Your task is to implement the entire platform according to the provided specifications.

Objective
Develop a secure, extensible portal that provides:

A dynamic shell with authentication, role‑based sidebar, and admin‑controlled application registry.

A built‑in Document Management System (DMS) with hierarchical folders, file uploads, versioning, locking, and real‑time collaboration.

An extensible framework to add future MoA line‑of‑business applications.

Documents to Read Thoroughly
All the following documents are located in the docs/ folder. Please read and understand them in order, as they build upon each other:

docs/01-srs.md (Software Requirements Specification)
Defines the functional and non‑functional requirements, the locked tech stack, database blueprint, security rules, and authorization model.

docs/02-prd.md (Product Requirements Document)
Explains the product vision, user personas, success metrics, feature epics, and user stories.

docs/03-system-design.md (System Architecture & Design)
Provides the high‑level architecture, component breakdown, data flow, deployment design, and real‑time collaboration approach.

docs/04-ui-ux-wireframes.md (UI/UX Wireframes)
Contains ASCII‑style wireframes of all key screens, navigation structure, and interaction patterns.

docs/05-features-breakdown.md (Feature Breakdown with Acceptance Criteria)
Lists every feature with ID, user story, and detailed acceptance criteria for testing.

docs/06-project-structure.md (Project Structure & Monorepo Layout)
Describes the Turborepo monorepo, package organization, environment variables, and deployment infrastructure.

docs/07-ux-enhancements.md (UX Enhancements from Design Mockups)
Extracts detailed visual design tokens, component states, micro‑interactions, and accessibility refinements.

Design Images to Reference
All visual mockups are in docs/imgs/. Study these images carefully to understand the exact look, layout, colors, and interactions. The filenames indicate which part of the UI they represent:

Image File	Purpose
00_themes_3.png, 00_themes_4.png	Colour system: Sidebar, destructive, chart, and border/ring tokens
01_Fullview_of the page.png	Full dashboard layout with sidebar, header, widgets
01.1_Sidebar.png	Sidebar with app list, settings, logout
01.1.1_Dashboard.png	Dashboard widgets (greeting, summary cards, recent docs)
01.1.1.1_Dashboard_componets.png	Detailed dashboard component breakdown
01.1.2_Document_management.png	DMS main view with folder tree and document list
01.1.2.1_Document_management_components.png	Document list items with version, size, type icons
01.1.2.2_Document_management_component_theree_dots.png	Three‑dot context menu on hover
01.1.2.3_Document_management_component_When_you_hover.png	Hover state of a document row
01.1.2.4_Document_management_component_Add_new_document.png	"New" dropdown (New Document / Upload File)
01.1.2.5_Document_management_component_Add_new_document_add.png	Inline creation of an untitled document
01.1.3_Admin_console.png	Admin console – Applications tab
01.1.3.1_Admin_console_componets.png	Admin components detail (apps list)
01.1.3.2_Admin_console_componets_navbar(gropups).png	Admin sub‑navigation tabs
01.1.3.3_Admin_console_componets_user_acsses.png	User Access assignment panel
01.1.3.4_Admin_console_componets_Audit_Logs.png	Audit log entries
01.1.3.5_Admin_console_componets_Register_New_App.png	Register New Application form
01.1.4_App Registry.png	App Registry main view with search/filter
01.1.4.1_App Registry_componets.png	App registry components (cards, status)
01.1.4.3_App Registry_componet_edit.png	Edit Application form
01.1.5_Settings.png	User settings/profile page
02_login.png	Login screen
03_signup.png	Sign‑up screen
Tech Stack Reminder (Locked)
Layer	Technology
Monorepo	Turborepo (PNPM workspaces)
Frontend	Next.js 14 (App Router), Tailwind CSS, Shadcn UI, dnd kit, TipTap
Backend	NestJS, GraphQL (Apollo Federation), BullMQ
Database	PostgreSQL + Drizzle ORM
Storage	MinIO (object storage)
Authorization	OpenFGA (ReBAC)
Search	Elasticsearch
Real‑time	Yjs (via WebSocket)
Deployment	Kubernetes, Docker
Key Directives for Development
Follow the project structure defined in 06-project-structure.md. All code must be placed in the correct monorepo workspace (apps/shell, apps/dms, apps/server, packages/shared, etc.).

Implement features as defined in 05-features-breakdown.md, ensuring each acceptance criterion is met.

Use the design images to replicate the exact UI components, spacing, colour, and interactions. The colour tokens from 00_themes_*.png are mandatory.

Enforce strict authorization: Next.js middleware for route protection, NestJS guards for GraphQL operations, and OpenFGA for relationship‑based access. No resource should ever be exposed to an unauthorized user.

Build the DMS with hierarchical folders, pre‑signed uploads, versioning, locking, and real‑time collaborative editing (Yjs + WebSocket).

Admin console must allow registration of new apps (slug, name, route, description, active/search toggle) and user assignment.

Internationalization: Support English and Amharic from the start. All labels, messages, and placeholders must be externalized.

Accessibility: WCAG 2.1 AA compliance for all components, as detailed in the wireframes and UX enhancements docs.

Fault isolation: The shell must remain functional even if a sub‑app crashes; use error boundaries.

Starting the Build
Begin by setting up the monorepo skeleton, shared packages (Drizzle schemas, Shadcn UI theme, auth utilities).

Then implement authentication and the shell layout (header, dynamic sidebar, dashboard).

Next, build the admin module (application registry, user assignment, audit log).

Finally, implement the DMS with all its features and integrate real‑time collaboration and search.

Refer back to the documents at every step to ensure nothing is missed. When in doubt, consult the wireframes and design images for exact layout expectations.

This master prompt is the single source of truth to guide you through the entire implementation.