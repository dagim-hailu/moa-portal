/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/shared/src/**/*.{ts,tsx}",
    "../../apps/dms/src/**/*.{ts,tsx}",
  ],
  important: true,
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        ring: "#1A7554",
        input: "#DCE5E0",
        border: "#DCE5E0",
        primary: {
          DEFAULT: "#1A7554",
          foreground: "#FFFFFF",
        },
        destructive: {
          DEFAULT: "#EF4343",
          foreground: "#FAFAFA",
        },
        sidebar: {
          DEFAULT: "#154735",
          foreground: "#DEEDE6",
          active: "#206F52",
          hover: "#195740",
        },
        chart: {
          1: "#1A7554",
          2: "#2A9D90",
          3: "#47829A",
          4: "#E2B33C",
          5: "#F18832",
        },
        muted: {
          DEFAULT: "#6B7280",
          foreground: "#6B7280",
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
      maxWidth: {
        portal: "1280px",
      },
    },
  },
  plugins: [],
};
