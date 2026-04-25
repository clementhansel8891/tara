import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/core/ui/PageHeader";
import { WorkspacePanel } from "@/core/ui/WorkspacePanel";
import { DataTableShell } from "@/core/tools/DataTableShell";
import { FilterBar } from "@/core/tools/FilterBar";
import { useSession } from "@/core/security/session";
import { salesService } from "@/core/services/sales/salesService";
import type { SalesOpportunity, SalesQuote } from "@/core/types/sales/sales";

export default function QuoteDesk() {
  const session = useSession();
  const [search, setSearch] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [opportunities, setOpportunities] = useState<SalesOpportunity[]>([]);
  const [quotes, setQuotes] = useState<SalesQuote[]>([]);
  
  const [selectedOpportunityId, setSelectedOpportunityId] = useState("");
  const [quoteAmount, setQuoteAmount] = useState("0");
  const [discountPercent, setDiscountPercent] = useState("0");

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const [o, q] = await Promise.all([
        salesService.listOpportunities(session.tenant_id, session),
        salesService.listQuotes(session.tenant_id, session),
      ]);
      setOpportunities(o);
      setQuotes(q);
      
      if (o.length > 0 && !selectedOpportunityId) {
        setSelectedOpportunityId(o[0].id);
        setQuoteAmount(o[0].amount.toString());
      }
    } catch (err) {
      console.error("Failed to fetch quote desk data:", err);
    } finally {
      setLoading(false);
    }
  }, [session.tenant_id, session, selectedOpportunityId]);

  useEffect(() => {
    refresh();
  }, [refresh, refreshKey]);

  const filtered = useMemo(
    () =>
      quotes.filter((item) =>
        search
          ? `${item.id} ${item.accountName} ${item.status}`
              .toLowerCase()
              .includes(search.toLowerCase())
          : true,
      ),
    [quotes, search],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quote and Proposal Desk"
        subtitle="Versioned quote lifecycle with approval routing and customer send controls."
        secondaryActions={
          <Input
            className="min-w-[220px]"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search quotes"
          />
        }
      />

      <WorkspacePanel title="Create Quote" description="Generate new quote version from an opportunity.">
        <div className="grid gap-3 md:grid-cols-4">
          <Input
            value={selectedOpportunityId}
            onChange={(event) => setSelectedOpportunityId(event.target.value)}
            placeholder="Opportunity ID"
          />
          <Input
            value={quoteAmount}
            onChange={(event) => setQuoteAmount(event.target.value)}
            placeholder="Quote amount"
            type="number"
          />
          <Input
            value={discountPercent}
            onChange={(event) => setDiscountPercent(event.target.value)}
            placeholder="Discount %"
            type="number"
          />
          <Button
            onClick={async () => {
              try {
                await salesService.createQuote(session.tenant_id, session, {
                  opportunityId: selectedOpportunityId,
                  amount: Number(quoteAmount),
                  discountPercent: Number(discountPercent),
                });
                setRefreshKey((value) => value + 1);
              } catch (err) {
                console.error("Failed to create quote:", err);
              }
            }}
          >
            Create Quote
          </Button>
        </div>
      </WorkspacePanel>

      <WorkspacePanel title="Quote Queue" description="Submit, approve/reject, and send quotes to customers.">
        <FilterBar searchValue={search} onSearchChange={setSearch} />
        <DataTableShell total={filtered.length} page={1} pageSize={10}>
          {loading ? (
             <div className="p-8 text-center text-muted-foreground italic">Refreshing quotes...</div>
          ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3 text-left">Quote</th>
                <th className="p-3 text-left">Account</th>
                <th className="p-3 text-left">Net Amount</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="p-3 font-medium">
                    {item.id} v{item.version}
                  </td>
                  <td className="p-3 text-muted-foreground">{item.accountName}</td>
                  <td className="p-3 text-muted-foreground">
                    {item.netAmount.toLocaleString()} {item.currency}
                  </td>
                  <td className="p-3">
                    <Badge variant={item.status === "PENDING_APPROVAL" ? "destructive" : "outline"}>
                      {item.status}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={item.status !== "DRAFT"}
                        onClick={async () => {
                          await salesService.submitQuoteForApproval(session.tenant_id, session, item.id);
                          setRefreshKey((value) => value + 1);
                        }}
                      >
                        Submit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={item.status !== "PENDING_APPROVAL"}
                        onClick={async () => {
                          await salesService.decideQuoteApproval(session.tenant_id, session, item.id, true);
                          setRefreshKey((value) => value + 1);
                        }}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={item.status !== "PENDING_APPROVAL"}
                        onClick={async () => {
                          await salesService.decideQuoteApproval(session.tenant_id, session, item.id, false);
                          setRefreshKey((value) => value + 1);
                        }}
                      >
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        disabled={item.status !== "APPROVED"}
                        onClick={async () => {
                          await salesService.sendQuoteToCustomer(session.tenant_id, session, item.id);
                          setRefreshKey((value) => value + 1);
                        }}
                      >
                        Send
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </DataTableShell>
      </WorkspacePanel>
    </div>
  );
}
