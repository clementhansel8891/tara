import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/core/ui/PageHeader";
import { WorkspacePanel } from "@/core/ui/WorkspacePanel";
import { DataTableShell } from "@/core/tools/DataTableShell";
import { FilterBar } from "@/core/tools/FilterBar";
import { ApprovalStatusBadge } from "@/core/tools/ApprovalStatusBadge";
import { useSession } from "@/core/security/session";
import { financeService, type FinanceInvoiceRow, type FinanceJournalRow } from "@/core/services/finance/financeService";
import { payrollService } from "@/core/services/finance/payrollService";
import { logService } from "@/core/services/finance/logService";
import type { PayrollEntry } from "@/core/types/finance/payrollTypes";

type LedgerTab = "journals" | "invoices" | "payroll";

const toPeriod = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${month}`;
};

export default function LedgerCore() {
  const session = useSession();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<LedgerTab>("journals");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [payrollDialogOpen, setPayrollDialogOpen] = useState(false);
  const [entry, setEntry] = useState<{
    account: string;
    type: "DEBIT" | "CREDIT";
    amount: number;
    description: string;
  }>({
    account: "",
    type: "DEBIT",
    amount: 0,
    description: "",
  });
  const [payrollPeriod, setPayrollPeriod] = useState(toPeriod());
  const [employeeCount, setEmployeeCount] = useState(10);
  const [netPerEmployee, setNetPerEmployee] = useState(7000000);
  const [journals, setJournals] = useState<FinanceJournalRow[]>([]);
  const [invoices, setInvoices] = useState<FinanceInvoiceRow[]>([]);
  const [payrollEntries, setPayrollEntries] = useState<PayrollEntry[]>([]);

  const refreshLedger = useCallback(async () => {
    const payrollRows = await payrollService.getPayrollEntries(session.tenantId);
    setJournals(financeService.listJournals(session.tenantId));
    setInvoices(financeService.listInvoices(session.tenantId));
    setPayrollEntries(payrollRows);
  }, [session.tenantId]);

  useEffect(() => {
    void refreshLedger();
  }, [refreshLedger]);

  const filteredJournals = useMemo(
    () =>
      journals.filter((journal) =>
        search
          ? `${journal.account} ${journal.description}`
              .toLowerCase()
              .includes(search.toLowerCase())
          : true,
      ),
    [journals, search],
  );

  const filteredInvoices = useMemo(
    () =>
      invoices.filter((invoice) =>
        search
          ? `${invoice.vendor} ${invoice.id} ${invoice.kind}`
              .toLowerCase()
              .includes(search.toLowerCase())
          : true,
      ),
    [invoices, search],
  );

  const filteredPayroll = useMemo(
    () =>
      payrollEntries.filter((payroll) =>
        search
          ? `${payroll.employeeId} ${payroll.period}`
              .toLowerCase()
              .includes(search.toLowerCase())
          : true,
      ),
    [payrollEntries, search],
  );

  const handleCreateJournal = () => {
    financeService.createJournal(session.tenantId, entry);
    logService.log(
      session.tenantId,
      session.userId,
      "Created Journal Entry",
      `${entry.account}:${entry.amount}`,
    );
    setDialogOpen(false);
    setEntry({ account: "", type: "DEBIT", amount: 0, description: "" });
    void refreshLedger();
  };

  const runPayrollPosting = async () => {
    const safeEmployeeCount = Math.max(employeeCount, 1);
    const safeNetPerEmployee = Math.max(netPerEmployee, 0);
    const totalNet = safeEmployeeCount * safeNetPerEmployee;
    const timestamp = new Date().toISOString();

    await payrollService.createPayrollEntry({
      id: `payroll-${Date.now()}`,
      tenantId: session.tenantId,
      employeeId: `batch-${payrollPeriod}`,
      period: payrollPeriod,
      baseSalary: totalNet,
      bonuses: 0,
      deductions: 0,
      netSalary: totalNet,
      status: "approved",
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    financeService.createJournal(session.tenantId, {
      account: "EXP-PAYROLL",
      type: "DEBIT",
      amount: totalNet,
      description: `Payroll posting for ${payrollPeriod}`,
    });
    financeService.createJournal(session.tenantId, {
      account: "BS-CASH",
      type: "CREDIT",
      amount: totalNet,
      description: `Payroll disbursement for ${payrollPeriod}`,
    });

    logService.log(
      session.tenantId,
      session.userId,
      "Ran payroll posting",
      `${payrollPeriod}:${totalNet}`,
    );
    setPayrollDialogOpen(false);
    void refreshLedger();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ledger Core"
        subtitle="Unified ledger workspace for journals, invoices, and payroll postings."
        primaryAction={<Button onClick={() => setDialogOpen(true)}>Create Journal Entry</Button>}
        secondaryActions={
          <Input
            placeholder="Search journals, invoices, or payroll"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="min-w-[220px]"
          />
        }
      />

      <WorkspacePanel title="Ledger Work Queue" description="Operational posting and review across accounting records.">
        <FilterBar searchValue={search} onSearchChange={setSearch} />
        <Tabs value={tab} onValueChange={(value) => setTab(value as LedgerTab)}>
          <TabsList>
            <TabsTrigger value="journals">Journals</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="payroll">Payroll</TabsTrigger>
          </TabsList>

          <TabsContent value="journals" className="mt-4">
            <DataTableShell total={filteredJournals.length} page={1} pageSize={10}>
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="p-3 text-left">Account</th>
                    <th className="p-3 text-left">Type</th>
                    <th className="p-3 text-left">Amount</th>
                    <th className="p-3 text-left">Description</th>
                    <th className="p-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredJournals.map((journal) => (
                    <tr key={journal.id} className="border-t">
                      <td className="p-3">{journal.account}</td>
                      <td className="p-3 text-muted-foreground">{journal.type}</td>
                      <td className="p-3 text-muted-foreground">{journal.amount.toLocaleString()}</td>
                      <td className="p-3">{journal.description}</td>
                      <td className="p-3">
                        <ApprovalStatusBadge status={journal.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DataTableShell>
          </TabsContent>

          <TabsContent value="invoices" className="mt-4">
            <DataTableShell total={filteredInvoices.length} page={1} pageSize={10}>
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="p-3 text-left">Direction</th>
                    <th className="p-3 text-left">Counterparty</th>
                    <th className="p-3 text-left">Amount</th>
                    <th className="p-3 text-left">Invoice Date</th>
                    <th className="p-3 text-left">Due Date</th>
                    <th className="p-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="border-t">
                      <td className="p-3">{invoice.kind}</td>
                      <td className="p-3">{invoice.vendor}</td>
                      <td className="p-3 text-muted-foreground">{invoice.amount.toLocaleString()}</td>
                      <td className="p-3 text-muted-foreground">{invoice.invoiceDate}</td>
                      <td className="p-3 text-muted-foreground">{invoice.dueDate}</td>
                      <td className="p-3">
                        <ApprovalStatusBadge status={invoice.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DataTableShell>
          </TabsContent>

          <TabsContent value="payroll" className="mt-4">
            <div className="mb-4 flex justify-end">
              <Button onClick={() => setPayrollDialogOpen(true)}>Run Payroll Posting</Button>
            </div>
            <DataTableShell total={filteredPayroll.length} page={1} pageSize={10}>
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="p-3 text-left">Period</th>
                    <th className="p-3 text-left">Batch</th>
                    <th className="p-3 text-left">Net Salary</th>
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3 text-left">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayroll.map((entryRow) => (
                    <tr key={entryRow.id} className="border-t">
                      <td className="p-3">{entryRow.period}</td>
                      <td className="p-3">{entryRow.employeeId}</td>
                      <td className="p-3 text-muted-foreground">{entryRow.netSalary.toLocaleString()}</td>
                      <td className="p-3">
                        <ApprovalStatusBadge status={entryRow.status.toUpperCase()} />
                      </td>
                      <td className="p-3 text-muted-foreground">{entryRow.updatedAt.slice(0, 10)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DataTableShell>
          </TabsContent>
        </Tabs>
      </WorkspacePanel>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Journal Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Account"
              value={entry.account}
              onChange={(event) => setEntry({ ...entry, account: event.target.value })}
            />
            <Select
              value={entry.type}
              onValueChange={(value: "DEBIT" | "CREDIT") =>
                setEntry({ ...entry, type: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DEBIT">Debit</SelectItem>
                <SelectItem value="CREDIT">Credit</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Amount"
              type="number"
              value={entry.amount}
              onChange={(event) => setEntry({ ...entry, amount: Number(event.target.value) })}
            />
            <Input
              placeholder="Description"
              value={entry.description}
              onChange={(event) => setEntry({ ...entry, description: event.target.value })}
            />
            <div className="flex justify-end gap-2">
              <Button onClick={handleCreateJournal}>Create and Route</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={payrollDialogOpen} onOpenChange={setPayrollDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Run Payroll Posting</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              type="month"
              value={payrollPeriod}
              onChange={(event) => setPayrollPeriod(event.target.value)}
            />
            <Input
              type="number"
              placeholder="Employees"
              value={employeeCount}
              onChange={(event) => setEmployeeCount(Number(event.target.value))}
            />
            <Input
              type="number"
              placeholder="Net Per Employee"
              value={netPerEmployee}
              onChange={(event) => setNetPerEmployee(Number(event.target.value))}
            />
            <div className="rounded border p-3 text-sm">
              Estimated posting: {(Math.max(employeeCount, 1) * Math.max(netPerEmployee, 0)).toLocaleString()}
            </div>
            <div className="flex justify-end gap-2">
              <Button onClick={runPayrollPosting}>Run Posting</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
