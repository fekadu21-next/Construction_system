import prisma from "../config/prisma.js";
import { generateAccessToken } from "../utils/auth.js";

async function testHrProjectsEndpoint() {
  const hrUser = await prisma.user.findFirst({
    where: {
      role: { name: "HR_MANAGER" },
      isActive: true,
    },
    include: { role: true },
  });

  if (!hrUser) {
    console.error("No active HR_MANAGER user found");
    return;
  }

  console.log("Testing with HR user:", hrUser.email, "role:", hrUser.role.name);

  const token = generateAccessToken({ userId: hrUser.id });
  const res = await fetch("http://localhost:5000/api/hr/projects", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const json = await res.json();
  console.log("HTTP /api/hr/projects status:", res.status);
  console.log("HTTP /api/hr/projects response:", JSON.stringify(json, null, 2));

  await prisma.$disconnect();
}

testHrProjectsEndpoint().catch(console.error);
