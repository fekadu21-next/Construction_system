import prisma from "../config/prisma.js";

async function main() {
  const cols = await prisma.$queryRawUnsafe(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'projects'
    ORDER BY ordinal_position;
  `);
  console.log("PROJECT COLUMNS:", cols);

  const projects = await prisma.project.findMany();
  console.log("CURRENT PROJECTS COUNT:", projects.length);
  if (projects.length > 0) {
    console.log("SAMPLE PROJECT:", projects[0]);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
