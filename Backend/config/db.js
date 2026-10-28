import pg from "pg";
import { env } from "./env.js";

const { Pool } = pg;

const pool = new Pool({
  connectionString: env.DATABASE_URL,

  ssl: {
    rejectUnauthorized: false,
  },

  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 60000,
});

// Report unexpected connection errors.
pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL pool error:", error.message);
});

async function ensureSupervisorTables(client) {
  try {
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'CANCELLED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE "RequestUrgency" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'EMERGENCY');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE "MaterialRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'FULFILLED', 'CANCELLED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      CREATE TABLE IF NOT EXISTS "tasks" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "projectId" TEXT NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
        "taskName" TEXT NOT NULL,
        "description" TEXT,
        "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
        "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
        "progressPercent" INTEGER NOT NULL DEFAULT 0,
        "startDate" TIMESTAMP(3),
        "dueDate" TIMESTAMP(3),
        "completedAt" TIMESTAMP(3),
        "completionNotes" TEXT,
        "issues" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS "tasks_projectId_idx" ON "tasks"("projectId");
      CREATE INDEX IF NOT EXISTS "tasks_status_idx" ON "tasks"("status");

      CREATE TABLE IF NOT EXISTS "material_categories" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL UNIQUE,
        "description" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "materials" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "code" TEXT NOT NULL UNIQUE,
        "name" TEXT NOT NULL,
        "unit" TEXT NOT NULL,
        "reorderLevel" DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        "currentStock" DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        "description" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "categoryId" TEXT REFERENCES "material_categories"("id") ON DELETE SET NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS "materials_categoryId_idx" ON "materials"("categoryId");

      CREATE TABLE IF NOT EXISTS "material_requests" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "requestNumber" TEXT NOT NULL UNIQUE,
        "projectId" TEXT NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
        "requestedById" TEXT NOT NULL REFERENCES "users"("id"),
        "requestedMaterials" TEXT NOT NULL,
        "totalEstimatedCost" DECIMAL(15, 2),
        "urgency" "RequestUrgency" NOT NULL DEFAULT 'NORMAL',
        "status" "MaterialRequestStatus" NOT NULL DEFAULT 'PENDING',
        "justification" TEXT,
        "deliveryLocation" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS "material_requests_projectId_idx" ON "material_requests"("projectId");
      CREATE INDEX IF NOT EXISTS "material_requests_requestedById_idx" ON "material_requests"("requestedById");
      CREATE INDEX IF NOT EXISTS "material_requests_status_idx" ON "material_requests"("status");

      CREATE TABLE IF NOT EXISTS "material_request_items" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "materialRequestId" TEXT NOT NULL REFERENCES "material_requests"("id") ON DELETE CASCADE,
        "itemName" TEXT NOT NULL,
        "quantity" DECIMAL(10, 2) NOT NULL DEFAULT 1.00,
        "unit" TEXT NOT NULL DEFAULT 'PCS',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS "material_request_items_materialRequestId_idx" ON "material_request_items"("materialRequestId");

      CREATE TABLE IF NOT EXISTS "daily_site_activities" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "projectId" TEXT NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
        "siteEngineerId" TEXT,
        "activityDate" DATE NOT NULL,
        "activityDescription" TEXT NOT NULL,
        "workCompleted" TEXT NOT NULL,
        "laborCount" INTEGER NOT NULL DEFAULT 0,
        "materialsUsed" TEXT,
        "issues" TEXT,
        "weatherConditions" TEXT DEFAULT 'Clear',
        "safetyObservations" TEXT DEFAULT 'Normal operations, PPE observed',
        "notes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS "daily_site_activities_projectId_idx" ON "daily_site_activities"("projectId");
      CREATE INDEX IF NOT EXISTS "daily_site_activities_activityDate_idx" ON "daily_site_activities"("activityDate");
    `);
    console.log("Supervisor and site operations tables verified successfully.");
  } catch (err) {
    console.warn("Table auto-migration notice (handled):", err.message);
  }
}

// Test the database connection.
export async function connectDB() {
  let client;

  try {
    client = await pool.connect();

    const result = await client.query(`
      SELECT
        current_database() AS database_name,
        NOW() AS server_time
    `);

    console.log("Supabase PostgreSQL connected successfully!");
    console.log("Database:", result.rows[0].database_name);
    console.log("Database time:", result.rows[0].server_time);

    // Auto-verify supervisor & operations tables
    await ensureSupervisorTables(client);

    return result.rows[0];
  } catch (error) {
    console.error("Database connection failed:", error.message);
    throw error;
  } finally {
    client?.release();
  }
}

// Export the pool for use in API routes.
export default pool;
