import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Layers, ClipboardCheck, ArrowLeftRight, Upload } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { retailService } from "@/core/services/retail/retailService";
import { useSession } from "@/core/security/session";
import { Roles } from "@/core/security/roles";
import type { RetailStore } from "@/core/types/retail/retail";

// ── Sub-components ───────────────────────────────────────────
import { InventoryPageHeader } from "./components/inventory/InventoryPageHeader";
import { InventoryKpiBar } from "./components/inventory/InventoryKpiBar";
import { FiltersBar } from "./components/inventory/FiltersBar";
import { InventoryTable } from "./components/inventory/InventoryTable";
import {
  StockOpnameTab,
  type OpnameEntry,
} from "./components/inventory/StockOpnameTab";
import {
  MovementsTab,
  type AuditEntry,
} from "./components/inventory/MovementsTab";
import { ImportExportTab } from "./components/inventory/ImportExportTab";
import {
  InventoryMovementDialog,
  type MovementPayload,
} from "./components/InventoryMovementDialog";
import {
  InventoryStockEditDialog,
  type BufferUpdatePayload,
} from "./components/InventoryStockEditDialog";
import { MOVEMENT_META, type MovementType } from "./components/movementMeta";
import type {
  InventoryItemView,
  InventoryFilters,
} from "./components/inventory/types";

// ── Constants ────────────────────────────────────────────────
const WRITE_ROLES = [Roles.OWNER, Roles.COMPANY_ADMIN, Roles.DEPT_HEAD];
const PAGE_SIZE = 20;
const STATS_PAGE_SIZE = 1000; // large fetch for accurate KPI aggregation

const statusBadge = (s: InventoryItemView["status"]) => {
  const map = {
    ok: "bg-emerald-50 text-emerald-700",
    low: "bg-amber-50 text-amber-700",
    critical: "bg-red-50 text-red-700",
    overstock: "bg-blue-50 text-blue-700",
  };
  return map[s];
};

const getItemStatus = (
  item: InventoryItemView,
): InventoryItemView["status"] => {
  if (item.available <= 0) return "critical";
  if (item.available < item.minBuffer) return "low";
  if (item.onHand > item.minBuffer * 5) return "overstock";
  return "ok";
};

const mapProduct = (p: any): InventoryItemView => {
  // Comprehensive fallback chain for stock field across API shapes
  const onHand = (p.metadata?.stock_on_hand as number) ?? Number(p.stock ?? 0);
  const reserved = (p.metadata?.reserved as number) ?? Math.floor(onHand * 0.1);
  const available = (p.metadata?.available as number) ?? onHand - reserved;

  const base: InventoryItemView = {
    id: p.id,
    sku: p.sku,
    name: p.name,
    category: p.categoryName ?? p.categoryId ?? "Uncategorized",
    onHand,
    reserved,
    available,
    minBuffer: p.minBuffer ?? 15,
    status: "ok",
  };
  base.status = getItemStatus(base);
  return base;
};

// ── Mock audit log (replace with API call when endpoint exists) ──
const MOCK_AUDIT_LOG: AuditEntry[] = [
  {
    id: "a1",
    actor: "Budi S.",
    action: "STOCK_ADJUST",
    sku: "SKU-001",
    qty: -5,
    reason: "Damaged goods write-off",
    ts: "2026-02-26 14:10",
    status: "approved",
  },
  {
    id: "a2",
    actor: "System",
    action: "SYNC_PULL",
    reason: "Core inventory sync",
    ts: "2026-02-26 13:00",
    status: "approved",
  },
  {
    id: "a3",
    actor: "Dewi K.",
    action: "TRANSFER_OUT",
    sku: "SKU-042",
    qty: 20,
    reason: "Branch rebalancing",
    ts: "2026-02-26 11:30",
    status: "pending",
  },
];

