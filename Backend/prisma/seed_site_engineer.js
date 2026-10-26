import prisma from "../config/prisma.js";

async function seedSiteEngineer() {
  console.log("Seeding Site Engineer operational records...");

  // 1. Get Site Engineer, PM, GM
  const siteEngineer = await prisma.user.findFirst({
    where: { email: "yared.site@construction.local" },
  });
  const pm = await prisma.user.findFirst({
    where: { email: "dawit.pm@construction.com" },
  });
  const gm = await prisma.user.findFirst({
    where: { email: "admin@gmail.com" },
  });

  if (!siteEngineer) {
    console.error("Missing Site Engineer (Eng. Yared Abebe) account!");
    return;
  }

  // 2. Assign Site Engineer directly to projects if not already assigned
  const projects = await prisma.project.findMany({
    where: {
      projectCode: {
        in: ["BM-PRJ-0104", "BM-PRJ-0105", "BM-PRJ-0108", "BM-PRJ-0112", "BM-PRJ-0115"],
      },
    },
    include: { milestones: true },
  });

  for (const p of projects) {
    await prisma.project.update({
      where: { id: p.id },
      data: { siteEngineerId: siteEngineer.id },
    });
    console.log(`✓ Assigned ${p.projectName} (${p.projectCode}) directly to ${siteEngineer.fullName}`);
  }

  const boleProject = projects.find((p) => p.projectCode === "BM-PRJ-0104");
  const meskelProject = projects.find((p) => p.projectCode === "BM-PRJ-0105");
  const hawassaProject = projects.find((p) => p.projectCode === "BM-PRJ-0108");

  // 3. Seed Tasks for Site Engineer
  if (boleProject) {
    const taskCount = await prisma.task.count({ where: { projectId: boleProject.id } });
    if (taskCount === 0) {
      const milestone = boleProject.milestones[0];
      await prisma.task.createMany({
        data: [
          {
            projectId: boleProject.id,
            milestoneId: milestone?.id || null,
            assignedToId: siteEngineer.id,
            taskName: "Inspect column rebar spacing on Floor 10 (Grid A-D)",
            description: "Verify rebar diameter, tie wire density, and concrete cover spacers before casting.",
            priority: "HIGH",
            status: "IN_PROGRESS",
            progressPercent: 70,
            startDate: new Date(Date.now() - 3 * 86400000),
            dueDate: new Date(Date.now() + 2 * 86400000),
            completionNotes: "Grid A to C completed. Grid D rebar tie spacing being adjusted.",
            createdById: pm?.id || gm?.id,
          },
          {
            projectId: boleProject.id,
            milestoneId: milestone?.id || null,
            assignedToId: siteEngineer.id,
            taskName: "Formwork alignment & shoring load test",
            description: "Inspect verticality of formwork shutters and check hydraulic jack props.",
            priority: "URGENT",
            status: "IN_PROGRESS",
            progressPercent: 50,
            startDate: new Date(Date.now() - 2 * 86400000),
            dueDate: new Date(Date.now() + 1 * 86400000),
            createdById: pm?.id || gm?.id,
          },
          {
            projectId: boleProject.id,
            milestoneId: milestone?.id || null,
            assignedToId: siteEngineer.id,
            taskName: "Substructure water pump installation in basement sump",
            description: "Install 15kW dewatering submersible pump to clear trench seepage.",
            priority: "MEDIUM",
            status: "COMPLETED",
            progressPercent: 100,
            startDate: new Date(Date.now() - 7 * 86400000),
            dueDate: new Date(Date.now() - 2 * 86400000),
            completedAt: new Date(Date.now() - 2 * 86400000),
            completionNotes: "Pump operational. Flow rate 400 L/min verified.",
            createdById: pm?.id || gm?.id,
          },
          {
            projectId: boleProject.id,
            milestoneId: milestone?.id || null,
            assignedToId: siteEngineer.id,
            taskName: "Concrete compression cube test (7-day break)",
            description: "Conduct compression test on 6 concrete cube specimens from slab pour #8.",
            priority: "HIGH",
            status: "PENDING",
            progressPercent: 0,
            startDate: new Date(),
            dueDate: new Date(Date.now() + 4 * 86400000),
            createdById: pm?.id || gm?.id,
          },
        ],
      });
      console.log(`✓ Seeded tasks for ${boleProject.projectName}`);
    }
  }

  if (hawassaProject) {
    const taskCount = await prisma.task.count({ where: { projectId: hawassaProject.id } });
    if (taskCount === 0) {
      await prisma.task.createMany({
        data: [
          {
            projectId: hawassaProject.id,
            assignedToId: siteEngineer.id,
            taskName: "Steel portal frame torque tightening inspection",
            description: "Calibrated torque wrench check on high-strength anchor bolts (Bay 1-6).",
            priority: "HIGH",
            status: "IN_PROGRESS",
            progressPercent: 80,
            startDate: new Date(Date.now() - 4 * 86400000),
            dueDate: new Date(Date.now() + 3 * 86400000),
            createdById: pm?.id || gm?.id,
          },
          {
            projectId: hawassaProject.id,
            assignedToId: siteEngineer.id,
            taskName: "Roof truss primer & anti-corrosion coating check",
            description: "Dry film thickness measurement of epoxy zinc phosphate primer.",
            priority: "MEDIUM",
            status: "PENDING",
            progressPercent: 20,
            startDate: new Date(),
            dueDate: new Date(Date.now() + 6 * 86400000),
            createdById: pm?.id || gm?.id,
          },
        ],
      });
      console.log(`✓ Seeded tasks for ${hawassaProject.projectName}`);
    }
  }

  // 4. Seed Daily Site Activities
  if (boleProject) {
    const actCount = await prisma.dailySiteActivity.count({ where: { projectId: boleProject.id } });
    if (actCount === 0) {
      await prisma.dailySiteActivity.createMany({
        data: [
          {
            projectId: boleProject.id,
            siteEngineerId: siteEngineer.id,
            activityDate: new Date(),
            activityDescription: "Floor 10 rebar reinforcement inspection and concrete pour preparation",
            workCompleted: "Inspected steel rebar on grids A-C. Concrete pump line checked and primed with cement slurry.",
            laborCount: 38,
            materialsUsed: "120 rebar spacer blocks, 45kg tie wire, 2 drums form oil",
            issues: "Minor hydraulic line leak on tower crane fixed in morning.",
            weatherConditions: "Sunny, 24°C, low wind",
            safetyObservations: "All 38 workers wearing required PPE and harness lanyards clipped on perimeter.",
            notes: "Casting scheduled for tomorrow at 06:00 AM.",
          },
          {
            projectId: boleProject.id,
            siteEngineerId: siteEngineer.id,
            activityDate: new Date(Date.now() - 86400000),
            activityDescription: "Formwork stripping on Level 9 central core",
            workCompleted: "Stripped formwork panels on Core 2. No honeycombing observed on exposed concrete surface.",
            laborCount: 32,
            materialsUsed: "Curing compound applied on 180 sq m vertical surfaces",
            weatherConditions: "Partly cloudy, 22°C",
            safetyObservations: "Debris netting inspected and debris cleared from catch nets.",
          },
        ],
      });
      console.log(`✓ Seeded daily site activities for ${boleProject.projectName}`);
    }
  }

  // 5. Seed Workforce (Employees) assigned to Bole & Hawassa projects
  if (boleProject) {
    const boleWorkers = [
      {
        id: "emp-bole-001",
        employeeCode: "EMP-BL-01",
        fullName: "Kebede Tadesse",
        phone: "+251 911 112233",
        trade: "FOREMAN",
        employmentType: "CONTRACT",
        dailyRate: 650.0,
        currency: "ETB",
        status: "ACTIVE",
        assignedProjectId: boleProject.id,
      },
      {
        id: "emp-bole-002",
        employeeCode: "EMP-BL-02",
        fullName: "Almaz Tesfaye",
        phone: "+251 912 223344",
        trade: "MASON",
        employmentType: "DAILY_LABORER",
        dailyRate: 480.0,
        currency: "ETB",
        status: "ACTIVE",
        assignedProjectId: boleProject.id,
      },
      {
        id: "emp-bole-003",
        employeeCode: "EMP-BL-03",
        fullName: "Mulugeta Alemu",
        phone: "+251 913 334455",
        trade: "CARPENTER",
        employmentType: "DAILY_LABORER",
        dailyRate: 500.0,
        currency: "ETB",
        status: "ACTIVE",
        assignedProjectId: boleProject.id,
      },
      {
        id: "emp-bole-004",
        employeeCode: "EMP-BL-04",
        fullName: "Getachew Bekele",
        phone: "+251 914 445566",
        trade: "STEEL_FIXER",
        employmentType: "DAILY_LABORER",
        dailyRate: 520.0,
        currency: "ETB",
        status: "ACTIVE",
        assignedProjectId: boleProject.id,
      },
      {
        id: "emp-bole-005",
        employeeCode: "EMP-BL-05",
        fullName: "Hanan Mohammed",
        phone: "+251 915 556677",
        trade: "ELECTRICIAN",
        employmentType: "CONTRACT",
        dailyRate: 600.0,
        currency: "ETB",
        status: "ACTIVE",
        assignedProjectId: boleProject.id,
      },
    ];

    for (const w of boleWorkers) {
      await prisma.employees.upsert({
        where: { employeeCode: w.employeeCode },
        update: { assignedProjectId: w.assignedProjectId, status: w.status },
        create: w,
      });
    }
    console.log(`✓ Seeded 5 assigned workers for ${boleProject.projectName}`);

    // Add initial attendance for yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    for (const w of boleWorkers.slice(0, 4)) {
      await prisma.attendances.upsert({
        where: {
          employeeId_date: {
            employeeId: w.id,
            date: yesterday,
          },
        },
        update: {},
        create: {
          id: `att-${w.id}-${yesterday.toISOString().split("T")[0]}`,
          employeeId: w.id,
          projectId: boleProject.id,
          date: yesterday,
          status: "PRESENT",
          overtimeHours: 1.5,
          workHours: 8.0,
          checkInTime: "07:45",
          checkOutTime: "17:15",
          notes: "On-site full shift casting support",
          recordedById: siteEngineer.id,
        },
      });
    }
    console.log(`✓ Seeded historical attendance records for ${boleProject.projectName}`);
  }

  // 6. Seed Notifications for Site Engineer
  const notifCount = await prisma.notifications.count({
    where: { recipientUserId: siteEngineer.id },
  });

  if (notifCount === 0) {
    const notifs = [
      {
        id: "notif-se-001",
        recipientRole: "SITE_ENGINEER",
        recipientUserId: siteEngineer.id,
        title: "New Task Assigned: Floor 10 Rebar Inspection",
        message: "Project Manager Dawit assigned you a new high-priority inspection task for Bole Commercial Center.",
        type: "INFO",
        category: "TASKS",
        link: "/site-engineer/tasks",
        isRead: false,
        createdAt: new Date(Date.now() - 3600000 * 2),
        updatedAt: new Date(Date.now() - 3600000 * 2),
      },
      {
        id: "notif-se-002",
        recipientRole: "SITE_ENGINEER",
        recipientUserId: siteEngineer.id,
        title: "Material Request MR-2026-104 Approved",
        message: "PM Dawit has approved your requisition for 500 Bags Portland Cement & 12 Tons Rebar.",
        type: "SUCCESS",
        category: "MATERIAL_REQUESTS",
        link: "/site-engineer/material-requests",
        isRead: false,
        createdAt: new Date(Date.now() - 3600000 * 5),
        updatedAt: new Date(Date.now() - 3600000 * 5),
      },
      {
        id: "notif-se-003",
        recipientRole: "SITE_ENGINEER",
        recipientUserId: siteEngineer.id,
        title: "Progress Report Reviewed with Comments",
        message: "Weekly Structural Casting report was reviewed by Dawit: 'Approved, proceed with Floor 10 casting.'",
        type: "INFO",
        category: "PROGRESS_REPORTS",
        link: "/site-engineer/progress-reports",
        isRead: true,
        createdAt: new Date(Date.now() - 86400000),
        updatedAt: new Date(Date.now() - 86400000),
      },
    ];

    for (const n of notifs) {
      await prisma.notifications.create({ data: n });
    }
    console.log(`✓ Seeded ${notifs.length} notifications for Site Engineer`);
  }

  console.log("\n✓ Site Engineer operational seeding completed successfully!");
}

seedSiteEngineer()
  .catch((err) => {
    console.error("Site Engineer seed failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
