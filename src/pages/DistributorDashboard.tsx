import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { DemandChart } from '@/components/dashboard/DemandChart';
import { InventoryTable } from '@/components/dashboard/InventoryTable';
import { AlertsPanel } from '@/components/dashboard/AlertsPanel';
import { RecommendationsPanel } from '@/components/dashboard/RecommendationsPanel';
import { useLiveData } from '@/hooks/useLiveData';
import { Warehouse, Package, Truck, AlertTriangle } from 'lucide-react';

export default function DistributorDashboard() {
  const {
    inventory, alerts, recommendations, historicalSales, stats,
    approveRecommendation, rejectRecommendation,
  } = useLiveData();

  const user = JSON.parse(localStorage.getItem('paintflow_user') || '{}');
  const transferRecs = recommendations.filter(r => r.type === 'transfer' || r.type === 'reorder');

  return (
    <DashboardLayout role="distributor" userName={user.name || 'Distributor'}>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Warehouse Stock"
          value={stats.totalUnits.toLocaleString()}
          change={-1.5}
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

      {/* Regional Demand Chart */}
      <div className="mb-6">
        <DemandChart data={historicalSales} title="Regional Demand Trend" />
      </div>

      {/* Transfer Recs + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <RecommendationsPanel
          recommendations={transferRecs}
          onApprove={approveRecommendation}
          onReject={rejectRecommendation}
        />
        <AlertsPanel alerts={alerts} />
      </div>

      {/* Warehouse Inventory */}
      <InventoryTable inventory={inventory} warehouseFilter="WH-002" />
    </DashboardLayout>
  );
}
