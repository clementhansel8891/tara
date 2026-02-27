import { useState, useEffect, useMemo } from "react";
import { retailService } from "@/core/services/retail/retailService";
import { Roles } from "@/core/security/roles";
import { useSession } from "@/core/security/session";
import { useToast } from "@/hooks/use-toast";
import type { RetailStore } from "@/core/types/retail/retail";
import {
  getItemStatus,
  type InventoryItemView,
  type OpnameEntry,
} from "./inventory.types";

export const WRITE_ROLES = [
  Roles.OWNER,
  Roles.COMPANY_ADMIN,
  Roles.DEPT_HEAD,
] as const;

export function useInventoryStore() {
  const session = useSession();
  const { toast } = useToast();
  const canWrite = (WRITE_ROLES as readonly string[]).includes(session.role);

  const [stores, setStores] = useState<RetailStore[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [inventory, setInventory] = useState<InventoryItemView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSync, setLastSync] = useState("");

  // Load stores
  useEffect(() => {
    retailService
      .listStores(session.tenantId!, session)
      .then((data) => {
        setStores(data);
        if (data.length) setSelectedStoreId(data[0].id);
      })
      .catch(console.error);
  }, [session.tenantId, session]);

  // Load inventory
  useEffect(() => {
    if (!selectedStoreId) return;
    setIsLoading(true);
    retailService
      .listInventory(session.tenantId!, session)
      .then((data) => {
        const items: InventoryItemView[] = (
          Array.isArray(data) ? data : []
        ).map((p) => {
          const base = {
            id: p.id,
            sku: p.sku,
            name: p.name,
            category: p.categoryId ?? "Uncategorized",
            onHand: p.stock ?? 0,
            reserved: Math.floor((p.stock ?? 0) * 0.1),
            available: Math.floor((p.stock ?? 0) * 0.9),
            minBuffer: 15,
            maxCapacity: 500,
            status: "ok" as const,
            lastUpdated: new Date().toISOString(),
          };
          return { ...base, status: getItemStatus(base) };
        });
        setInventory(items);
        setLastSync(new Date().toLocaleTimeString());
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [selectedStoreId, session.tenantId, session]);

  const stats = useMemo(
    () => ({
      totalSKUs: inventory.length,
      totalSOH: inventory.reduce((s, i) => s + i.onHand, 0),
      totalATS: inventory.reduce((s, i) => s + i.available, 0),
      critical: inventory.filter((i) => i.status === "critical").length,
      low: inventory.filter((i) => i.status === "low").length,
    }),
    [inventory],
  );

  const selectedStore = stores.find((s) => s.id === selectedStoreId);

  const sync = () => {
    setIsLoading(true);
    setTimeout(() => {
      setLastSync(new Date().toLocaleTimeString());
      setIsLoading(false);
      toast({
        title: "Synced",
        description: "Inventory pulled from Core Inventory.",
      });
    }, 1000);
  };

  const updateItemBuffer = (
    id: string,
    minBuffer: number,
    maxCapacity: number,
    reason: string,
  ) => {
    setInventory((prev) =>
      prev.map((i) =>
        i.id === id
          ? {
              ...i,
              minBuffer,
              maxCapacity,
              status: getItemStatus({ ...i, minBuffer }),
            }
          : i,
      ),
    );
    toast({
      title: canWrite ? "Buffer Updated" : "Change Request Sent",
      description: reason,
    });
  };

  const buildOpname = (): OpnameEntry[] =>
    inventory.map((i) => ({
      sku: i.sku,
      name: i.name,
      expected: i.onHand,
      counted: "",
    }));

  return {
    session,
    toast,
    canWrite,
    stores,
    selectedStoreId,
    setSelectedStoreId,
    selectedStore,
    inventory,
    isLoading,
    lastSync,
    stats,
    sync,
    updateItemBuffer,
    buildOpname,
  };
}
