// Equipment seed: 3 Company-Owned + 2 Rented = 5 records with real DB IDs
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Real IDs from DB
const SUPPLIERS = {
  mugher: "2353a56e-3789-4b69-8e29-cbd3d9d3511e",    // Mugher Cement & Aggregates Corp
  blueNile: "3ef99b59-b979-4dfa-bbc5-47e383034f58",  // Blue Nile Steel & Metal Trading
  ethioElec: "7b7fc7f5-3d7e-42d8-8d6d-d5c0bcf86048", // Ethio Electricals & Power Gear
  abebe: "b1e34c7e-6181-4ba1-b4e0-6fa71251a342",      // Abebe Building Supplies
};

const USERS = {
  fike: "091474f8-9b93-4444-93fa-69315dd2be3e",
  zerubabel: "0973bdba-069d-4c3e-af29-57a335a50202",
  abebe: "18fd99ca-dcde-4ad9-9f25-4507d3fb8613",
};

const PROJECTS = {
  meskel:  "29d817f6-3f07-4aea-9c3d-561216cc9a53", // Meskel Square Multi-Use Plaza
  adama:   "9f6e6ab8-6cf5-4b1d-9eb3-73f74c01d7b1", // Adama Highway Logistics Terminal
  entoto:  "aa806faf-8fc0-4240-9bcb-dc97e99f02e8", // Entoto Eco-Lodge
};

const EQUIPMENT_SEED = [
  // ─── COMPANY OWNED (3) ───────────────────────────────────────────
  {
    code: "EQ-COM-001",
    name: "Sinotruk HOWO 16m³ Tipper Dump Truck",
    model: "HOWO 371HP 6×4 Heavy Tipper — Ethiopia Spec",
    category: "HAULAGE_TRANSPORT",
    ownership: "COMPANY_OWNED",
    supplierId: SUPPLIERS.abebe,
    supplierName: "Abebe Building Supplies",
    supplierContact: "+251 911 002233",
    rentalRateDailyETB: 0,
    internalCostPerDayETB: 1800,
    agreementRef: "CAPEX-TRK-2023-001",
    projectId: PROJECTS.meskel,
    projectName: "Meskel Square Multi-Use Plaza (BM-PRJ-0105)",
    status: "ON_SITE",
    serialOrPlate: "3-C-99120 AA",
    currentHourMeter: 4110,
    nextServiceHours: 4250,
    fuelRateType: "N_A",
    condition: "GOOD",
    notes: "Transporting excavated soil and concrete aggregate to Meskel site. Daily 6am–6pm cycle.",
    createdById: USERS.zerubabel,
  },
  {
    code: "EQ-COM-002",
    name: "Perkins 150 kVA Silent Diesel Generator",
    model: "Perkins 1106A-70TAG4 Heavy Power Canopy",
    category: "POWER_ENERGY",
    ownership: "COMPANY_OWNED",
    supplierId: SUPPLIERS.ethioElec,
    supplierName: "Ethio Electricals & Power Gear",
    supplierContact: "+251 911 556677",
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
    createdById: USERS.fike,
  },
  {
    code: "EQ-COM-003",
    name: "Carmix 3.5m³ Self-Loading Concrete Mixer",
    model: "Carmix 3500 4×4 Off-Road Self-Loading",
    category: "CONCRETE",
    ownership: "COMPANY_OWNED",
    supplierId: SUPPLIERS.blueNile,
    supplierName: "Blue Nile Steel & Metal Trading",
    supplierContact: "+251 912 345678",
    rentalRateDailyETB: 0,
    internalCostPerDayETB: 2500,
    agreementRef: "CAPEX-MIX-2025-003",
    projectId: PROJECTS.adama,
    projectName: "Adama Highway Logistics Terminal (BM-PRJ-0115)",
    status: "ON_SITE",
    serialOrPlate: "3-B-44102 AA",
    currentHourMeter: 2120,
    nextServiceHours: 2250,
    fuelRateType: "N_A",
    condition: "GOOD",
    notes: "Capital asset purchased 2025. Allocated to sub-structure pours at Adama site.",
    createdById: USERS.abebe,
  },
  // ─── RENTED (2) ──────────────────────────────────────────────────
  {
    code: "EQ-RNT-001",
    name: "Caterpillar 320D Crawler Excavator",
    model: "CAT 320D (20-Ton, 1.2m³ Heavy Bucket)",
    category: "EARTHMOVING",
    ownership: "RENTED",
    supplierId: SUPPLIERS.mugher,
    supplierName: "Mugher Cement & Aggregates Corp",
    supplierContact: "+251 911 234567",
    rentalRateDailyETB: 8500,
    internalCostPerDayETB: 0,
    rentalStartDate: new Date("2026-10-05"),
    rentalEndDate: new Date("2026-11-10"),
    agreementRef: "RENT-2026-0089",
    projectId: PROJECTS.meskel,
    projectName: "Meskel Square Multi-Use Plaza (BM-PRJ-0105)",
    status: "ON_SITE",
    serialOrPlate: "CAT-320-ET-9812",
    currentHourMeter: 1480,
    nextServiceHours: null,
    fuelRateType: "DRY_RATE",
    condition: "EXCELLENT",
    notes: "Deep basement trench excavation. Operator provided by supplier at no extra cost.",
    createdById: USERS.zerubabel,
  },
  {
    code: "EQ-RNT-002",
    name: "Sany 25-Ton Truck-Mounted Mobile Crane",
    model: "Sany STC250C (33.5m Telescopic Boom, 360° Swing)",
    category: "LIFTING",
    ownership: "RENTED",
    supplierId: SUPPLIERS.abebe,
    supplierName: "Abebe Building Supplies",
    supplierContact: "+251 911 002233",
    rentalRateDailyETB: 16000,
    internalCostPerDayETB: 0,
    rentalStartDate: new Date("2026-10-18"),
    rentalEndDate: new Date("2026-11-15"),
    agreementRef: "RENT-2026-0104",
    projectId: PROJECTS.entoto,
    projectName: "Entoto Eco-Lodge & Visitor Center (BM-PRJ-0112)",
    status: "ON_SITE",
    serialOrPlate: "3-ET-19803 AA",
    currentHourMeter: 940,
    nextServiceHours: null,
    fuelRateType: "WET_RATE",
    condition: "EXCELLENT",
    notes: "Erecting structural pre-engineered timber trusses for Entoto lodge roofing. Certified crane operator included in rate.",
    createdById: USERS.fike,
  },
];

async function main() {
  console.log("🌱 Seeding equipment table...\n");

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
