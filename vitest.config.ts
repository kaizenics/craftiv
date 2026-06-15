import { defineConfig } from "vitest/config";

export default defineConfig({
  // Resolve the "@/*" path alias from tsconfig.json so tests import the same way app code does.
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    // Dummy Turso connection. Modules like lib/credits import db/index.ts, which constructs a
    // libsql client at import time. A remote-style URL constructs lazily and never connects, so
    // pure-logic tests can import these modules without a real database.
    env: {
      TURSO_DATABASE_URL: "libsql://stub.invalid",
      TURSO_AUTH_TOKEN: "stub",
    },
  },
});
