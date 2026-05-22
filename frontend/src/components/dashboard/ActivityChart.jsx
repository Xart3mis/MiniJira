import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { Skeleton } from '../ui/Skeleton';

function bucketByDay(tasks, days = 14) {
  const map = {};
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    map[key] = { date: key, created: 0, completed: 0 };
  }
  tasks.forEach((t) => {
    const createdKey = new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (map[createdKey]) map[createdKey].created++;
    if (t.status === 'Done' && t.updatedAt) {
      const doneKey = new Date(t.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (map[doneKey]) map[doneKey].completed++;
    }
  });
  return Object.values(map);
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-brand-elevated border border-[var(--border-default)] rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-brand-silver/50 mb-1.5 font-mono">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <span className="font-mono font-medium">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

export default function ActivityChart({ tasks = [], isLoading }) {
  if (isLoading) return <Skeleton className="h-48 w-full rounded-lg" />;

  const data = bucketByDay(tasks, 14);
  const hasData = data.some((d) => d.created > 0 || d.completed > 0);

  if (!hasData) {
    return (
      <div className="h-48 flex items-center justify-center">
        <p className="text-xs text-brand-silver/25">No task activity yet</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: -20 }}>
        <defs>
          <linearGradient id="rose-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#904e55" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#904e55" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="teal-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#256a69" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#256a69" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="rgba(188,186,187,0.06)"
          vertical={false}
        />
        <XAxis
          dataKey="date"
          tick={{ fill: 'rgba(188,186,187,0.3)', fontSize: 10, fontFamily: 'DM Mono' }}
          axisLine={false}
          tickLine={false}
          interval={2}
        />
        <YAxis
          tick={{ fill: 'rgba(188,186,187,0.25)', fontSize: 10, fontFamily: 'DM Mono' }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(188,186,187,0.08)' }} />
        <Area
          type="monotone"
          dataKey="created"
          stroke="#904e55"
          strokeWidth={1.5}
          fill="url(#rose-grad)"
          dot={false}
          activeDot={{ r: 4, fill: '#904e55', strokeWidth: 0 }}
        />
        <Area
          type="monotone"
          dataKey="completed"
          stroke="#256a69"
          strokeWidth={1.5}
          fill="url(#teal-grad)"
          dot={false}
          activeDot={{ r: 4, fill: '#256a69', strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
