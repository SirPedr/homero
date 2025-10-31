import { cors } from "@elysiajs/cors";
import "dotenv/config";
import { Elysia } from "elysia";
import { registerHandler } from "./modules/auth/handlers/register";
import { loginHandler } from "./modules/auth/handlers/login";

export const app = new Elysia()
  .use(
    cors({
      origin: process.env.CORS_ORIGIN || "",
      methods: ["GET", "POST", "OPTIONS"]
    })
  )
  .use(registerHandler)
  .use(loginHandler);

if (import.meta.main) {
  app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
  });
}
