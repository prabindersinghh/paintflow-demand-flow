import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface DemandChartProps {
  data: { date: string; actual: number; predicted: number }[];
  title?: string;
}

export function DemandChart({ data, title = 'Demand: Actual vs AI Predicted' }: DemandChartProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-card-foreground">{title}</h3>
        <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-[10px] font-semibold text-accent">
          AI Powered
        </span>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
          <defs>
            <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(215, 55%, 35%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(215, 55%, 35%)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="predictedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(174, 62%, 38%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(174, 62%, 38%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 20%, 90%)" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(215, 12%, 50%)' }} />
          <YAxis tick={{ fontSize: 10, fill: 'hsl(215, 12%, 50%)' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(0, 0%, 100%)',
              border: '1px solid hsl(215, 20%, 90%)',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          <Legend wrapperStyle={{ fontSize: '11px' }} />
          <Area
            type="monotone"
            dataKey="actual"
            stroke="hsl(215, 55%, 35%)"
            fill="url(#actualGrad)"
            strokeWidth={2}
            name="Actual Sales"
          />
          <Area
            type="monotone"
            dataKey="predicted"
            stroke="hsl(174, 62%, 38%)"
            fill="url(#predictedGrad)"
            strokeWidth={2}
            strokeDasharray="5 5"
            name="AI Predicted"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
