// ============================================================
// LICENSING CONTEXT - Module activation and entitlements
// ============================================================

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import type { License, ModuleInstance, LicenseLimits } from "../types";
import { useIdentity } from "../identity/context";

// ============================================================
// STATE TYPES
// ============================================================

interface LicensingState {
  isLoading: boolean;
  licenses: License[];
  moduleInstances: ModuleInstance[];
}

type LicensingAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_LICENSES"; payload: License[] }
  | { type: "SET_MODULE_INSTANCES"; payload: ModuleInstance[] }
  | { type: "TOGGLE_MODULE"; payload: { moduleId: string; enabled: boolean } };

// ============================================================
// MOCK DATA
// ============================================================

const mockModuleDefinitions = [
  {
    id: "core",
    name: "Core System",
    description: "Essential business operations management",
    category: "core",
    version: "1.0.0",
    requiredCoreServices: [],
    requiredPermissions: [],
    supportedDeviceTypes: ["desktop", "tablet", "mobile"],
    configSchema: {},
    presets: [],
  },
  {
    id: "retail",
    name: "Retail Module",
    description: "Point of sale and retail operations management",
    category: "industry",
    version: "1.0.0",
    requiredCoreServices: ["inventory", "financial", "shift"],
    requiredPermissions: [{ resource: "sales", actions: ["read"] }],
    supportedDeviceTypes: ["desktop", "tablet", "kiosk"],
    configSchema: {
      enableBarcode: {
        type: "boolean",
        label: "Enable Barcode Scanner",
        description: "Enable barcode scanning for products",
        default: true,
      },
      taxRate: {
        type: "number",
        label: "Default Tax Rate",
        description: "Default tax rate percentage",
        default: 8.5,
      },
      enableLoyalty: {
        type: "boolean",
        label: "Enable Loyalty Program",
        description: "Enable customer loyalty points",
        default: false,
      },
    },
    presets: [
      {
        id: "general",
        name: "General Retail",
        description: "Standard retail configuration",
        config: { enableBarcode: true, taxRate: 8.5 },
      },
      {
        id: "grocery",
        name: "Grocery Store",
        description: "Optimized for grocery retail",
        config: { enableBarcode: true, taxRate: 0, enableLoyalty: true },
      },
    ],
  },
  {
    id: "cafe",
    name: "Cafe Module",
    description: "Restaurant and cafe operations management",
    category: "industry",
    version: "1.0.0",
    requiredCoreServices: ["inventory", "financial", "shift", "workflow"],
    requiredPermissions: [{ resource: "orders", actions: ["read"] }],
    supportedDeviceTypes: ["desktop", "tablet", "kiosk", "display"],
    configSchema: {
      tableCount: {
        type: "number",
        label: "Number of Tables",
        description: "Total tables in the establishment",
        default: 10,
      },
      enableKDS: {
        type: "boolean",
        label: "Enable Kitchen Display",
        description: "Enable kitchen display system",
        default: true,
      },
      enableReservations: {
        type: "boolean",
        label: "Enable Reservations",
        description: "Allow table reservations",
        default: false,
      },
      serviceChargeRate: {
        type: "number",
        label: "Service Charge %",
        description: "Default service charge percentage",
        default: 0,
      },
    },
    presets: [
      {
        id: "cafe",
        name: "Cafe",
        description: "Standard cafe configuration",
        config: { tableCount: 10, enableKDS: true },
      },
      {
        id: "restaurant",
        name: "Full Service Restaurant",
        description: "Full service restaurant",
        config: {
          tableCount: 20,
          enableKDS: true,
          enableReservations: true,
          serviceChargeRate: 10,
        },
      },
      {
        id: "fastfood",
        name: "Fast Food",
        description: "Quick service restaurant",
        config: { tableCount: 0, enableKDS: true },
      },
    ],
  },
  {
    id: "finance",
    name: "Finance Module",
    description: "Financial management and accounting",
    category: "core",
    version: "1.0.0",
    requiredCoreServices: ["financial", "audit"],
    requiredPermissions: [{ resource: "finance", actions: ["read"] }],
    supportedDeviceTypes: ["desktop"],
    configSchema: {},
    presets: [],
  },
  {
    id: "hr",
    name: "HR Module",
    description: "Human resources and payroll management",
    category: "core",
    version: "1.0.0",
    requiredCoreServices: ["time_attendance", "workflow"],
    requiredPermissions: [{ resource: "hr", actions: ["read"] }],
    supportedDeviceTypes: ["desktop", "tablet"],
    configSchema: {},
    presets: [],
  },
  {
    id: "inventory",
    name: "Inventory Module",
    description: "Advanced inventory and warehouse management",
    category: "core",
    version: "1.0.0",
    requiredCoreServices: ["inventory"],
    requiredPermissions: [{ resource: "inventory", actions: ["read"] }],
    supportedDeviceTypes: ["desktop", "tablet", "mobile"],
    configSchema: {},
    presets: [],
  },
  {
    id: "purchasing",
    name: "Purchasing Module",
    description: "Procurement and supplier management",
    category: "core",
    version: "1.0.0",
    requiredCoreServices: ["inventory", "workflow"],
    requiredPermissions: [{ resource: "purchasing", actions: ["read"] }],
    supportedDeviceTypes: ["desktop"],
    configSchema: {},
    presets: [],
  },
  {
    id: "security",
    name: "Security Module",
    description: "Security monitoring and access control",
    category: "core",
    version: "1.0.0",
    requiredCoreServices: ["audit"],
    requiredPermissions: [{ resource: "security", actions: ["read"] }],
    supportedDeviceTypes: ["desktop"],
    configSchema: {},
    presets: [],
  },
];

