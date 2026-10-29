import prisma from "../config/prisma.js";

async function seedMaterialsAndSuppliers() {
  console.log("Starting Materials and Suppliers seeding...");

  // 1. Get creator user (Procurement Officer or General Manager)
  const creator = await prisma.user.findFirst({
    where: {
      OR: [
        { role: { name: "PROCUREMENT_OFFICER" } },
        { role: { name: "GENERAL_MANAGER" } },
      ],
    },
  });

  const creatorId = creator?.id || null;
  console.log(`Using creator user ID: ${creatorId} (${creator?.email || "none"})`);

  // 2. Seed 4 Categories
  console.log("\n1. Seeding 4 Material Categories...");
  const categoriesData = [
    {
      name: "Cement & Concrete",
      description: "Binding materials, pre-mixes, aggregates, and concrete admixtures.",
    },
    {
      name: "Steel & Metal Reinforcement",
      description: "Deformed rebars, structural beams, wire mesh, and binding ties.",
    },
    {
      name: "Plumbing & Sanitary",
      description: "Pipes, drainage fittings, water supply lines, and sanitary fixtures.",
    },
    {
      name: "Electrical & Lighting",
      description: "Conduits, wiring cables, switches, circuit breakers, and fixtures.",
    },
  ];

  const categoryMap = {};
  for (const cat of categoriesData) {
    const record = await prisma.materialCategory.upsert({
      where: { name: cat.name },
      update: { description: cat.description },
      create: {
        name: cat.name,
        description: cat.description,
      },
    });
    categoryMap[cat.name] = record.id;
    console.log(`  ✓ Category ready: ${record.name} (${record.id})`);
  }

  // 3. Seed 6 Materials with opening stock and stock transactions
  console.log("\n2. Seeding 6 Materials with full details and opening stock movements...");
  const materialsData = [
    {
      code: "MAT-001",
      name: "Portland Cement 42.5R",
      categoryName: "Cement & Concrete",
      unit: "Bag",
      reorderLevel: 100,
      openingStock: 250, // In Stock (> 100)
      description: "General-purpose and structural high-performance Portland cement 42.5R grade.",
      isActive: true,
      reference: "INIT-PO-2026-001",
      notes: "Opening balance counted and verified at Central Store Bin A-1",
    },
    {
      code: "MAT-002",
      name: "Reinforcement Steel Rebar 12mm",
      categoryName: "Steel & Metal Reinforcement",
      unit: "Ton",
      reorderLevel: 10,
      openingStock: 4, // Low Stock (<= 10 and > 0)
      description: "Standard high-yield deformed carbon steel rebar for beams and columns.",
      isActive: true,
      reference: "INIT-PO-2026-002",
      notes: "Opening balance verified in Outdoor Laydown Yard B",
    },
    {
      code: "MAT-003",
      name: "PVC Pipe 20mm Class C",
      categoryName: "Plumbing & Sanitary",
      unit: "Piece",
      reorderLevel: 50,
      openingStock: 0, // Out of Stock (0)
      description: "Pressure-rated PVC piping for indoor drainage and domestic plumbing.",
      isActive: true,
      reference: "INIT-PO-2026-003",
      notes: "Stock depleted pending new purchase order delivery",
    },
    {
      code: "MAT-004",
      name: "High-Tensile Deformed Bar 16mm",
      categoryName: "Steel & Metal Reinforcement",
      unit: "Ton",
      reorderLevel: 15,
      openingStock: 32, // In Stock (> 15)
      description: "Heavy-duty foundation rebar Grade 60 for load-bearing deep foundations.",
      isActive: true,
      reference: "INIT-PO-2026-004",
      notes: "Fresh consignment verified from supplier batch #9042",
    },
    {
      code: "MAT-005",
      name: "Copper Electrical Cable 2.5mm²",
      categoryName: "Electrical & Lighting",
      unit: "Roll",
      reorderLevel: 25,
      openingStock: 8, // Low Stock (<= 25 and > 0)
      description: "Flame-retardant single-core insulated copper wiring cable for internal lighting circuits.",
      isActive: true,
      reference: "INIT-PO-2026-005",
      notes: "Reserved for Bole Commercial Center Phase 2 electrical wiring",
    },
    {
      code: "MAT-006",
      name: "River Sand Fine Aggregate",
      categoryName: "Cement & Concrete",
      unit: "m³",
      reorderLevel: 40,
      openingStock: 65, // In Stock (> 40)
      description: "Washed river sand aggregate suitable for bricklaying and plastering mortar mixes.",
      isActive: true,
      reference: "INIT-PO-2026-006",
      notes: "Sand heap stockpile measured in Sand Storage Bay 3",
    },
  ];

  for (const m of materialsData) {
    const categoryId = categoryMap[m.categoryName];
    const existing = await prisma.material.findUnique({
      where: { code: m.code },
    });

    let material;
    if (existing) {
      material = await prisma.material.update({
        where: { id: existing.id },
        data: {
          name: m.name,
          categoryId,
          unit: m.unit,
          reorderLevel: m.reorderLevel,
          currentStock: m.openingStock,
          description: m.description,
          isActive: m.isActive,
        },
      });
      console.log(`  ✓ Material updated: ${m.code} - ${m.name} (${m.openingStock} ${m.unit})`);
    } else {
      material = await prisma.material.create({
        data: {
          code: m.code,
          name: m.name,
          categoryId,
          unit: m.unit,
          reorderLevel: m.reorderLevel,
          currentStock: m.openingStock,
          description: m.description,
          isActive: m.isActive,
          createdById: creatorId,
        },
      });
      console.log(`  ✓ Material created: ${m.code} - ${m.name} (${m.openingStock} ${m.unit})`);
    }

    // Ensure initial opening stock movement exists
    if (m.openingStock > 0) {
      const movementExists = await prisma.stockMovement.findFirst({
        where: {
          materialId: material.id,
          reference: m.reference,
        },
      });

      if (!movementExists) {
        await prisma.stockMovement.create({
          data: {
            materialId: material.id,
            movementType: "RECEIPT",
            quantity: m.openingStock,
            reference: m.reference,
            notes: m.notes,
            createdById: creatorId,
          },
        });
        console.log(`    ↳ Recorded stock movement: +${m.openingStock} ${m.unit} (${m.reference})`);
      }
    }
  }

  // 4. Seed 5 Suppliers
  console.log("\n3. Seeding 5 Suppliers with full business and contact details...");
  const suppliersData = [
    {
      code: "SUP-001",
      name: "Abebe Building Supplies",
      contactPerson: "Abebe Kebede",
      phone: "+251 911 234567",
      email: "contact@abebesupplies.et",
      website: "https://abebesupplies.et",
      address: "Bole Medhanialem Commercial Complex, Floor 2",
      city: "Addis Ababa",
      country: "Ethiopia",
      taxId: "TIN-009845123",
      paymentTerms: "Net 30 Days",
      notes: "Primary supplier for cement, masonry bricks, and structural aggregate. Dependable fleet.",
      isActive: true,
    },
    {
      code: "SUP-002",
      name: "Blue Nile Steel & Metal Trading",
      contactPerson: "Hana Tesfaye",
      phone: "+251 922 345678",
      email: "sales@bluenilesteel.com",
      website: "https://bluenilesteel.com",
      address: "Kality Industrial Zone, Warehouse No. 14",
      city: "Addis Ababa",
      country: "Ethiopia",
      taxId: "TIN-008765432",
      paymentTerms: "Net 45 Days",
      notes: "Certified supplier for high-yield deformed rebars, wire mesh, and hollow structural sections.",
      isActive: true,
    },
    {
      code: "SUP-003",
      name: "Addis Plumbing & Sanitary Supply",
      contactPerson: "Dawit Alemu",
      phone: "+251 933 456789",
      email: "info@addisplumbing.et",
      website: "https://addisplumbing.et",
      address: "Merkato Building Materials Center, Shop B-12",
      city: "Addis Ababa",
      country: "Ethiopia",
      taxId: "TIN-007654321",
      paymentTerms: "Immediate Cash / Bank Transfer",
      notes: "Historical supplier for PVC piping and fittings. Retained for record reference; currently inactive for new orders.",
      isActive: false, // Inactive
    },
    {
      code: "SUP-004",
      name: "Ethio Electricals & Power Gear",
      contactPerson: "Mulugeta Assefa",
      phone: "+251 944 567890",
      email: "orders@ethioelectricals.com",
      website: "https://ethioelectricals.com",
      address: "Piazza Central Commercial Street, Suite 402",
      city: "Addis Ababa",
      country: "Ethiopia",
      taxId: "TIN-006543210",
      paymentTerms: "Net 15 Days",
      notes: "Distributor of certified electrical cables, safety conduits, distribution boxes, and circuit breakers.",
      isActive: true,
    },
    {
      code: "SUP-005",
      name: "Mugher Cement & Aggregates Corp",
      contactPerson: "Tigist Haile",
      phone: "+251 955 678901",
      email: "distribution@mugher.gov.et",
      website: "https://mugher.gov.et",
      address: "Industrial Area Gate 3, Mugher Distribution Yard",
      city: "Addis Ababa",
      country: "Ethiopia",
      taxId: "TIN-005432109",
      paymentTerms: "Letter of Credit / Bank Advance",
      notes: "Bulk cement manufacturer and supplier for large-scale structural foundations and infrastructure.",
      isActive: true,
    },
  ];

  for (const s of suppliersData) {
    const existing = await prisma.supplier.findUnique({
      where: { code: s.code },
    });

    if (existing) {
      await prisma.supplier.update({
        where: { id: existing.id },
        data: {
          name: s.name,
          contactPerson: s.contactPerson,
          phone: s.phone,
          email: s.email,
          website: s.website,
          address: s.address,
          city: s.city,
          country: s.country,
          taxId: s.taxId,
          paymentTerms: s.paymentTerms,
          notes: s.notes,
          isActive: s.isActive,
        },
      });
      console.log(`  ✓ Supplier updated: ${s.code} - ${s.name} (${s.isActive ? "Active" : "Inactive"})`);
    } else {
      await prisma.supplier.create({
        data: {
          code: s.code,
          name: s.name,
          contactPerson: s.contactPerson,
          phone: s.phone,
          email: s.email,
          website: s.website,
          address: s.address,
          city: s.city,
          country: s.country,
          taxId: s.taxId,
          paymentTerms: s.paymentTerms,
          notes: s.notes,
          isActive: s.isActive,
          createdById: creatorId,
        },
      });
      console.log(`  ✓ Supplier created: ${s.code} - ${s.name} (${s.isActive ? "Active" : "Inactive"})`);
    }
  }

  console.log("\n✅ All 4 Categories, 6 Materials, and 5 Suppliers seeded successfully!");
  await prisma.$disconnect();
}

seedMaterialsAndSuppliers().catch(async (e) => {
  console.error("❌ Seeding error:", e);
  await prisma.$disconnect();
  process.exit(1);
});
