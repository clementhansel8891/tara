import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DataTableShell } from "@/core/tools/DataTableShell";
import { useQuery } from "@tanstack/react-query";
import { financeApiClient } from "@/core/services/finance/financeApiClient";
import { useSession } from "@/core/security/session";
import { Badge } from "@/components/ui/badge";
import { useEffect } from "react";
import { audit } from "@/core/logging/audit";
import { systemLogger } from "@/core/logging/systemLogger";

interface DrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountId: string;
  accountName: string;
  periodId: string;
  snapshotSequence: number;
  correlationId: string;
}

export const DrillDownModal: React.FC<DrillDownModalProps> = ({
  isOpen,
  onClose,
  accountId,
  accountName,
  periodId,
  snapshotSequence,
  correlationId,
}) => {
  const session = useSession();

  const { data, isLoading } = useQuery({
    queryKey: ["drill-down", accountId, periodId, snapshotSequence, correlationId],
    queryFn: async () => {
      try {
        return await financeApiClient.getGLLinesForSnapshot(
          session,
          accountId,
          periodId,
          snapshotSequence,
          undefined,
          correlationId
        );
      } catch (err) {
        systemLogger.failure("GL Drill-down fetch failure", { error: err }, correlationId);
        throw err;
      }
    },
    enabled: isOpen,
  });

  useEffect(() => {
    if (isOpen) {
      audit.log({
        tenantId: session.tenant_id,
        actorId: session.user_id,
        action: "FINANCE_DRILLDOWN_VIEW",
        entityType: "FINANCE_ACCOUNT",
        entityId: accountId,
        before: { correlationId, snapshotSequence, periodId },
      });
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            GL Drill-Down: {accountName}
            <Badge variant="outline" className="font-mono text-[10px]">
              SEQ: {snapshotSequence}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <div suppressHydrationWarning className="animate-spin text-muted-foreground">Loading...</div>
            </div>
          ) : (
            <DataTableShell total={data?.lines?.length || 0} page={1} pageSize={10}>
              <table className="w-full text-sm">
                <thead className="bg-muted text-xs uppercase">
                  <tr>
                    <th className="p-3 text-left">Date</th>
                    <th className="p-3 text-left">Ref</th>
                    <th className="p-3 text-left">Description</th>
                    <th className="p-3 text-right">Debit</th>
                    <th className="p-3 text-right">Credit</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.lines?.map((line: any) => (
                    <tr key={line.id} className="border-b hover:bg-muted/30">
                      <td className="p-3 whitespace-nowrap">{new Date(line.createdAt).toLocaleDateString()}</td>
                      <td className="p-3 font-mono text-xs">{line.ref || line.id.substring(0, 8)}</td>
                      <td className="p-3">{line.description}</td>
                      <td className="p-3 text-right">{line.debit > 0 ? line.debit.toFixed(2) : "-"}</td>
                      <td className="p-3 text-right">{line.credit > 0 ? line.credit.toFixed(2) : "-"}</td>
                    </tr>
                  ))}
                  {(!data?.lines || data.lines.length === 0) && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground italic">
                        No ledger entries found for this snapshot window.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </DataTableShell>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
