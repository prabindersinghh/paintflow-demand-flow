import { useDashboard } from './DashboardLayout';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard,
  Package,
  TrendingUp,
  Bell,
  Settings,
  Truck,
  ShoppingCart,
  BarChart3,
  Warehouse,
  ChevronLeft,
  Droplets,
  LogOut,
} from 'lucide-react';

const NAV_ITEMS = {
  admin: [
    { icon: LayoutDashboard, label: 'Overview', path: '/admin' },
    { icon: Package, label: 'Inventory', path: '/admin/inventory' },
    { icon: TrendingUp, label: 'Forecasts', path: '/admin/forecasts' },
    { icon: Truck, label: 'Transfers', path: '/admin/transfers' },
    { icon: BarChart3, label: 'Analytics', path: '/admin/analytics' },
    { icon: Bell, label: 'Alerts', path: '/admin/alerts' },
  ],
  distributor: [
    { icon: LayoutDashboard, label: 'Overview', path: '/distributor' },
    { icon: Warehouse, label: 'Warehouse', path: '/distributor/warehouse' },
    { icon: Truck, label: 'Transfers', path: '/distributor/transfers' },
    { icon: Bell, label: 'Alerts', path: '/distributor/alerts' },
  ],
  dealer: [
    { icon: LayoutDashboard, label: 'Overview', path: '/dealer' },
    { icon: ShoppingCart, label: 'Orders', path: '/dealer/orders' },
    { icon: TrendingUp, label: 'Forecasts', path: '/dealer/forecasts' },
    { icon: Bell, label: 'Alerts', path: '/dealer/alerts' },
  ],
  viewer: [
    { icon: LayoutDashboard, label: 'Overview', path: '/viewer' },
    { icon: BarChart3, label: 'Analytics', path: '/viewer/analytics' },
  ],
};

export function Sidebar() {
  const { role, sidebarOpen, setSidebarOpen } = useDashboard();
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const items = NAV_ITEMS[role];

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <aside
      className={`sidebar-gradient flex flex-col transition-all duration-300 ${
        sidebarOpen ? 'w-60' : 'w-16'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
          <Droplets className="h-4 w-4 text-accent-foreground" />
        </div>
        {sidebarOpen && (
          <div className="flex flex-col">
            <span className="text-sm font-bold text-sidebar-primary-foreground tracking-tight">
              PaintFlow
            </span>
            <span className="text-[10px] text-sidebar-primary font-medium">.ai</span>
          </div>
        )}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="ml-auto text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
        >
          <ChevronLeft className={`h-4 w-4 transition-transform ${!sidebarOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-1 px-2">
        {items.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-sidebar-accent text-sidebar-primary'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
              }`}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3 space-y-1">
        <button
          onClick={() => navigate('/login')}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
        >
          <Settings className="h-4 w-4" />
          {sidebarOpen && <span>Switch Role</span>}
        </button>
        {user && (
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
            {sidebarOpen && <span>Sign Out</span>}
          </button>
        )}
      </div>
    </aside>
  );
}
