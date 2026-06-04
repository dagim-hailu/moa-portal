import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://moa:moa@localhost:5432/moa_portal",
  },
});
