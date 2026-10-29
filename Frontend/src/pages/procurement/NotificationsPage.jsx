import ProcurementModulePlaceholder from "./ProcurementModulePlaceholder.jsx";

export default function ProcurementNotificationsPage() {
  return (
    <ProcurementModulePlaceholder
      title="Procurement & Fleet Notifications"
      icon="🔔"
      description="Real-time alert center monitoring material reorder thresholds, equipment rental return deadlines, requisition approvals, and delivery milestones."
      scopeType="BOTH"
      scopeReason="Monitors critical events for both consumable warehouse materials (low stock alerts, emergency reorders) and leased heavy machinery (rental period expiration, scheduled maintenance hours)."
      requestSource={{
        roles: ["System Automation Engine", "Project Manager", "Site Engineer"],
        trigger: "Triggered automatically when inventory falls below minimum buffer or when contract milestones (e.g., equipment rental end date) approach.",
        incomingData: "Event payload with severity level (Critical, Warning, Informational), entity ID, and recommended action.",
      }}
      handlesAndDisplays={{
        summary: "Displays categorized notifications stream with direct navigation links to resolving pages.",
        dataPoints: [
          "Alert Priority (Critical Red, Warning Yellow, Info Blue)",
          "Category (Stock Reorder, Equipment Rental Expiry, PM Approval, Inbound Delivery)",
          "Event Timestamp and Elapsed Time",
          "Direct Action Link (e.g., 'View Requisition', 'Open Rental Contract')",
          "Read / Unread Status and Batch Operations",
        ],
      }}
      destinationTarget={{
        roles: ["Procurement Officer", "Storekeeper"],
        outcome: "Enables immediate operational intervention to prevent jobsite concrete pour stoppages or unnecessary daily machinery rental penalties.",
        outgoingData: "Action acknowledgment; Dismissed/Resolved event status; Triggered emergency PO / rental extension.",
      }}
      futureActions={[
        {
          name: "Configure Safety Buffer Thresholds",
          icon: "⚙️",
          badge: "Rules",
          desc: "Adjust minimum stock alert levels (e.g., trigger warning when cement < 100 bags).",
          btnText: "Edit Reorder Thresholds",
        },
        {
          name: "Set Equipment Off-Hire Reminders",
          icon: "⏰",
          badge: "Reminders",
          desc: "Receive alerts 48 hours prior to equipment rental lease expiration to prevent penalty rates.",
          btnText: "Configure Lease Alerts",
        },
        {
          name: "Mark All Alerts as Read",
          icon: "✅",
          badge: "Batch",
          desc: "Acknowledge all pending informational alerts across materials and equipment.",
          btnText: "Mark All Read",
        },
      ]}
      workflowSteps={[
        { step: 1, title: "Threshold Cross", actor: "System Daemon", desc: "Stock / Date limit hit" },
        { step: 2, title: "Event Dispatch", actor: "Alert Engine", desc: "Generates notification" },
        { step: 3, title: "Officer Review", actor: "Procurement Officer", desc: "Reviews priority alert" },
        { step: 4, title: "Intervention", actor: "Procurement Officer", desc: "Orders stock / Extends lease" },
        { step: 5, title: "Resolution", actor: "System Engine", desc: "Event resolved & logged" },
      ]}
    />
  );
}
