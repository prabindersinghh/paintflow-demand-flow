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
import { useAuth } from '@/hooks/useAuth';
import { useAutoSeed } from '@/hooks/useAutoSeed';
import { Package, AlertTriangle, Target, TrendingUp, Sparkles, DollarSign, RefreshCw, Play, Zap, ClipboardCheck, Calendar } from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const {
    products, inventory, alerts, recommendations, historicalSales, regionalDemand, skuVelocity, stats,
    activityLog, plannedActions, projections, loading,
    approveRecommendation, rejectRecommendation, runForecast, runRecommendations, evaluateAlerts, executePlan, refresh,
  } = useRealData();

  useAutoSeed(refresh);

  const handleRunAll = async () => {
    await runForecast(user?.name);
    await runRecommendations(user?.name);
    await evaluateAlerts();
  };

  const handleExecutePlan = async () => {
    if (stats.approvedPlans === 0) {
      const { toast } = await import('sonner');
      toast.error('No approved plans to execute. Approve recommendations first.');
      return;
    }
    await executePlan(user?.name);
  };

  if (loading) {
    return (
      <DashboardLayout role="admin" userName={user?.name || 'Admin'}>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-6 w-6 animate-spin text-accent" />
          <span className="ml-2 text-sm text-muted-foreground">Loading data...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin" userName={user?.name || 'Admin'}>
      {/* Action Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <button
          onClick={handleRunAll}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition-colors shadow-sm"
        >
          <Play className="h-4 w-4" />
          Generate Plan
        </button>
        <button
          onClick={handleExecutePlan}
          disabled={stats.approvedPlans === 0}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Zap className="h-4 w-4" />
          Execute Plan ({stats.approvedPlans})
        </button>
        <button
          onClick={refresh}
          className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-card-foreground hover:bg-muted transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
        <div className="ml-auto flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/5 px-3 py-1.5">
          <Calendar className="h-3.5 w-3.5 text-accent" />
          <span className="text-[11px] font-medium text-accent">Planning Mode</span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-6">
        <StatsCard
          title="Current Inventory"
          value={`${(stats.totalLitres / 1000).toFixed(1)}K L`}
          icon={<Package className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Inventory Value"
          value={`₹${(stats.totalValue / 100000).toFixed(1)}L`}
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Stockout Risk"
          value={`${stats.stockoutRiskScore}%`}
          icon={<AlertTriangle className="h-4 w-4 text-muted-foreground" />}
          variant={stats.stockoutRiskScore > 20 ? 'destructive' : 'default'}
        />
        <StatsCard
          title="Active Alerts"
          value={stats.activeAlerts}
          icon={<Target className="h-4 w-4 text-muted-foreground" />}
          variant={stats.activeAlerts > 10 ? 'warning' : 'default'}
        />
        <StatsCard
          title="Pending Plans"
          value={stats.pendingPlans}
          icon={<Sparkles className="h-4 w-4 text-muted-foreground" />}
          variant="accent"
        />
        <StatsCard
          title="Approved Plans"
          value={stats.approvedPlans}
          icon={<ClipboardCheck className="h-4 w-4 text-muted-foreground" />}
          variant={stats.approvedPlans > 0 ? 'accent' : 'default'}
        />
        <StatsCard
          title="Projected Risks"
          value={stats.projectedRisks}
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
          variant={stats.projectedRisks > 5 ? 'destructive' : 'default'}
        />
      </div>

      {/* Projected Inventory Chart */}
      <div className="mb-6">
        <ProjectedInventoryChart inventory={inventory} projections={projections} products={products} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <DemandChart data={historicalSales} />
        <RegionalDemandMap data={regionalDemand} />
      </div>

      {/* Planning Report + Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <RecommendationsPanel
          recommendations={recommendations}
          onApprove={(id) => approveRecommendation(id, user?.name)}
          onReject={(id) => rejectRecommendation(id, user?.name)}
        />
        <PlanningReport projections={projections} plannedActions={plannedActions} />
      </div>

      {/* Alerts */}
      <div className="mb-6">
        <AlertsPanel alerts={alerts} />
      </div>

      {/* Inventory + SKU Velocity + Activity */}
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
