import { AlertTriangle, TrendingUp, ArrowRightLeft, ShoppingCart, Package } from 'lucide-react';
import type { InventoryProjection, PlannedAction } from '@/lib/types';

interface PlanningReportProps {
  projections: InventoryProjection[];
  plannedActions: PlannedAction[];
}

export function PlanningReport({ projections, plannedActions }: PlanningReportProps) {
  const stockoutRisks = projections.filter(p => 
    p.products && p.projected_quantity < p.products.min_stock * 0.5
  );
  const overstockRisks = projections.filter(p => 
    p.products && p.projected_quantity > p.products.min_stock * 4
  );
  const transfers = plannedActions.filter(a => a.action_type === 'transfer');
  const reorders = plannedActions.filter(a => a.action_type === 'reorder');
  const orders = plannedActions.filter(a => a.action_type === 'order');

  const sections = [
    {
      title: 'Projected Stockout Risks',
      icon: AlertTriangle,
      color: 'text-destructive',
      bg: 'bg-destructive/10',
      items: stockoutRisks.slice(0, 6).map(p => ({
        label: p.products?.name || 'Unknown',
        detail: `${p.projected_quantity} units by ${new Date(p.projected_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${p.warehouses?.name || 'warehouse'}`,
        severity: p.projected_quantity <= 0 ? 'critical' : 'warning',
      })),
      count: stockoutRisks.length,
    },
    {
      title: 'Projected Overstock Risks',
      icon: Package,
      color: 'text-warning',
      bg: 'bg-warning/10',
      items: overstockRisks.slice(0, 4).map(p => ({
        label: p.products?.name || 'Unknown',
        detail: `${p.projected_quantity} units projected at ${p.warehouses?.name || 'warehouse'}`,
        severity: 'info' as const,
      })),
      count: overstockRisks.length,
    },
    {
      title: 'Required Transfers',
      icon: ArrowRightLeft,
      color: 'text-accent',
      bg: 'bg-accent/10',
      items: transfers.slice(0, 4).map(a => ({
        label: a.products?.name || 'Product',
        detail: `${a.quantity} units: ${a.from_location} → ${a.to_location}`,
        severity: a.status as string,
      })),
      count: transfers.length,
    },
    {
      title: 'Required Reorders',
      icon: TrendingUp,
      color: 'text-info',
      bg: 'bg-info/10',
      items: reorders.slice(0, 4).map(a => ({
        label: a.products?.name || 'Product',
        detail: `${a.quantity} units to ${a.to_location}`,
        severity: a.status as string,
      })),
      count: reorders.length,
    },
    {
      title: 'Dealer Suggested Orders',
      icon: ShoppingCart,
      color: 'text-chart-3',
      bg: 'bg-chart-3/10',
      items: orders.slice(0, 4).map(a => ({
        label: a.products?.name || 'Product',
        detail: `${a.quantity} units for ${a.to_location}`,
        severity: a.status as string,
      })),
      count: orders.length,
    },
  ];

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-5 py-3">
        <h3 className="text-sm font-semibold text-card-foreground">📋 Planning Report</h3>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          AI-generated plan summary • No inventory has been modified
        </p>
      </div>
      <div className="divide-y divide-border/50 max-h-[500px] overflow-y-auto">
        {sections.map(section => {
          const Icon = section.icon;
          return (
            <div key={section.title} className="px-5 py-3">
              <div className="flex items-center gap-2 mb-2">
                <div className={`rounded-md ${section.bg} p-1`}>
                  <Icon className={`h-3.5 w-3.5 ${section.color}`} />
                </div>
                <span className="text-xs font-semibold text-card-foreground">{section.title}</span>
                <span className={`ml-auto rounded-full ${section.bg} px-2 py-0.5 text-[10px] font-bold ${section.color}`}>
                  {section.count}
                </span>
              </div>
              {section.items.length === 0 ? (
                <p className="text-[10px] text-muted-foreground pl-7">None detected</p>
              ) : (
                <div className="space-y-1.5 pl-7">
                  {section.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-medium text-card-foreground">{item.label}</span>
                        <p className="text-[10px] text-muted-foreground">{item.detail}</p>
                      </div>
                      <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${
                        item.severity === 'critical' ? 'bg-destructive/10 text-destructive' :
                        item.severity === 'approved' ? 'bg-success/10 text-success' :
                        item.severity === 'pending' ? 'bg-warning/10 text-warning' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {item.severity}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
