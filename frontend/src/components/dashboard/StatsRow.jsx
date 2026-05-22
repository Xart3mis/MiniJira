import { cn } from '../../lib/utils';
import { Skeleton } from '../ui/Skeleton';

function Stat({ label, value, sub, accent }) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <span
        className={cn(
          'text-2xl font-semibold tabular-nums tracking-tight',
          accent === 'rose' && 'text-brand-rose',
          accent === 'teal' && 'text-brand-teal',
          !accent && 'text-brand-silver'
        )}
      >
        {value}
      </span>
      <span className="text-xs text-brand-silver/45 leading-none">{label}</span>
      {sub && <span className="text-[10px] text-brand-silver/25 font-mono mt-0.5">{sub}</span>}
    </div>
  );
}

export default function StatsRow({ tasks = [], isLoading }) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-8 py-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-6 w-10" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
    );
  }

  const total = tasks.length;
  const open = tasks.filter((t) => t.status !== 'Done').length;
  const inProgress = tasks.filter((t) => t.status === 'InProgress').length;
  const done = tasks.filter((t) => t.status === 'Done').length;
  const overdue = tasks.filter(
    (t) => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'Done'
  ).length;
  const dueToday = tasks.filter((t) => {
    if (!t.deadline || t.status === 'Done') return false;
    const d = new Date(t.deadline);
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  }).length;

  const stats = [
    { label: 'total tasks', value: total },
    { label: 'open', value: open },
    { label: 'in progress', value: inProgress, accent: 'rose' },
    { label: 'completed', value: done, accent: 'teal' },
    ...(overdue > 0 ? [{ label: 'overdue', value: overdue, accent: 'rose' }] : []),
    ...(dueToday > 0 ? [{ label: 'due today', value: dueToday }] : []),
  ];

  return (
    <div className="flex items-center gap-8 overflow-x-auto pb-1">
      {stats.map((s, i) => (
        <div key={i} className="flex items-center gap-8">
          <Stat {...s} />
          {i < stats.length - 1 && (
            <div className="h-8 w-px bg-[var(--border-subtle)]" />
          )}
        </div>
      ))}
    </div>
  );
}
