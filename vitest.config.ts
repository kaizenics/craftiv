import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // Same "@/..." alias as tsconfig, so tests import modules the way the app does.
  resolve: { alias: { "@": fileURLToPath(new URL("./", import.meta.url)) } },
  // A throwaway in-memory database, so no test can ever reach the real one.
  // The auth-policy suite builds a database in beforeAll, which can pass 10s when every file runs at once.
  test: { env: { TURSO_DATABASE_URL: "file::memory:", TURSO_AUTH_TOKEN: "" }, hookTimeout: 30_000 },
});
