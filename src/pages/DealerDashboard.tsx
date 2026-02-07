import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { DemandChart } from '@/components/dashboard/DemandChart';
import { AlertsPanel } from '@/components/dashboard/AlertsPanel';
import { useLiveData } from '@/hooks/useLiveData';
import { PRODUCTS } from '@/lib/mock-data';
import { ShoppingCart, TrendingUp, AlertTriangle, Sparkles, Check, Package } from 'lucide-react';
import { toast } from 'sonner';

export default function DealerDashboard() {
  const { alerts, recommendations, historicalSales } = useLiveData();
  const [orderedItems, setOrderedItems] = useState<Set<string>>(new Set());
  const user = JSON.parse(localStorage.getItem('paintflow_user') || '{}');

  const dealerRecs = recommendations.filter(r => r.type === 'order');

  const handleOrder = (recId: string, productName: string) => {
    setOrderedItems(prev => new Set(prev).add(recId));
    toast.success(`Order placed for ${productName}`, {
      description: 'Your smart order has been submitted for fulfillment.',
    });
  };

  return (
    <DashboardLayout role="dealer" userName={user.name || 'Dealer'}>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Recommended Orders"
          value={dealerRecs.length}
          icon={<Sparkles className="h-4 w-4 text-muted-foreground" />}
          variant="accent"
        />
        <StatsCard
          title="Orders Placed"
          value={orderedItems.size}
          icon={<ShoppingCart className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="30-Day Demand"
          value="2,847"
          change={12.3}
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Low Stock SKUs"
          value={3}
          icon={<AlertTriangle className="h-4 w-4 text-muted-foreground" />}
          variant="warning"
        />
      </div>

      {/* Hero: Recommended Orders */}
      <div className="rounded-lg border-2 border-accent/30 bg-card p-5 mb-6 stat-glow">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-accent" />
          <h3 className="text-base font-bold text-card-foreground">Smart Order Recommendations</h3>
          <span className="ml-auto rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
            AI Recommended
          </span>
        </div>
        <div className="space-y-3">
          {dealerRecs.map(rec => {
            const product = PRODUCTS.find(p => p.id === rec.productId);
            const isOrdered = orderedItems.has(rec.id);
            return (
              <div key={rec.id} className="flex items-center gap-4 rounded-lg border border-border bg-muted/30 px-4 py-3">
                <div className="rounded-md bg-primary p-2">
                  <Package className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-card-foreground">{product?.name || rec.productId}</p>
                  <p className="text-xs text-muted-foreground">
                    Qty: <span className="font-bold text-card-foreground">{rec.quantity}</span> • {rec.reason}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      rec.priority === 'high' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'
                    }`}>
                      {rec.priority.toUpperCase()}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      AI Confidence: {rec.aiConfidence}%
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleOrder(rec.id, product?.name || '')}
                  disabled={isOrdered}
                  className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                    isOrdered
                      ? 'bg-success/10 text-success cursor-default'
                      : 'bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm'
                  }`}
                >
                  {isOrdered ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Ordered
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-3.5 w-3.5" />
                      Order Now
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Forecast + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DemandChart data={historicalSales} title="Your 30-Day Demand Forecast" />
        <AlertsPanel alerts={alerts.filter(a => a.severity !== 'info')} />
      </div>
    </DashboardLayout>
  );
}
