import bcrypt from "bcryptjs";
import prisma from "../config/prisma.js";

const ROLES = [
  {
    id: "general-manager-id",
    name: "GENERAL_MANAGER",
    description: "Oversees the system, users, and projects.",
  },
  {
    id: "project-manager-id",
    name: "PROJECT_MANAGER",
    description: "Manages assigned construction projects.",
  },
  {
    id: "hr-manager-id",
    name: "HR_MANAGER",
    description: "Handles workforce and HR responsibilities.",
  },
  {
    id: "site-engineer-id",
    name: "SITE_ENGINEER",
    description: "Handles site operations and technical progress.",
  },
  {
    id: "procurement-officer-id",
    name: "PROCUREMENT_OFFICER",
    description: "Handles suppliers and procurement.",
  },
  {
    id: "accountant-id",
    name: "ACCOUNTANT",
    description: "Handles financial records and expenses.",
  },
  {
    id: "supervisor-id",
    name: "SUPERVISOR",
    description: "Supervises site workforce and daily construction activities.",
  },
];

const GM_EMAIL = (process.env.SEED_GENERAL_MANAGER_EMAIL || "admin@gmail.com").toLowerCase().trim();
const GM_PASSWORD = process.env.SEED_GENERAL_MANAGER_PASSWORD || "Admin@123456";
const GM_NAME = "General Manager";
const GM_PHONE = "+251 911 234567";

async function seed() {
  console.log("Starting seed process...");

  // 1. Create or ensure all system roles exist
  console.log("\nEnsuring all system roles exist...");
  for (const role of ROLES) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: role,
    });
    console.log(`✓ Role ready: ${role.name}`);
  }

  // Find general manager role id
  const gmRole = await prisma.role.findUnique({
    where: { name: "GENERAL_MANAGER" },
  });

  // 2. Create or update the single General Manager account
  console.log(`\nConfiguring General Manager account: ${GM_EMAIL}...`);
  const passwordHash = await bcrypt.hash(GM_PASSWORD, 12);

  const gmUser = await prisma.user.upsert({
    where: { email: GM_EMAIL },
    update: {
      fullName: GM_NAME,
      phone: GM_PHONE,
      passwordHash,
      roleId: gmRole.id,
      isActive: true,
      emailVerifiedAt: new Date(),
    },
    create: {
      fullName: GM_NAME,
      email: GM_EMAIL,
      phone: GM_PHONE,
      passwordHash,
      roleId: gmRole.id,
      isActive: true,
      emailVerifiedAt: new Date(),
      mustChangePassword: false,
    },
    include: { role: true },
  });
  console.log(`✓ General Manager configured: ${gmUser.fullName} (${gmUser.email})`);

  // 3. Clean up any previous demo users (all 5 other roles are created only by GM)
  const previousDemoEmails = [
    "gm@construction.local",
    "pm@construction.local",
    "hr@construction.local",
    "se@construction.local",
    "po@construction.local",
    "acc@construction.local",
  ];

  console.log("\nRemoving previous demo seeded accounts...");
  for (const email of previousDemoEmails) {
    const demoUser = await prisma.user.findUnique({
      where: { email },
    });

    if (demoUser) {
      console.log(`Found legacy demo user: ${email} (${demoUser.id})`);

      // Detach any project manager references
      await prisma.project.updateMany({
        where: { projectManagerId: demoUser.id },
        data: { projectManagerId: null },
      });

      // Reassign project creator to GM
      await prisma.project.updateMany({
        where: { createdById: demoUser.id },
        data: { createdById: gmUser.id },
      });

      // Detach audit logs
      await prisma.auditLog.updateMany({
        where: { actorUserId: demoUser.id },
        data: { actorUserId: gmUser.id },
      });

      // Remove tokens and sessions
      await prisma.refreshSession.deleteMany({
        where: { userId: demoUser.id },
      });
      await prisma.passwordResetToken.deleteMany({
        where: { userId: demoUser.id },
      });

      // Delete the demo user
      await prisma.user.delete({
        where: { id: demoUser.id },
      });
      console.log(`✓ Cleaned up legacy demo user: ${email}`);
    }
  }

  console.log("\nSeed process completed successfully!");
  console.log(`Only General Manager (${GM_EMAIL}) is seeded.`);
  console.log("All other 5 roles must be created by the General Manager.\n");
}

seed()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
