UX Enhancements
MOA_PORTAL – Ministry of Agriculture Portal
Version: 1.0
Date: 2026-05-10
Status: Draft
Confidentiality: Internal

Table of Contents
Introduction

Visual Identity & Theming
2.1 Colour System
2.2 Typography & Iconography

Navigation & Layout Enhancements
3.1 Dynamic Sidebar Refinements
3.2 Dashboard Personalisation

Component UX Improvements
4.1 Document Management
4.2 Admin Console & App Registry
4.3 Universal Search
4.4 Settings & Profile

Interaction States & Micro‑interactions
5.1 Hover, Focus & Active Feedback
5.2 Context Menus & Overlays

Accessibility & Inclusivity

Responsive & Adaptive Behaviour

Conclusion

1. Introduction
This document outlines user experience enhancements derived from the detailed design mockups of MOA_PORTAL. The enhancements aim to refine the visual language, improve usability through consistent interaction patterns, and ensure the interface meets the highest standards of accessibility and responsiveness for Ministry staff.

While the earlier UI/UX wireframes defined the structural blueprint, the mockups provided (dashboard, document management, admin console, app registry, login) introduce specific visual treatments and interaction details. These are consolidated below as formal enhancements to be implemented.

2. Visual Identity & Theming
2.1 Colour System
A refined colour palette ensures a professional, Ministry‑appropriate aesthetic while maintaining clear functional hierarchy.

Token	Hex Code	Usage
Destructive	#EF4343	Delete buttons, critical errors, revoke actions
Destructive Foreground	#FAFAFA	Text on destructive backgrounds
Border	#DCE5E0	Subtle separators, card borders
Input	#DCE5E0	Input field borders (unfocused)
Ring	#1A7554	Focus ring for interactive elements
Sidebar Background	#154735	Left navigation panel (dark green)
Sidebar Foreground	#DEEDE6	Sidebar text and icons (mint white)
Sidebar Active	#206F52	Active/highlighted item background
Sidebar Hover	#195740	Hover state background
Chart / Accent Colours	#1A7554 (Chart 1), #2A9D90 (Chart 2), #47829A (Chart 3), #E2B33C (Chart 4), #F18832 (Chart 5)	Data visualisation, status badges
Enhancement:

