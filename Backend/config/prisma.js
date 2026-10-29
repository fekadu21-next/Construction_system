import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import path from "node:path";

// Ensure .env is loaded even if prisma.js is imported directly
const configDir = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(configDir, "../.env");
dotenv.config({ path: envPath, override: true });

function getSanitizedDbUrl() {
  let url = process.env.DATABASE_URL || process.env.DIRECT_URL;
  if (url && url.includes("pooler.supabase.com:5432")) {
    url = url.replace("pooler.supabase.com:5432", "pooler.supabase.com:6543");
  }
  return url;
}

const prismaClientSingleton = () => {
  const url = getSanitizedDbUrl();
  return new PrismaClient({
    datasources: url
      ? {
          db: {
            url,
          },
        }
      : undefined,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
};

const client = globalThis.prismaGlobal ?? prismaClientSingleton();

// Provide compatibility aliases between singular and plural/snake_case model access
const modelAliases = {
  attendances: "attendance",
  employees: "employee",
  materials: "material",
  suppliers: "supplier",
  notifications: "notification",
  leave_requests: "leaveRequest",
  stock_movements: "stockMovement",
  material_categories: "materialCategory",
  daily_site_activities: "dailySiteActivity",
};

const prisma = new Proxy(client, {
  get(target, prop, receiver) {
    if (prop in target) {
      return Reflect.get(target, prop, receiver);
    }
    const alias = modelAliases[prop];
    if (alias && alias in target) {
      return Reflect.get(target, alias, receiver);
    }
    return Reflect.get(target, prop, receiver);
  },
});

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = client;

