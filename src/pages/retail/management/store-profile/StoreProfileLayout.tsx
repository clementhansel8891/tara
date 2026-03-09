import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";
import { PageHeader } from "@/core/ui/PageHeader";
import {
  Globe,
  Save,
  RefreshCw,
  Layout,
  Zap,
  PackageCheck,
  Monitor,
  ShieldCheck,
  Link,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "@/core/security/session";
import { retailService } from "@/core/services/retail/retailService";
import type { RetailStore } from "@/core/types/retail/retail";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useNavigate, useLocation } from "react-router-dom";
import { GlobalFleetDashboard } from "./modules/GlobalFleetDashboard";
import { CreateStoreDialog } from "./CreateStoreDialog";
import { PlusCircle } from "lucide-react";

// --- Context Definitions ---

interface StoreContextType {
  selectedStore: RetailStore | null;
  stores: RetailStore[];
  setSelectedStoreId: (id: string) => void;
  isSaving: boolean;
  saveConfig: () => Promise<void>;
  updateLocalConfig: (updates: Partial<RetailStore>) => void;
  isDirty: boolean;
  selectedStoreId: string;
  canEditStore: boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used within StoreProvider");
  return context;
};

// --- Main Layout Component ---

export const StoreProfileLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const session = useSession();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [stores, setStores] = useState<RetailStore[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>("all_stores");
  const [isSaving, setIsSaving] = useState(false);
  const [localStore, setLocalStore] = useState<RetailStore | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // 1. RBAC Guards & Redirection
  useEffect(() => {
    if (!session) return;

    const role = session.role?.toLowerCase();

    if (role === "staff") {
      toast({
        title: "Access Restricted",
        description: "Staff nodes are redirected to Operations Hub.",
      });
      navigate("/retail/operations-hub");
      return;
    }

    if (role === "store_manager") {
      if (session.locationId) {
        setSelectedStoreId(session.locationId);
      } else {
        // If manager has no assigned store, maybe redirect or show error
        console.warn("Store Manager has no assigned locationId in session");
      }
    }
  }, [session, session.locationId, navigate, toast]);

  // 2. Data Fetching
  useEffect(() => {
    const fetchStores = async () => {
      if (!session.tenantId) return;
      try {
        const data = await retailService.listStores(session.tenantId, session);
        setStores(data);
        if (data.length > 0) {
          setSelectedStoreId((prev) =>
            prev === "all_stores" ? data[0].id : prev,
          );
        }
      } catch (error) {
        console.error("Failed to fetch stores", error);
      }
    };
    fetchStores();
  }, [session.tenantId, session]);

  // 3. Sync local state when selected store changes
  useEffect(() => {
    if (selectedStoreId === "all_stores") {
      setLocalStore(null);
      setIsDirty(false);
    } else {
      const store = stores.find((s) => s.id === selectedStoreId) || null;
      setLocalStore(store);
      setIsDirty(false);
    }
  }, [selectedStoreId, stores]);

  const updateLocalConfig = (updates: Partial<RetailStore>) => {
    if (!localStore) return;
    setLocalStore({ ...localStore, ...updates });
    setIsDirty(true);
  };

  const saveConfig = async () => {
    if (!localStore || !session.tenantId) return;
    setIsSaving(true);
    try {
      await retailService.updateStore(session.tenantId, session, localStore);
      toast({
        title: "Node Synchronized",
        description: `Configuration parameters for ${localStore.name} updated globally.`,
      });
      setIsDirty(false);
      // Refresh stores list to get updated version
      const data = await retailService.listStores(session.tenantId, session);
      setStores(data);
    } catch (e) {
      toast({
        title: "Handshake Failed",
        description: "Consistency check failed during persistence.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const roleStr = session.role?.toLowerCase() || "";
  const isStoreManager = roleStr === "store_manager";

  const canEditStore = [
    "dept_head",
    "finance_dept_head",
    "hr_dept_head",
    "company_admin",
    "hr_admin",
    "finance_admin",
    "owner",
    "superadmin",
  ].includes(roleStr);

  const contextValue = useMemo(
    () => ({
      selectedStore: localStore,
      stores,
      setSelectedStoreId,
      isSaving,
      saveConfig,
      updateLocalConfig,
      isDirty,
      selectedStoreId,
      canEditStore,
    }),
    [localStore, stores, isSaving, isDirty, selectedStoreId, canEditStore],
  );

  const activeTab = location.pathname.split("/").pop() || "overview";

  const tabs = [
    { id: "overview", label: "Metadata", icon: Layout, path: "overview" },
    { id: "operations", label: "Capabilities", icon: Zap, path: "operations" },
    {
      id: "logistics",
      label: "Logistics Hub",
      icon: PackageCheck,
      path: "logistics",
    },
    { id: "hardware", label: "Hardware Grid", icon: Monitor, path: "hardware" },
    { id: "channels", label: "Channel Bindings", icon: Link, path: "channels" },
    {
      id: "governance",
      label: "Risk & Governance",
      icon: ShieldCheck,
      path: "governance",
    },
  ];

  const handleTabChange = (value: string) => {
    navigate(`/m/retail/management/profile/${value}`);
  };

  return (
    <StoreContext.Provider value={contextValue}>
      <div className="flex flex-col">
        {/* Header Section */}
        <div className="px-8 py-6 border-b bg-white shrink-0 flex items-center justify-between gap-6">
          <PageHeader
            title={localStore ? localStore.name : "Fleet Registry"}
            subtitle={
              localStore
                ? `Authoritative Node: ${localStore.code} • ${localStore.type?.toUpperCase()}`
                : `Global Governance Hub • ${stores.length} Nodes Registered`
            }
          />

          <div className="flex items-center gap-4">
            <Select
              value={selectedStoreId}
              onValueChange={setSelectedStoreId}
              disabled={isStoreManager}
            >
              <SelectTrigger className="w-[320px] h-12 rounded-2xl border-slate-200 bg-slate-50 font-black italic text-sm shadow-sm hover:bg-white transition-all">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-200 shadow-2xl p-2">
                {(session.role?.toLowerCase() === "superadmin" ||
                  session.role?.toLowerCase() === "owner") && (
                  <>
                    <SelectItem
                      value="all_stores"
                      className="font-black italic py-3 cursor-pointer rounded-xl"
                    >
                      <div className="flex items-center gap-2 text-blue-600">
                        <Globe className="w-4 h-4" /> GLOBAL FLEET VIEW
                      </div>
                    </SelectItem>
                    <Separator className="my-2" />
                  </>
                )}
                {stores.map((s) => (
                  <SelectItem
                    key={s.id}
                    value={s.id}
                    className="font-bold italic py-3 cursor-pointer rounded-xl"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm",
                          s.status === "active"
                            ? "bg-emerald-500"
                            : "bg-slate-300",
                        )}
                      />
                      <span>{s.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {canEditStore && (
              <CreateStoreDialog
                onSuccess={async (newStore) => {
                  // Refresh list
                  const data = await retailService.listStores(
                    session.tenantId!,
                    session,
                  );
                  setStores(data);
                  // Select the new store
                  setSelectedStoreId(newStore.id);
                }}
              />
            )}

            {localStore && canEditStore && (
              <Button
                onClick={saveConfig}
                disabled={isSaving || !isDirty}
                className={cn(
                  "h-11 px-8 rounded-2xl font-black italic uppercase tracking-widest text-[10px] gap-2 shadow-xl transition-all active:scale-95",
                  isDirty ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-900",
                )}
              >
                {isSaving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save
                    className={cn(
                      "w-4 h-4",
                      isDirty ? "text-white" : "text-blue-400",
                    )}
                  />
                )}
                {isDirty ? "Save Configuration" : "Node Synchronized"}
              </Button>
            )}
          </div>
        </div>

        {/* Tab Navigation - Hidden in Global View */}
        {selectedStoreId !== "all_stores" && (
          <div className="px-8 bg-white border-b shrink-0">
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="bg-transparent h-auto p-0 gap-12 rounded-none justify-start">
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className={cn(
                      "data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none border-b-4 font-black italic uppercase tracking-[0.2em] text-[10px] py-4 px-0 flex items-center gap-2 transition-all",
                      activeTab === tab.id
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-slate-400 hover:text-slate-600",
                    )}
                  >
                    <tab.icon className="w-4 h-4" /> {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        )}

        {/* Content Area */}
        <div className="bg-slate-50/50 p-8 lg:p-12">
          <div className="max-w-7xl mx-auto">
            {selectedStoreId === "all_stores" ? (
              <GlobalFleetDashboard />
            ) : (
              children
            )}
          </div>
        </div>
      </div>
    </StoreContext.Provider>
  );
};
