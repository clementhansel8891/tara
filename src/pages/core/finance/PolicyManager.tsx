import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/core/ui/PageHeader";
import { WorkspacePanel } from "@/core/ui/WorkspacePanel";
import { DataTableShell } from "@/core/tools/DataTableShell";
import { FilterBar } from "@/core/tools/FilterBar";
import { ApprovalStatusBadge } from "@/core/tools/ApprovalStatusBadge";
import { useSession } from "@/core/security/session";
import { financeService, type FinanceCapexBudgetRow } from "@/core/services/finance/financeService";
import { logService } from "@/core/services/finance/logService";

type PolicyType = "APPROVAL_LIMIT" | "PAYMENT_RULE" | "EXPENSE_POLICY";

export default function PolicyManager() {
  const session = useSession();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [policyForm, setPolicyForm] = useState({
    title: "",
    type: "APPROVAL_LIMIT" as PolicyType,
    description: "",
    threshold: 0,
  });
  const [budgetForm, setBudgetForm] = useState({
    department: "",
    totalBudget: 0,
  });
  const [policies, setPolicies] = useState(() => financeService.listPolicies(session.tenantId));
  const [capexBudgets, setCapexBudgets] = useState<FinanceCapexBudgetRow[]>(() =>
    financeService.listCapexBudgets(session.tenantId),
  );

  const refreshPolicies = useCallback(() => {
    setPolicies(financeService.listPolicies(session.tenantId));
    setCapexBudgets(financeService.listCapexBudgets(session.tenantId));
  }, [session.tenantId]);

  useEffect(() => {
    refreshPolicies();
  }, [refreshPolicies]);

  const statusCounts = useMemo(
    () => ({
      active: policies.filter((policy) => policy.active).length,
      inactive: policies.filter((policy) => !policy.active).length,
    }),
    [policies],
  );

  const filteredPolicies = useMemo(
    () =>
      policies.filter((policy) =>
        search ? policy.title.toLowerCase().includes(search.toLowerCase()) : true,
      ),
    [policies, search],
  );

  const savePolicy = () => {
    financeService.createPolicy(session.tenantId, policyForm);
    logService.log(session.tenantId, session.userId, "Created policy", policyForm.title);
    setDialogOpen(false);
    setPolicyForm({ title: "", type: "APPROVAL_LIMIT", description: "", threshold: 0 });
    refreshPolicies();
  };

  const togglePolicy = (id: string) => {
    financeService.togglePolicy(session.tenantId, id);
    logService.log(session.tenantId, session.userId, "Toggled policy active state", id);
    refreshPolicies();
  };

  const saveCapexBudget = () => {
    if (!budgetForm.department.trim()) return;
    financeService.setCapexBudget(session.tenantId, session, budgetForm);
    logService.log(
      session.tenantId,
      session.userId,
      "Set CAPEX budget",
      `${budgetForm.department}:${budgetForm.totalBudget}`,
    );
    setBudgetForm({ department: "", totalBudget: 0 });
    refreshPolicies();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Policy Manager"
        subtitle="Maintain policy thresholds for approvals, payment rules, and expense controls."
        primaryAction={<Button onClick={() => setDialogOpen(true)}>New Policy</Button>}
        secondaryActions={
          <Input
            placeholder="Search policies"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="min-w-[220px]"
          />
        }
      />

      <WorkspacePanel title="Policy Health" description="Coverage and activation status by rule set.">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Active policies</p>
            <p className="text-xl font-semibold">{statusCounts.active}</p>
            <Badge variant="default">Enforced</Badge>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Inactive policies</p>
            <p className="text-xl font-semibold">{statusCounts.inactive}</p>
            <Badge variant="secondary">Draft / Paused</Badge>
          </div>
        </div>
      </WorkspacePanel>

      <WorkspacePanel
        title="CAPEX Budgets"
        description="Ledger-backed budget controls used by CAPEX request validation."
      >
        <div className="mb-3 grid gap-2 md:grid-cols-3">
          <Input
            placeholder="Department"
            value={budgetForm.department}
            onChange={(event) => setBudgetForm({ ...budgetForm, department: event.target.value })}
          />
          <Input
            placeholder="Total Budget"
            type="number"
            value={budgetForm.totalBudget}
            onChange={(event) =>
              setBudgetForm({ ...budgetForm, totalBudget: Number(event.target.value) })
            }
          />
          <Button onClick={saveCapexBudget}>Set Budget</Button>
        </div>
        <DataTableShell total={capexBudgets.length} page={1} pageSize={10}>
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3 text-left">Department</th>
                <th className="p-3 text-left">Account</th>
                <th className="p-3 text-left">Allocated</th>
                <th className="p-3 text-left">Committed</th>
                <th className="p-3 text-left">Available</th>
              </tr>
            </thead>
            <tbody>
              {capexBudgets.map((budget) => (
                <tr key={budget.department} className="border-t">
                  <td className="p-3 font-medium">{budget.department}</td>
                  <td className="p-3 text-muted-foreground">{budget.accountCode}</td>
                  <td className="p-3 text-muted-foreground">{budget.allocatedBudget.toLocaleString()}</td>
                  <td className="p-3 text-muted-foreground">{budget.committedBudget.toLocaleString()}</td>
                  <td className="p-3 text-muted-foreground">{budget.availableBudget.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTableShell>
      </WorkspacePanel>

      <WorkspacePanel title="Policies" description="All policies, thresholds, and current activation status.">
        <FilterBar searchValue={search} onSearchChange={setSearch} />
        <DataTableShell total={filteredPolicies.length} page={1} pageSize={10}>
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3 text-left">Title</th>
                <th className="p-3 text-left">Type</th>
                <th className="p-3 text-left">Threshold</th>
                <th className="p-3 text-left">Description</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPolicies.map((policy) => (
                <tr key={policy.id} className="border-t">
                  <td className="p-3 font-medium">{policy.title}</td>
                  <td className="p-3 text-muted-foreground">{policy.type}</td>
                  <td className="p-3 text-muted-foreground">{policy.threshold.toLocaleString()}</td>
                  <td className="p-3 text-muted-foreground">{policy.description}</td>
                  <td className="p-3">
                    <ApprovalStatusBadge status={policy.active ? "ACTIVE" : "INACTIVE"} />
                  </td>
                  <td className="p-3">
                    <Button size="sm" variant="outline" onClick={() => togglePolicy(policy.id)}>
                      {policy.active ? "Deactivate" : "Activate"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTableShell>
      </WorkspacePanel>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Policy</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Title"
              value={policyForm.title}
              onChange={(event) => setPolicyForm({ ...policyForm, title: event.target.value })}
            />
            <Select value={policyForm.type} onValueChange={(value) => setPolicyForm({ ...policyForm, type: value as PolicyType })}>
              <SelectTrigger>
                <SelectValue placeholder="Policy Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="APPROVAL_LIMIT">Approval Limit</SelectItem>
                <SelectItem value="PAYMENT_RULE">Payment Rule</SelectItem>
                <SelectItem value="EXPENSE_POLICY">Expense Policy</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Threshold Amount"
              type="number"
              value={policyForm.threshold}
              onChange={(event) =>
                setPolicyForm({
                  ...policyForm,
                  threshold: Number(event.target.value),
                })
              }
            />
            <Input
              placeholder="Description"
              value={policyForm.description}
              onChange={(event) => setPolicyForm({ ...policyForm, description: event.target.value })}
            />
            <div className="flex justify-end gap-2">
              <Button onClick={savePolicy}>Save Policy</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
