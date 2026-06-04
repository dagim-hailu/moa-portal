UI / UX Wireframes
MOA_PORTAL – Ministry of Agriculture Portal
Version: 1.0
Date: 2026-05-10
Status: Draft
Confidentiality: Internal

Table of Contents
Introduction

Design Principles

Global Layout – The Shell

Key Screens
4.1 Login Page
4.2 Dashboard
4.3 Dynamic Left Sidebar
4.4 Admin Console – App Registry
4.5 Admin Console – User Assignment
4.6 DMS – Document Library
4.7 DMS – File Preview & Version History
4.8 DMS – Collaborative Editor
4.9 Universal Search Overlay
4.10 Error Pages

Interaction Patterns

Responsive Behavior

Amharic & Accessibility

1. Introduction
This document describes the user interface and user experience wireframes for MOA_PORTAL. It translates the functional requirements into concrete screen layouts, interaction patterns, and flow. The wireframes are intended as a visual blueprint for designers and front‑end developers.

All designs follow the Ministry of Agriculture’s branding guidelines and the locked tech stack: Tailwind CSS + Shadcn UI. Every component is accessible (WCAG 2.1 AA) and supports both English and Amharic.

2. Design Principles
Ministry-First: Official MOA colors (green/earthy tones), clean typography, professional look.

Permission‑Opaqueness: A user never sees UI elements (icons, links, breadcrumbs) for applications they cannot access.

Simplicity: Core actions reachable in one click; minimal nested menus.

Responsive: Works on desktop and tablet used by field officers.

Real‑Time Feedback: Loading skeletons, optimistic updates, immediate sidebar updates upon admin changes.

Consistency: All apps (present and future) use the same Shadcn UI components.

3. Global Layout – The Shell
The shell consists of three persistent regions: Header, Left Sidebar, and the Main Content Area. The sidebar is dynamic; the header is global.

text
+-----------------------------------------------------------------------+
|  [MOA Logo]  Ministry of Agriculture Portal      [🔍 Search...] [👤 ] |
+-----------------------------------------------------------------------+
| [📁 DMS ]   |  (Main Content Area)                                    |
| [📋 Todo ] |                                                          |
|            |  [Dashboard / App Content]                                |
| (only       |                                                          |
|  permitted  |                                                          |
|  apps)      |                                                          |
|            |                                                          |
+------------+----------------------------------------------------------+
Header

Left: MOA emblem and portal name (in Amharic subtitle).

Center/Right: Universal search bar (collapsible).

Right: User avatar/name, dropdown for language switching, logout.

Left Sidebar

Vertical list of applications the user is authorised to view.

Each item shows app icon + name. No “coming soon” or locked icons.

Current active app is highlighted with MOA primary green.

Footer: Admin link (only if user is admin).

Main Content Area

Renders the child page of the selected application.

Uses Shadcn UI Card, Tabs, Table, etc., with ample whitespace.

