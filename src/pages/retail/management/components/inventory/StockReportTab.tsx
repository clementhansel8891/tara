import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { SessionContext } from "@/core/security/session";
import type { RetailStore } from "@/core/types/retail/retail";

// --- Modular Imports ---
import { AuditMetadata, ReportType } from "./reporting/ReportingHubTypes";
import { REPORT_TEMPLATES } from "./reporting/ReportingHubConstants";
import { ReportTemplateCard } from "./reporting/ReportTemplateCard";
import { ReportFilterDialog } from "./reporting/ReportFilterDialog";
import { SecurityProtocolCard } from "./reporting/SecurityProtocolCard";

type Props = {
  canWrite: boolean;
  session?: SessionContext;
  stores?: RetailStore[];
  selectedStoreId?: string;
};

// --- Hub Header Component ---
const HubHeader: React.FC = () => (
  <div className="flex flex-col items-center text-center space-y-6 max-w-3xl mx-auto">
    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 mb-2">
      <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
      <span className="text-[11px] font-black uppercase tracking-[0.25em] text-indigo-700">
        Analytics Engine v2.0
      </span>
    </div>
    <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter text-slate-950 uppercase leading-[0.9] text-center">
      Retail Reporting Hub
    </h2>
    <p className="text-slate-500 font-medium text-lg italic max-w-2xl leading-relaxed">
      Select a specialized report template below to configure your deployment
      parameters and initiate data extraction.
    </p>
  </div>
);

export const StockReportTab: React.FC<Props> = ({
  canWrite,
  session,
  stores = [],
  selectedStoreId,
}) => {
  const { toast } = useToast();

  // -- State --
  const [selectedReport, setSelectedReport] = useState<ReportType>("LEDGER");
  const [branchId, setBranchId] = useState<string>(selectedStoreId || "all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toggles, setToggles] = useState({
    costPrice: true,
    supplierInfo: false,
    barcodes: true,
  });

  // -- Role Logic --
  const userRole = session?.role as
    | "OWNER"
    | "COMPANY_ADMIN"
    | "DEPT_HEAD"
    | "STORE_MANAGER"
    | "STAFF";
  const isAdmin = ["OWNER", "COMPANY_ADMIN", "DEPT_HEAD"].includes(userRole);

  // Managers locked to their branch (current selectedStoreId)
  const effectiveBranchId = isAdmin ? branchId : selectedStoreId || "all";

  const activeReportMeta =
    REPORT_TEMPLATES.find((r) => r.id === selectedReport) || null;

  // -- Actions --
  const logAuditAction = (
    userId: string,
    actionType: string,
    metadata: AuditMetadata,
  ) => {
    // Placeholder for audit logging system
    console.log(`[AUDIT] User: ${userId} | Action: ${actionType}`, metadata);
  };

  const handleExport = async (format: "CSV" | "PDF" | "EXCEL") => {
    setIsGenerating(true);

    try {
      // Simulation delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // EXTERNAL_EXPORT_SYSTEM_BRIDGE
      const payload: AuditMetadata = {
        reportType: selectedReport,
        branchId: effectiveBranchId,
        format,
        config: toggles,
        dateRange: { from: dateFrom, to: dateTo },
      };

      if (session?.userId) {
        logAuditAction(session.userId, "EXPORT_REPORT", payload);
      }

      toast({
        title: "Deployment Successful",
        description: `Your ${selectedReport} report is ready for download in ${format} format.`,
      });

      setIsModalOpen(false);
    } catch (error) {
      toast({
        title: "Deployment Failed",
        description: "An error occurred while generating the report.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleField = (field: "costPrice" | "supplierInfo" | "barcodes") => {
    setToggles((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <div className="max-w-[1200px] mx-auto space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20 px-4">
      {/* -- Header Section -- */}
      <HubHeader />

      {/* -- Centered Report Selection Grid -- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {REPORT_TEMPLATES.map((template) => (
          <ReportTemplateCard
            key={template.id}
            template={template}
            isActive={selectedReport === template.id}
            onClick={() => {
              setSelectedReport(template.id);
              setIsModalOpen(true);
            }}
          />
        ))}
      </div>

      {/* -- SaaS Branding Section -- */}
      <SecurityProtocolCard />

      {/* -- Concentrated Filter Modal (WIDE) -- */}
      <ReportFilterDialog
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        activeReportMeta={activeReportMeta}
        branchId={branchId}
        setBranchId={setBranchId}
        isAdmin={isAdmin}
        stores={stores}
        effectiveBranchId={effectiveBranchId}
        dateFrom={dateFrom}
        setDateFrom={setDateFrom}
        dateTo={dateTo}
        setDateTo={setDateTo}
        toggles={toggles}
        toggleField={toggleField}
        isGenerating={isGenerating}
        handleExport={handleExport}
      />
    </div>
  );
};
