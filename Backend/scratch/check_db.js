import prisma from "../config/prisma.js";

async function main() {
  const tables = await prisma.$queryRawUnsafe(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `);
  console.log("PUBLIC TABLES:", tables.map(t => t.table_name));

  const empCount = await prisma.employee.count();
  console.log("EMPLOYEES COUNT:", empCount);

  const employees = await prisma.employee.findMany();
  console.log("EMPLOYEES LIST:", employees);

  const projects = await prisma.project.findMany();
  console.log("CURRENT PROJECTS COUNT:", projects.length);
}

main().catch(console.error).finally(() => prisma.$disconnect());
