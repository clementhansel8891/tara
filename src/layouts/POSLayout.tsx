import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { AppSwitcher } from '@/components/shared/AppSwitcher';
import { OfflineIndicator } from '@/components/shared/OfflineIndicator';
import { useApp } from '@/contexts/AppContext';
import {
  ShoppingCart,
  LayoutGrid,
  History,
  Settings,
  Moon,
  Sun,
  LogOut,
  User,
  Package,
  Clock,
} from 'lucide-react';

interface POSLayoutProps {
  variant: 'retail' | 'cafe';
}

const retailNavItems = [
  { path: '/pos-retail', icon: ShoppingCart, label: 'Cashier', end: true },
  { path: '/pos-retail/sales', icon: LayoutGrid, label: 'Sales' },
  { path: '/pos-retail/inventory', icon: Package, label: 'Inventory' },
  { path: '/pos-retail/shifts', icon: Clock, label: 'Shifts' },
  { path: '/pos-retail/history', icon: History, label: 'History' },
  { path: '/pos-retail/settings', icon: Settings, label: 'Settings' },
];

const cafeNavItems = [
  { path: '/pos-cafe', icon: ShoppingCart, label: 'Cashier', end: true },
  { path: '/pos-cafe/tables', icon: LayoutGrid, label: 'Tables' },
  { path: '/pos-cafe/kitchen', icon: User, label: 'Kitchen' },
  { path: '/pos-cafe/inventory', icon: Package, label: 'Inventory' },
  { path: '/pos-cafe/history', icon: History, label: 'History' },
  { path: '/pos-cafe/settings', icon: Settings, label: 'Settings' },
];

export function POSLayout({ variant }: POSLayoutProps) {
  const { state, logout, toggleTheme } = useApp();
  const navItems = variant === 'retail' ? retailNavItems : cafeNavItems;

  return (
    <div className="flex flex-col h-screen bg-pos-background dark:bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 h-14 bg-card border-b shrink-0">
        <div className="flex items-center gap-3">
          <AppSwitcher />
          <OfflineIndicator showText size="sm" />
        </div>

        <div className="flex items-center gap-2">
          {state.currentUser && (
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
              <User size={16} />
              <span>{state.currentUser.name}</span>
            </div>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-muted-foreground"
          >
            {state.theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            className="text-muted-foreground"
          >
            <LogOut size={18} />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>

      {/* Bottom Navigation - Tablet/Mobile Friendly */}
      <nav className="flex items-center justify-around bg-card border-t h-16 shrink-0">
        {navItems.map(({ path, icon: Icon, label, end }) => (
          <NavLink
            key={path}
            to={path}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-colors touch-target',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )
            }
          >
            <Icon size={22} />
            <span className="text-xs font-medium">{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
