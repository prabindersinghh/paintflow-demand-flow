import { DemandChart } from '@/components/dashboard/DemandChart';
import { RegionalDemandMap } from '@/components/dashboard/RegionalDemandMap';
import { SKUVelocityChart } from '@/components/dashboard/SKUVelocityChart';
import { ProjectedInventoryChart } from '@/components/dashboard/ProjectedInventoryChart';
import { useRealData } from '@/hooks/useRealData';

export default function ForecastsPage() {
  const { historicalSales, regionalDemand, skuVelocity, products, inventory, projections } = useRealData();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">Demand Predictions</h2>
        <p className="text-xs text-muted-foreground">
          AI-generated forecasts from historical sales data • Read-only analytical view
        </p>
      </div>

      {/* Actual vs Predicted */}
      <DemandChart data={historicalSales} title="30-Day Demand: Actual vs AI Predicted" />

      {/* Projected Inventory */}
      <ProjectedInventoryChart inventory={inventory} projections={projections} products={products} />

      {/* Regional + SKU velocity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RegionalDemandMap data={regionalDemand} />
        <SKUVelocityChart data={skuVelocity} />
      </div>
    </div>
  );
}
