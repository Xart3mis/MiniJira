import { UsersThree, Trash, PencilSimple } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { SkeletonRow } from '../ui/Skeleton';
import EmptyState from '../ui/EmptyState';
import Avatar, { AvatarGroup } from '../ui/Avatar';
import Button from '../ui/Button';
import { useUsers } from '../../hooks/useUsers';
import { useDeleteTeam } from '../../hooks/useTeams';
import { useTasks } from '../../hooks/useTasks';

export default function TeamTable({ teams = [], isLoading, onEdit }) {
  const { data: users = [] } = useUsers();
  const { data: tasks = [] } = useTasks();
  const deleteTeam = useDeleteTeam();

  if (isLoading) {
    return (
      <div className="space-y-0.5">
        {[0, 1, 2].map((i) => <SkeletonRow key={i} />)}
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <EmptyState
        icon={UsersThree}
        title="No teams yet"
        description="Create a team to organize members and tasks"
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" aria-label="Teams">
        <thead>
          <tr className="border-b border-[var(--border-subtle)]">
            <th className="text-left py-2.5 px-3 text-xs text-brand-silver/35 font-medium uppercase tracking-wide">
              Team
            </th>
            <th className="text-left py-2.5 px-3 text-xs text-brand-silver/35 font-medium uppercase tracking-wide hidden sm:table-cell">
              Members
            </th>
            <th className="text-right py-2.5 px-3 text-xs text-brand-silver/35 font-medium uppercase tracking-wide hidden md:table-cell">
              Open tasks
            </th>
            <th className="text-right py-2.5 px-3 text-xs text-brand-silver/35 font-medium uppercase tracking-wide hidden lg:table-cell">
              Done
            </th>
            <th className="py-2.5 px-3 w-20" />
          </tr>
        </thead>
        <tbody>
          {teams.map((team, i) => {
            const members = users.filter((u) => u.teamId === team.teamId);
            const teamTasks = tasks.filter((t) => t.teamId === team.teamId);
            const openTasks = teamTasks.filter((t) => t.status !== 'Done').length;
            const doneTasks = teamTasks.filter((t) => t.status === 'Done').length;

            return (
              <motion.tr
                key={team.teamId}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="border-b border-[var(--border-subtle)] hover:bg-brand-elevated/30 transition-colors"
              >
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded bg-[var(--accent-rose-muted)] flex items-center justify-center shrink-0">
                      <UsersThree size={12} className="text-brand-rose" weight="fill" />
                    </div>
                    <span className="text-brand-silver/80 font-medium">{team.name}</span>
                  </div>
                </td>
                <td className="py-3 px-3 hidden sm:table-cell">
                  <div className="flex items-center gap-2">
                    <AvatarGroup
                      names={members.map((m) => m.name || m.email || '')}
                      max={4}
                      size="xs"
                    />
                    <span className="text-xs text-brand-silver/35 font-mono">{members.length}</span>
                  </div>
                </td>
                <td className="py-3 px-3 text-right hidden md:table-cell">
                  <span className="text-xs font-mono text-brand-silver/50">{openTasks}</span>
                </td>
                <td className="py-3 px-3 text-right hidden lg:table-cell">
                  <span className="text-xs font-mono text-brand-teal">{doneTasks}</span>
                </td>
                <td className="py-3 px-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onEdit?.(team)}
                      className="w-7 h-7 flex items-center justify-center rounded text-brand-silver/25 hover:text-brand-silver/60 hover:bg-brand-elevated transition-colors"
                      aria-label={`Edit ${team.name}`}
                    >
                      <PencilSimple size={13} />
                    </button>
                    <button
                      onClick={() => deleteTeam.mutate(team.teamId)}
                      className="w-7 h-7 flex items-center justify-center rounded text-brand-silver/25 hover:text-brand-rose hover:bg-[var(--accent-rose-muted)] transition-colors"
                      aria-label={`Delete ${team.name}`}
                    >
                      <Trash size={13} />
                    </button>
                  </div>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
