import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Skeleton } from '../ui/Skeleton';
import { useUsers } from '../../hooks/useUsers';

const COLORS = {
  ToDo: 'rgba(188,186,187,0.25)',
  InProgress: '#904e55',
  InReview: '#7a5a6e',
  Done: '#256a69',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-brand-elevated border border-[var(--border-default)] rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-brand-silver/60 mb-1 font-medium">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.fill === 'rgba(188,186,187,0.25)' ? 'rgba(188,186,187,0.5)' : p.fill }}>
          {p.name}: <span className="font-mono font-medium">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

export default function TeamWorkload({ tasks = [], isLoading }) {
  const { data: users = [] } = useUsers();

  if (isLoading) return <Skeleton className="h-48 w-full rounded-lg" />;

  const workload = users
    .map((u) => {
      const userTasks = tasks.filter((t) => t.assigneeId === u.userId);
      return {
        name: (u.name || u.email || '').split(' ')[0],
        ToDo: userTasks.filter((t) => t.status === 'ToDo').length,
        InProgress: userTasks.filter((t) => t.status === 'InProgress').length,
        InReview: userTasks.filter((t) => t.status === 'InReview').length,
        Done: userTasks.filter((t) => t.status === 'Done').length,
      };
    })
    .filter((u) => u.ToDo + u.InProgress + u.InReview + u.Done > 0);

  if (workload.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center">
        <p className="text-xs text-brand-silver/25">No assigned tasks</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={workload} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
        <XAxis
          type="number"
          tick={{ fill: 'rgba(188,186,187,0.25)', fontSize: 10, fontFamily: 'DM Mono' }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fill: 'rgba(188,186,187,0.45)', fontSize: 11, fontFamily: 'DM Sans' }}
          axisLine={false}
          tickLine={false}
          width={60}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(188,186,187,0.04)' }} />
        {['ToDo', 'InProgress', 'InReview', 'Done'].map((key) => (
          <Bar key={key} dataKey={key} stackId="a" fill={COLORS[key]} radius={key === 'Done' ? [0, 3, 3, 0] : 0} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
