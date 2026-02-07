import { useRealData } from '@/hooks/useRealData';
import { ArrowRightLeft, Check, Clock, X } from 'lucide-react';
import { toLitres } from '@/lib/packaging';

export default function TransfersPage() {
  const { plannedActions, recommendations } = useRealData();

  // Read from planned_actions and recommendations — NOT from executed transactions
  const transfers = plannedActions.filter(a => a.action_type === 'transfer');
  const reorders = plannedActions.filter(a => a.action_type === 'reorder');
  const recTransfers = recommendations.filter(r => r.type === 'transfer');

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-warning/10 text-warning',
      approved: 'bg-success/10 text-success',
      executed: 'bg-accent/10 text-accent',
      rejected: 'bg-destructive/10 text-destructive',
    };
    return (
      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${styles[status] || 'bg-muted text-muted-foreground'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">Recommended Logistics Movements</h2>
        <p className="text-xs text-muted-foreground">
          AI-recommended transfers and reorders from planning engine • Advisory view
        </p>
      </div>

      {/* Transfer Plan */}
      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border px-5 py-3">
          <ArrowRightLeft className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-semibold text-card-foreground">Inter-Warehouse Transfers</h3>
          <span className="ml-auto rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent">
            {transfers.length} planned
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">Product</th>
                <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">From</th>
                <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">To</th>
                <th className="px-4 py-2.5 text-right font-semibold text-muted-foreground">Quantity</th>
                <th className="px-4 py-2.5 text-center font-semibold text-muted-foreground">Status</th>
                <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody>
              {transfers.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No transfers planned</td></tr>
              ) : transfers.map(t => {
                const prod = t.products;
                const litres = prod ? toLitres(t.quantity, prod) : t.quantity;
                return (
                  <tr key={t.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2.5 font-medium text-card-foreground">{prod?.name || '—'}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{t.from_location || '—'}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{t.to_location}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-card-foreground">{litres.toLocaleString()}L</td>
                    <td className="px-4 py-2.5 text-center">{statusBadge(t.status)}</td>
                    <td className="px-4 py-2.5 text-muted-foreground text-[11px]">
                      {t.planned_execution_date
                        ? new Date(t.planned_execution_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reorder Plan */}
      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border px-5 py-3">
          <ArrowRightLeft className="h-4 w-4 text-info" />
          <h3 className="text-sm font-semibold text-card-foreground">Reorder Recommendations</h3>
          <span className="ml-auto rounded-full bg-info/10 px-2 py-0.5 text-[10px] font-semibold text-info">
            {reorders.length} planned
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">Product</th>
                <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">Destination</th>
                <th className="px-4 py-2.5 text-right font-semibold text-muted-foreground">Quantity</th>
                <th className="px-4 py-2.5 text-center font-semibold text-muted-foreground">Status</th>
                <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">Order By</th>
              </tr>
            </thead>
            <tbody>
              {reorders.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No reorders planned</td></tr>
              ) : reorders.map(r => {
                const prod = r.products;
                const litres = prod ? toLitres(r.quantity, prod) : r.quantity;
                return (
                  <tr key={r.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2.5 font-medium text-card-foreground">{prod?.name || '—'}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{r.to_location}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-card-foreground">{litres.toLocaleString()}L</td>
                    <td className="px-4 py-2.5 text-center">{statusBadge(r.status)}</td>
                    <td className="px-4 py-2.5 text-muted-foreground text-[11px]">
                      {r.planned_execution_date
                        ? new Date(r.planned_execution_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        : 'ASAP'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