// ── Main Component ────────────────────────────────────────────
const InventoryVisibility = () => {
  const session = useSession();
  const { toast } = useToast();
  const canWrite = WRITE_ROLES.includes(
    session.role as (typeof WRITE_ROLES)[number],
  );

  // ── Store ─────────────────────────────────────────────────
  const [stores, setStores] = useState<RetailStore[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");

  // ── Display — paginated data ───────────────────────────────
  const [inventory, setInventory] = useState<InventoryItemView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSync, setLastSync] = useState<string>("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // ── Filters — server-side (search, category, sort) ────────
  const [filters, setFilters] = useState<InventoryFilters>({
    search: "",
    status: "all",
    category: "all",
    sortBy: "name-asc",
  });

  console.log("[InventoryVisibility] Render:", {
    tenantId: session.tenantId,
    selectedStoreId,
    isLoading,
    hasSession: !!session.token,
  });

  // ── Debounced search — prevents API call on every keystroke ─
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(filters.search), 400);
    return () => clearTimeout(timer);
  }, [filters.search]);

  // ── Stats — server-side aggregation ───────────────────────
  const [serverStats, setServerStats] = useState({
    total: 0,
    critical: 0,
    lowStock: 0,
    overstock: 0,
    outOfStock: 0,
    totalSOH: 0,
    totalATS: 0,
  });
  const [isAggregating, setIsAggregating] = useState(false);

  // ── Dialogs ───────────────────────────────────────────────
  const [editItem, setEditItem] = useState<InventoryItemView | null>(null);
  const [movementType, setMovementType] = useState<MovementType | null>(null);

  // ── Opname ────────────────────────────────────────────────
  const [opnameActive, setOpnameActive] = useState(false);
  const [opnameEntries, setOpnameEntries] = useState<OpnameEntry[]>([]);
  const [barcodeInput, setBarcodeInput] = useState("");

  // ── Load stores ───────────────────────────────────────────
  useEffect(() => {
    if (!session.tenantId) return;

    console.log("[InventoryVisibility] Fetching stores for:", session.tenantId);
    retailService
      .listStores(session.tenantId, session)
      .then((data) => {
        setStores(data);
        if (data.length > 0) setSelectedStoreId(data[0].id);
      })
      .catch((err) => {
        console.error("[InventoryVisibility] Store fetch failed:", err);
        toast({
          title: "Store Fetch Failed",
          description: "Could not load stores for your tenant.",
          variant: "destructive",
        });
      });
  }, [session.tenantId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load display inventory (paginated, server filters) ─────
  useEffect(() => {
    if (!selectedStoreId || !session.tenantId) return;
    setIsLoading(true);
    retailService
      .listInventory(session.tenantId, session, {
        page,
        pageSize: PAGE_SIZE,
        categoryId: filters.category !== "all" ? filters.category : undefined,
        q: debouncedSearch.trim() || undefined,
        sortBy: filters.sortBy.startsWith("name") ? "name" : "price",
        sortDir: filters.sortBy.endsWith("desc") ? "desc" : "asc",
      })
      .then((data) => {
        const meta = (data as any).meta ?? {
          total: data.length,
          page: 1,
          pageSize: data.length || 1,
        };
        setTotal(meta.total);
        setInventory((Array.isArray(data) ? data : []).map(mapProduct));
        setLastSync(new Date().toLocaleTimeString());
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [
    selectedStoreId,
    session.tenantId,
    page,
    filters.category,
    debouncedSearch,
    filters.sortBy,
  ]);

  // ── Load Server Stats for KPI ─────────────────────────────
  useEffect(() => {
    if (!selectedStoreId || !session.tenantId) return;
    setIsAggregating(true);
    retailService
      .getInventoryStats(session.tenantId, session, {
        categoryId: filters.category !== "all" ? filters.category : undefined,
        q: debouncedSearch.trim() || undefined,
      })
      .then((stats) => {
        setServerStats(stats);
      })
      .catch(console.error)
      .finally(() => setIsAggregating(false));
  }, [selectedStoreId, session.tenantId, filters.category, debouncedSearch]);

  // ── Reset page when search/filter changes ────────────────
  useEffect(() => {
    setPage(1);
  }, [filters.category, filters.sortBy, debouncedSearch]);

  // ── KPI stats — from the server-side aggregation dataset ──
  const stats = useMemo(
    () => ({
      totalSKUs: serverStats.total,
      totalSOH: serverStats.totalSOH,
      totalATS: serverStats.totalATS,
      critical: serverStats.critical,
      low: serverStats.lowStock,
    }),
    [serverStats],
  );

  // ── Client-side status filter applied on returned page data ─
  // BUG FIX: only statusFilter is client-side (not search/category — those are server-side)
  const filtered = useMemo(
    () =>
      filters.status === "all"
        ? inventory
        : inventory.filter((i) => i.status === filters.status),
    [inventory, filters.status],
  );

  const categoryOptions = useMemo(
    () => [
      "all",
      "Electronics",
      "Clothing",
      "Furniture",
      "Accessories",
      "Home & Garden",
    ],
    [],
  );

  const totalPages = Math.max(1, Math.ceil((total || 1) / PAGE_SIZE));

  // ── Handlers ──────────────────────────────────────────────
  const handleSync = useCallback(() => {
    setIsLoading(true);
    setIsAggregating(true);
    Promise.all([
      retailService.listInventory(session.tenantId!, session, {
        page,
        pageSize: PAGE_SIZE,
        categoryId: filters.category !== "all" ? filters.category : undefined,
        q: debouncedSearch.trim() || undefined,
        sortBy: filters.sortBy.startsWith("name") ? "name" : "price",
        sortDir: filters.sortBy.endsWith("desc") ? "desc" : "asc",
      }),
      retailService.getInventoryStats(session.tenantId!, session, {
        categoryId: filters.category !== "all" ? filters.category : undefined,
        q: debouncedSearch.trim() || undefined,
      }),
    ])
      .then(([display, stats]) => {
        const meta = (display as any).meta ?? {
          total: (display as any).length || 0,
          page: 1,
        };
        setTotal(meta.total);
        setInventory((Array.isArray(display) ? display : []).map(mapProduct));
        setServerStats((prev) => ({ ...prev, ...stats }));
        setLastSync(new Date().toLocaleTimeString());
        toast({ title: "Synced", description: "Inventory pulled from Core." });
      })
      .catch(console.error)
      .finally(() => {
        setIsLoading(false);
        setIsAggregating(false);
      });
  }, [session, page, filters, debouncedSearch, toast]);

  const handleMovementSubmit = useCallback(
    ({
      lines,
      ref,
      reason,
      destinationStoreId,
      expectedDate,
      uom,
    }: MovementPayload) => {
      const label = MOVEMENT_META[movementType!].label;
      toast({
        title: `${label} Request Submitted`,
        description: `${lines.length} line(s), ${uom}. Ref: ${ref || "N/A"}. ${reason}${
          destinationStoreId ? ` • To store ${destinationStoreId}` : ""
        }${expectedDate ? ` • ETA ${expectedDate}` : ""}`,
      });
    },
    [movementType, toast],
  );

  const handleEditSubmit = useCallback(
    ({
      id,
      minBuffer,
      reason,
      effectiveDate,
      notifyProcurement,
    }: BufferUpdatePayload) => {
      setInventory((prev) =>
        prev.map((i) =>
          i.id === id
            ? { ...i, minBuffer, status: getItemStatus({ ...i, minBuffer }) }
            : i,
        ),
      );
      toast({
        title: canWrite ? "Buffer Updated" : "Change Request Sent",
        description: `${reason} • Effective ${effectiveDate}${
          notifyProcurement ? " • Procurement alerted" : ""
        }`,
      });
    },
    [canWrite, toast],
  );

  // ── Opname handlers ───────────────────────────────────────
  const startOpname = useCallback(() => {
    setOpnameEntries(
      inventory.map((i) => ({
        sku: i.sku,
        name: i.name,
        expected: i.onHand,
        counted: "",
      })),
    );
    setOpnameActive(true);
  }, [inventory]);

  const handleBarcodeKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== "Enter") return;
      const sku = barcodeInput.trim();
      setBarcodeInput("");
      setOpnameEntries((prev) => {
        const idx = prev.findIndex((entry) => entry.sku === sku);
        if (idx === -1) {
          toast({
            title: "SKU Not Found",
            description: sku,
            variant: "destructive",
          });
          return prev;
        }
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          counted: Number(updated[idx].counted || 0) + 1,
        };
        return updated;
      });
    },
    [barcodeInput, toast],
  );

  const submitOpname = useCallback(() => {
    const variances = opnameEntries.filter(
      (e) => e.counted !== "" && Number(e.counted) !== e.expected,
    );
    toast({
      title: "Stock Opname Submitted",
      description: `${variances.length} variance(s) found. Pending reconciliation approval.`,
    });
    setOpnameActive(false);
  }, [opnameEntries, toast]);

  const handleCountChange = useCallback((index: number, value: string) => {
    setOpnameEntries((prev) =>
      prev.map((entry, i) =>
        i === index
          ? { ...entry, counted: value === "" ? "" : Number(value) }
          : entry,
      ),
    );
  }, []);

  const selectedStore = stores.find((s) => s.id === selectedStoreId);

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-[calc(100vh-120px)] overflow-hidden">
      {/* ── Header ── */}
      <div className="px-8 py-5 border-b bg-white shrink-0">
        <InventoryPageHeader
          stores={stores}
          selectedStoreId={selectedStoreId}
          onStoreChange={setSelectedStoreId}
          lastSync={lastSync}
          isLoading={isLoading}
          canWrite={canWrite}
          onSync={handleSync}
        />
        <InventoryKpiBar stats={stats} isAggregating={isAggregating} />
      </div>

      {/* ── Tabs ── */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="ledger" className="h-full flex flex-col">
          <div className="px-8 pt-4 border-b bg-white shrink-0">
            <TabsList className="bg-slate-100 rounded-xl p-1 h-10">
              {[
                { val: "ledger", label: "Stock Ledger", icon: Layers },
                { val: "opname", label: "Stock Opname", icon: ClipboardCheck },
                { val: "movements", label: "Movements", icon: ArrowLeftRight },
                { val: "import", label: "Import / Export", icon: Upload },
              ].map((t) => (
                <TabsTrigger
                  key={t.val}
                  value={t.val}
                  className="rounded-lg font-black italic text-xs uppercase tracking-widest gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <t.icon className="w-3.5 h-3.5" /> {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* TAB 1: Stock Ledger */}
          <TabsContent
            value="ledger"
            className="flex-1 overflow-y-auto m-0 p-8"
          >
            <div className="max-w-7xl mx-auto space-y-6">
              <FiltersBar
                canWrite={canWrite}
                filters={filters}
                categoryOptions={categoryOptions}
                onFiltersChange={(patch) =>
                  setFilters((prev) => ({ ...prev, ...patch }))
                }
              />
              <Card className="rounded-[2rem] border-none shadow-xl overflow-hidden bg-white">
                <InventoryTable
                  items={filtered}
                  isLoading={isLoading}
                  page={page}
                  pageSize={PAGE_SIZE}
                  totalPages={totalPages}
                  totalItems={total || inventory.length}
                  currentCount={filtered.length}
                  statusBadge={statusBadge}
                  onEdit={(item) => setEditItem(item)}
                  onMovement={(type) => setMovementType(type)}
                  onPageChange={(pNum) =>
                    setPage(Math.max(1, Math.min(totalPages, pNum)))
                  }
                />
              </Card>
            </div>
          </TabsContent>

          {/* TAB 2: Stock Opname */}
          <TabsContent value="opname" className="flex-1 m-0 p-8">
            <div className="max-w-5xl mx-auto space-y-8">
              <StockOpnameTab
                storeName={selectedStore?.name}
                opnameActive={opnameActive}
                opnameEntries={opnameEntries}
                barcodeInput={barcodeInput}
                onStart={startOpname}
                onDiscard={() => setOpnameActive(false)}
                onSubmit={submitOpname}
                onBarcodeChange={setBarcodeInput}
                onBarcodeKeyDown={handleBarcodeKeyDown}
                onCountChange={handleCountChange}
              />
            </div>
          </TabsContent>

          {/* TAB 3: Movements */}
          <TabsContent
            value="movements"
            className="flex-1 overflow-y-auto m-0 p-8"
          >
            <MovementsTab
              canWrite={canWrite}
              auditLog={MOCK_AUDIT_LOG}
              onMovement={(type) => setMovementType(type)}
            />
          </TabsContent>

          {/* TAB 4: Import / Export */}
          <TabsContent
            value="import"
            className="flex-1 overflow-y-auto m-0 p-8"
          >
            <ImportExportTab canWrite={canWrite} />
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Dialogs ── */}
      <InventoryMovementDialog
        type={movementType ?? "request_po"}
        open={!!movementType}
        onClose={() => setMovementType(null)}
        stores={stores}
        selectedStoreId={selectedStoreId}
        items={inventory}
        onSubmit={handleMovementSubmit}
      />
      <InventoryStockEditDialog
        item={editItem}
        open={!!editItem}
        onClose={() => setEditItem(null)}
        canWrite={canWrite}
        onSubmit={handleEditSubmit}
      />
    </div>
  );
};

export default InventoryVisibility;
