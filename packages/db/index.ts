import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";

import * as schema from "./schema";

/**
 * Turso Database Client
 * Creates a connection to the Turso database using LibSQL
 */
const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

/**
 * Drizzle ORM Database Instance
 * Configured with full schema for type-safe queries
 */
export const db = drizzle(client, { schema });

export type Database = typeof db;