Apply Ring (#1A7554) consistently on all form inputs, buttons, and selectable cards to give clear focus visibility.

Use the chart palette for future dashboard analytics widgets (crop yields, subsidy stats).

Sidebar maintains a dark green background (#154735) with high‑contrast text (#DEEDE6) to distinguish the navigation layer from the content area.

2.2 Typography & Iconography
Ministry branding relies on a clean, sans‑serif typeface (e.g., Inter or system UI) for both English and Amharic.

Icons are consistent throughout (Lucide icon set from Shadcn UI), with file‑type badges (PDF, DOC) as shown in the document management mockups.

Enhancement:

File icons in DMS must be visually distinct based on file extension, using official MOA green for PDF, blue for DOC, etc.

Sidebar items display an app‑specific icon (customizable during app registration), reinforcing quick recognition.

3. Navigation & Layout Enhancements
3.1 Dynamic Sidebar Refinements
The sidebar mockup (01.1_Sidebar.png) displays four items plus a “Settings” and “Sign Out” footer. The design removes clutter by never rendering forbidden applications.

Enhancements:

A collapsed mode (future) to show icons only, triggered by a hamburger toggle on smaller screens.

Active indicator uses the Sidebar Active background (#206F52) with a left border accent of #DEEDE6.

Hover state (Sidebar Hover #195740) gives immediate visual feedback.

Badge count on app icons (e.g., unread documents) will be a later addition; the sidebar structure now reserves space for such indicators.

3.2 Dashboard Personalisation
The dashboard (01.1.1_Dashboard.png) shows a greeting, summary cards (“4 Recent Documents”, “2 Folder Spaces”, “1 Active Applications”), a “My Applications” widget, and a “Recent Documents” list.

Enhancements:

Drag‑and‑drop customisation (dnd kit) allows users to reorder these widgets. The “Customise” button (shown in wireframes) will be added as a permanent button in the top‑right corner of the dashboard.

Summary cards will be the first default widgets; they animate on data update (e.g., new document uploaded) using a subtle scale pulse.

“My Applications” widget shows the app icon and a snippet of its description, with a “Launch” button for direct access—shortcutting the sidebar for frequently used apps.

4. Component UX Improvements
4.1 Document Management
The DMS mockups introduce crucial interaction details:

Folder tree (01.1.2_Document_management.png): Indented hierarchy with collapsible folders. The current selection is highlighted in a light background.

Document list shows file type icon, name, version, size, and date.

Three‑dot menu (01.1.2.2_Document_management_component_theree_dots.png): On hover, a “...” icon appears. Clicking reveals: Edit Content, View Versions, Check Out, Delete.

Add New (01.1.2.4_...Add_new_document.png): A dropdown from “+ New” allows creation of a blank document or file upload.

Inline creation (01.1.2.5_...Add_new_document_add.png): An “Untitled Document” placeholder with Version 1 appears; user can rename and save.

Enhancements:

Hover‑triggered context menus reduce visual clutter. The three‑dot menu must be keyboard accessible (Enter / Space to open).

Inline document creation with auto‑focus on title input and a “Save” / “Discard” pair of buttons improves flow (bypassing modals for quick notes).

Drag‑and‑drop files onto the folder tree will be supported in a future iteration; the current upload button remains the primary method.

Check‑out indicator (lock icon beside file name) turns red when locked by another user, with a tooltip showing the locker’s name.

4.2 Admin Console & App Registry
Mockups provide a detailed admin area with three tabs: Applications, User Access, Audit Log.

Applications (01.1.3_Admin_console.png): A list of registered apps with toggle switches for active/inactive and search icons.

User Access (01.1.3.3_Admin_console_componets_user_acsses.png): Shows an “Assign App” button and currently no assignments.

Audit Log (01.1.3.4_...Audit_Logs.png): Recent events with type (App Toggled, App Updated), user, and timestamp.

Register New Application (01.1.3.5_...Register_New_App.png): Form with Slug, Display Name, Description, Route Path, Sidebar Order, Active & Search toggles.

Edit Application (01.1.4.3_App Registry_componet_edit.png): Similar form with prefilled data, slug disabled.

Enhancements:

Batch assignment in User Access panel: table with checkboxes, “Select All”, and a “Assign selected” button to streamline provisioning.

Live preview of sidebar order as a drag‑and‑drop list in the app editing screen.

Confirmation dialogs before toggling app status (active/inactive) to prevent accidental hiding of critical apps.

Audit log filtering by event type, app, and date range (already structure allows expansion).

Search within Admin (01.1.4.1_App Registry_componets.png includes a top search bar) to quickly find an app by name.

4.3 Universal Search
While not a separate mockup, the global search bar is present in many header screens.

Enhancements:

On focus, the search bar expands slightly and shows a dropdown with recent searches / suggested apps (as in 01.1.4_App Registry.png where “Search apps…” is visible).

Keyboard shortcut Ctrl+K should activate it, and Esc should dismiss.

Results must be grouped by app with category headers (Documents, Tasks – future), identical to the overlay design in the Wireframes.

4.4 Settings & Profile
01.1.5_Settings.png shows a simple settings page with Full Name, Email (read‑only), and a “Save Changes” button. Sign‑out is at the bottom of the sidebar.

Enhancements:

Add Language preference (English / Amharic) as a dropdown; changing it instantly re‑renders the UI.

Password change section (future) to allow users to update their password.

Provide account activity (last login, active sessions) for security transparency.

5. Interaction States & Micro‑interactions
5.1 Hover, Focus & Active Feedback
Buttons: Slight background lighten/darken and scale (0.98) on press.

Cards (Widgets, App tiles): Elevation increase (shadow) on hover; click navigates.

Sidebar items: Background transition from #154735 to #195740 on hover, to #206F52 on active.

Inputs: Border changes to Ring on focus, with a soft box‑shadow to meet accessibility.

5.2 Context Menus & Overlays
Three‑dot menu in DMS (and later apps) uses a Shadcn UI DropdownMenu, with items that have icons and keyboard shortcuts (e.g., “Delete – Del”).

Modals (Register App, Edit App, Create Folder) use a centred overlay with backdrop blur. All modals must trap focus and close on Esc.

Toast notifications for success/error (e.g., “Application registered successfully”) appear at the bottom‑right corner.

6. Accessibility & Inclusivity
All colour combinations meet WCAG 2.1 AA contrast ratio (4.5:1 for normal text). The dark sidebar #154735 with #DEEDE6 text passes.

Focus indicators are highly visible (Ring #1A7554) around interactive elements.

Amharic text is sized and aligned appropriately; RTL support is enabled in Tailwind config.

aria-labels on icon‑only buttons, role="navigation" on sidebar, and live regions for dynamic content updates (e.g., “Application list updated”).

Keyboard navigation: all dropdowns, context menus, and modals are fully operable without a mouse.

7. Responsive & Adaptive Behaviour
The mockups primarily show a desktop (1440px) layout. For Ministry field officers using tablets, the following enhancements are planned:

Tablet (<1024px): Sidebar collapses into a bottom navigation bar (or hamburger menu) to maximise content space. The “+ New” button in DMS moves to a floating action button (FAB).

Mobile (<768px): Single‑column layout. The header simplifies (logo + search icon). Universal search becomes a full‑screen overlay.

Dashboard widgets stack vertically, and drag‑and‑drop is disabled on touch devices, replaced by a “Edit Layout” button that lets users reorder via list.

These adaptations will be tested against the Ministry’s issued tablet devices.

8. Conclusion
The UX enhancements defined in this document elevate the initial wireframes to a usable, delightful, and inclusive interface for MOA_PORTAL. By standardising colours, refining micro‑interactions, and ensuring accessibility, the portal will provide Ministry staff with an intuitive workspace that hides complexity behind a clean, purpose‑driven design. Future application modules will inherit these patterns automatically through the shared component library.