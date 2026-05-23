import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTasks } from '../hooks/useTasks';
import { StatusBadge, PriorityBadge } from '../components/ui/Badge';
import { SkeletonRow } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { Select } from '../components/ui/Select';
import useAuthStore from '../store/authStore';
import useUiStore from '../store/uiStore';
import { formatDate, isOverdue, cn } from '../lib/utils';
import { ListChecks, CalendarBlank, Plus } from '@phosphor-icons/react';
import Button from '../components/ui/Button';
import { STATUSES, STATUS_LABELS } from '../lib/constants';

export default function MyTasksPage() {
  const { user } = useAuthStore();
  const openTaskPanel = useUiStore((s) => s.openTaskPanel);
  const openCreateTask = useUiStore((s) => s.openCreateTask);
  const [statusFilter, setStatusFilter] = useState('');

  const isManager = user?.role === 'Manager';

  // Managers see all tasks (they can't be assigned tasks themselves).
  // Employees see only tasks assigned to them.
  const { data: allTasks = [], isLoading } = useTasks(
    isManager ? {} : (user?.userId ? { assigneeId: user.userId } : {})
  );

  const tasks = statusFilter
    ? allTasks.filter((t) => t.status === statusFilter)
    : allTasks;

  const grouped = STATUSES.reduce((acc, s) => {
    acc[s] = tasks.filter((t) => t.status === s);
    return acc;
  }, {});

  return (
    <div className="px-6 py-6 max-w-[900px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-brand-silver">My Tasks</h1>
          <p className="text-sm text-brand-silver/35 mt-0.5">{allTasks.length} assigned{isManager ? "" : " to You"}</p>
        </div>
        <div className="flex items-center gap-2">
          {isManager && (
            <Button
              variant="primary"
              size="sm"
              iconLeft={<Plus size={14} />}
              onClick={openCreateTask}
            >
              New task
            </Button>
          )}
          <div className="w-40">
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
            placeholder="All statuses"
            options={[
              { value: '', label: 'All statuses' },
              ...STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] })),
            ]}
          />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-1">
          {[0, 1, 2, 3, 4].map((i) => <SkeletonRow key={i} />)}
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="No tasks assigned to you"
          description="Tasks assigned to you will appear here"
        />
      ) : (
        <div className="space-y-6">
          {STATUSES.filter((s) => grouped[s].length > 0).map((status) => (
            <section key={status}>
              <div className="flex items-center gap-2 mb-2">
                <StatusBadge status={status} />
                <span className="text-xs font-mono text-brand-silver/25">{grouped[status].length}</span>
              </div>
              <div className="space-y-0.5">
                {grouped[status].map((task, i) => (
                  <motion.button
                    key={task.taskId}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => openTaskPanel(task.taskId)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-brand-elevated transition-colors text-left group"
                  >
                    <PriorityBadge priority={task.priority} />
                    <span className="flex-1 text-sm text-brand-silver/65 truncate group-hover:text-brand-silver/85 transition-colors">
                      {task.title}
                    </span>
                    {task.deadline && (
                      <span
                        className={cn(
                          'flex items-center gap-1 text-[10px] font-mono shrink-0',
                          isOverdue(task.deadline) ? 'text-brand-rose' : 'text-brand-silver/25'
                        )}
                      >
                        <CalendarBlank size={10} />
                        {formatDate(task.deadline)}
                      </span>
                    )}
                  </motion.button>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
