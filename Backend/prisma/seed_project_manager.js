import bcrypt from "bcryptjs";
import prisma from "../config/prisma.js";

async function seedPM() {
  console.log("Seeding Project Manager operational records...");

  // 1. Get Dawit (Project Manager) and GM
  const dawit = await prisma.user.findFirst({
    where: { email: "dawit.pm@construction.com" },
  });
  const gm = await prisma.user.findFirst({
    where: { email: "admin@gmail.com" },
  });
  const seRole = await prisma.role.findUnique({
    where: { name: "SITE_ENGINEER" },
  });

  if (!dawit || !gm) {
    console.error("Missing Dawit or GM account");
    return;
  }

  // 2. Ensure Site Engineer exists
  const sePasswordHash = await bcrypt.hash("Engineer@123456", 10);
  const siteEngineer = await prisma.user.upsert({
    where: { email: "yared.site@construction.local" },
    update: {},
    create: {
      fullName: "Eng. Yared Abebe",
      email: "yared.site@construction.local",
      phone: "+251 911 345678",
      passwordHash: sePasswordHash,
      roleId: seRole.id,
      isActive: true,
      emailVerifiedAt: new Date(),
      createdById: gm.id,
    },
  });
  console.log("✓ Site Engineer ready:", siteEngineer.fullName);

  // 3. Projects definitions
  const projectsData = [
    {
      projectName: "Bole Commercial Center Tower",
      projectCode: "BM-PRJ-0104",
      description: "14-storey mixed commercial building with 2 basement levels and smart parking.",
      location: "Bole Sub-City, Addis Ababa",
      startDate: new Date("2025-08-15"),
      endDate: new Date("2026-12-30"),
      budget: 48500000.0,
      currency: "ETB",
      status: "IN_PROGRESS",
      projectManagerId: dawit.id,
      createdById: gm.id,
    },
    {
      projectName: "Meskel Square Multi-Use Plaza",
      projectCode: "BM-PRJ-0105",
      description: "Civic open square, pedestrian underpass, retail pavilions, and underground storage.",
      location: "Kirkos District, Addis Ababa",
      startDate: new Date("2025-11-01"),
      endDate: new Date("2027-03-15"),
      budget: 62000000.0,
      currency: "ETB",
      status: "ON_HOLD",
      projectManagerId: dawit.id,
      createdById: gm.id,
    },
    {
      projectName: "Hawassa Industrial Warehouse Hub",
      projectCode: "BM-PRJ-0108",
      description: "Pre-engineered steel warehouse units (12,000 sq m) with automated loading bays.",
      location: "Industrial Park Zone, Hawassa",
      startDate: new Date("2025-06-10"),
      endDate: new Date("2026-11-30"),
      budget: 24000000.0,
      currency: "ETB",
      status: "IN_PROGRESS",
      projectManagerId: dawit.id,
      createdById: gm.id,
    },
    {
      projectName: "Entoto Eco-Lodge & Visitor Center",
      projectCode: "BM-PRJ-0112",
      description: "Sustainable stone and timber guest chalets, dining terrace, and off-grid solar grid.",
      location: "Entoto Natural Park, Addis Ababa",
      startDate: new Date("2025-03-01"),
      endDate: new Date("2026-09-15"),
      budget: 18500000.0,
      currency: "ETB",
      status: "COMPLETED",
      projectManagerId: dawit.id,
      createdById: gm.id,
    },
    {
      projectName: "Adama Highway Logistics Terminal",
      projectCode: "BM-PRJ-0115",
      description: "Heavy freight parking, reinforced concrete pavements, and customs weighbridge facility.",
      location: "Toll Expressway Exit 3, Adama",
      startDate: new Date("2026-02-01"),
      endDate: new Date("2027-08-30"),
      budget: 35000000.0,
      currency: "ETB",
      status: "PLANNED",
      projectManagerId: dawit.id,
      createdById: gm.id,
    },
  ];

  for (const p of projectsData) {
    const project = await prisma.project.upsert({
      where: { projectCode: p.projectCode },
      update: {
        projectName: p.projectName,
        status: p.status,
        projectManagerId: p.projectManagerId,
        budget: p.budget,
        location: p.location,
      },
      create: p,
    });
    console.log(`✓ Project ready: ${project.projectName} (${project.projectCode})`);

    // Add Milestones if none exist
    const milestoneCount = await prisma.milestone.count({ where: { projectId: project.id } });
    if (milestoneCount === 0) {
      await prisma.milestone.createMany({
        data: [
          {
            projectId: project.id,
            milestoneName: "Substructure Excavation & Foundation Raft",
            dueDate: new Date(Date.now() - 30 * 86400000),
            status: "COMPLETED",
            progressPercent: 100,
            assignedEngineerId: siteEngineer.id,
            createdById: dawit.id,
          },
          {
            projectId: project.id,
            milestoneName: "Floor 10 Structural Slab Casting",
            dueDate: new Date(Date.now() + 5 * 86400000),
            status: p.status === "ON_HOLD" ? "BEHIND_SCHEDULE" : "IN_PROGRESS",
            progressPercent: p.status === "ON_HOLD" ? 40 : 75,
            assignedEngineerId: siteEngineer.id,
            createdById: dawit.id,
          },
          {
            projectId: project.id,
            milestoneName: "Exterior Curtain Wall & Cladding",
            dueDate: new Date(Date.now() + 60 * 86400000),
            status: "UPCOMING",
            progressPercent: 0,
            assignedEngineerId: siteEngineer.id,
            createdById: dawit.id,
          },
        ],
      });
      console.log(`  + Seeded milestones for ${project.projectName}`);
    }

    // Add Progress Report if none exist
    const reportCount = await prisma.progressReport.count({ where: { projectId: project.id } });
    if (reportCount === 0) {
      await prisma.progressReport.create({
        data: {
          projectId: project.id,
          siteEngineerId: siteEngineer.id,
          reportTitle: "Weekly Structural Casting & Rebar Inspection",
          workCompleted: "Completed formwork stripping on Grid B-C and concrete compression testing.",
          reportedProgress: "+5.2% Floor Slab 9 Cured",
          issuesOrDelays: p.status === "ON_HOLD" ? "Groundwater infiltration in trench requiring extra pump." : "None",
          weatherConditions: "Dry (24°C)",
          laborCount: 42,
          equipmentActive: "Tower Crane #2, Mobile Mixer, Concrete Pump",
          photosAttached: 4,
          reviewStatus: p.status === "ON_HOLD" ? "FLAGGED" : "PENDING_REVIEW",
        },
      });
      console.log(`  + Seeded progress report for ${project.projectName}`);
    }

    // Add Material Request if none exist
    const requestCount = await prisma.materialRequest.count({ where: { projectId: project.id } });
    if (requestCount === 0) {
      const mr = await prisma.materialRequest.create({
        data: {
          requestNumber: `MR-2026-${project.projectCode.slice(-3)}`,
          projectId: project.id,
          requestedById: siteEngineer.id,
          requestedMaterials: "500 Bags Portland Cement (Grade 42.5R) & 12 Tons Rebar 16mm",
          totalEstimatedCost: 1901000.0,
          urgency: p.status === "ON_HOLD" ? "CRITICAL" : "HIGH",
          status: "PENDING",
          justification: "Critical for casting floor structural columns before scheduled rain.",
          deliveryLocation: "Site Gate 2 - Central Yard",
          items: {
            create: [
              { itemName: "Portland Cement (Grade 42.5R)", quantity: 500, unit: "Bags", estimatedUnitCost: 1450.0 },
              { itemName: "High-Yield Deformed Steel 16mm", quantity: 12, unit: "Tons", estimatedUnitCost: 98000.0 },
            ],
          },
        },
      });
      console.log(`  + Seeded material request for ${project.projectName} (${mr.requestNumber})`);
    }

    // Add Project Expenses if none exist
    const expenseCount = await prisma.projectExpense.count({ where: { projectId: project.id } });
    if (expenseCount === 0) {
      const baseCost = Number(p.budget) * 0.45;
      await prisma.projectExpense.createMany({
        data: [
          {
            projectId: project.id,
            category: "MATERIALS",
            amount: baseCost * 0.5,
            currency: "ETB",
            description: "Bulk cement and rebar procurement batch 1 & 2",
            expenseDate: new Date(Date.now() - 20 * 86400000),
            recordedById: gm.id,
          },
          {
            projectId: project.id,
            category: "LABOR",
            amount: baseCost * 0.3,
            currency: "ETB",
            description: "Direct skilled trades and daily labor payroll",
            expenseDate: new Date(Date.now() - 10 * 86400000),
            recordedById: gm.id,
          },
          {
            projectId: project.id,
            category: "EQUIPMENT",
            amount: baseCost * 0.2,
            currency: "ETB",
            description: "Tower crane and earthmoving equipment lease",
            expenseDate: new Date(Date.now() - 5 * 86400000),
            recordedById: gm.id,
          },
        ],
      });
      console.log(`  + Seeded expenses for ${project.projectName}`);
    }
  }

  console.log("\n✓ Project Manager database seeding completed successfully!");
}

seedPM()
  .catch((err) => {
    console.error("PM Seed failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
