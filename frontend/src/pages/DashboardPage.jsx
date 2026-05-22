import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTasks } from '../hooks/useTasks';
import { useMe } from '../hooks/useUsers';
import StatsRow from '../components/dashboard/StatsRow';
import ActivityChart from '../components/dashboard/ActivityChart';
import TeamWorkload from '../components/dashboard/TeamWorkload';
import { StatusBadge, PriorityBadge } from '../components/ui/Badge';
import { SkeletonRow } from '../components/ui/Skeleton';
import useAuthStore from '../store/authStore';
import useUiStore from '../store/uiStore';
import { formatRelative, isOverdue } from '../lib/utils';
import { CalendarBlank, Warning } from '@phosphor-icons/react';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data: me } = useMe();
  const { data: tasks = [], isLoading } = useTasks();
  const openTaskPanel = useUiStore((s) => s.openTaskPanel);
  const isManager = user?.role === 'Manager';

  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
    .slice(0, 8);

  const overdueTasks = tasks.filter(
    (t) => isOverdue(t.deadline) && t.status !== 'Done'
  );

  return (
    <div className="px-6 py-6 max-w-[1200px] mx-auto">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-brand-silver">
          {user?.name ? `Hello, ${user.name.split(' ')[0]}` : 'Dashboard'}
        </h1>
        <p className="text-sm text-brand-silver/35 mt-0.5">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="mb-8 pb-6 border-b border-[var(--border-subtle)]">
        <StatsRow tasks={tasks} isLoading={isLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <section>
            <h2 className="text-xs font-medium text-brand-silver/40 uppercase tracking-widest mb-3">
              Task activity — last 14 days
            </h2>
            <div className="flex gap-4 text-xs text-brand-silver/30 mb-2">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-0.5 rounded bg-brand-rose inline-block" />
                Created
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-0.5 rounded bg-brand-teal inline-block" />
                Completed
              </span>
            </div>
            <ActivityChart tasks={tasks} isLoading={isLoading} />
          </section>

          {isManager && (
            <section>
              <h2 className="text-xs font-medium text-brand-silver/40 uppercase tracking-widest mb-3">
                Team workload
              </h2>
              <TeamWorkload tasks={tasks} isLoading={isLoading} />
            </section>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          {overdueTasks.length > 0 && (
            <section>
              <h2 className="text-xs font-medium text-brand-silver/40 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Warning size={12} className="text-brand-rose" weight="fill" />
                Overdue ({overdueTasks.length})
              </h2>
              <div className="space-y-1">
                {overdueTasks.slice(0, 5).map((task) => (
                  <button
                    key={task.taskId}
                    onClick={() => openTaskPanel(task.taskId)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-brand-elevated transition-colors text-left group"
                  >
                    <CalendarBlank size={13} className="text-brand-rose shrink-0" />
                    <span className="text-sm text-brand-silver/60 truncate flex-1 group-hover:text-brand-silver/80 transition-colors">
                      {task.title}
                    </span>
                    <PriorityBadge priority={task.priority} />
                  </button>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="text-xs font-medium text-brand-silver/40 uppercase tracking-widest mb-3">
              Recent activity
            </h2>
            {isLoading ? (
              <div className="space-y-0.5">
                {[0, 1, 2, 3].map((i) => <SkeletonRow key={i} />)}
              </div>
            ) : recentTasks.length === 0 ? (
              <p className="text-xs text-brand-silver/25 py-4">No tasks yet.</p>
            ) : (
              <div className="space-y-0.5">
                {recentTasks.map((task, i) => (
                  <motion.button
                    key={task.taskId}
                    initial={{ opacity: 0, x: 4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => openTaskPanel(task.taskId)}
                    className="w-full flex items-start gap-2.5 px-3 py-2.5 rounded-lg hover:bg-brand-elevated transition-colors text-left group"
                  >
                    <StatusBadge status={task.status} className="mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-brand-silver/65 truncate group-hover:text-brand-silver/85 transition-colors">
                        {task.title}
                      </p>
                      <p className="text-[10px] text-brand-silver/25 font-mono mt-0.5">
                        {formatRelative(task.updatedAt || task.createdAt)}
                      </p>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
