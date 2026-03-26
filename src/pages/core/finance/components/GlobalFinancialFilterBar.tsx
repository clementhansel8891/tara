import React, { useEffect, useState } from "react";
import { useCFO } from "../CFOContext";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { financeService, type AccountingPeriod } from "@/core/services/finance/financeService";
import { useSession } from "@/core/security/session";
import { Filter, Lock, Unlock } from "lucide-react";
import { audit } from "@/core/logging/audit";
import { systemLogger } from "@/core/logging/systemLogger";

export const GlobalFinancialFilterBar: React.FC = () => {
  const { state, updateFilters } = useCFO();
  const session = useSession();
  
  const [localState, setLocalState] = useState({
    companyId: state.companyId,
    periodId: state.periodId,
  });
  
  const [periods, setPeriods] = useState<AccountingPeriod[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    financeService.listPeriods(session.tenantId, session)
      .then(setPeriods)
      .catch((err) => {
        systemLogger.failure("Failed to list accounting periods", { error: err }, state.correlationId);
      })
      .finally(() => setLoading(false));
  }, [session]);

  const handleApply = () => {
    audit.log({
      tenantId: session.tenantId,
      actorId: session.userId,
      action: "FINANCE_CONTEXT_CHANGE",
      entityType: "FINANCE_CONTEXT",
      before: { companyId: state.companyId, periodId: state.periodId, correlationId: state.correlationId },
      after: { companyId: localState.companyId, periodId: localState.periodId, correlationId: state.correlationId },
    });
    updateFilters({
      companyId: localState.companyId,
      periodId: localState.periodId,
    });
  };

  const hasChanges = localState.companyId !== state.companyId || localState.periodId !== state.periodId;

  return (
    <div className="sticky top-0 z-10 w-full border-b bg-background/95 p-4 backdrop-blur shadow-sm">
      <div className="flex flex-wrap items-end gap-6 container mx-auto">
        <div className="flex flex-col gap-1.5 min-w-[200px]">
          <Label className="text-xs uppercase text-muted-foreground font-bold">Entity / Company</Label>
          <Select
            value={localState.companyId}
            onValueChange={(val) => setLocalState(p => ({ ...p, companyId: val }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Company" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="zenvix-corp">Zenvix Corporation (HQ)</SelectItem>
              <SelectItem value="zenvix-global">Zenvix Global Logistics</SelectItem>
              <SelectItem value="zenvix-indonesia">PT Zenvix Indonesia</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5 min-w-[240px]">
          <Label className="text-xs uppercase text-muted-foreground font-bold">Fiscal Period</Label>
          <Select
            value={localState.periodId}
            onValueChange={(val) => setLocalState(p => ({ ...p, periodId: val }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Period" />
            </SelectTrigger>
            <SelectContent>
              {periods.map(p => (
                <SelectItem key={p.id} value={p.id}>
                  {p.startDate} - {p.endDate} ({p.status})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 mb-0.5">
          <Button 
            disabled={!hasChanges || loading} 
            onClick={handleApply}
            className="gap-2"
          >
            <Filter size={16} />
            Apply Context
          </Button>
          
          <div className="flex items-center gap-2 px-3 py-2 border rounded-md bg-muted/50 text-xs">
            {state.isLocked ? (
              <>
                <Lock size={14} className="text-primary" />
                <span className="font-mono">SEQ: {state.snapshotSequence}</span>
              </>
            ) : (
              <>
                <Unlock size={14} className="text-muted-foreground" />
                <span className="text-muted-foreground italic">Unlocked State</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
