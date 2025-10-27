import "dotenv/config";
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";

const app = new Elysia()
  .use(
    cors({
      origin: process.env.CORS_ORIGIN || "",
      methods: ["GET", "POST", "OPTIONS"],
    })
  )
  .get("/", () => "Abobra Server is up and running!")
  .listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
  });
