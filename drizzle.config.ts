import { config } from "dotenv";

// Load environment variables from .env.local
config({ path: ".env.local" });

export default {
  schema: "./db/schema/index.ts",
  out: "./db/migrations",
  dialect: "turso",
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
};
