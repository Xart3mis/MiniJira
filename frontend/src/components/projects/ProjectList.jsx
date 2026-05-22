import { FolderOpen, DotsThree, PencilSimple, Trash } from '@phosphor-icons/react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { SkeletonCard } from '../ui/Skeleton';
import EmptyState from '../ui/EmptyState';
import useAuthStore from '../../store/authStore';
import { useDeleteProject } from '../../hooks/useProjects';

export default function ProjectList({ projects = [], isLoading, onEdit }) {
  const isManager = useAuthStore((s) => s.user?.role === 'Manager');
  const deleteProject = useDeleteProject();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <EmptyState
        icon={FolderOpen}
        title="No projects yet"
        description={isManager ? 'Create a project to organize your tasks' : undefined}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {projects.map((project, i) => (
        <motion.div
          key={project.projectId}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04, duration: 0.2 }}
          className={cn(
            'bg-brand-overlay border border-[var(--border-default)] rounded-xl p-4',
            'hover:border-[var(--border-strong)] transition-colors duration-150'
          )}
        >
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-md bg-[var(--accent-teal-muted)] flex items-center justify-center shrink-0">
                <FolderOpen size={14} className="text-brand-teal" weight="fill" />
              </div>
              <h3 className="text-sm font-medium text-brand-silver truncate">{project.title}</h3>
            </div>

            {isManager && (
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button className="w-6 h-6 flex items-center justify-center rounded text-brand-silver/25 hover:text-brand-silver/60 hover:bg-brand-elevated transition-colors shrink-0">
                    <DotsThree size={16} weight="bold" />
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    align="end"
                    sideOffset={4}
                    className="z-50 w-36 bg-brand-elevated border border-[var(--border-default)] rounded-lg shadow-xl p-1 animate-slide-up"
                  >
                    <DropdownMenu.Item
                      className="flex items-center gap-2 px-3 py-1.5 text-sm text-brand-silver/60 hover:text-brand-silver hover:bg-brand-highlight rounded cursor-pointer outline-none"
                      onClick={() => onEdit?.(project)}
                    >
                      <PencilSimple size={13} /> Edit
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator className="h-px bg-[var(--border-subtle)] my-1" />
                    <DropdownMenu.Item
                      className="flex items-center gap-2 px-3 py-1.5 text-sm text-brand-rose/70 hover:text-brand-rose hover:bg-[var(--accent-rose-muted)] rounded cursor-pointer outline-none"
                      onClick={() => deleteProject.mutate(project.projectId)}
                    >
                      <Trash size={13} /> Delete
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            )}
          </div>

          {project.description && (
            <p className="text-xs text-brand-silver/35 leading-relaxed line-clamp-2">
              {project.description}
            </p>
          )}

          <p className="text-[10px] text-brand-silver/20 font-mono mt-3">
            {project.teamId ?? 'No team'}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
