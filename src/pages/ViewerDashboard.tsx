import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { DemandChart } from '@/components/dashboard/DemandChart';
import { InventoryTable } from '@/components/dashboard/InventoryTable';
import { AlertsPanel } from '@/components/dashboard/AlertsPanel';
import { RecommendationsPanel } from '@/components/dashboard/RecommendationsPanel';
import { RegionalDemandMap } from '@/components/dashboard/RegionalDemandMap';
import { SKUVelocityChart } from '@/components/dashboard/SKUVelocityChart';
import { ActivityTimeline } from '@/components/dashboard/ActivityTimeline';
import { PlanningReport } from '@/components/dashboard/PlanningReport';
import { ProjectedInventoryChart } from '@/components/dashboard/ProjectedInventoryChart';
import { useRealData } from '@/hooks/useRealData';
import { useAutoSeed } from '@/hooks/useAutoSeed';
import { Eye, Package, AlertTriangle, Target, TrendingUp, Sparkles, RefreshCw } from 'lucide-react';

export default function ViewerDashboard() {
  const {
    products, inventory, alerts, recommendations, historicalSales, regionalDemand, skuVelocity, stats,
    activityLog, plannedActions, projections, loading, refresh,
  } = useRealData();

  useAutoSeed(refresh);

  if (loading) {
    return (
      <DashboardLayout role="viewer" userName="Demo Viewer">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-6 w-6 animate-spin text-accent" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="viewer" userName="Demo Viewer">
      {/* Demo Banner */}
      <div className="mb-6 flex items-center gap-3 rounded-lg border-2 border-accent/30 bg-accent/5 px-5 py-3">
        <Eye className="h-5 w-5 text-accent" />
        <div>
          <p className="text-sm font-semibold text-card-foreground">Judge Demo Mode</p>
          <p className="text-xs text-muted-foreground">
            Read-only view of PaintFlow.ai system intelligence. All data is persisted in the database.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
        <StatsCard title="Network Inventory" value={`${(stats.totalLitres / 1000).toFixed(1)}K L`} icon={<Package className="h-4 w-4 text-muted-foreground" />} />
        <StatsCard title="Stockout Risk" value={`${stats.stockoutRiskScore}%`} icon={<AlertTriangle className="h-4 w-4 text-muted-foreground" />} variant={stats.stockoutRiskScore > 20 ? 'destructive' : 'default'} />
        <StatsCard title="Active Alerts" value={stats.activeAlerts} icon={<Target className="h-4 w-4 text-muted-foreground" />} />
        <StatsCard title="Active SKUs" value={stats.totalSKUs} icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />} />
        <StatsCard title="Pending Recs" value={recommendations.filter(r => r.status === 'pending').length} icon={<Sparkles className="h-4 w-4 text-muted-foreground" />} variant="accent" />
        <StatsCard title="Executed" value={recommendations.filter(r => r.status === 'executed').length} icon={<Sparkles className="h-4 w-4 text-muted-foreground" />} />
      </div>

      {/* Projected Inventory */}
      <div className="mb-6">
        <ProjectedInventoryChart inventory={inventory} projections={projections} products={products} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <DemandChart data={historicalSales} />
        <RegionalDemandMap data={regionalDemand} />
      </div>

      {/* Planning Report + Recommendations + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <RecommendationsPanel recommendations={recommendations} readOnly />
        <PlanningReport projections={projections} plannedActions={plannedActions} />
        <AlertsPanel alerts={alerts} />
      </div>

      {/* Inventory + Velocity + Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          <InventoryTable inventory={inventory} compact />
        </div>
        <div className="space-y-4">
          <SKUVelocityChart data={skuVelocity} />
          <ActivityTimeline entries={activityLog} compact />
        </div>
      </div>
    </DashboardLayout>
  );
}
