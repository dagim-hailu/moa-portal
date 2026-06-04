Styling Guide & Design Tokens
MOA_PORTAL – Ministry of Agriculture Portal
Version: 1.0
Date: 2026-05-17
Status: Draft
Confidentiality: Internal

Table of Contents
Typography
1.1 Font Families
1.2 Type Scale
1.3 Amharic Considerations

Spacing & Layout
2.1 Spacing Scale
2.2 Component Padding
2.3 Grid & Alignment

Colours
3.1 Core Palette
3.2 Semantic Tokens

Elevation & Borders
4.1 Border Radius
4.2 Shadows
4.3 Borders & Rings

Interactive States
5.1 Buttons & Links
5.2 Form Inputs

Icons

Implementation in Tailwind

1. Typography
1.1 Font Families
Primary (Latin/English): Inter
A modern, highly legible sans‑serif with excellent readability in UI. Variable font to minimise load.

Primary (Ethiopic/Amharic): Noto Sans Ethiopic
Google’s Noto font covers the Geʽez script used for Amharic. It pairs well with Inter and guarantees consistent rendering across browsers.

System fallback stack:

css
--font-sans: 'Inter', 'Noto Sans Ethiopic', ui-sans-serif, system-ui, -apple-system, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
1.2 Type Scale
Adopt a slightly larger base size for government‑wide accessibility. 16px as default.

Token	Size (rem / px)	Line Height	Weight	Usage
h1	2rem / 32px	1.2	700 (Bold)	Page titles (Dashboard, App names)
h2	1.5rem / 24px	1.3	600 (SemiBold)	Section headers
h3	1.25rem / 20px	1.4	600	Card headers, widget titles
body	1rem / 16px	1.5	400 (Regular)	Paragraphs, descriptions
small	0.875rem / 14px	1.5	400	Meta info, timestamps, file sizes
caption	0.75rem / 12px	1.5	400	Badges, overline text, help text
button	0.875rem / 14px	1	500 (Medium)	Button labels, tab labels
1.3 Amharic Considerations
Noto Sans Ethiopic often requires additional line‑height (1.6 for body) to avoid clipping ascenders/descenders. Apply via a CSS class .amharic { line-height: 1.6; }.

Amharic numerals are not required; use standard Arabic numerals.

The sidebar and navigation items must accommodate the typically longer Amharic words by allowing horizontal padding and truncation with ....

2. Spacing & Layout
2.1 Spacing Scale
Tailwind’s default 4‑point grid is used. All spacing values are multiples of 0.25rem (4px).

Base unit: 4px

Common values: 1 (4px), 2 (8px), 3 (12px), 4 (16px), 5 (20px), 6 (24px), 8 (32px), 10 (40px), 12 (48px)

2.2 Component Padding
Shell header: px-6 py-4 (24px horizontal, 16px vertical)

Sidebar: px-4 py-6 (16px / 24px)

Content area: p-6 (24px all sides)

Cards (Widgets, Lists): p-5 (20px)

Buttons: px-4 py-2 (16px x 8px) for medium, px-5 py-3 for large

Form inputs: px-3 py-2 (12px x 8px)

Modal content: p-8 (32px)

2.3 Grid & Alignment
Use CSS Grid / Tailwind’s grid utilities for dashboard widgets.

Widgets are arranged in a 12‑column responsive grid.

Sidebar width fixed at 280px on desktop, collapsible to 64px (icons only) on tablet.

Max content width: 1280px with mx-auto for dashboard and DMS views.

3. Colours
3.1 Core Palette
(From design mockups and UX enhancements)

Token	Hex	Tailwind Class (example)
Sidebar Background	#154735	bg-sidebar
Sidebar Foreground	#DEEDE6	text-sidebar-fg
Sidebar Active	#206F52	bg-sidebar-active
Sidebar Hover	#195740	hover:bg-sidebar-hover
Destructive	#EF4343	bg-destructive
Destructive Foreground	#FAFAFA	text-destructive-fg
Border	#DCE5E0	border-border
Input	#DCE5E0	border-input
Ring (focus)	#1A7554	ring-ring
Chart 1 / Primary	#1A7554	primary (green)
Chart 2	#2A9D90	secondary (teal)
Chart 3	#47829A	tertiary (blue)
Chart 4	#E2B33C	warning (amber)
Chart 5	#F18832	info (orange)
3.2 Semantic Tokens
Background (main) #FFFFFF or #F9FAFB (light gray for content area).