const mockLicenses: License[] = [
  {
    id: "lic-core",
    organizationId: "org-1",
    moduleId: "core",
    type: "enterprise",
    status: "active",
    startDate: "2024-01-01",
    endDate: "2025-12-31",
    limits: {
      maxUsers: 100,
      maxDevices: 50,
      maxSites: 10,
      concurrentSessions: 25,
    },
    features: ["*"],
  },
  {
    id: "lic-retail",
    organizationId: "org-1",
    moduleId: "retail",
    type: "professional",
    status: "active",
    startDate: "2024-01-01",
    endDate: "2025-12-31",
    limits: {
      maxUsers: 20,
      maxDevices: 10,
      maxSites: 5,
      concurrentSessions: 10,
    },
    features: ["pos", "inventory", "shifts", "reports"],
  },
  {
    id: "lic-cafe",
    organizationId: "org-1",
    moduleId: "cafe",
    type: "professional",
    status: "active",
    startDate: "2024-01-01",
    endDate: "2025-12-31",
    limits: {
      maxUsers: 20,
      maxDevices: 15,
      maxSites: 5,
      concurrentSessions: 15,
    },
    features: ["pos", "tables", "kds", "inventory", "reports"],
  },
  {
    id: "lic-finance",
    organizationId: "org-1",
    moduleId: "finance",
    type: "standard",
    status: "active",
    startDate: "2024-01-01",
    endDate: "2025-12-31",
    limits: { maxUsers: 5, maxDevices: 5, maxSites: 1, concurrentSessions: 3 },
    features: ["ledger", "reports"],
  },
  {
    id: "lic-hr",
    organizationId: "org-1",
    moduleId: "hr",
    type: "trial",
    status: "active",
    startDate: "2024-06-01",
    endDate: "2024-07-01",
    limits: { maxUsers: 10, maxDevices: 5, maxSites: 1, concurrentSessions: 5 },
    features: ["attendance", "scheduling"],
  },
];

const mockModuleInstances: ModuleInstance[] = [
  {
    id: "inst-core",
    organizationId: "org-1",
    moduleId: "core",
    licenseId: "lic-core",
    status: "active",
    config: {},
    activatedAt: "2024-01-01",
  },
  {
    id: "inst-retail",
    organizationId: "org-1",
    moduleId: "retail",
    licenseId: "lic-retail",
    status: "active",
    config: { enableBarcode: true, taxRate: 8.5 },
    presetId: "general",
    activatedAt: "2024-01-01",
  },
  {
    id: "inst-cafe",
    organizationId: "org-1",
    moduleId: "cafe",
    licenseId: "lic-cafe",
    status: "active",
    config: { tableCount: 12, enableKDS: true },
    presetId: "cafe",
    activatedAt: "2024-01-01",
  },
  {
    id: "inst-finance",
    organizationId: "org-1",
    moduleId: "finance",
    licenseId: "lic-finance",
    status: "active",
    config: {},
    activatedAt: "2024-01-01",
  },
];

// ============================================================
// REDUCER
// ============================================================

const initialState: LicensingState = {
  isLoading: true,
  licenses: [],
  moduleInstances: [],
};

