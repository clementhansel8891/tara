import { useCallback, useEffect, useMemo, useState } from "react";
// cspell:ignore qris gopay shopeepay
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/core/ui/PageHeader";
import { WorkspacePanel } from "@/core/ui/WorkspacePanel";
import { DataTableShell } from "@/core/tools/DataTableShell";
import { FilterBar } from "@/core/tools/FilterBar";
import { WorkflowRequestCard } from "@/core/tools/WorkflowRequestCard";
import { ApprovalStatusBadge } from "@/core/tools/ApprovalStatusBadge";
import { useSession } from "@/core/security/session";
import { workflowService } from "@/core/services/hr/workflowService";
import { financeService, type FinanceAlert } from "@/core/services/finance/financeService";
import { logService } from "@/core/services/finance/logService";
import type { PaymentMethod } from "@/core/types/finance/payments";
import type { WorkflowRequest } from "@/core/tools/workflows/workflowTypes";

const PAYMENT_METHODS: PaymentMethod[] = [
  "BANK_TRANSFER",
  "QRIS",
  "GOPAY",
  "OVO",
  "DANA",
  "SHOPEEPAY",
  "CARD",
];

export default function MoneyDesk() {
  const session = useSession();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"approvals" | "alerts" | "tasks">("approvals");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [amount, setAmount] = useState("5000000");
  const [method, setMethod] = useState<PaymentMethod>("BANK_TRANSFER");
  const [destination, setDestination] = useState("Vendor A");
  const [purpose, setPurpose] = useState("Payment request");

  const [alerts, setAlerts] = useState<FinanceAlert[]>([]);
  const [tasks, setTasks] = useState<WorkflowRequest[]>([]);
  const [approvals, setApprovals] = useState<WorkflowRequest[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refreshDesk = useCallback(() => {
    financeService.getAlerts(session.tenantId, session).then(setAlerts);
    financeService.getInbox(session.tenantId, session).then(setTasks);
    setApprovals(
      workflowService
        .listInbox(session.tenantId, session, "PENDING")
        .filter((item) => item.destinationDept === "FINANCE"),
    );
  }, [session]);

  useEffect(() => {
    refreshDesk();
  }, [refreshDesk]);

  const filteredApprovals = useMemo(
    () =>
      approvals.filter((item) =>
        search ? item.entityId.toLowerCase().includes(search.toLowerCase()) : true,
      ),
    [approvals, search],
  );

  const filteredAlerts = useMemo(
    () =>
      alerts.filter((item) =>
        search ? item.title.toLowerCase().includes(search.toLowerCase()) : true,
      ),
    [alerts, search],
  );

  const filteredTasks = useMemo(
    () =>
      tasks.filter((item) =>
        search ? item.entityId.toLowerCase().includes(search.toLowerCase()) : true,
      ),
    [tasks, search],
  );

  const submitPaymentRequest = async () => {
    try {
      await financeService.createPaymentRequest(session.tenantId, session, {
        amount: Number(amount || "0"),
        method,
        destination,
        purpose,
      });
      logService.log(
        session.tenantId,
        session.userId,
        "Created payment request from MoneyDesk",
        `${destination} - ${amount}`,
      );
      setErrorMessage(null);
      setStatusMessage("Payment request created and routed.");
      setDialogOpen(false);
      refreshDesk();
    } catch (error) {
      setStatusMessage(null);
      setErrorMessage(error instanceof Error ? error.message : "Failed to create payment request.");
    }
  };

  const approveTask = (workflowId: string) => {
    try {
      workflowService.approveRequest(session.tenantId, workflowId, session, "Approved from MoneyDesk");
      logService.log(session.tenantId, session.userId, "Workflow approved", workflowId);
      setErrorMessage(null);
      setStatusMessage(`Workflow ${workflowId} approved.`);
      refreshDesk();
    } catch (error) {
      setStatusMessage(null);
      setErrorMessage(error instanceof Error ? error.message : "Failed to approve workflow.");
    }
  };

  const rejectTask = (workflowId: string) => {
    try {
      workflowService.rejectRequest(session.tenantId, workflowId, session, "Rejected from MoneyDesk");
      logService.log(session.tenantId, session.userId, "Workflow rejected", workflowId);
      setErrorMessage(null);
      setStatusMessage(`Workflow ${workflowId} rejected.`);
      refreshDesk();
    } catch (error) {
      setStatusMessage(null);
      setErrorMessage(error instanceof Error ? error.message : "Failed to reject workflow.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Money Desk"
        subtitle="Finance operating inbox for approvals, alerts, and routed tasks."
        primaryAction={<Button onClick={() => setDialogOpen(true)}>Create Payment Request</Button>}
        secondaryActions={
          <Input
            placeholder="Search approvals, alerts, or tasks"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="min-w-[220px]"
          />
        }
      />

      <WorkspacePanel title="Work Queue" description="Cross-module approvals and operational alerts.">
        {statusMessage ? (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {statusMessage}
          </div>
        ) : null}
        {errorMessage ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {errorMessage}
          </div>
        ) : null}
        <Tabs value={tab} onValueChange={(value) => setTab(value as typeof tab)}>
          <TabsList>
            <TabsTrigger value="approvals">Approvals</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
          </TabsList>

          <TabsContent value="approvals" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredApprovals.map((flow) => (
                <WorkflowRequestCard
                  key={flow.id}
                  title={`${flow.entityType} | ${flow.entityId}`}
                  subtitle={`From ${flow.makerDept} to ${flow.destinationDept}`}
                  status={flow.status}
                  urgency={flow.status === "PENDING" ? 80 : 40}
                  owner={flow.destinationDept}
                  actionLabel="Review"
                  onAction={() => approveTask(flow.id)}
                  footer={
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => approveTask(flow.id)}>
                        Approve
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => rejectTask(flow.id)}>
                        Reject
                      </Button>
                    </div>
                  }
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="alerts" className="mt-4">
            {filteredAlerts.length ? (
              filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="mb-2 flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium text-foreground">{alert.title}</p>
                    <p className="text-xs text-muted-foreground">{alert.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <ApprovalStatusBadge status={alert.severity.toUpperCase()} />
                    {alert.action ? <Badge variant="outline">{alert.action}</Badge> : null}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                No active alerts for this tenant.
              </div>
            )}
          </TabsContent>

          <TabsContent value="tasks" className="mt-4">
            {filteredTasks.length ? (
              filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className="mb-2 flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {task.entityType} | {task.entityId}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Routed to {task.destinationDept}
                    </p>
                  </div>
                  <ApprovalStatusBadge status={task.status} />
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                No tasks routed to Finance.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </WorkspacePanel>

      <WorkspacePanel title="Active Records" description="Live table for finance workflows.">
        <FilterBar searchValue={search} onSearchChange={setSearch} />
        <DataTableShell total={filteredTasks.length} page={1} pageSize={10}>
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3 text-left">Entity</th>
                <th className="p-3 text-left">Type</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Requested By</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task) => (
                <tr key={task.id} className="border-t">
                  <td className="p-3">{task.entityId}</td>
                  <td className="p-3 text-muted-foreground">{task.entityType}</td>
                  <td className="p-3">
                    <ApprovalStatusBadge status={task.status} />
                  </td>
                  <td className="p-3 text-muted-foreground">{task.requestedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTableShell>
      </WorkspacePanel>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Payment Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Amount" />
            <Select value={method} onValueChange={(value) => setMethod(value as PaymentMethod)}>
              <SelectTrigger>
                <SelectValue placeholder="Method" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((paymentMethod) => (
                  <SelectItem key={paymentMethod} value={paymentMethod}>
                    {paymentMethod}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
              placeholder="Destination"
            />
            <Textarea value={purpose} onChange={(event) => setPurpose(event.target.value)} placeholder="Purpose" />
            <div className="flex justify-end gap-2">
              <Button onClick={submitPaymentRequest}>Create and Route</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
