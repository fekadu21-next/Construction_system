// Equipment seed: 3 Company-Owned + 2 Rented = 5 records with real dynamic DB IDs
import prisma from "../config/prisma.js";

async function main() {
  console.log("🌱 Seeding equipment table...\n");

  // Fetch actual existing suppliers, projects, and users from database
  const [suppliers, projects, users] = await Promise.all([
    prisma.supplier.findMany(),
    prisma.project.findMany(),
    prisma.user.findMany(),
  ]);

  if (suppliers.length === 0) {
    console.error("No suppliers found. Please run seed_materials_suppliers.js first.");
    process.exit(1);
  }

  const supplierMap = {};
  suppliers.forEach((s) => {
    supplierMap[s.code] = s;
    supplierMap[s.name] = s;
  });

  const projectMap = {};
  projects.forEach((p) => {
    projectMap[p.projectCode] = p;
    projectMap[p.projectName] = p;
  });

  const defaultUser = users[0] || null;
  const abebeSupplier = supplierMap["SUP-001"] || suppliers[0];
  const blueNileSupplier = supplierMap["SUP-002"] || suppliers[1] || suppliers[0];
  const ethioElecSupplier = supplierMap["SUP-004"] || suppliers[3] || suppliers[0];
  const mugherSupplier = supplierMap["SUP-005"] || suppliers[4] || suppliers[0];

  const firstProject = projects[0] || null;
  const secondProject = projects[1] || firstProject;
  const thirdProject = projects[2] || firstProject;

  const EQUIPMENT_SEED = [
    // ─── COMPANY OWNED (3) ───────────────────────────────────────────
    {
      code: "EQ-COM-001",
      name: "Sinotruk HOWO 16m³ Tipper Dump Truck",
      model: "HOWO 371HP 6×4 Heavy Tipper — Ethiopia Spec",
      category: "HAULAGE_TRANSPORT",
      ownership: "COMPANY_OWNED",
      supplierId: abebeSupplier?.id || null,
      supplierName: abebeSupplier?.name || "Abebe Building Supplies",
      supplierContact: abebeSupplier?.phone || "+251 911 002233",
      rentalRateDailyETB: 0,
      internalCostPerDayETB: 1800,
      agreementRef: "CAPEX-TRK-2023-001",
      projectId: firstProject?.id || null,
      projectName: firstProject ? `${firstProject.projectName} (${firstProject.projectCode})` : "General Fleet",
      status: "ON_SITE",
      serialOrPlate: "3-C-99120 AA",
      currentHourMeter: 4110,
      nextServiceHours: 4250,
      fuelRateType: "N_A",
      condition: "GOOD",
      notes: "Transporting excavated soil and concrete aggregate to site. Daily 6am–6pm cycle.",
      createdById: defaultUser?.id || null,
    },
    {
      code: "EQ-COM-002",
      name: "Perkins 150 kVA Silent Diesel Generator",
      model: "Perkins 1106A-70TAG4 Heavy Power Canopy",
      category: "POWER_ENERGY",
      ownership: "COMPANY_OWNED",
      supplierId: ethioElecSupplier?.id || null,
      supplierName: ethioElecSupplier?.name || "Ethio Electricals & Power Gear",
      supplierContact: ethioElecSupplier?.phone || "+251 911 556677",
      rentalRateDailyETB: 0,
      internalCostPerDayETB: 1200,
      agreementRef: "CAPEX-GEN-2024-002",
      projectId: null,
      projectName: null,
      status: "AVAILABLE",
      serialOrPlate: "GEN-PK-150-09",
      currentHourMeter: 3450,
      nextServiceHours: 3500,
      fuelRateType: "N_A",
      condition: "EXCELLENT",
      notes: "Stored in central equipment yard. Ready for immediate project dispatch when grid power fails.",
      createdById: defaultUser?.id || null,
    },
    {
      code: "EQ-COM-003",
      name: "Carmix 3.5m³ Self-Loading Concrete Mixer",
      model: "Carmix 3500 4×4 Off-Road Self-Loading",
      category: "CONCRETE",
      ownership: "COMPANY_OWNED",
      supplierId: blueNileSupplier?.id || null,
      supplierName: blueNileSupplier?.name || "Blue Nile Steel & Metal Trading",
      supplierContact: blueNileSupplier?.phone || "+251 912 345678",
      rentalRateDailyETB: 0,
      internalCostPerDayETB: 2500,
      agreementRef: "CAPEX-MIX-2025-003",
      projectId: secondProject?.id || null,
      projectName: secondProject ? `${secondProject.projectName} (${secondProject.projectCode})` : "Site Operations",
      status: "ON_SITE",
      serialOrPlate: "3-B-44102 AA",
      currentHourMeter: 2120,
      nextServiceHours: 2250,
      fuelRateType: "N_A",
      condition: "GOOD",
      notes: "Capital asset purchased 2025. Allocated to sub-structure pours.",
      createdById: defaultUser?.id || null,
    },
    // ─── RENTED (2) ──────────────────────────────────────────────────
    {
      code: "EQ-RNT-001",
      name: "Caterpillar 320D Crawler Excavator",
      model: "CAT 320D (20-Ton, 1.2m³ Heavy Bucket)",
      category: "EARTHMOVING",
      ownership: "RENTED",
      supplierId: mugherSupplier?.id || null,
      supplierName: mugherSupplier?.name || "Mugher Cement & Aggregates Corp",
      supplierContact: mugherSupplier?.phone || "+251 911 234567",
      rentalRateDailyETB: 8500,
      internalCostPerDayETB: 0,
      rentalStartDate: new Date("2026-10-05"),
      rentalEndDate: new Date("2026-11-10"),
      agreementRef: "RENT-2026-0089",
      projectId: firstProject?.id || null,
      projectName: firstProject ? `${firstProject.projectName} (${firstProject.projectCode})` : "Foundation Works",
      status: "ON_SITE",
      serialOrPlate: "CAT-320-ET-9812",
      currentHourMeter: 1480,
      nextServiceHours: null,
      fuelRateType: "DRY_RATE",
      condition: "EXCELLENT",
      notes: "Deep basement trench excavation. Operator provided by supplier at no extra cost.",
      createdById: defaultUser?.id || null,
    },
    {
      code: "EQ-RNT-002",
      name: "Sany 25-Ton Truck-Mounted Mobile Crane",
      model: "Sany STC250C (33.5m Telescopic Boom, 360° Swing)",
      category: "LIFTING",
      ownership: "RENTED",
      supplierId: abebeSupplier?.id || null,
      supplierName: abebeSupplier?.name || "Abebe Building Supplies",
      supplierContact: abebeSupplier?.phone || "+251 911 002233",
      rentalRateDailyETB: 16000,
      internalCostPerDayETB: 0,
      rentalStartDate: new Date("2026-10-18"),
      rentalEndDate: new Date("2026-11-15"),
      agreementRef: "RENT-2026-0104",
      projectId: thirdProject?.id || null,
      projectName: thirdProject ? `${thirdProject.projectName} (${thirdProject.projectCode})` : "Structural Works",
      status: "ON_SITE",
      serialOrPlate: "3-ET-19803 AA",
      currentHourMeter: 940,
      nextServiceHours: null,
      fuelRateType: "WET_RATE",
      condition: "EXCELLENT",
      notes: "Erecting structural elements and timber trusses. Certified crane operator included in rate.",
      createdById: defaultUser?.id || null,
    },
  ];

  // Clear existing equipment first
  const deleted = await prisma.equipment.deleteMany({});
  console.log(`Cleared ${deleted.count} existing equipment record(s).`);

  let created = 0;
  for (const eq of EQUIPMENT_SEED) {
    try {
      const record = await prisma.equipment.create({ data: eq });
      const tag = eq.ownership === "RENTED" ? "🔵 RENTED" : "🟢 OWNED ";
      console.log(`  ${tag}  ${record.code} — ${record.name}`);
      created++;
    } catch (err) {
      console.error(`  ❌ Failed to seed ${eq.code}: ${err.message}`);
    }
  }

  console.log(`\n✅ Seeded ${created} / ${EQUIPMENT_SEED.length} equipment records.\n`);

  // Print summary
  const all = await prisma.equipment.findMany({
    select: { code: true, name: true, ownership: true, status: true },
  });
  console.log("=== Equipment Registry ===");
  all.forEach((e) => {
    console.log(`  ${e.code} | ${e.ownership.padEnd(14)} | ${e.status.padEnd(12)} | ${e.name}`);
  });

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
