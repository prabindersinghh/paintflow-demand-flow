import type { Region } from '@/lib/types';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface RegionalDemandProps {
  data: { region: string; demand: number; growth: number }[];
}

const REGION_COLORS: Record<string, string> = {
  North: 'bg-chart-1',
  South: 'bg-chart-2',
  East: 'bg-chart-3',
  West: 'bg-chart-4',
  Central: 'bg-chart-5',
};

export function RegionalDemandMap({ data }: RegionalDemandProps) {
  const maxDemand = Math.max(...data.map(d => d.demand), 1);

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h3 className="text-sm font-semibold text-card-foreground mb-4">Regional Demand Heatmap</h3>
      <div className="grid grid-cols-1 gap-3">
        {data.map(({ region, demand, growth }) => (
          <div key={region} className="flex items-center gap-3">
            <div className="w-16 text-xs font-medium text-muted-foreground">{region}</div>
            <div className="flex-1 h-8 rounded-md bg-muted overflow-hidden relative">
              <div
                className={`h-full ${REGION_COLORS[region] || 'bg-chart-1'} opacity-80 rounded-md transition-all duration-700`}
                style={{ width: `${(demand / maxDemand) * 100}%` }}
              />
              <span className="absolute inset-0 flex items-center px-3 text-[11px] font-semibold text-card-foreground">
                {demand.toLocaleString()} units
              </span>
            </div>
            <div className="flex items-center gap-1 w-16">
              {growth > 0 ? (
                <TrendingUp className="h-3 w-3 text-success" />
              ) : (
                <TrendingDown className="h-3 w-3 text-destructive" />
              )}
              <span className={`text-[11px] font-semibold ${growth > 0 ? 'text-success' : 'text-destructive'}`}>
                {growth > 0 ? '+' : ''}{growth}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