Background: light gray (#F9FAFB) to reduce eye strain.

4. Key Screens
4.1 Login Page
text
+--------------------------------------------------+
|                                                    |
|               [MOA Emblem Large]                   |
|          Ministry of Agriculture Portal            |
|                                                    |
|        +------------------------------------+      |
|        |  Email / Staff ID                   |      |
|        +------------------------------------+      |
|        +------------------------------------+      |
|        |  Password                           |      |
|        +------------------------------------+      |
|                                                    |
|              [ Sign In ]  (Primary Green)          |
|                                                    |
|         Forgot password? | Help (in Amharic)       |
+--------------------------------------------------+
Centered card on a gradient background (green to white).

Field labels support Amharic. Error messages appear inline.

4.2 Dashboard
After login, the user lands on a customisable dashboard.

text
+-----------------------------------------------------------------------+
| [Header]                                                                |
+-----------------------------------------------------------------------+
| [Sidebar]  |  Welcome, Dr. Abebe                                       |
|            |                                                            |
|            |  +-------------------+  +-------------------+              |
|            |  | Quick Access      |  | Recent Documents  |              |
|            |  | [📁 DMS] [📋 T..] |  | - Policy_2025.pdf |              |
|            |  +-------------------+  | - Farm_Report.doc |              |
|            |                         +-------------------+              |
|            |  +--------------------------------------------+           |
|            |  | My Tasks (example future widget)           |           |
|            |  +--------------------------------------------+           |
+------------+----------------------------------------------------------+
Widgets are draggable (dnd kit).

A “Customise” button in the corner lets users add/remove widgets.

Layout is persisted per user.

4.3 Dynamic Left Sidebar
Rendering logic:

Fetch myApps from GraphQL.

Map to <SidebarItem> components.

If the array is empty, show a message: “No applications assigned. Contact your administrator.”

Example with only DMS assigned:

text
| [📁 DMS]   |
Example with DMS and a future Crop Monitor:

text
| [📁 DMS]   |
| [🌾 Crop]  |
The active item has a left border accent and bold text.

4.4 Admin Console – App Registry
text
+-----------------------------------------------------------------------+
| [Header]                                                                |
+-----------------------------------------------------------------------+
| [Sidebar]  |  Admin Console > Applications                             |
|            |                                                            |
|            |  + Register New Application   [Form]                      |
|            |  | Slug: [____________]                                    |
|            |  | Name (EN): [_________]  Name (AM): [__________]       |
|            |  | Route Path: /apps/ [____]                              |
|            |  | Active: [✓]    Search Enabled: [✓]                    |
|            |  | [Register]                                             |
|            |  +-----------------------------------------------------+  |
|            |                                                            |
|            |  Applications List                                         |
|            |  +----+----------------+----------+--------+-------+        |
|            |  | ID | Name           | Route    | Active | Users |        |
|            |  +----+----------------+----------+--------+-------+        |
|            |  | 1  | DMS           | /apps/dms| ✅     | 54    |        |
|            |  | 2  | Crop Monitor  | /apps/cm | ✅     | 12    |        |
|            |  | 3  | Subsidy Track | /apps/st | ❌     | 0     |        |
|            |  +----+----------------+----------+--------+-------+        |
|            |                                                            |
+------------+----------------------------------------------------------+
Each row has a toggle to change active status and a button to manage assignments.

4.5 Admin Console – User Assignment
Inside an app’s row, a “Assign Users” button opens a modal/panel:

text
+---------------------------------------------------+
|  Assign Users to "Crop Monitor"          [Close]   |
+---------------------------------------------------+
|  Search user: [________________]                    |
|                                                     |
|  Available Users (not assigned)                     |
|  +-------------------------------+                  |
|  | ○ Dr. Abebe Bekele            |                  |
|  | ○ Mrs. Tigist Alemu           |                  |
|  | ○ Mr. Kebede Girma            |                  |
|  +-------------------------------+                  |
|                                                     |
|  Assigned Users (12)                                |
|  +-------------------------------+                  |
|  | ✓ Dr. Worku Tadesse          |                  |
|  | ✓ Mrs. Meseret Hailu         |                  |
|  +-------------------------------+                  |
|                                                     |
|  [Save Changes]                                     |
+---------------------------------------------------+
Batch selection with checkboxes; search filters as you type.

On save, OpenFGA tuples are updated, sidebar refreshes for affected users.

4.6 DMS – Document Library
text
+-----------------------------------------------------------------------+
| [Header]                                                                |
+-----------------------------------------------------------------------+
| [Sidebar]  |  Document Management > Policy Library > 2025               |
|            |                                                            |
|            |  + New Folder   + Upload   [Grid/List Toggle]              |
|            |  +---------+---------+---------+---------+                  |
|            |  | 📁 Drafts| 📁 Final | 📄 Policy | 📄 Report|            |
|            |  |         |         | _2025.pdf| _Q1.doc |                |
|            |  +---------+---------+---------+---------+                  |
|            |                                                            |
|            |  Breadcrumb: Site Spaces / Policy Library / 2025           |
+------------+----------------------------------------------------------+
Hierarchy rendered with indentation or as a table.

Right‑click context menu: rename, move, delete, share (future).

Upload triggers the pre‑signed URL flow with a progress bar.

4.7 DMS – File Preview & Version History
Clicking a file opens a side panel or full page:

text
+-------------------------------------------------------+
|  Policy_2025.pdf                         [Check Out]   |
|---------------------------------------------------------|
|  Version History                                       |
|  v3 - Dr. Abebe, 10 May 2026   [Download] [Restore]    |
|  v2 - Mrs. Tigist, 8 May 2026                          |
|  v1 - Dr. Abebe, 1 May 2026                            |
|---------------------------------------------------------|
|  [Open in Editor] / [Download] / [Share Link]           |
+-------------------------------------------------------+
If checked out, a lock icon and the locker’s name appear.

“Open in Editor” launches the collaborative editor (if text‑based doc).

4.8 DMS – Collaborative Editor
text
+-----------------------------------------------------------------------+
| [Header]                                                                |
+-----------------------------------------------------------------------+
| [Sidebar]  |  📝 Policy_2025.pdf                                       |
|            |  [Menu: File, Edit, Insert]                                |
|            |  +------------------------------------------------------+  |
|            |  | (Rich Text Toolbar – Bold, Italic, Headings, etc.)   |  |
|            |  +------------------------------------------------------+  |
|            |  |                                                        |  |
|            |  |  Collaborative Text Area (TipTap)                    |  |
|            |  |  Cursors of other users shown in different colors.   |  |
|            |  |  Real‑time changes synced.                            |  |
|            |  |                                                        |  |
|            |  +------------------------------------------------------+  |
|            |  Connected users: 🟢 Dr. Abebe, 🟢 Mrs. Tigist            |
+------------+----------------------------------------------------------+
Awareness (avatars) displayed at the top of the editor.

Auto‑save with debounce; version automatically incremented on close or explicit save.

4.9 Universal Search Overlay
Triggered by focusing the header search bar or pressing Ctrl+K.

text
+-------------------------------------------------------+
|  🔍  Search across all applications...                  |
+-------------------------------------------------------+
|  Documents (2)                                         |
|  📄 Policy_2025.pdf – /Policy Library/2025             |
|  📄 Farm_Report.doc – /Projects/Research               |
+-------------------------------------------------------+
|  Tasks (0)   [Future]                                  |
+-------------------------------------------------------+
|  Appointments (0) [Future]                             |
+-------------------------------------------------------+
Results grouped by app with icon.

Each result is a link navigating directly inside the corresponding app.

If no results, show “No items found” in the current language.

4.10 Error Pages
403 Forbidden (within shell):

text
+-----------------------------------------------------------------------+
| [Header]                                                                |
+-----------------------------------------------------------------------+
| [Sidebar]  |  🚫 Access Denied                                         |
|            |  You do not have permission to view this application.       |
|            |  If you believe this is a mistake, contact your admin.      |
+------------+----------------------------------------------------------+
404 Not Found (for inactive apps or unknown routes):

text
+-----------------------------------------------------------------------+
| [Header]                                                                |
+-----------------------------------------------------------------------+
| [Sidebar]  |  📄 Page Not Found                                         |
|            |  The application or page you are looking for does not       |
|            |  exist or has been removed.                                 |
+------------+----------------------------------------------------------+
Both pages include a “Go to Dashboard” button.

5. Interaction Patterns
Loading States: Shimmer/skeleton placeholders matching the content shape.

Notifications: Toast messages (via Shadcn UI sonner) for success/error of admin actions, file uploads, etc.

Confirmation Modals: For critical actions (delete folder, revoke app access).

Keyboard Shortcuts:

Ctrl+K: Focus universal search.

Esc: Close overlay/modal.

Tab navigation through sidebar and forms.

Real‑Time Updates: Sidebar refreshes when admin assignments change (via WebSocket/GraphQL subscription or polling). DMS editor shows live cursors.

6. Responsive Behavior
The layout adapts for tablets (768px – 1024px) and smaller screens:

Sidebar collapses into a hamburger menu (top left) on screens < 1024px.

Dashboard widgets stack vertically.

DMS file/folder list switches to single column.

Admin console tables become card layouts.

Universal search overlay goes full‑screen on mobile devices.

All breakpoints follow Tailwind’s default: sm, md, lg, xl.

7. Amharic & Accessibility
All static text comes from i18n resource files (en.json, am.json). The language switcher in the header toggles the active locale.

Direction: Left‑to‑right for English, but the UI can handle RTL for Amharic (Tailwind RTL support enabled).

Color contrast: All text meets 4.5:1 ratio against background (Shadcn default colors pass).

Focus indicators: Visible on all interactive elements.

Screen readers: ARIA labels on icons, landmarks, and live regions for dynamic content (sidebar updates, search results).

