import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/contexts/AppContext";

// Layouts
import { CoreLayout } from "@/layouts/CoreLayout";
import { POSLayout } from "@/layouts/POSLayout";

// Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Core Pages
import CoreDashboard from "./pages/core/Dashboard";
import Operations from "./pages/core/Operations";
import Staff from "./pages/core/Staff";
import Modules from "./pages/core/Modules";
import Reports from "./pages/core/Reports";
import Integrations from "./pages/core/Integrations";
import Settings from "./pages/core/Settings";
import Finance from "./pages/core/Finance";
import HR from "./pages/core/HR";
import InventoryModule from "./pages/core/InventoryModule";
import Admin from "./pages/core/Admin";
import Purchasing from "./pages/core/Purchasing";
import Security from "./pages/core/Security";

// POS Cafe Pages
import CafeTables from "./pages/pos-cafe/Tables";
import CafeKitchen from "./pages/pos-cafe/Kitchen";
import CafeCashier from "./pages/pos-cafe/Cashier";
import CafeInventory from "./pages/pos-cafe/Inventory";
import CafeHistory from "./pages/pos-cafe/History";
import CafeSettings from "./pages/pos-cafe/Settings";

// POS Retail Pages
import RetailCashier from "./pages/pos-retail/Cashier";
import RetailSales from "./pages/pos-retail/Sales";
import RetailInventory from "./pages/pos-retail/Inventory";
import RetailShifts from "./pages/pos-retail/Shifts";
import RetailHistory from "./pages/pos-retail/History";
import RetailSettings from "./pages/pos-retail/Settings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Landing / Login */}
            <Route path="/" element={<Index />} />

            {/* Core System */}
            <Route path="/core" element={<CoreLayout />}>
              <Route index element={<CoreDashboard />} />
              <Route path="operations" element={<Operations />} />
              <Route path="staff" element={<Staff />} />
              <Route path="modules" element={<Modules />} />
              <Route path="reports" element={<Reports />} />
              <Route path="integrations" element={<Integrations />} />
              <Route path="settings" element={<Settings />} />
              {/* Core Modules */}
              <Route path="finance" element={<Finance />} />
              <Route path="hr" element={<HR />} />
              <Route path="inventory" element={<InventoryModule />} />
              <Route path="admin" element={<Admin />} />
              <Route path="purchasing" element={<Purchasing />} />
              <Route path="security" element={<Security />} />
            </Route>

            {/* POS Retail */}
            <Route path="/pos-retail" element={<POSLayout variant="retail" />}>
              <Route index element={<RetailCashier />} />
              <Route path="sales" element={<RetailSales />} />
              <Route path="inventory" element={<RetailInventory />} />
              <Route path="shifts" element={<RetailShifts />} />
              <Route path="history" element={<RetailHistory />} />
              <Route path="settings" element={<RetailSettings />} />
            </Route>

            {/* POS Cafe */}
            <Route path="/pos-cafe" element={<POSLayout variant="cafe" />}>
              <Route index element={<CafeCashier />} />
              <Route path="tables" element={<CafeTables />} />
              <Route path="kitchen" element={<CafeKitchen />} />
              <Route path="inventory" element={<CafeInventory />} />
              <Route path="history" element={<CafeHistory />} />
              <Route path="settings" element={<CafeSettings />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AppProvider>
  </QueryClientProvider>
);

export default App;
