import { Layers, AlertTriangle, History, ClipboardCheck } from "lucide-react";
import { ReportTemplate } from "./ReportingHubTypes";

export const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: "LEDGER",
    label: "Full Stock Ledger",
    description: "SOH, ATS, and current inventory valuation across all SKUs.",
    icon: Layers,
    color: "blue",
  },
  {
    id: "CRITICAL",
    label: "Critical & Low Stock",
    description:
      "Threshold-based report for items requiring immediate restock.",
    icon: AlertTriangle,
    color: "amber",
  },
  {
    id: "HISTORY",
    label: "Movement History",
    description:
      "Full 90-day audit trail of all inbound and outbound log entries.",
    icon: History,
    color: "indigo",
  },
  {
    id: "OPNAME",
    label: "Opname Results",
    description:
      "Detailed discrepancy reports from the latest physical counts.",
    icon: ClipboardCheck,
    color: "emerald",
  },
];
