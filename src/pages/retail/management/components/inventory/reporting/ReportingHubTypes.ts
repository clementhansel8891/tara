import { FileText } from "lucide-react";

export type ReportType = "LEDGER" | "CRITICAL" | "HISTORY" | "OPNAME";

export interface AuditMetadata {
  reportType: ReportType;
  branchId: string;
  format: "CSV" | "PDF" | "EXCEL";
  config: {
    costPrice: boolean;
    supplierInfo: boolean;
    barcodes: boolean;
  };
  dateRange: {
    from: string;
    to: string;
  };
}

export interface ReportTemplate {
  id: ReportType;
  label: string;
  description: string;
  icon: typeof FileText;
  color: string;
}
