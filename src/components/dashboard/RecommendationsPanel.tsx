import { Sparkles, Check, X, ArrowRight } from 'lucide-react';
import { PRODUCTS, type Recommendation } from '@/lib/mock-data';

interface RecommendationsPanelProps {
  recommendations: Recommendation[];
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  readOnly?: boolean;
  compact?: boolean;
}

export function RecommendationsPanel({ recommendations, onApprove, onReject, readOnly, compact }: RecommendationsPanelProps) {
  const display = compact ? recommendations.slice(0, 4) : recommendations;

  const priorityStyles = {
    high: 'bg-destructive/10 text-destructive',
    medium: 'bg-warning/10 text-warning',
    low: 'bg-info/10 text-info',
  };

  const statusStyles = {
    pending: 'bg-warning/10 text-warning',
    approved: 'bg-success/10 text-success',
    rejected: 'bg-destructive/10 text-destructive',
  };

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-semibold text-card-foreground">AI Recommendations</h3>
        </div>
        <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-[10px] font-semibold text-accent">
          {recommendations.filter(r => r.status === 'pending').length} Pending
        </span>
      </div>
      <div className="divide-y divide-border/50">
        {display.map(rec => {
          const product = PRODUCTS.find(p => p.id === rec.productId);
          return (
            <div key={rec.id} className="px-5 py-3 hover:bg-muted/30 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${priorityStyles[rec.priority]}`}>
                      {rec.priority.toUpperCase()}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusStyles[rec.status]}`}>
                      {rec.status}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Confidence: {rec.aiConfidence}%
                    </span>
                  </div>
                  <p className="text-xs font-medium text-card-foreground">
                    {rec.type === 'transfer' ? 'Transfer' : rec.type === 'reorder' ? 'Reorder' : 'Order'}{' '}
                    <span className="font-mono text-accent">{product?.name || rec.productId}</span>
                  </p>
                  {rec.from && (
                    <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                      {rec.from} <ArrowRight className="h-2.5 w-2.5" /> {rec.to}
                    </p>
                  )}
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Qty: <span className="font-semibold text-card-foreground">{rec.quantity}</span> — {rec.reason}
                  </p>
                </div>
                {!readOnly && rec.status === 'pending' && (
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => onApprove?.(rec.id)}
                      className="rounded-md bg-success/10 p-1.5 text-success hover:bg-success/20 transition-colors"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onReject?.(rec.id)}
                      className="rounded-md bg-destructive/10 p-1.5 text-destructive hover:bg-destructive/20 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
