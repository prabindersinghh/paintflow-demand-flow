import { RegionalDemandMap } from '@/components/dashboard/RegionalDemandMap';
import { DemandChart } from '@/components/dashboard/DemandChart';
import { SKUVelocityChart } from '@/components/dashboard/SKUVelocityChart';
import { useRealData } from '@/hooks/useRealData';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { toLitres } from '@/lib/packaging';

export default function AnalyticsPage() {
  const { regionalDemand, historicalSales, skuVelocity, projections, products, recommendations } = useRealData();

  // Regional performance from forecasts/recommendations — not transactions
  const regionStats = regionalDemand.map(r => {
    const regionProjections = projections.filter(p => p.warehouses?.region === r.region);
    const atRisk = regionProjections.filter(p => p.products && p.projected_quantity < p.products.min_stock * 0.5).length;
    const regionRecs = recommendations.filter(rec => rec.to_location?.includes(r.region) || rec.from_location?.includes(r.region));
    return { ...r, atRisk, recCount: regionRecs.length };
  });

  // Top movers from recommendations
  const topProducts = products.slice(0, 10).map(p => {
    const recs = recommendations.filter(r => r.product_id === p.id);
    const totalPlanned = recs.reduce((s, r) => s + toLitres(r.quantity, p), 0);
    return { ...p, recCount: recs.length, totalPlanned };
  }).sort((a, b) => b.recCount - a.recCount);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">Regional Performance Analytics</h2>
        <p className="text-xs text-muted-foreground">
          Metrics derived from forecast and recommendation data • Decision intelligence view
        </p>
      </div>

      {/* Regional Summary Table */}
      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border px-5 py-3">
          <h3 className="text-sm font-semibold text-card-foreground">Region Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">Region</th>
                <th className="px-4 py-2.5 text-right font-semibold text-muted-foreground">7-Day Demand</th>
                <th className="px-4 py-2.5 text-right font-semibold text-muted-foreground">Growth</th>
                <th className="px-4 py-2.5 text-right font-semibold text-muted-foreground">At-Risk SKUs</th>
                <th className="px-4 py-2.5 text-right font-semibold text-muted-foreground">Planned Actions</th>
              </tr>
            </thead>
            <tbody>
              {regionStats.map(r => (
                <tr key={r.region} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-2.5 font-medium text-card-foreground">{r.region}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-card-foreground">{r.demand.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right">
                    <span className={`flex items-center justify-end gap-1 font-semibold ${r.growth > 0 ? 'text-success' : 'text-destructive'}`}>
                      {r.growth > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {r.growth > 0 ? '+' : ''}{r.growth}%
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span className={`font-semibold ${r.atRisk > 0 ? 'text-destructive' : 'text-success'}`}>
                      {r.atRisk}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right text-muted-foreground">{r.recCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RegionalDemandMap data={regionalDemand} />
        <SKUVelocityChart data={skuVelocity} />
      </div>

      <DemandChart data={historicalSales} title="Historical Demand Trend" />

      {/* Top Products by Recommendation Activity */}
      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border px-5 py-3">
          <h3 className="text-sm font-semibold text-card-foreground">Top Products by Planning Activity</h3>
          <p className="text-[10px] text-muted-foreground">Ranked by number of AI recommendations generated</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">SKU</th>
                <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">Product</th>
                <th className="px-4 py-2.5 text-right font-semibold text-muted-foreground">Recommendations</th>
                <th className="px-4 py-2.5 text-right font-semibold text-muted-foreground">Total Planned (L)</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.filter(p => p.recCount > 0).map(p => (
                <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-2.5 font-mono text-muted-foreground">{p.sku}</td>
                  <td className="px-4 py-2.5 font-medium text-card-foreground">{p.name}</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-accent">{p.recCount}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-card-foreground">{p.totalPlanned.toLocaleString()}L</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
