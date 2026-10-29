import ProcurementModulePlaceholder from "./ProcurementModulePlaceholder.jsx";

export default function MaterialIssuancePage() {
  return (
    <ProcurementModulePlaceholder
      title="Material Issuance & Site Consumption"
      icon="📤"
      description="Store dispatch center for issuing warehouse materials to active construction work packages, printing gate passes, and recording inventory depletion."
      scopeType="MATERIALS_ONLY"
      scopeReason="Dedicated exclusively to consumable construction materials (cement, rebar, timber, sand, conduit). Heavy machinery is NEVER 'consumed' or issued from stock; plant machinery is managed, deployed, and returned via the separate 'Equipment & Machinery' module."
      requestSource={{
        roles: ["Site Engineer", "Foreman", "Project Manager"],
        trigger: "Triggered when approved site requisitions are ready for physical dispatch from the warehouse to the construction work zone.",
        incomingData: "Approved material requisition with Work Package ID, targeted building floor/grid, and authorized recipient name.",
      }}
      handlesAndDisplays={{
        summary: "Displays store dispatches, gate passes, real-time inventory deductions, and cost allocation to project milestones.",
        dataPoints: [
          "Store Issue Voucher (SIV-2026-xxx)",
          "Material Name & Dispatched Quantity",
          "Deducted Warehouse Bin / Rack Location",
          "Recipient Foreman / Driver Signature",
          "Cost Code / BOQ Milestone (Foundation, Superstructure, Finishing)",
          "Remaining Warehouse Stock Balance after issuance",
        ],
      }}
      destinationTarget={{
        roles: ["Site Foreman", "Project Cost Ledger", "AI Prediction Model"],
        outcome: "Deducts stock balances permanently, delivers materials to work zone, and posts direct material expenditure to the project's financial cost ledger.",
        outgoingData: "Signed Store Issue Voucher (SIV); Gate Pass chit; Incurred Project Material Cost posted to accounting ledger.",
      }}
      futureActions={[
        {
          name: "Issue Store Voucher (SIV)",
          icon: "📤",
          badge: "Dispatch",
          desc: "Deduct warehouse inventory count and assign material cost directly to project task.",
          btnText: "Generate SIV Pass",
        },
        {
          name: "Print Site Gate Pass",
          icon: "📄",
          badge: "Security",
          desc: "Generate official gate pass for site security checkpoints allowing material movement.",
          btnText: "Print Gate Pass",
        },
        {
          name: "Return Unused Material to Store",
          icon: "📥",
          badge: "Reversal",
          desc: "Log surplus rebar or timber returned from completed site stages back into store stock.",
          btnText: "Return to Stock",
        },
      ]}
      workflowSteps={[
        { step: 1, title: "Site Demand", actor: "Site Engineer", desc: "Requests concrete pour batch" },
        { step: 2, title: "Store Pick", actor: "Storekeeper", desc: "Picks from warehouse bins" },
        { step: 3, title: "SIV Voucher", actor: "Storekeeper", desc: "Records digital dispatch" },
        { step: 4, title: "Gate Release", actor: "Site Security / Gate", desc: "Validates gate pass" },
        { step: 5, title: "Cost Allocation", actor: "Accountant / AI", desc: "Debits project material cost" },
      ]}
    />
  );
}
