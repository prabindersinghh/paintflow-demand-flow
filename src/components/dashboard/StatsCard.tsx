import { type ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: ReactNode;
  variant?: 'default' | 'accent' | 'warning' | 'destructive';
}

export function StatsCard({ title, value, change, changeLabel, icon, variant = 'default' }: StatsCardProps) {
  const variantStyles = {
    default: 'border-border',
    accent: 'border-accent/30 stat-glow',
    warning: 'border-warning/30',
    destructive: 'border-destructive/30',
  };

  return (
    <div className={`rounded-lg border bg-card p-5 ${variantStyles[variant]} transition-all hover:shadow-md`}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-card-foreground animate-count-up">{value}</p>
          {change !== undefined && (
            <div className="flex items-center gap-1">
              {change > 0 ? (
                <TrendingUp className="h-3 w-3 text-success" />
              ) : change < 0 ? (
                <TrendingDown className="h-3 w-3 text-destructive" />
              ) : (
                <Minus className="h-3 w-3 text-muted-foreground" />
              )}
              <span className={`text-xs font-medium ${
                change > 0 ? 'text-success' : change < 0 ? 'text-destructive' : 'text-muted-foreground'
              }`}>
                {change > 0 ? '+' : ''}{change}%
              </span>
              {changeLabel && (
                <span className="text-xs text-muted-foreground">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
        <div className="rounded-lg bg-muted p-2.5">
          {icon}
        </div>
      </div>
    </div>
  );
}
