import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/core/ui/PageHeader";
import { WorkspacePanel } from "@/core/ui/WorkspacePanel";
import { DataTableShell } from "@/core/tools/DataTableShell";
import { FilterBar } from "@/core/tools/FilterBar";
import { ApprovalStatusBadge } from "@/core/tools/ApprovalStatusBadge";
import { useSession } from "@/core/security/session";
import { financeService, type FinanceInvoiceRow } from "@/core/services/finance/financeService";
import { logService } from "@/core/services/finance/logService";

type InvoiceKind = "PAYABLE" | "RECEIVABLE";

export default function InvoiceCapture() {
  const session = useSession();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [kindFilter, setKindFilter] = useState<InvoiceKind | "ALL">("ALL");
  const [formKind, setFormKind] = useState<InvoiceKind>("PAYABLE");
  const [counterparty, setCounterparty] = useState("");
  const [amount, setAmount] = useState("0");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [invoices, setInvoices] = useState<FinanceInvoiceRow[]>(() =>
    financeService.listInvoices(session.tenantId),
  );

  const refreshInvoices = useCallback(() => {
    setInvoices(financeService.listInvoices(session.tenantId));
  }, [session.tenantId]);

  useEffect(() => {
    refreshInvoices();
  }, [refreshInvoices]);

  const filteredInvoices = useMemo(
    () =>
      invoices.filter((invoice) => {
        const searchMatch = search
          ? invoice.vendor.toLowerCase().includes(search.toLowerCase())
          : true;
        const kindMatch = kindFilter === "ALL" ? true : invoice.kind === kindFilter;
        return searchMatch && kindMatch;
      }),
    [invoices, kindFilter, search],
  );

  const grouped = useMemo(() => {
    const groups: Record<InvoiceKind, FinanceInvoiceRow[]> = {
      PAYABLE: [],
      RECEIVABLE: [],
    };
    filteredInvoices.forEach((invoice) => {
      groups[invoice.kind].push(invoice);
    });
    return groups;
  }, [filteredInvoices]);

  const captureInvoice = () => {
    if (formKind === "PAYABLE") {
      financeService.capturePayableInvoice(session.tenantId, session, {
        vendor: counterparty,
        amount: Number(amount || "0"),
        invoiceDate,
        dueDate,
      });
    } else {
      financeService.createReceivable(session.tenantId, session, {
        customer: counterparty,
        amount: Number(amount || "0"),
        dueDate,
        invoiceDate,
      });
    }
    logService.log(
      session.tenantId,
      session.userId,
      "Captured invoice",
      `${formKind} - ${counterparty}`,
    );
    setDialogOpen(false);
    setCounterparty("");
    setAmount("0");
    setInvoiceDate("");
    setDueDate("");
    refreshInvoices();
  };

  const renderTable = (items: FinanceInvoiceRow[]) => (
    <DataTableShell total={items.length} page={1} pageSize={10}>
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
          {items.map((invoice) => (
            <tr key={invoice.id} className="border-t">
              <td className="p-3">{invoice.kind}</td>
              <td className="p-3 font-medium">{invoice.vendor}</td>
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
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoice Capture"
        subtitle="Capture payable and receivable invoices into finance workflows."
        primaryAction={<Button onClick={() => setDialogOpen(true)}>Create Invoice</Button>}
        secondaryActions={
          <div className="flex gap-2">
            <Select value={kindFilter} onValueChange={(value) => setKindFilter(value as typeof kindFilter)}>
              <SelectTrigger>
                <SelectValue placeholder="Direction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="PAYABLE">Payable</SelectItem>
                <SelectItem value="RECEIVABLE">Receivable</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Search counterparties"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="min-w-[220px]"
            />
          </div>
        }
      />

      <WorkspacePanel title="Invoice Records" description="All captured invoices and settlement status.">
        <FilterBar searchValue={search} onSearchChange={setSearch} />
        <Tabs value={kindFilter}>
          <TabsList>
            <TabsTrigger value="PAYABLE" onClick={() => setKindFilter("PAYABLE")}>
              Payable
            </TabsTrigger>
            <TabsTrigger value="RECEIVABLE" onClick={() => setKindFilter("RECEIVABLE")}>
              Receivable
            </TabsTrigger>
            <TabsTrigger value="ALL" onClick={() => setKindFilter("ALL")}>
              All
            </TabsTrigger>
          </TabsList>

          <TabsContent value="PAYABLE" className="mt-4">
            {renderTable(grouped.PAYABLE)}
          </TabsContent>
          <TabsContent value="RECEIVABLE" className="mt-4">
            {renderTable(grouped.RECEIVABLE)}
          </TabsContent>
          <TabsContent value="ALL" className="mt-4">
            {renderTable(filteredInvoices)}
          </TabsContent>
        </Tabs>
      </WorkspacePanel>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Capture Invoice</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Select value={formKind} onValueChange={(value) => setFormKind(value as InvoiceKind)}>
              <SelectTrigger>
                <SelectValue placeholder="Invoice type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PAYABLE">Payable</SelectItem>
                <SelectItem value="RECEIVABLE">Receivable</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder={formKind === "PAYABLE" ? "Vendor" : "Customer"}
              value={counterparty}
              onChange={(event) => setCounterparty(event.target.value)}
            />
            <Input placeholder="Amount" type="number" value={amount} onChange={(event) => setAmount(event.target.value)} />
            <Input
              placeholder="Invoice Date"
              type="date"
              value={invoiceDate}
              onChange={(event) => setInvoiceDate(event.target.value)}
            />
            <Input placeholder="Due Date" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
            <div className="flex justify-end gap-2">
              <Button onClick={captureInvoice}>Capture and Route</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
