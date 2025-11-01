import { cors } from "@elysiajs/cors";
import { db } from "@homero/db";
import "dotenv/config";
import { Elysia } from "elysia";
import { createLoginHandler } from "./modules/auth/handlers/login";
import { createRegisterHandler } from "./modules/auth/handlers/register";

export const app = new Elysia()
  .use(
    cors({
      origin: process.env.CORS_ORIGIN || "",
      methods: ["GET", "POST", "OPTIONS"]
    })
  )
  .use(createRegisterHandler({ db }))
  .use(createLoginHandler({ db }));

if (import.meta.main) {
  app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
  });
}
