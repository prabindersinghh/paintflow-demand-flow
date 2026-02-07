import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { DemandChart } from '@/components/dashboard/DemandChart';
import { InventoryTable } from '@/components/dashboard/InventoryTable';
import { AlertsPanel } from '@/components/dashboard/AlertsPanel';
import { RecommendationsPanel } from '@/components/dashboard/RecommendationsPanel';
import { RegionalDemandMap } from '@/components/dashboard/RegionalDemandMap';
import { SKUVelocityChart } from '@/components/dashboard/SKUVelocityChart';
import { ActivityTimeline } from '@/components/dashboard/ActivityTimeline';
import { useRealData } from '@/hooks/useRealData';
import { useAuth } from '@/hooks/useAuth';
import { Package, AlertTriangle, Target, TrendingUp, Sparkles, DollarSign, RefreshCw, Play } from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const {
    inventory, alerts, recommendations, historicalSales, regionalDemand, skuVelocity, stats,
    activityLog, loading,
    approveRecommendation, rejectRecommendation, runForecast, runRecommendations, evaluateAlerts, refresh,
  } = useRealData();

  const handleRunAll = async () => {
    await runForecast(user?.name);
    await runRecommendations(user?.name);
    await evaluateAlerts();
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
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={handleRunAll}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition-colors shadow-sm"
        >
          <Play className="h-4 w-4" />
          Run Forecast & Recommendations
        </button>
        <button
          onClick={refresh}
          className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-card-foreground hover:bg-muted transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
        <StatsCard
          title="Network Inventory"
          value={stats.totalUnits.toLocaleString()}
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
          onApprove={(id) => approveRecommendation(id, user?.name)}
          onReject={(id) => rejectRecommendation(id, user?.name)}
        />
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
