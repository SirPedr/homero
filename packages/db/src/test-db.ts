import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import * as schema from "./schema";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { Wait } from "testcontainers";

export async function createTestDb() {
  console.log("Starting PostgreSQL test container...");

  const container = await new PostgreSqlContainer("postgres:17-alpine")
    .withDatabase("homero-test")
    .withUsername("homero_admin")
    .withPassword("homero")
    .withWaitStrategy(
      Wait.forLogMessage(/database system is ready to accept connections/, 2)
    )
    .start();

  console.log(`✓ Test database started at ${container.getConnectionUri()}`);

  const connectionUri = container.getConnectionUri();
  const db = drizzle(connectionUri, { schema });
  const migrationsPath = new URL("./migrations", import.meta.url).pathname;

  try {
    await migrate(db, { migrationsFolder: migrationsPath });
    console.log("✓ Migrations completed successfully");
  } catch (error) {
    console.error("✗ Migration failed:", error);
    throw error;
  }

  return { db, container };
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
