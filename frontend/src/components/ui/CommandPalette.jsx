import { useEffect, useCallback } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SquaresFour, Kanban, ListChecks, FolderOpen, ChartBar, UsersThree,
  GearSix, Plus, MagnifyingGlass, ArrowRight,
} from '@phosphor-icons/react';
import useUiStore from '../../store/uiStore';
import useAuthStore from '../../store/authStore';
import { useTasks } from '../../hooks/useTasks';

const NAV_COMMANDS = [
  { id: 'dashboard', label: 'Go to Dashboard', path: '/dashboard', icon: SquaresFour },
  { id: 'kanban', label: 'Go to Kanban Board', path: '/kanban', icon: Kanban },
  { id: 'my-tasks', label: 'Go to My Tasks', path: '/my-tasks', icon: ListChecks },
  { id: 'projects', label: 'Go to Projects', path: '/projects', icon: FolderOpen },
  { id: 'analytics', label: 'Go to Analytics', path: '/analytics', icon: ChartBar, managerOnly: true },
  { id: 'teams', label: 'Go to Teams', path: '/teams', icon: UsersThree, managerOnly: true },
  { id: 'settings', label: 'Go to Settings', path: '/settings', icon: GearSix },
];

export default function CommandPalette() {
  const { commandPaletteOpen, closeCommandPalette, openCreateTask, openTaskPanel } = useUiStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { data: tasks = [] } = useTasks({}, { enabled: commandPaletteOpen });

  const handleKeyDown = useCallback(
    (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        commandPaletteOpen ? closeCommandPalette() : useUiStore.getState().openCommandPalette();
      }
      if (e.key === 'Escape') closeCommandPalette();
    },
    [commandPaletteOpen, closeCommandPalette]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const visibleNav = NAV_COMMANDS.filter((c) => !c.managerOnly || user?.role === 'Manager');

  return (
    <AnimatePresence>
      {commandPaletteOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-[18vh]"
          onClick={closeCommandPalette}
        >
          <div
            className="absolute inset-0 bg-brand-base/70 backdrop-blur-sm"
            aria-hidden="true"
          />
          <motion.div
            initial={{ scale: 0.97, opacity: 0, y: -8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.97, opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <Command
              className="bg-brand-overlay border border-[var(--border-strong)] rounded-xl overflow-hidden shadow-2xl"
              shouldFilter
            >
              <div className="flex items-center gap-3 px-4 border-b border-[var(--border-default)]">
                <MagnifyingGlass size={16} className="text-brand-silver/40 shrink-0" />
                <Command.Input
                  placeholder="Search tasks, navigate..."
                  className="flex-1 h-12 bg-transparent text-sm text-brand-silver placeholder:text-brand-silver/30 outline-none"
                  autoFocus
                />
                <kbd className="text-[10px] text-brand-silver/30 border border-[var(--border-subtle)] rounded px-1.5 py-0.5 font-mono">
                  ESC
                </kbd>
              </div>

              <Command.List className="max-h-[320px] overflow-y-auto p-1.5">
                <Command.Empty className="py-8 text-center text-sm text-brand-silver/30">
                  No results
                </Command.Empty>

                {user?.role === 'Manager' && (
                  <Command.Group
                    heading={
                      <span className="px-2 py-1 text-[10px] font-medium text-brand-silver/30 uppercase tracking-widest">
                        Actions
                      </span>
                    }
                  >
                    <Command.Item
                      onSelect={() => { openCreateTask(); closeCommandPalette(); }}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-brand-silver rounded-md cursor-pointer data-[selected]:bg-brand-highlight"
                    >
                      <Plus size={14} className="text-brand-rose" />
                      Create new task
                    </Command.Item>
                  </Command.Group>
                )}

                <Command.Group
                  heading={
                    <span className="px-2 py-1 text-[10px] font-medium text-brand-silver/30 uppercase tracking-widest">
                      Navigate
                    </span>
                  }
                >
                  {visibleNav.map(({ id, label, path, icon: Icon }) => (
                    <Command.Item
                      key={id}
                      value={label}
                      onSelect={() => { navigate(path); closeCommandPalette(); }}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-brand-silver rounded-md cursor-pointer data-[selected]:bg-brand-highlight"
                    >
                      <Icon size={14} className="text-brand-silver/40" />
                      {label}
                      <ArrowRight size={12} className="ml-auto text-brand-silver/20" />
                    </Command.Item>
                  ))}
                </Command.Group>

                {tasks.length > 0 && (
                  <Command.Group
                    heading={
                      <span className="px-2 py-1 text-[10px] font-medium text-brand-silver/30 uppercase tracking-widest">
                        Tasks
                      </span>
                    }
                  >
                    {tasks.slice(0, 8).map((task) => (
                      <Command.Item
                        key={task.taskId}
                        value={task.title}
                        onSelect={() => {
                          openTaskPanel(task.taskId);
                          closeCommandPalette();
                        }}
                        className="flex items-center gap-2.5 px-3 py-2 text-sm text-brand-silver rounded-md cursor-pointer data-[selected]:bg-brand-highlight"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-silver/30 shrink-0" />
                        <span className="truncate">{task.title}</span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}
              </Command.List>

              <div className="border-t border-[var(--border-subtle)] px-4 py-2 flex items-center gap-3">
                <span className="text-[10px] text-brand-silver/25 font-mono">↑↓ navigate</span>
                <span className="text-[10px] text-brand-silver/25 font-mono">↵ select</span>
              </div>
            </Command>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
