import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from '@phosphor-icons/react';
import { cn } from '../../lib/utils';
import { STATUS_LABELS, STATUS_COLORS } from '../../lib/constants';
import { SkeletonCard } from '../ui/Skeleton';
import EmptyState from '../ui/EmptyState';
import TaskCard from './TaskCard';
import { ListChecks } from '@phosphor-icons/react';
import useAuthStore from '../../store/authStore';
import useUiStore from '../../store/uiStore';

export default function KanbanColumn({ status, tasks = [], isLoading }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const colors = STATUS_COLORS[status];
  const isManager = useAuthStore((s) => s.user?.role === 'Manager');
  const openCreateTask = useUiStore((s) => s.openCreateTask);

  return (
    <div className="flex flex-col w-72 shrink-0 h-full">
      <div className="flex items-center justify-between px-1 mb-3">
        <div className="flex items-center gap-2">
          <span className={cn('w-2 h-2 rounded-full', colors.dot)} />
          <h3 className="text-sm font-medium text-brand-silver/70">
            {STATUS_LABELS[status]}
          </h3>
          <span className="text-xs font-mono text-brand-silver/30 tabular-nums">
            {tasks.length}
          </span>
        </div>
        {isManager && status === 'ToDo' && (
          <button
            onClick={openCreateTask}
            className="w-5 h-5 flex items-center justify-center rounded text-brand-silver/25 hover:text-brand-silver/60 hover:bg-brand-elevated transition-colors duration-150"
            aria-label="Create task"
          >
            <Plus size={14} />
          </button>
        )}
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 rounded-lg min-h-[200px] p-2 transition-colors duration-200 space-y-2 overflow-y-auto',
          isOver
            ? 'bg-[var(--accent-rose-muted)] ring-1 ring-[var(--accent-rose-border)]'
            : 'bg-brand-raised/40'
        )}
      >
        <SortableContext
          items={tasks.map((t) => t.taskId)}
          strategy={verticalListSortingStrategy}
        >
          {isLoading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : tasks.length === 0 ? (
            <EmptyState
              icon={ListChecks}
              title={isOver ? 'Drop here' : 'No tasks'}
              description={isManager ? 'Create a task to get started' : undefined}
            />
          ) : (
            tasks.map((task) => <TaskCard key={task.taskId} task={task} />)
          )}
        </SortableContext>
      </div>
    </div>
  );
}
