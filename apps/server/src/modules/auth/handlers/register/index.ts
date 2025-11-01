import { usersTable } from "@homero/db";
import argon2 from "argon2";
import Elysia from "elysia";
import { createRouteHandler } from "helpers/create-route-handler";
import { REGISTER_BODY_SCHEMA } from "./settings";

export const createRegisterHandler = createRouteHandler(({ db }) =>
  new Elysia().post(
    "/register",
    async ({ body: { username, email, password }, set }) => {
      const hashedPassword = await argon2.hash(password);

      try {
        await db.insert(usersTable).values({
          username,
          passwordHash: hashedPassword,
          email
        });
      } catch (error: any) {
        if (error.cause?.code === "23505") {
          set.status = 409;
          return "User already exists";
        }
        throw error;
      }
    },
    {
      body: REGISTER_BODY_SCHEMA
    }
  )
);
