import { defineConfig } from "vitest/config";
import path from "path";

/**
 * Zenvix Backend unit/property test config.
 *
 * Root is the `backend` directory so that `src/**` spec files are discovered
 * directly. vitest and fast-check resolve from the repo-root node_modules.
 *
 * Run from the repo root:
 *   npx vitest run --config backend/vitest.config.ts
 */
export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    root: __dirname, // backend
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["**/node_modules/**", "**/dist/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
