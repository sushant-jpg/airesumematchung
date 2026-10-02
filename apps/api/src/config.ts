import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { loadEnvFile } from "node:process";
import { z } from "zod";

for (const envPath of [resolve(process.cwd(), ".env"), resolve(process.cwd(), "../../.env")]) {
  if (existsSync(envPath)) { loadEnvFile(envPath); break; }
}

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().int().positive().default(4000),
  WEB_URL: z.string().url().default("http://localhost:3000"),
  MONGODB_URI: z.string().min(1).default("mongodb://localhost:27017/hirematch"),
  JWT_ACCESS_SECRET: z.string().min(32).default("development-access-secret-change-me-now"),
  JWT_REFRESH_SECRET: z.string().min(32).default("development-refresh-secret-change-me"),
  ACCESS_TOKEN_TTL: z.string().default("15m"),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().positive().default(7),
  AI_SERVICE_URL: z.string().url().default("http://localhost:8000"),
  COOKIE_SECURE: z.enum(["true", "false"]).default("false"),
  MAX_RESUME_SIZE_MB: z.coerce.number().positive().max(20).default(5),
  RESUME_STORAGE_DIR: z.string().default("uploads/resumes")
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) throw new Error(`Invalid environment: ${parsed.error.message}`);
export const config = parsed.data;
