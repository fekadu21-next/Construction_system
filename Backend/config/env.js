import dotenv from "dotenv";

import { fileURLToPath } from "node:url";
import path from "node:path";

// Locate the existing .env file in the project root.
const configDir = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(configDir, "../.env");

const result = dotenv.config({ path: envPath, override: true });

if (result.error) {
  throw new Error(`Failed to load .env file: ${result.error.message}`);
}

// Ensure Supabase connection pooler uses port 6543 to avoid network timeouts on 5432
let dbUrl = process.env.DATABASE_URL;
if (dbUrl && dbUrl.includes("pooler.supabase.com:5432")) {
  dbUrl = dbUrl.replace("pooler.supabase.com:5432", "pooler.supabase.com:6543");
  process.env.DATABASE_URL = dbUrl;
}

let directUrl = process.env.DIRECT_URL;
if (directUrl && directUrl.includes("pooler.supabase.com:5432")) {
  directUrl = directUrl.replace("pooler.supabase.com:5432", "pooler.supabase.com:6543");
  process.env.DIRECT_URL = directUrl;
}

export const env = {
  PORT: Number(process.env.PORT || 5000),
  NODE_ENV: process.env.NODE_ENV || "development",
  DATABASE_URL: dbUrl,
  DIRECT_URL: directUrl,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "15m",
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5174",
  // Email / SMTP settings
  SMTP_HOST: process.env.SMTP_HOST || process.env.EMAIL_HOST || "",
  SMTP_PORT: Number(process.env.SMTP_PORT || process.env.EMAIL_PORT || 587),
  SMTP_SECURE: process.env.SMTP_SECURE === "true",
  SMTP_USER: process.env.SMTP_USER || process.env.EMAIL_USER || "",
  SMTP_PASS: process.env.SMTP_PASS || process.env.EMAIL_PASS || "",
  EMAIL_SERVICE: process.env.EMAIL_SERVICE || "",
  EMAIL_FROM: process.env.EMAIL_FROM || process.env.SMTP_FROM || "",
};

// Validate required configuration.
if (!env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing from .env");
}

if (!env.DIRECT_URL) {
  throw new Error("DIRECT_URL is missing from .env");
}

if (!env.JWT_SECRET) {
  throw new Error("JWT_SECRET is missing from .env");
}

console.log("Environment variables loaded successfully.");
