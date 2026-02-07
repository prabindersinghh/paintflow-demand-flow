import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { DemandChart } from '@/components/dashboard/DemandChart';
import { InventoryTable } from '@/components/dashboard/InventoryTable';
import { AlertsPanel } from '@/components/dashboard/AlertsPanel';
import { RecommendationsPanel } from '@/components/dashboard/RecommendationsPanel';
import { useRealData } from '@/hooks/useRealData';
import { useAuth } from '@/hooks/useAuth';
import { Warehouse, Package, Truck, AlertTriangle, RefreshCw } from 'lucide-react';

export default function DistributorDashboard() {
  const { user } = useAuth();
  const {
    inventory, alerts, recommendations, historicalSales, stats, loading,
    approveRecommendation, rejectRecommendation, refresh,
  } = useRealData();

  const transferRecs = recommendations.filter(r => r.type === 'transfer' || r.type === 'reorder');

  if (loading) {
    return (
      <DashboardLayout role="distributor" userName={user?.name || 'Distributor'}>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-6 w-6 animate-spin text-accent" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="distributor" userName={user?.name || 'Distributor'}>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Warehouse Stock"
          value={stats.totalUnits.toLocaleString()}
          icon={<Warehouse className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Low Stock Items"
          value={stats.lowStockCount}
          icon={<Package className="h-4 w-4 text-muted-foreground" />}
          variant={stats.lowStockCount > 5 ? 'warning' : 'default'}
        />
        <StatsCard
          title="Pending Transfers"
          value={transferRecs.filter(r => r.status === 'pending').length}
          icon={<Truck className="h-4 w-4 text-muted-foreground" />}
          variant="accent"
        />
        <StatsCard
          title="Active Alerts"
          value={alerts.length}
          icon={<AlertTriangle className="h-4 w-4 text-muted-foreground" />}
          variant={alerts.filter(a => a.severity === 'critical').length > 0 ? 'destructive' : 'default'}
        />
      </div>

      <div className="mb-6">
        <DemandChart data={historicalSales} title="Regional Demand Trend" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <RecommendationsPanel
          recommendations={transferRecs}
          onApprove={(id) => approveRecommendation(id, user?.name)}
          onReject={(id) => rejectRecommendation(id, user?.name)}
        />
        <AlertsPanel alerts={alerts} />
      </div>

      <InventoryTable inventory={inventory} />
    </DashboardLayout>
  );
}
