import ProcurementModulePlaceholder from "./ProcurementModulePlaceholder.jsx";

export default function PurchaseOrdersPage() {
  return (
    <ProcurementModulePlaceholder
      title="Purchase Orders & Rental Agreements"
      icon="🛒"
      description="Commercial commitment registry for issuing formal Purchase Orders (for materials) and Equipment Rental Agreements (for leased machinery) to registered suppliers."
      scopeType="BOTH"
      scopeReason="Handles commercial purchasing commitments for bulk building materials (PO) and legally binding machinery lease contracts (Rental Agreements with daily/hourly rates, mob/demob fees, and dry/wet fuel terms)."
      requestSource={{
        roles: ["Project Manager", "General Manager", "Procurement Officer"],
        trigger: "Triggered when approved site requisitions cannot be fulfilled from internal warehouse stock or company fleet.",
        incomingData: "Approved requisition with quantity/duration, project charge code, and 3 competing supplier price quotations.",
      }}
      handlesAndDisplays={{
        summary: "Displays all active, approved, and fulfilled purchase orders and equipment rental contracts.",
        dataPoints: [
          "PO / Agreement Number (PO-2026-xxx / RENT-2026-xxx)",
          "Vendor Identity (Linked to Verified Suppliers)",
          "Contract Type (Bulk Material Purchase vs Equipment Rental Lease)",
          "Commercial Value in ETB (Unit Rates, 15% VAT, Total Commitment)",
          "Delivery / Mobilization Date & Destination Project",
          "Authorization Status (Draft, Pending GM Approval, Issued to Vendor, Closed)",
        ],
      }}
      destinationTarget={{
        roles: ["External Supplier", "Storekeeper / Site Engineer", "Accountant"],
        outcome: "Legally transmits order to supplier, alerts site of incoming shipment, and establishes committed expenditure for Accounting.",
        outgoingData: "Signed PO / Rental Contract PDF sent to vendor; Committed Cost record queued for Accountant 3-Way Match.",
      }}
      futureActions={[
        {
          name: "Issue Material Purchase Order",
          icon: "📦",
          badge: "Materials",
          desc: "Create official PO for cement, structural steel, or electrical supplies with tax breakdown.",
          btnText: "New Material PO",
        },
        {
          name: "Draft Equipment Rental Agreement",
          icon: "🚜",
          badge: "Equipment",
          desc: "Draft heavy machinery lease contract with daily rental rates, operator chits, and return terms.",
          btnText: "New Rental Agreement",
        },
        {
          name: "Request GM High-Value Sign-off",
          icon: "✍️",
          badge: "Governance",
          desc: "Route orders exceeding delegated PM threshold (> ETB 500,000) to General Manager.",
          btnText: "Submit for GM Approval",
        },
      ]}
      workflowSteps={[
        { step: 1, title: "Requisition", actor: "Site Engineer", desc: "Approved field request" },
        { step: 2, title: "Sourcing & Quotes", actor: "Procurement Officer", desc: "Selects best quotation" },
        { step: 3, title: "PO / Contract", actor: "Procurement Officer", desc: "Issues formal agreement" },
        { step: 4, title: "Inward Delivery", actor: "Storekeeper / SE", desc: "Waybill & GRN verified" },
        { step: 5, title: "3-Way Match", actor: "Accountant", desc: "Invoice audit & payment" },
      ]}
    />
  );
}
