import ProcurementModulePlaceholder from "./ProcurementModulePlaceholder.jsx";

export default function ReportsPage() {
  return (
    <ProcurementModulePlaceholder
      title="Procurement & Fleet Analytics Reports"
      icon="📈"
      description="Executive and operational analytics engine providing total material inventory valuation, equipment rental cost accumulation, and supplier delivery performance metrics."
      scopeType="BOTH"
      scopeReason="Generates consolidated supply chain analytics covering both physical material inventory balances and heavy machinery fleet utilization, rental expenditure, and operating hours."
      requestSource={{
        roles: ["General Manager", "Accountant", "Project Manager"],
        trigger: "Triggered during month-end audits, project cost reviews, or executive management strategic planning.",
        incomingData: "Date range, target project code, supplier filter, and report category (Inventory, Fleet, Vendor Performance).",
      }}
      handlesAndDisplays={{
        summary: "Displays inventory valuation dashboards, material burn rate charts, equipment rental burn summaries, and vendor reliability scorecards.",
        dataPoints: [
          "Total Material Stock Valuation in ETB",
          "Equipment Fleet Utilization (% Active on Site vs % Idle in Yard)",
          "Monthly Equipment Rental Expenditure vs Budget Variance",
          "Supplier On-Time Delivery Rate & Material Quality Rejection %",
          "Fast-Moving vs Dead Stock Analysis",
          "Cost Discrepancy Logs (PO vs Invoiced Amount)",
        ],
      }}
      destinationTarget={{
        roles: ["General Manager", "Accountant", "AI Predictive Engine"],
        outcome: "Delivers auditable financial reports for accounting, and feeds clean historical features into the AI model for project cost and delay forecasting.",
        outgoingData: "Executive Procurement Audit (PDF/Excel); Normalized AI Training Dataset; Month-End Inventory Asset Valuation.",
      }}
      futureActions={[
        {
          name: "Export Procurement Audit (PDF / Excel)",
          icon: "📊",
          badge: "Export",
          desc: "Download official consolidated report for corporate audit and tax compliance.",
          btnText: "Generate Audit PDF",
        },
        {
          name: "Run Equipment Fleet Utilization Audit",
          icon: "🚜",
          badge: "Machinery",
          desc: "Calculate idle machine hours, daily lease costs, and equipment breakdown ratios.",
          btnText: "Analyze Fleet Efficiency",
        },
        {
          name: "Supplier On-Time Scorecard",
          icon: "🏢",
          badge: "Vendors",
          desc: "Rank material vendors and equipment rental firms by lead time and invoice accuracy.",
          btnText: "View Vendor Rankings",
        },
      ]}
      workflowSteps={[
        { step: 1, title: "Data Harvest", actor: "System Engine", desc: "Aggregates transactions" },
        { step: 2, title: "Normalization", actor: "System Engine", desc: "Cleans & deduplicates" },
        { step: 3, title: "Analytics", actor: "Procurement / AI", desc: "Calculates variances & ROI" },
        { step: 4, title: "Audit Review", actor: "Accountant / GM", desc: "Validates financial truth" },
        { step: 5, title: "AI Training", actor: "Python Service", desc: "Refines predictive models" },
      ]}
    />
  );
}
