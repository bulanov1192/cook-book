import path from "node:path";
import { config as loadEnv } from "dotenv";
import { z } from "zod";

loadEnv();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_FILE: z.string().default("./data/recipe-book.db"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  BETTER_AUTH_URL: z.string().optional(),
  BETTER_AUTH_SECRET: z.string().default("dev-secret-change-me-dev-secret-change-me"),
  ADMIN_EMAILS: z.string().default("")
});

const parsed = envSchema.parse(process.env);

export const env = {
  ...parsed,
  DATABASE_FILE: path.resolve(process.cwd(), parsed.DATABASE_FILE),
  BETTER_AUTH_URL: parsed.BETTER_AUTH_URL ?? `http://localhost:${parsed.PORT}`,
  ADMIN_EMAILS: parsed.ADMIN_EMAILS
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
};
