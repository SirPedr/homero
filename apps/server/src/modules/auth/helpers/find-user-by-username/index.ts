import { db } from "@homero/db";

export const findUserByUsername = (username: string) =>
  db.query.usersTable.findFirst({
    where: (user, { eq }) => eq(user.username, username)
  });
