import { hrService } from "../services/hrService.js";
import prisma from "../config/prisma.js";

async function main() {
  const actor = await prisma.user.findFirst({ where: { role: { name: "HR_MANAGER" } } });
  const emp = await prisma.employee.findFirst({ where: { employeeCode: "EMP-0001" } });
  const project = await prisma.project.findFirst({ where: { projectCode: "pr001" } });

  console.log("Actor:", actor?.id);
  console.log("Employee:", emp?.id);
  console.log("Project:", project?.id);

  const payload = {
    fullName: "worker one",
    employeeCode: "EMP-0001",
    phone: "+25193849389483",
    email: "",
    trade: "SITE_LABORER",
    employmentType: "CONTRACT",
    dailyRate: "500",
    monthlySalary: "150000",
    currency: "ETB",
    status: "ACTIVE",
    nationalId: "934809482833894",
    assignedProjectId: project.id,
  };

  try {
    const updated = await hrService.updateEmployee(emp.id, payload, actor.id);
    console.log("Update success:", updated);
  } catch (err) {
    console.error("Update error caught:", err);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