Foreground (text) #111827 (gray‑900) for main text, #6B7280 for muted text.

Success #16A34A (green‑600), Error #EF4343, Warning #E2B33C.

Links use primary (#1A7554) with underline on hover.

4. Elevation & Borders
4.1 Border Radius
Default (buttons, inputs, cards): 0.5rem (8px) — Tailwind rounded-lg.

Small (badges, tags): 0.25rem (4px) — rounded.

Modal: rounded-xl (12px).

Sidebar: rounded-none (no radius).

Avatars: rounded-full.

4.2 Shadows
Card / Widget (resting): shadow-sm (0 1px 2px rgba(0,0,0,0.05)).

Hover elevation: shadow-md (0 4px 6px rgba(0,0,0,0.07)).

Modal / Dropdown: shadow-lg (0 10px 15px rgba(0,0,0,0.1)).

Focus ring: ring-2 ring-ring ring-offset-2.

4.3 Borders & Rings
Default border color: border-border (#DCE5E0).

Focus ring uses Ring (#1A7554) with a 2px width.

Inputs use border-input on idle, transitioning to border-ring on focus.

5. Interactive States
5.1 Buttons & Links
Primary button: bg-primary text-white hover:bg-primary/90 active:scale-[0.98].

Destructive button: bg-destructive text-destructive-fg hover:bg-destructive/90.

Ghost button: hover:bg-accent hover:text-accent-foreground.

Links: text-primary underline-offset-4 hover:underline.

All interactive elements must have a visible focus state (ring).

5.2 Form Inputs
Idle: border-input bg-white.

Hover: border-gray-400.

Focus: border-ring ring-2 ring-ring ring-offset-2.

Error: border-destructive ring-destructive.

Disabled: opacity-50 cursor-not-allowed bg-gray-100.

6. Icons
Library: Lucide Icons (the default of Shadcn UI).

Sizing: Inline icons 1em; standalone action icons 1.25rem (20px).

Color: Inherit from parent text color, or use text-muted-foreground for secondary actions.

File type icons use the accent colours (PDF: text-primary, DOC: text-chart-3, etc.) as per UX enhancements.

7. Implementation in Tailwind
Customise tailwind.config.ts (in apps/shell and any shared package) to extend the default theme with the above tokens:

ts
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class", // future-proof
  content: ["./src/**/*.{ts,tsx}", "../../packages/shared/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "Noto Sans Ethiopic", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "ui-monospace", "monospace"],
      },
      colors: {
        sidebar: {
          DEFAULT: "#154735",
          foreground: "#DEEDE6",
          active: "#206F52",
          hover: "#195740",
        },
        destructive: {
          DEFAULT: "#EF4343",
          foreground: "#FAFAFA",
        },
        border: "#DCE5E0",
        input: "#DCE5E0",
        ring: "#1A7554",
        primary: {
          DEFAULT: "#1A7554",
          foreground: "#FFFFFF",
        },
        chart: {
          1: "#1A7554",
          2: "#2A9D90",
          3: "#47829A",
          4: "#E2B33C",
          5: "#F18832",
        },
      },
      borderRadius: {
        lg: "0.5rem",
        xl: "0.75rem",
      },
      fontSize: {
        h1: ["2rem", { lineHeight: "1.2", fontWeight: "700" }],
        h2: ["1.5rem", { lineHeight: "1.3", fontWeight: "600" }],
        h3: ["1.25rem", { lineHeight: "1.4", fontWeight: "600" }],
        body: ["1rem", { lineHeight: "1.5" }],
        small: ["0.875rem", { lineHeight: "1.5" }],
        caption: ["0.75rem", { lineHeight: "1.5" }],
        button: ["0.875rem", { lineHeight: "1", fontWeight: "500" }],
      },
    },
  },
  plugins: [],
};
export default config;
End of Styling Guide Document

