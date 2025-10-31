import z from "zod";

export const LOGIN_BODY_SCHEMA = z.object({
  username: z.string(),
  password: z.string()
});
