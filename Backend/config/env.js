import dotenv from "dotenv";

import { fileURLToPath } from "node:url";
import path from "node:path";

// Locate the existing .env file in the project root.
const configDir = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(configDir, "../.env");

const result = dotenv.config({ path: envPath });

if (result.error) {
  throw new Error(`Failed to load .env file: ${result.error.message}`);
}

export const env = {
  PORT: Number(process.env.PORT || 5000),
  NODE_ENV: process.env.NODE_ENV || "development",
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "15m",
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173",
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
