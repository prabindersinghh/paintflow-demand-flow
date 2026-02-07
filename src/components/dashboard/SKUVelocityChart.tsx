import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface SKUVelocityChartProps {
  data: { sku: string; name: string; velocity: number; trend: 'up' | 'down' | 'stable' }[];
}

export function SKUVelocityChart({ data }: SKUVelocityChartProps) {
  const TrendIcon = { up: TrendingUp, down: TrendingDown, stable: Minus };
  const trendColor = { up: 'text-success', down: 'text-destructive', stable: 'text-muted-foreground' };

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h3 className="text-sm font-semibold text-card-foreground mb-4">SKU Velocity Index</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 20%, 90%)" />
          <XAxis dataKey="sku" tick={{ fontSize: 8, fill: 'hsl(215, 12%, 50%)' }} angle={-45} textAnchor="end" height={50} />
          <YAxis tick={{ fontSize: 10, fill: 'hsl(215, 12%, 50%)' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(0, 0%, 100%)',
              border: '1px solid hsl(215, 20%, 90%)',
              borderRadius: '8px',
              fontSize: '11px',
            }}
          />
          <Bar dataKey="velocity" fill="hsl(174, 62%, 38%)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {data.slice(0, 4).map(item => {
          const Icon = TrendIcon[item.trend];
          return (
            <div key={item.sku} className="flex items-center gap-2 text-[11px]">
              <Icon className={`h-3 w-3 ${trendColor[item.trend]}`} />
              <span className="font-mono text-muted-foreground">{item.sku}</span>
              <span className="font-medium text-card-foreground">{item.velocity}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
