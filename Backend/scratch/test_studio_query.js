import prisma from "../config/prisma.js";

async function main() {
  console.log("Running the exact Prisma Studio query on Employee...");
  try {
    const res = await prisma.employee.findMany({
      take: 100,
      skip: 0,
      select: {
        id: true,
        employeeCode: true,
        fullName: true,
        phone: true,
        email: true,
        trade: true,
        employmentType: true,
        dailyRate: true,
        monthlySalary: true,
        currency: true,
        status: true,
        nationalId: true,
        assignedProjectId: true,
        assignedProject: true,
        attendanceLogs: {
          select: {
            id: true,
          },
        },
        leaveRequests: {
          select: {
            id: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });
    console.log("✓ QUERY SUCCESS! Found rows:", res.length);
    console.log("Sample:", res[0] || "No records yet");
  } catch (err) {
    console.error("✗ QUERY FAILED:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
