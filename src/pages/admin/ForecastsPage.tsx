import { DemandChart } from '@/components/dashboard/DemandChart';
import { RegionalDemandMap } from '@/components/dashboard/RegionalDemandMap';
import { SKUVelocityChart } from '@/components/dashboard/SKUVelocityChart';
import { ProjectedInventoryChart } from '@/components/dashboard/ProjectedInventoryChart';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { useRealData } from '@/hooks/useRealData';
import { BarChart3 } from 'lucide-react';

export default function ForecastsPage() {
  const { historicalSales, regionalDemand, skuVelocity, products, inventory, projections } = useRealData();

  const hasForecasts = historicalSales.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">Demand Predictions</h2>
        <p className="text-xs text-muted-foreground">
          AI-generated forecasts from historical sales data • Read-only analytical view
        </p>
      </div>

      {!hasForecasts ? (
        <div className="rounded-lg border border-border bg-card">
          <EmptyState
            title="No forecast data"
            message="Run the Planning Engine from the Overview to generate demand predictions."
            icon={<BarChart3 className="h-6 w-6 text-accent" />}
          />
        </div>
      ) : (
        <>
          <DemandChart data={historicalSales} title="30-Day Demand: Actual vs AI Predicted" />
          <ProjectedInventoryChart inventory={inventory} projections={projections} products={products} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <RegionalDemandMap data={regionalDemand} />
            <SKUVelocityChart data={skuVelocity} />
          </div>
        </>
      )}
    </div>
  );
}
