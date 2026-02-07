import { useDashboard } from './DashboardLayout';
import { Bell, Search, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';

const ROLE_LABELS = {
  admin: 'Company Admin',
  distributor: 'Distributor',
  dealer: 'Dealer',
  viewer: 'Viewer (Demo)',
};

export function TopBar() {
  const { role, userName } = useDashboard();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="flex items-center justify-between border-b border-border bg-card px-6 py-3">
      <div className="flex items-center gap-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">{ROLE_LABELS[role]} Dashboard</h2>
          <p className="text-xs text-muted-foreground">
            Last sync: {time.toLocaleTimeString()}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search SKUs, regions..."
            className="w-48 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
          />
        </div>

        {/* Refresh indicator */}
        <div className="flex items-center gap-1.5 rounded-md bg-success/10 px-2.5 py-1.5">
          <RefreshCw className="h-3 w-3 text-success animate-spin" style={{ animationDuration: '3s' }} />
          <span className="text-[11px] font-medium text-success">Live</span>
        </div>

        {/* Notifications */}
        <button className="relative rounded-md p-2 hover:bg-muted transition-colors">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
            5
          </span>
        </button>

        {/* User */}
        <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-1.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {userName.split(' ').map(n => n[0]).join('')}
          </div>
          <span className="text-xs font-medium text-foreground">{userName}</span>
        </div>
      </div>
    </header>
  );
}
