import { useTaskActivity } from '../../hooks/useTasks';
import { SkeletonRow } from '../ui/Skeleton';
import { StatusBadge } from '../ui/Badge';
import Avatar from '../ui/Avatar';
import { formatRelative } from '../../lib/utils';
import { ArrowRight } from '@phosphor-icons/react';

export default function ActivityLog({ taskId }) {
  const { data: activity = [], isLoading } = useTaskActivity(taskId);

  if (isLoading) {
    return (
      <div className="space-y-0.5">
        {[0, 1, 2].map((i) => <SkeletonRow key={i} />)}
      </div>
    );
  }

  if (activity.length === 0) {
    return (
      <p className="text-xs text-brand-silver/60 py-4 text-center">No activity yet</p>
    );
  }

  return (
    <div className="space-y-0.5">
      {activity.map((entry, i) => (
        <div key={i} className="flex items-start gap-2.5 py-2">
          <Avatar name={entry.userId} size="xs" className="mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-brand-silver/85 font-medium">{entry.userId}</span>
              <span className="text-xs text-brand-silver/60">moved</span>
              <StatusBadge status={entry.oldStatus} />
              <ArrowRight size={10} className="text-brand-silver/60" />
              <StatusBadge status={entry.newStatus} />
            </div>
            <p className="text-[10px] text-brand-silver/60 mt-0.5 font-mono">
              {formatRelative(entry.timestamp)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
