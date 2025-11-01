import type { NodePgDatabase } from "@homero/db";
import * as schema from "@homero/db/schema";

type AppDB = NodePgDatabase<typeof schema>;

export const findUserByUsername = (db: AppDB, username: string) =>
  db.query.usersTable.findFirst({
    where: (user, { eq }) => eq(user.username, username)
  });
