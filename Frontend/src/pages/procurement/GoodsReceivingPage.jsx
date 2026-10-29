import ProcurementModulePlaceholder from "./ProcurementModulePlaceholder.jsx";

export default function GoodsReceivingPage() {
  return (
    <ProcurementModulePlaceholder
      title="Deliveries & Inward Receiving"
      icon="🚚"
      description="Physical delivery gatekeeper for inspecting vendor shipments, generating Goods Received Notes (GRN) for materials, and logging Equipment Delivery & Inspection Notes (EDIN) for heavy machinery."
      scopeType="BOTH"
      scopeReason="Handles physical receiving for bulk materials (cement bags, rebar bundles, aggregate loads) and heavy machinery mobilization (verifying excavator/crane hour-meters, tire/track condition, and fuel level upon arrival at site gates)."
      requestSource={{
        roles: ["External Suppliers", "Transporters", "Storekeeper"],
        trigger: "Triggered when a delivery truck or heavy transport low-bed arrives at the warehouse or jobsite gate with a vendor waybill.",
        incomingData: "Supplier Delivery Waybill, Transporter Bill of Lading, Purchase Order reference, and physical cargo.",
      }}
      handlesAndDisplays={{
        summary: "Displays incoming shipments, physical inspection checklists, and discrepancy flags.",
        dataPoints: [
          "GRN / EDIN Tracking ID (GRN-2026-xxx / EDIN-2026-xxx)",
          "Matched Purchase Order / Rental Agreement Ref",
          "Delivered Quantity vs PO Quantity (Over/Short delivery flags)",
          "Condition Inspection (Accepted, Rejected, Damaged with photo proof)",
          "Equipment Specifics (Starting Hour Meter, Fuel Level, Joint Inspection)",
          "Assigned Warehouse Bin Location or Site Laydown Yard Zone",
        ],
      }}
      destinationTarget={{
        roles: ["Inventory & Store Balance", "Equipment Fleet Registry", "Accountant"],
        outcome: "Increases material stock in store, marks equipment as ON_SITE, and provides the vital 'Receiving Truth' for the Accountant to verify supplier invoices.",
        outgoingData: "Signed Goods Received Note (GRN) PDF; Real-time Stock Balance increment; Verified Receiving Proof sent to Accounting.",
      }}
      futureActions={[
        {
          name: "Generate Goods Received Note (GRN)",
          icon: "📦",
          badge: "Materials",
          desc: "Inspect bulk shipment, count accepted bags/tons, and auto-increment warehouse stock.",
          btnText: "Log Material GRN",
        },
        {
          name: "Accept Equipment Delivery (EDIN)",
          icon: "🚜",
          badge: "Equipment",
          desc: "Inspect arriving excavator/crane, log starting hour meter, and confirm rental clock start.",
          btnText: "Log Machine Arrival",
        },
        {
          name: "File Vendor Discrepancy Claim",
          icon: "⚠️",
          badge: "Inspection",
          desc: "Document damaged rebar, broken tiles, or defective machine for credit note or replacement.",
          btnText: "Flag Discrepancy / Return",
        },
      ]}
      workflowSteps={[
        { step: 1, title: "Gate Arrival", actor: "Transporter / Vendor", desc: "Waybill presented" },
        { step: 2, title: "Inspection", actor: "Storekeeper / SE", desc: "Quantity & quality check" },
        { step: 3, title: "GRN / EDIN Sign", actor: "Storekeeper / SE", desc: "Digital sign-off" },
        { step: 4, title: "Stock Update", actor: "System Engine", desc: "Inventory count increases" },
        { step: 5, title: "Audit Verification", actor: "Accountant", desc: "3-Way match & payment" },
      ]}
    />
  );
}
