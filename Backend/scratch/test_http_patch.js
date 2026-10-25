import prisma from "../config/prisma.js";
import { generateAccessToken } from "../utils/auth.js";

async function testHttpPatch() {
  const hrUser = await prisma.user.findFirst({
    where: { role: { name: "HR_MANAGER" } },
  });

  const emp = await prisma.employee.findFirst({
    where: { employeeCode: "EMP-0001" },
  });

  const project = await prisma.project.findFirst({
    where: { projectCode: "pr001" },
  });

  const token = generateAccessToken({ userId: hrUser.id });

  // This is what the React state formData looks like when the form submits
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

  console.log("Sending PATCH to:", `http://localhost:5000/api/hr/employees/${emp.id}`);

  try {
    const res = await fetch(`http://localhost:5000/api/hr/employees/${emp.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    console.log("HTTP Status:", res.status);
    const json = await res.json();
    console.log("HTTP Response:", json);
  } catch (err) {
    console.error("HTTP Fetch Error:", err);
  }

  await prisma.$disconnect();
}

testHttpPatch().catch(console.error);
