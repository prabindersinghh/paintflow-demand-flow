import { AlertTriangle, AlertCircle, Info, Clock } from 'lucide-react';
import type { Alert } from '@/lib/mock-data';

interface AlertsPanelProps {
  alerts: Alert[];
  compact?: boolean;
}

const ALERT_CONFIG = {
  critical: { icon: AlertTriangle, bg: 'bg-destructive/10', text: 'text-destructive', border: 'border-destructive/20' },
  warning: { icon: AlertCircle, bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/20' },
  info: { icon: Info, bg: 'bg-info/10', text: 'text-info', border: 'border-info/20' },
};

export function AlertsPanel({ alerts, compact }: AlertsPanelProps) {
  const displayAlerts = compact ? alerts.slice(0, 4) : alerts;

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <h3 className="text-sm font-semibold text-card-foreground">Active Alerts</h3>
        <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive">
          {alerts.filter(a => a.severity === 'critical').length} Critical
        </span>
      </div>
      <div className="divide-y divide-border/50">
        {displayAlerts.map(alert => {
          const config = ALERT_CONFIG[alert.severity];
          const Icon = config.icon;
          return (
            <div key={alert.id} className={`flex gap-3 px-5 py-3 ${config.bg}/30 hover:${config.bg} transition-colors`}>
              <div className={`mt-0.5 rounded-md ${config.bg} p-1.5`}>
                <Icon className={`h-3.5 w-3.5 ${config.text}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold text-card-foreground">{alert.title}</p>
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
                    {alert.region}
                  </span>
                </div>
                {!compact && (
                  <p className="mt-0.5 text-[11px] text-muted-foreground leading-relaxed">
                    {alert.description}
                  </p>
                )}
                <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Clock className="h-2.5 w-2.5" />
                  {alert.timestamp.toLocaleString()}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
