import { beforeAll, afterAll, beforeEach } from "bun:test";
import { createTestDb, clearDatabase } from "@homero/db";

let testDb: Awaited<ReturnType<typeof createTestDb>>["db"];
let testPool: Awaited<ReturnType<typeof createTestDb>>["pool"];

beforeAll(async () => {
  const { db, pool } = await createTestDb();
  testDb = db;
  testPool = pool;
});

afterAll(async () => {
  await testPool?.end();
});

beforeEach(async () => {
  await clearDatabase(testDb);
});

export { testDb };
