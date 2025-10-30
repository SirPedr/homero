import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

export async function createTestDb() {
  const pool = new Pool({
    connectionString: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
  });

  const db = drizzle(pool, { schema });

  const migrationsPath = new URL("./migrations", import.meta.url).pathname;

  await migrate(db, { migrationsFolder: migrationsPath });

  return { db, pool };
}

export async function clearDatabase(db: ReturnType<typeof drizzle>) {
  await db.delete(schema.usersTable);
}

export async function withTransaction<T>(
  db: ReturnType<typeof drizzle>,
  callback: (tx: any) => Promise<T>
): Promise<T | undefined> {
  return await db
    .transaction(async (tx) => {
      await callback(tx);
      throw new Error("ROLLBACK");
    })
    .catch((err) => {
      if (err.message === "ROLLBACK") {
        return undefined;
      }
      throw err;
    });
}
