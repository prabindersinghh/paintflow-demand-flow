import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { DemandChart } from '@/components/dashboard/DemandChart';
import { InventoryTable } from '@/components/dashboard/InventoryTable';
import { AlertsPanel } from '@/components/dashboard/AlertsPanel';
import { RecommendationsPanel } from '@/components/dashboard/RecommendationsPanel';
import { RegionalDemandMap } from '@/components/dashboard/RegionalDemandMap';
import { SKUVelocityChart } from '@/components/dashboard/SKUVelocityChart';
import { useLiveData } from '@/hooks/useLiveData';
import { Package, AlertTriangle, Target, TrendingUp, Sparkles, DollarSign } from 'lucide-react';

export default function AdminDashboard() {
  const {
    inventory, alerts, recommendations, historicalSales, regionalDemand, skuVelocity, stats,
    approveRecommendation, rejectRecommendation,
  } = useLiveData();

  const user = JSON.parse(localStorage.getItem('paintflow_user') || '{}');

  return (
    <DashboardLayout role="admin" userName={user.name || 'Admin'}>
      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
        <StatsCard
          title="Network Inventory"
          value={stats.totalUnits.toLocaleString()}
          change={3.2}
          changeLabel="vs last week"
          icon={<Package className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Inventory Value"
          value={`₹${(stats.totalValue / 100000).toFixed(1)}L`}
          change={5.1}
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Stockout Risk"
          value={`${stats.stockoutRiskScore}%`}
          change={-2.4}
          icon={<AlertTriangle className="h-4 w-4 text-muted-foreground" />}
          variant={stats.stockoutRiskScore > 20 ? 'destructive' : 'default'}
        />
        <StatsCard
          title="Forecast Accuracy"
          value={`${stats.forecastAccuracy}%`}
          change={1.8}
          icon={<Target className="h-4 w-4 text-muted-foreground" />}
          variant="accent"
        />
        <StatsCard
          title="Active SKUs"
          value={stats.totalSKUs}
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="AI Suggestions"
          value={recommendations.filter(r => r.status === 'pending').length}
          icon={<Sparkles className="h-4 w-4 text-muted-foreground" />}
          variant="accent"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <DemandChart data={historicalSales} />
        <RegionalDemandMap data={regionalDemand} />
      </div>

      {/* Recommendations + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <RecommendationsPanel
          recommendations={recommendations}
          onApprove={approveRecommendation}
          onReject={rejectRecommendation}
        />
        <AlertsPanel alerts={alerts} />
      </div>

      {/* Inventory + SKU Velocity */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          <InventoryTable inventory={inventory} compact />
        </div>
        <SKUVelocityChart data={skuVelocity} />
      </div>
    </DashboardLayout>
  );
}
