import pool from "../config/db.js";

const sql = `
ALTER TABLE "attendances" ADD COLUMN IF NOT EXISTS "checkInTime" TEXT;
ALTER TABLE "attendances" ADD COLUMN IF NOT EXISTS "checkOutTime" TEXT;
ALTER TABLE "attendances" ADD COLUMN IF NOT EXISTS "workHours" DECIMAL(4,2) DEFAULT 8.00;
ALTER TABLE "attendances" ADD COLUMN IF NOT EXISTS "approvalStatus" TEXT NOT NULL DEFAULT 'APPROVED';
ALTER TABLE "attendances" ADD COLUMN IF NOT EXISTS "recordedById" TEXT;
ALTER TABLE "attendances" ADD COLUMN IF NOT EXISTS "reviewedById" TEXT;
ALTER TABLE "attendances" ADD COLUMN IF NOT EXISTS "correctionReason" TEXT;
ALTER TABLE "attendances" ADD COLUMN IF NOT EXISTS "submittedAt" TIMESTAMP(3);
ALTER TABLE "attendances" ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "attendances_approvalStatus_idx" ON "attendances"("approvalStatus");

ALTER TABLE "attendances" DROP CONSTRAINT IF EXISTS "attendances_projectId_fkey";
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
`;

async function main() {
  console.log("Upgrading attendances table schema in Supabase PostgreSQL...");
  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log("✓ Successfully upgraded attendances table with workflow columns!");

    const cols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'attendances'
      ORDER BY ordinal_position;
    `);
    console.log("Columns in attendances table:", cols.rows.map(c => `${c.column_name} (${c.data_type})`));
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
