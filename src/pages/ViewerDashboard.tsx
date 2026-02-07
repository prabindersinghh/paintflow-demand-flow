import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { DemandChart } from '@/components/dashboard/DemandChart';
import { InventoryTable } from '@/components/dashboard/InventoryTable';
import { AlertsPanel } from '@/components/dashboard/AlertsPanel';
import { RecommendationsPanel } from '@/components/dashboard/RecommendationsPanel';
import { RegionalDemandMap } from '@/components/dashboard/RegionalDemandMap';
import { SKUVelocityChart } from '@/components/dashboard/SKUVelocityChart';
import { useLiveData } from '@/hooks/useLiveData';
import { Eye, Package, AlertTriangle, Target, TrendingUp, Sparkles } from 'lucide-react';

export default function ViewerDashboard() {
  const {
    inventory, alerts, recommendations, historicalSales, regionalDemand, skuVelocity, stats,
  } = useLiveData();

  return (
    <DashboardLayout role="viewer" userName="Demo Viewer">
      {/* Demo Banner */}
      <div className="mb-6 flex items-center gap-3 rounded-lg border-2 border-accent/30 bg-accent/5 px-5 py-3">
        <Eye className="h-5 w-5 text-accent" />
        <div>
          <p className="text-sm font-semibold text-card-foreground">Judge Demo Mode</p>
          <p className="text-xs text-muted-foreground">
            Read-only view of PaintFlow.ai system intelligence. Data updates in real-time.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
        <StatsCard title="Network Inventory" value={stats.totalUnits.toLocaleString()} change={3.2} icon={<Package className="h-4 w-4 text-muted-foreground" />} />
        <StatsCard title="Stockout Risk" value={`${stats.stockoutRiskScore}%`} icon={<AlertTriangle className="h-4 w-4 text-muted-foreground" />} variant={stats.stockoutRiskScore > 20 ? 'destructive' : 'default'} />
        <StatsCard title="Forecast Accuracy" value={`${stats.forecastAccuracy}%`} icon={<Target className="h-4 w-4 text-muted-foreground" />} variant="accent" />
        <StatsCard title="Active SKUs" value={stats.totalSKUs} icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />} />
        <StatsCard title="Active Alerts" value={alerts.length} icon={<AlertTriangle className="h-4 w-4 text-muted-foreground" />} />
        <StatsCard title="AI Suggestions" value={recommendations.filter(r => r.status === 'pending').length} icon={<Sparkles className="h-4 w-4 text-muted-foreground" />} variant="accent" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <DemandChart data={historicalSales} />
        <RegionalDemandMap data={regionalDemand} />
      </div>

      {/* Recommendations + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <RecommendationsPanel recommendations={recommendations} readOnly />
        <AlertsPanel alerts={alerts} />
      </div>

      {/* Inventory + Velocity */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          <InventoryTable inventory={inventory} compact />
        </div>
        <SKUVelocityChart data={skuVelocity} />
      </div>
    </DashboardLayout>
  );
}
