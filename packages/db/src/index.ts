import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

export * from "drizzle-orm";
export * from "./schema";
export * from "./test-db";
export { NodePgDatabase } from "drizzle-orm/node-postgres";
export { DrizzleQueryError } from "drizzle-orm";

const dbUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || "";

export const db = drizzle(dbUrl, { schema });
