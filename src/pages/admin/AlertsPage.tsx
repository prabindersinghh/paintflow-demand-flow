import { AlertsPanel } from '@/components/dashboard/AlertsPanel';
import { useRealData } from '@/hooks/useRealData';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

export default function AlertsPage() {
  const { alerts, projections } = useRealData();

  const critical = alerts.filter(a => a.severity === 'critical');
  const warnings = alerts.filter(a => a.severity === 'warning');
  const info = alerts.filter(a => a.severity === 'info');

  // Projected risk events from projections
  const projectedRisks = projections.filter(p =>
    p.products && p.projected_quantity < p.products.min_stock * 0.5
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">Predicted Risk Events</h2>
        <p className="text-xs text-muted-foreground">
          AI-generated alerts from forecast and projection analysis • Advisory view
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <div>
            <p className="text-2xl font-bold text-destructive">{critical.length}</p>
            <p className="text-[10px] text-muted-foreground">Critical Alerts</p>
          </div>
        </div>
        <div className="rounded-lg border border-warning/20 bg-warning/5 p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-warning" />
          <div>
            <p className="text-2xl font-bold text-warning">{warnings.length}</p>
            <p className="text-[10px] text-muted-foreground">Warnings</p>
          </div>
        </div>
        <div className="rounded-lg border border-info/20 bg-info/5 p-4 flex items-center gap-3">
          <Info className="h-5 w-5 text-info" />
          <div>
            <p className="text-2xl font-bold text-info">{info.length}</p>
            <p className="text-[10px] text-muted-foreground">Informational</p>
          </div>
        </div>
      </div>

      {/* Projected Risk Events */}
      {projectedRisks.length > 0 && (
        <div className="rounded-lg border border-destructive/20 bg-card">
          <div className="border-b border-border px-5 py-3">
            <h3 className="text-sm font-semibold text-card-foreground">Projected Stockout Events</h3>
            <p className="text-[10px] text-muted-foreground">Based on inventory projections, not executed transactions</p>
          </div>
          <div className="divide-y divide-border/50 max-h-[300px] overflow-y-auto">
            {projectedRisks.slice(0, 15).map((p, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-2.5 text-xs">
                <div>
                  <span className="font-medium text-card-foreground">{p.products?.name || '—'}</span>
                  <span className="text-muted-foreground ml-2">at {p.warehouses?.name || '—'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-destructive">{p.projected_quantity} units</span>
                  <span className="text-[10px] text-muted-foreground">
                    by {new Date(p.projected_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full alerts list */}
      <AlertsPanel alerts={alerts} />
    </div>
  );
}
