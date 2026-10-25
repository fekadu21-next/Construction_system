import pool from "../config/db.js";

const sql = `
CREATE TABLE IF NOT EXISTS "employees" (
    "id" TEXT NOT NULL,
    "employeeCode" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "trade" TEXT NOT NULL,
    "employmentType" TEXT NOT NULL DEFAULT 'DAILY_LABORER',
    "dailyRate" DECIMAL(10,2),
    "monthlySalary" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'ETB',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "nationalId" TEXT,
    "assignedProjectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "employees_employeeCode_key" ON "employees"("employeeCode");
CREATE INDEX IF NOT EXISTS "employees_trade_idx" ON "employees"("trade");
CREATE INDEX IF NOT EXISTS "employees_status_idx" ON "employees"("status");
CREATE INDEX IF NOT EXISTS "employees_assignedProjectId_idx" ON "employees"("assignedProjectId");

CREATE TABLE IF NOT EXISTS "attendances" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "projectId" TEXT,
    "date" DATE NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PRESENT',
    "overtimeHours" DECIMAL(4,2) NOT NULL DEFAULT 0.00,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendances_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "attendances_employeeId_date_key" ON "attendances"("employeeId", "date");
CREATE INDEX IF NOT EXISTS "attendances_projectId_idx" ON "attendances"("projectId");
CREATE INDEX IF NOT EXISTS "attendances_date_idx" ON "attendances"("date");

CREATE TABLE IF NOT EXISTS "leave_requests" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "leaveType" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewerNote" TEXT,
    "reviewedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leave_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "leave_requests_employeeId_idx" ON "leave_requests"("employeeId");
CREATE INDEX IF NOT EXISTS "leave_requests_status_idx" ON "leave_requests"("status");

ALTER TABLE "employees" DROP CONSTRAINT IF EXISTS "employees_assignedProjectId_fkey";
ALTER TABLE "employees" ADD CONSTRAINT "employees_assignedProjectId_fkey" FOREIGN KEY ("assignedProjectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "attendances" DROP CONSTRAINT IF EXISTS "attendances_employeeId_fkey";
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "leave_requests" DROP CONSTRAINT IF EXISTS "leave_requests_employeeId_fkey";
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
`;

async function main() {
  console.log("Creating HR tables in Supabase PostgreSQL...");
  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log("✓ Successfully created tables: employees, attendances, leave_requests");

    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    console.log("Public tables currently in database:", res.rows.map(r => r.table_name));
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
