import { eq, usersTable } from "@homero/db";
import argon2 from "argon2";
import Elysia from "elysia";
import { createRouteHandler } from "helpers/create-route-handler";
import { findUserByUsername } from "../../helpers/find-user-by-username";
import { generateRefreshToken } from "../../helpers/generate-refresh-token";
import { signJWT } from "../../helpers/sign-jwt";
import { LOGIN_BODY_SCHEMA } from "./settings";

export const createLoginHandler = createRouteHandler(({ db }) =>
  new Elysia().post(
    "/login",
    async ({
      body: { username, password },
      set,
      cookie: { access_token, refresh_token }
    }) => {
      const existingUser = await findUserByUsername(db, username);

      if (!existingUser) {
        set.status = 401;
        return "Invalid username or password";
      }

      const doesPasswordMatch = await argon2.verify(
        existingUser.passwordHash,
        password
      );

      if (!doesPasswordMatch) {
        set.status = 401;
        return "Invalid username or password";
      }

      const userPayload = {
        userID: existingUser.id,
        email: existingUser.email,
        username: existingUser.username
      };

      const jwt = await signJWT(userPayload, process.env.JWT_SECRET!);

      const refreshToken = await generateRefreshToken(existingUser.id);

      access_token?.set({
        value: jwt,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 15 * 60
      });

      refresh_token?.set({
        value: refreshToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60
      });

      const hashedRefreshToken = await argon2.hash(refreshToken);

      await db
        .update(usersTable)
        .set({ refreshToken: hashedRefreshToken })
        .where(eq(usersTable.id, existingUser.id));

      return { user: userPayload };
    },
    { body: LOGIN_BODY_SCHEMA }
  )
);
