import prisma from "../config/prisma.js";

async function main() {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE projects 
    ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'ETB';
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE projects 
    ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP;
  `);
  console.log("Columns currency and archivedAt added/verified!");

  const cols = await prisma.$queryRawUnsafe(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'projects'
    ORDER BY ordinal_position;
  `);
  console.log("UPDATED COLUMNS:", cols.map(c => c.column_name));
}

main().catch(console.error).finally(() => prisma.$disconnect());
