import { Clock, User, ArrowRightLeft, Sparkles, Bell, ShoppingCart } from 'lucide-react';
import type { ActivityLogEntry } from '@/lib/types';

interface ActivityTimelineProps {
  entries: ActivityLogEntry[];
  compact?: boolean;
}

const ACTION_CONFIG: Record<string, { icon: typeof Clock; label: string; color: string }> = {
  transfer_executed: { icon: ArrowRightLeft, label: 'Transfer Executed', color: 'text-success' },
  reorder_executed: { icon: ArrowRightLeft, label: 'Reorder Executed', color: 'text-accent' },
  order_placed: { icon: ShoppingCart, label: 'Order Placed', color: 'text-info' },
  forecast_run: { icon: Sparkles, label: 'Forecast Run', color: 'text-accent' },
  recommendations_generated: { icon: Sparkles, label: 'Recommendations Generated', color: 'text-accent' },
  alerts_evaluated: { icon: Bell, label: 'Alerts Evaluated', color: 'text-warning' },
  recommendation_rejected: { icon: ArrowRightLeft, label: 'Recommendation Rejected', color: 'text-destructive' },
};

export function ActivityTimeline({ entries, compact }: ActivityTimelineProps) {
  const display = compact ? entries.slice(0, 8) : entries;

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <h3 className="text-sm font-semibold text-card-foreground">Activity Log</h3>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          {entries.length} entries
        </span>
      </div>
      <div className="divide-y divide-border/50 max-h-[400px] overflow-y-auto">
        {display.length === 0 ? (
          <div className="px-5 py-8 text-center text-xs text-muted-foreground">
            No activity yet. Run the forecast engine to get started.
          </div>
        ) : (
          display.map(entry => {
            const config = ACTION_CONFIG[entry.action] || { icon: Clock, label: entry.action, color: 'text-muted-foreground' };
            const Icon = config.icon;
            return (
              <div key={entry.id} className="flex gap-3 px-5 py-3 hover:bg-muted/30 transition-colors">
                <div className="mt-0.5 rounded-md bg-muted p-1.5">
                  <Icon className={`h-3.5 w-3.5 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-card-foreground">{config.label}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <User className="h-2.5 w-2.5 text-muted-foreground" />
                    <span className="text-[11px] text-muted-foreground">{entry.user_name || 'System'}</span>
                  </div>
                  {entry.details && Object.keys(entry.details).length > 0 && (
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {Object.entries(entry.details).map(([k, v]) => `${k}: ${v}`).join(' • ')}
                    </p>
                  )}
                  <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Clock className="h-2.5 w-2.5" />
                    {new Date(entry.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
