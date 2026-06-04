import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@moa/shared/auth": path.resolve(__dirname, "../../packages/shared/src/auth/index.ts"),
    },
  },
  test: {
    environment: "node",
  },
});
