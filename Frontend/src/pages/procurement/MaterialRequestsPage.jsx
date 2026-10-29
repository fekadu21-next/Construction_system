import ProcurementModulePlaceholder from "./ProcurementModulePlaceholder.jsx";

export default function MaterialRequestsPage() {
  return (
    <ProcurementModulePlaceholder
      title="Material & Equipment Requisitions"
      icon="📋"
      description="Field requisition gateway where site engineers submit requests for consumable materials and heavy equipment required on construction projects."
      scopeType="BOTH"
      scopeReason="Handles consumable materials (cement, rebar, pipes) and equipment requisitions (excavators, mobile cranes, compactors). Requisitions are tagged by item type so materials route to store balances and equipment routes to fleet/rental availability."
      requestSource={{
        roles: ["Site Engineer", "Project Manager"],
        trigger: "Site Engineer submits a site requisition when materials run low or when a construction phase (e.g., deep excavation) requires machinery.",
        incomingData: "Requisition form specifying Project Code, Task/BOQ Code, Item/Machine requested, required delivery date, and urgency level.",
      }}
      handlesAndDisplays={{
        summary: "Displays incoming site requests with real-time warehouse stock checks and fleet availability indicators.",
        dataPoints: [
          "Requisition ID (REQ-2026-xxx)",
          "Requesting Project & Site Location",
          "Item Category (Material vs Heavy Equipment)",
          "Quantity Requested vs Warehouse Stock Balance",
          "Approval Status (Pending PM, Approved, Rejected, Fulfilled)",
          "Urgency Tag (Critical Path, Routine, Emergency)",
        ],
      }}
      destinationTarget={{
        roles: ["Storekeeper (if in stock)", "Procurement Officer (if to purchase/rent)"],
        outcome: "Approved requests convert into a Store Issuance Voucher (if items exist in warehouse) or trigger a Purchase Order / Rental Agreement.",
        outgoingData: "Dispatch reservation notice sent to site; Purchase / Rental requisition queued for procurement.",
      }}
      futureActions={[
        {
          name: "Convert to Purchase Order",
          icon: "🛒",
          badge: "Action",
          desc: "Automatically push unfulfilled material lines to a draft Supplier Purchase Order.",
          btnText: "Generate Draft PO",
        },
        {
          name: "Create Equipment Rental Request",
          icon: "🚜",
          badge: "Action",
          desc: "Route heavy machinery requisition directly to Equipment Rental Sourcing.",
          btnText: "Route to Rental Desk",
        },
        {
          name: "Issue from Warehouse Stock",
          icon: "📦",
          badge: "Stock Match",
          desc: "Reserve in-stock warehouse inventory and trigger Store Issue Voucher (SIV).",
          btnText: "Reserve In-Stock Qty",
        },
      ]}
      workflowSteps={[
        { step: 1, title: "Field Need", actor: "Site Engineer", desc: "Submits request form" },
        { step: 2, title: "PM Review", actor: "Project Manager", desc: "Validates budget impact" },
        { step: 3, title: "Stock Audit", actor: "Procurement / Store", desc: "Checks warehouse balance" },
        { step: 4, title: "PO / SIV", actor: "Procurement Officer", desc: "Issues PO or SIV pass" },
        { step: 5, title: "Receipt", actor: "Site Engineer", desc: "Signs gate handover" },
      ]}
    />
  );
}
