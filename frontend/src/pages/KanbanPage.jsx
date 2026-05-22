import { useState } from 'react';
import { Plus, Funnel, X } from '@phosphor-icons/react';
import { useTasks } from '../hooks/useTasks';
import { useTeams } from '../hooks/useTeams';
import { useUsers } from '../hooks/useUsers';
import KanbanBoard from '../components/kanban/KanbanBoard';
import Button from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import useAuthStore from '../store/authStore';
import useUiStore from '../store/uiStore';
import { PRIORITIES } from '../lib/constants';
import { cn } from '../lib/utils';

export default function KanbanPage() {
  const { user } = useAuthStore();
  const { openCreateTask } = useUiStore();
  const isManager = user?.role === 'Manager';

  const [filters, setFilters] = useState({
    teamId: user?.teamId ?? '',
    priority: '',
    assigneeId: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  const activeFilters = Object.values(filters).filter(Boolean).length;

  const { data: teams = [] } = useTeams();
  const { data: users = [] } = useUsers();

  const taskParams = Object.fromEntries(
    Object.entries(filters).filter(([_, v]) => !!v)
  );

  const { data: tasks = [], isLoading } = useTasks(taskParams);

  const clearFilters = () =>
    setFilters({ teamId: user?.teamId ?? '', priority: '', assigneeId: '' });

  const setFilter = (key, val) => setFilters((f) => ({ ...f, [key]: val }));

  const assignableUsers = users.filter(
    (u) => !filters.teamId || u.teamId === filters.teamId
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-[var(--border-subtle)] shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold text-brand-silver">Board</h1>
          <span className="text-xs font-mono text-brand-silver/25 tabular-nums">
            {tasks.length} tasks
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={cn(
              'flex items-center gap-1.5 h-7 px-3 rounded text-xs transition-colors',
              showFilters || activeFilters > 0
                ? 'bg-[var(--accent-rose-muted)] text-brand-rose border border-[var(--accent-rose-border)]'
                : 'text-brand-silver/45 hover:text-brand-silver/70 hover:bg-brand-elevated border border-transparent'
            )}
          >
            <Funnel size={13} />
            Filter
            {activeFilters > 0 && (
              <span className="w-4 h-4 rounded-full bg-brand-rose text-[#f0edee] text-[9px] flex items-center justify-center font-mono">
                {activeFilters}
              </span>
            )}
          </button>

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
        </div>
      </div>

      {showFilters && (
        <div className="flex items-end gap-3 px-6 py-3 border-b border-[var(--border-subtle)] shrink-0 flex-wrap">
          {isManager && (
            <div className="w-44">
              <Select
                label="Team"
                value={filters.teamId}
                onValueChange={(v) => setFilter('teamId', v)}
                placeholder="All teams"
                options={[
                  { value: '', label: 'All teams' },
                  ...teams.map((t) => ({ value: t.teamId, label: t.name })),
                ]}
              />
            </div>
          )}
          <div className="w-36">
            <Select
              label="Priority"
              value={filters.priority}
              onValueChange={(v) => setFilter('priority', v)}
              placeholder="Any priority"
              options={[
                { value: '', label: 'Any priority' },
                ...PRIORITIES.map((p) => ({ value: p, label: p })),
              ]}
            />
          </div>
          {isManager && (
            <div className="w-44">
              <Select
                label="Assignee"
                value={filters.assigneeId}
                onValueChange={(v) => setFilter('assigneeId', v)}
                placeholder="Anyone"
                options={[
                  { value: '', label: 'Anyone' },
                  ...assignableUsers.map((u) => ({ value: u.userId, label: u.name || u.email })),
                ]}
              />
            </div>
          )}
          {activeFilters > 0 && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-brand-silver/35 hover:text-brand-silver/60 mb-1.5 transition-colors"
            >
              <X size={12} /> Clear filters
            </button>
          )}
        </div>
      )}

      <div className="flex-1 overflow-x-auto overflow-y-hidden px-6 pt-5">
        <KanbanBoard tasks={tasks} isLoading={isLoading} filters={taskParams} />
      </div>
    </div>
  );
}
