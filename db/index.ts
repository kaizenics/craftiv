import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";

import * as schema from "./schema";

/**
 * Turso Database Client
 * Creates a connection to the Turso database using LibSQL
 */
const databaseUrl = process.env.TURSO_DATABASE_URL?.trim();
if (!databaseUrl) {
  throw new Error("TURSO_DATABASE_URL is not set.");
}

const client = createClient({
  url: databaseUrl,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

/**
 * Drizzle ORM Database Instance
 * Configured with full schema for type-safe queries
 */
export const db = drizzle(client, { schema });

export type Database = typeof db;