function licensingReducer(
  state: LicensingState,
  action: LicensingAction,
): LicensingState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_LICENSES":
      return { ...state, licenses: action.payload };
    case "SET_MODULE_INSTANCES":
      return { ...state, moduleInstances: action.payload };
    case "TOGGLE_MODULE": {
      const { moduleId, enabled } = action.payload;
      if (enabled) {
        const newInstance: ModuleInstance = {
          id: `inst-${moduleId}-${Date.now()}`,
          organizationId: "org-1",
          moduleId,
          licenseId: `lic-${moduleId}`,
          status: "active",
          config: {},
          activatedAt: new Date().toISOString(),
        };
        return {
          ...state,
          moduleInstances: [...state.moduleInstances, newInstance],
        };
      } else {
        return {
          ...state,
          moduleInstances: state.moduleInstances.filter(
            (m) => m.moduleId !== moduleId,
          ),
        };
      }
    }
    default:
      return state;
  }
}

// ============================================================
// CONTEXT
// ============================================================

interface LicensingContextType {
  state: LicensingState;

  // Module management
  isModuleActive: (moduleId: string) => boolean;
  isModuleLicensed: (moduleId: string) => boolean;
  getModuleLicense: (moduleId: string) => License | undefined;
  getModuleInstance: (moduleId: string) => ModuleInstance | undefined;
  getActiveModules: () => ModuleInstance[];

  // Feature checking
  hasFeature: (moduleId: string, feature: string) => boolean;

  // License limits
  getLimits: (moduleId: string) => LicenseLimits | undefined;

  // Module activation
  toggleModule: (moduleId: string, enabled: boolean) => void;
}

const LicensingContext = createContext<LicensingContextType | undefined>(
  undefined,
);

// ============================================================
// PROVIDER
// ============================================================

export function LicensingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(licensingReducer, initialState);
  const { state: identityState } = useIdentity();

  // Load licensing data when authenticated
  useEffect(() => {
    if (identityState.isAuthenticated) {
      // In production, this would be an API call
      dispatch({ type: "SET_LICENSES", payload: mockLicenses });
      dispatch({ type: "SET_MODULE_INSTANCES", payload: mockModuleInstances });
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [identityState.isAuthenticated]);

  const isModuleActive = useCallback(
    (moduleId: string): boolean => {
      return state.moduleInstances.some(
        (m) => m.moduleId === moduleId && m.status === "active",
      );
    },
    [state.moduleInstances],
  );

  const isModuleLicensed = useCallback(
    (moduleId: string): boolean => {
      const license = state.licenses.find((l) => l.moduleId === moduleId);
      return license ? license.status === "active" : false;
    },
    [state.licenses],
  );

  const getModuleLicense = useCallback(
    (moduleId: string): License | undefined => {
      return state.licenses.find((l) => l.moduleId === moduleId);
    },
    [state.licenses],
  );

  const getModuleInstance = useCallback(
    (moduleId: string): ModuleInstance | undefined => {
      return state.moduleInstances.find((m) => m.moduleId === moduleId);
    },
    [state.moduleInstances],
  );

  const getActiveModules = useCallback((): ModuleInstance[] => {
    return state.moduleInstances.filter((m) => m.status === "active");
  }, [state.moduleInstances]);

  const hasFeature = useCallback(
    (moduleId: string, feature: string): boolean => {
      const license = state.licenses.find((l) => l.moduleId === moduleId);
      if (!license || license.status !== "active") return false;
      return (
        license.features.includes("*") || license.features.includes(feature)
      );
    },
    [state.licenses],
  );

  const getLimits = useCallback(
    (moduleId: string): LicenseLimits | undefined => {
      const license = state.licenses.find((l) => l.moduleId === moduleId);
      return license?.limits;
    },
    [state.licenses],
  );

  const toggleModule = useCallback(
    (moduleId: string, enabled: boolean): void => {
      dispatch({ type: "TOGGLE_MODULE", payload: { moduleId, enabled } });
    },
    [],
  );

  return (
    <LicensingContext.Provider
      value={{
        state,
        isModuleActive,
        isModuleLicensed,
        getModuleLicense,
        getModuleInstance,
        getActiveModules,
        hasFeature,
        getLimits,
        toggleModule,
      }}
    >
      {children}
    </LicensingContext.Provider>
  );
}

export function useLicensing() {
  const context = useContext(LicensingContext);
  if (!context) {
    throw new Error("useLicensing must be used within a LicensingProvider");
  }
  return context;
}
