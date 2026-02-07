import { Sparkles, ArrowRight, ArrowRightLeft, ShoppingCart, Truck } from 'lucide-react';
import type { Recommendation } from '@/lib/types';
import { formatLitres } from '@/lib/packaging';

interface RecommendationsPanelProps {
  recommendations: Recommendation[];
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  readOnly?: boolean;
  compact?: boolean;
}

const GROUP_CONFIG: Record<string, { label: string; icon: typeof ArrowRightLeft; color: string; bg: string }> = {
  transfer: { label: 'Transfers', icon: ArrowRightLeft, color: 'text-accent', bg: 'bg-accent/10' },
  reorder: { label: 'Reorders', icon: ShoppingCart, color: 'text-info', bg: 'bg-info/10' },
  order: { label: 'Dealer Supply', icon: Truck, color: 'text-chart-5', bg: 'bg-chart-5/10' },
};

const priorityStyles: Record<string, string> = {
  high: 'bg-destructive/10 text-destructive',
  medium: 'bg-warning/10 text-warning',
  low: 'bg-info/10 text-info',
};

export function RecommendationsPanel({ recommendations, compact }: RecommendationsPanelProps) {
  // Get latest plan run: all recommendations from the most recent created_at batch
  const latestRecs = getLatestPlanRecs(recommendations);
  const display = compact ? latestRecs.slice(0, 12) : latestRecs;

  // Group by type
  const groups = new Map<string, typeof display>();
  for (const rec of display) {
    const key = rec.type || 'order';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(rec);
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-semibold text-card-foreground">Planned Actions</h3>
        </div>
        <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-[10px] font-semibold text-accent">
          {latestRecs.length} suggestions
        </span>
      </div>
      <div className="max-h-[600px] overflow-y-auto">
        {latestRecs.length === 0 ? (
          <div className="px-5 py-8 text-center text-xs text-muted-foreground">
            No recommendations. Run the planning engine to generate suggestions.
          </div>
        ) : (
          Array.from(groups.entries()).map(([type, recs]) => {
            const config = GROUP_CONFIG[type] || GROUP_CONFIG.order;
            const Icon = config.icon;
            return (
              <div key={type}>
                <div className={`flex items-center gap-2 px-5 py-2 ${config.bg} border-b border-border/50`}>
                  <Icon className={`h-3.5 w-3.5 ${config.color}`} />
                  <span className={`text-xs font-bold ${config.color}`}>{config.label}</span>
                  <span className="ml-auto text-[10px] text-muted-foreground">{recs.length} items</span>
                </div>
                <div className="divide-y divide-border/30">
                  {recs.map(rec => {
                    const product = rec.products;
                    const litres = formatLitres(rec.quantity, product);
                    return (
                      <div key={rec.id} className="px-5 py-3 hover:bg-muted/30 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${priorityStyles[rec.priority] || ''}`}>
                                {rec.priority.toUpperCase()}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                Confidence: {rec.ai_confidence}%
                              </span>
                            </div>
                            <p className="text-xs font-medium text-card-foreground">
                              <span className="font-mono text-accent">{product?.name || rec.product_id}</span>
                            </p>
                            {rec.from_location && (
                              <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                                {rec.from_location} <ArrowRight className="h-2.5 w-2.5" /> {rec.to_location}
                              </p>
                            )}
                            {!rec.from_location && rec.to_location && (
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                → {rec.to_location}
                              </p>
                            )}
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              Qty: <span className="font-semibold text-card-foreground">{litres}</span>
                              {rec.reason && <> — {rec.reason}</>}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/** Get recommendations from the latest plan run (same created_at minute batch) */
function getLatestPlanRecs(recs: Recommendation[]): Recommendation[] {
  if (recs.length === 0) return [];
  // Find the latest created_at timestamp
  const latest = recs.reduce((max, r) => r.created_at > max ? r.created_at : max, recs[0].created_at);
  const latestTime = new Date(latest).getTime();
  // Include all recs within 2 minutes of the latest (same batch)
  const threshold = 2 * 60 * 1000;
  return recs.filter(r => latestTime - new Date(r.created_at).getTime() <= threshold);
}
