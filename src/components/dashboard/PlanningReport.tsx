import { AlertTriangle, TrendingUp, ArrowRightLeft, ShoppingCart, Package, DollarSign, Calendar, Shield } from 'lucide-react';
import type { InventoryProjection, PlannedAction, Product } from '@/lib/types';
import { toLitres } from '@/lib/packaging';

interface PlanningReportProps {
  projections: InventoryProjection[];
  plannedActions: PlannedAction[];
  products?: Product[];
}

export function PlanningReport({ projections, plannedActions, products }: PlanningReportProps) {
  // Section 1: Predicted Risks
  const now = Date.now();
  const sevenDays = now + 7 * 86400000;
  const thirtyDays = now + 30 * 86400000;

  const stockoutRisks7d = projections.filter(p =>
    p.products && new Date(p.projected_date).getTime() <= sevenDays && p.projected_quantity < p.products.min_stock * 0.5
  );
  const overstockRisks30d = projections.filter(p =>
    p.products && new Date(p.projected_date).getTime() <= thirtyDays && p.projected_quantity > p.products.min_stock * 4
  );

  // Section 2: Transfer Plan
  const transfers = plannedActions.filter(a => a.action_type === 'transfer');

  // Section 3: Reorder Plan
  const reorders = plannedActions.filter(a => a.action_type === 'reorder');

  // Section 4: Financial Impact
  const stockoutPreventedValue = stockoutRisks7d.reduce((sum, p) => {
    const prod = p.products;
    if (!prod) return sum;
    const deficit = Math.max(0, prod.min_stock - p.projected_quantity);
    return sum + deficit * prod.unit_price;
  }, 0);

  const holdingCostReduced = overstockRisks30d.reduce((sum, p) => {
    const prod = p.products;
    if (!prod) return sum;
    const excess = p.projected_quantity - prod.min_stock * 2;
    // Estimated holding cost ~2% of value per month
    return sum + Math.max(0, excess) * prod.unit_price * 0.02;
  }, 0);

  const sections = [
    {
      id: 'risks',
      title: 'Predicted Risks',
      icon: AlertTriangle,
      color: 'text-destructive',
      bg: 'bg-destructive/10',
      content: (
        <div className="space-y-3">
          <div>
            <p className="text-[11px] font-semibold text-destructive mb-1.5">
              ⚠ SKUs at Stockout Risk (7 days) — {stockoutRisks7d.length}
            </p>
            {stockoutRisks7d.length === 0 ? (
              <p className="text-[10px] text-muted-foreground pl-3">No stockout risks detected</p>
            ) : (
              <div className="space-y-1 pl-3">
                {stockoutRisks7d.slice(0, 6).map((p, i) => {
                  const prod = p.products!;
                  const litres = toLitres(p.projected_quantity, prod);
                  return (
                    <div key={i} className="flex items-center justify-between text-[11px]">
                      <div>
                        <span className="font-medium text-card-foreground">{prod.name}</span>
                        <span className="text-muted-foreground ml-1.5">at {p.warehouses?.name || '—'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-destructive">{litres.toLocaleString()}L left</span>
                        <span className="text-[9px] text-muted-foreground">
                          by {new Date(p.projected_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div>
            <p className="text-[11px] font-semibold text-warning mb-1.5">
              📦 SKUs at Overstock Risk (30 days) — {overstockRisks30d.length}
            </p>
            {overstockRisks30d.length === 0 ? (
              <p className="text-[10px] text-muted-foreground pl-3">No overstock risks detected</p>
            ) : (
              <div className="space-y-1 pl-3">
                {overstockRisks30d.slice(0, 4).map((p, i) => {
                  const prod = p.products!;
                  const litres = toLitres(p.projected_quantity, prod);
                  return (
                    <div key={i} className="flex items-center justify-between text-[11px]">
                      <span className="font-medium text-card-foreground">{prod.name}</span>
                      <span className="font-mono text-warning">{litres.toLocaleString()}L projected</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'transfers',
      title: 'Transfer Plan',
      icon: ArrowRightLeft,
      color: 'text-accent',
      bg: 'bg-accent/10',
      content: transfers.length === 0 ? (
        <p className="text-[10px] text-muted-foreground pl-3">No transfers recommended</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-border/50">
                <th className="pb-1.5 text-left font-semibold text-muted-foreground">Product</th>
                <th className="pb-1.5 text-left font-semibold text-muted-foreground">Route</th>
                <th className="pb-1.5 text-right font-semibold text-muted-foreground">Qty</th>
                <th className="pb-1.5 text-center font-semibold text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {transfers.slice(0, 8).map(t => {
                const prod = t.products;
                const litres = prod ? toLitres(t.quantity, prod) : t.quantity;
                return (
                  <tr key={t.id} className="border-b border-border/30">
                    <td className="py-1.5 font-medium text-card-foreground">{prod?.name || '—'}</td>
                    <td className="py-1.5 text-muted-foreground">
                      {t.from_location} → {t.to_location}
                    </td>
                    <td className="py-1.5 text-right font-mono text-card-foreground">{litres.toLocaleString()}L</td>
                    <td className="py-1.5 text-center">
                      <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${
                        t.status === 'approved' ? 'bg-success/10 text-success' :
                        t.status === 'pending' ? 'bg-warning/10 text-warning' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ),
    },
    {
      id: 'reorders',
      title: 'Reorder Plan',
      icon: ShoppingCart,
      color: 'text-info',
      bg: 'bg-info/10',
      content: reorders.length === 0 ? (
        <p className="text-[10px] text-muted-foreground pl-3">No reorders recommended</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-border/50">
                <th className="pb-1.5 text-left font-semibold text-muted-foreground">Product</th>
                <th className="pb-1.5 text-right font-semibold text-muted-foreground">Qty</th>
                <th className="pb-1.5 text-left font-semibold text-muted-foreground">Destination</th>
                <th className="pb-1.5 text-left font-semibold text-muted-foreground">Order By</th>
              </tr>
            </thead>
            <tbody>
              {reorders.slice(0, 8).map(r => {
                const prod = r.products;
                const litres = prod ? toLitres(r.quantity, prod) : r.quantity;
                const orderBy = r.planned_execution_date
                  ? new Date(r.planned_execution_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : 'ASAP';
                return (
                  <tr key={r.id} className="border-b border-border/30">
                    <td className="py-1.5 font-medium text-card-foreground">{prod?.name || '—'}</td>
                    <td className="py-1.5 text-right font-mono text-card-foreground">{litres.toLocaleString()}L</td>
                    <td className="py-1.5 text-muted-foreground">{r.to_location}</td>
                    <td className="py-1.5 text-muted-foreground">{orderBy}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ),
    },
    {
      id: 'financial',
      title: 'Financial Impact',
      icon: DollarSign,
      color: 'text-chart-5',
      bg: 'bg-chart-5/10',
      content: (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-success/20 bg-success/5 p-3">
            <p className="text-[10px] text-muted-foreground mb-1">Stockout Loss Prevented</p>
            <p className="text-lg font-bold text-success">
              ₹{(stockoutPreventedValue / 1000).toFixed(1)}K
            </p>
            <p className="text-[9px] text-muted-foreground mt-0.5">
              {stockoutRisks7d.length} SKUs at risk
            </p>
          </div>
          <div className="rounded-lg border border-accent/20 bg-accent/5 p-3">
            <p className="text-[10px] text-muted-foreground mb-1">Holding Cost Reduced</p>
            <p className="text-lg font-bold text-accent">
              ₹{(holdingCostReduced / 1000).toFixed(1)}K
            </p>
            <p className="text-[9px] text-muted-foreground mt-0.5">
              {overstockRisks30d.length} SKUs overstocked
            </p>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-5 py-3 flex items-center gap-2">
        <Shield className="h-4 w-4 text-accent" />
        <div>
          <h3 className="text-sm font-semibold text-card-foreground">AI Planning Report</h3>
          <p className="text-[10px] text-muted-foreground">
            Advisory intelligence • No inventory modified
          </p>
        </div>
        <span className="ml-auto rounded-full bg-accent/10 px-2.5 py-0.5 text-[10px] font-semibold text-accent">
          Decision Support
        </span>
      </div>
      <div className="divide-y divide-border/50 max-h-[600px] overflow-y-auto">
        {sections.map(section => {
          const Icon = section.icon;
          return (
            <div key={section.id} className="px-5 py-4">
              <div className="flex items-center gap-2 mb-3">
                <div className={`rounded-md ${section.bg} p-1.5`}>
                  <Icon className={`h-3.5 w-3.5 ${section.color}`} />
                </div>
                <span className="text-xs font-bold text-card-foreground">{section.title}</span>
              </div>
              {section.content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
