import z from "zod";

export const REGISTER_BODY_SCHEMA = z.object({
  username: z.string().trim().min(1).max(255),
  email: z.email().max(255),
  password: z
    .string()
    .min(8)
    .max(100, "Password must be between 8 and 100 characters")
});
