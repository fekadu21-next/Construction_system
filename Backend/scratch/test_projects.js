import { projectService } from "../services/projectService.js";
import prisma from "../config/prisma.js";

async function test() {
  console.log("Testing project service...");
  const metrics = await projectService.getProjectMetrics();
  console.log("METRICS:", metrics);

  const nextCode = await projectService.generateNextProjectCode();
  console.log("NEXT CODE:", nextCode);

  const projects = await projectService.getProjects({ page: 1, limit: 5 });
  console.log("PROJECTS TOTAL:", projects.total);
  console.log("PROJECTS METRICS IN RESULT:", projects.metrics);
  console.log("ALL TESTS PASSED!");
}

test().catch(console.error).finally(() => prisma.$disconnect());
