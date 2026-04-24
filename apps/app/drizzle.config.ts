import { config } from "dotenv";

config({ path: ".env.local" });

const drizzleConfig = {
  schema: "./db/schema/index.ts",
  out: "./db/migrations",
  dialect: "turso",
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
};

export default drizzleConfig;
