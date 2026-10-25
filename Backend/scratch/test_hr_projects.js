import { hrService } from "../services/hrService.js";
import prisma from "../config/prisma.js";

async function main() {
  console.log("Testing hrService.getProjects()...");
  const projects = await hrService.getProjects();
  console.log("Successfully fetched projects for HR module:", projects);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
