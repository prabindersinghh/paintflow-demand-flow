import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import type { InventoryProjection, InventoryItem, Product } from '@/lib/types';

interface ProjectedInventoryChartProps {
  inventory: InventoryItem[];
  projections: InventoryProjection[];
  products: Product[];
}

export function ProjectedInventoryChart({ inventory, projections, products }: ProjectedInventoryChartProps) {
  // Aggregate by product: current stock, 7-day projected, 30-day projected
  const productMap = new Map<string, { name: string; current: number; day7: number; day30: number; min: number }>();

  for (const p of products.slice(0, 10)) {
    productMap.set(p.id, { name: p.name.length > 18 ? p.name.slice(0, 16) + '…' : p.name, current: 0, day7: 0, day30: 0, min: p.min_stock });
  }

  // Sum current inventory per product
  for (const item of inventory) {
    const entry = productMap.get(item.product_id);
    if (entry) entry.current += item.quantity;
  }

  // Sum projections per product per date
  for (const proj of projections) {
    const entry = productMap.get(proj.product_id);
    if (!entry) continue;
    // Determine if 7-day or 30-day based on date proximity
    const daysOut = Math.round((new Date(proj.projected_date).getTime() - Date.now()) / 86400000);
    if (daysOut <= 10) {
      entry.day7 += proj.projected_quantity;
    } else {
      entry.day30 += proj.projected_quantity;
    }
  }

  const chartData = Array.from(productMap.values()).map(v => ({
    name: v.name,
    'Current Stock': v.current,
    '7-Day Projected': v.day7,
    '30-Day Projected': v.day30,
    'Min Stock': v.min,
  }));

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-card-foreground">Projected Inventory</h3>
        <div className="flex gap-2">
          <span className="rounded-full bg-chart-2/10 px-2 py-0.5 text-[10px] font-semibold text-chart-2">Current</span>
          <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent">7-Day</span>
          <span className="rounded-full bg-chart-4/10 px-2 py-0.5 text-[10px] font-semibold text-chart-4">30-Day</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 20%, 90%)" />
          <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'hsl(215, 12%, 50%)' }} angle={-30} textAnchor="end" height={60} />
          <YAxis tick={{ fontSize: 10, fill: 'hsl(215, 12%, 50%)' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(0, 0%, 100%)',
              border: '1px solid hsl(215, 20%, 90%)',
              borderRadius: '8px',
              fontSize: '11px',
            }}
          />
          <Legend wrapperStyle={{ fontSize: '10px' }} />
          <Bar dataKey="Current Stock" fill="hsl(215, 55%, 35%)" radius={[2, 2, 0, 0]} />
          <Bar dataKey="7-Day Projected" fill="hsl(174, 62%, 38%)" radius={[2, 2, 0, 0]} />
          <Bar dataKey="30-Day Projected" fill="hsl(280, 55%, 55%)" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
