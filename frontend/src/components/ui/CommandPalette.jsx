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
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-[14vh] px-4"
          onClick={closeCommandPalette}
        >
          <div
            className="absolute inset-0 bg-brand-base/80 backdrop-blur-md"
            aria-hidden="true"
          />
          <motion.div
            initial={{ scale: 0.98, opacity: 0, y: -12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.98, opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Command
              className="bg-brand-overlay/95 border border-white/5 rounded-2xl overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] backdrop-blur-xl"
              shouldFilter
            >
              <div className="flex items-center gap-4 px-5 h-16 border-b border-white/5">
                <MagnifyingGlass weight="bold" size={20} className="text-brand-silver/30 shrink-0" />
                <Command.Input
                  placeholder="Search for anything..."
                  className="flex-1 bg-transparent text-base text-brand-silver placeholder:text-brand-silver/30 outline-none focus:ring-0"
                  autoFocus
                />
                <div className="flex items-center gap-1.5 px-2 py-1 bg-brand-elevated/50 border border-white/10 rounded-lg shadow-sm">
                  <span className="text-[10px] font-bold text-brand-silver/40 tracking-wider">ESC</span>
                </div>
              </div>

              <Command.List className="max-h-[60vh] overflow-y-auto p-2">
                <Command.Empty className="py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <MagnifyingGlass size={32} weight="duotone" className="text-brand-silver/10" />
                    <p className="text-sm text-brand-silver/30 font-medium">No results found</p>
                  </div>
                </Command.Empty>

                {user?.role === 'Manager' && (
                  <Command.Group
                    heading={
                      <div className="px-3 py-2 text-[10px] font-bold text-brand-silver/20 uppercase tracking-[0.2em]">
                        Actions
                      </div>
                    }
                  >
                    <Command.Item
                      onSelect={() => { openCreateTask(); closeCommandPalette(); }}
                      className="group flex items-center gap-3 px-3 py-3 text-sm text-brand-silver/80 rounded-xl cursor-pointer data-[selected]:bg-white/[0.03] data-[selected]:text-brand-silver transition-all"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-rose/10 group-data-[selected]:bg-brand-rose/20 transition-colors">
                        <Plus size={18} weight="bold" className="text-brand-rose" />
                      </div>
                      <span className="font-medium">Create new task</span>
                      <kbd className="ml-auto text-[10px] font-mono text-brand-silver/20 group-data-[selected]:text-brand-silver/40 transition-colors">N</kbd>
                    </Command.Item>
                  </Command.Group>
                )}

                <Command.Group
                  heading={
                    <div className="px-3 py-2 mt-4 text-[10px] font-bold text-brand-silver/20 uppercase tracking-[0.2em]">
                      Navigate
                    </div>
                  }
                >
                  {visibleNav.map(({ id, label, path, icon: Icon }) => (
                    <Command.Item
                      key={id}
                      value={label}
                      onSelect={() => { navigate(path); closeCommandPalette(); }}
                      className="group flex items-center gap-3 px-3 py-3 text-sm text-brand-silver/80 rounded-xl cursor-pointer data-[selected]:bg-white/[0.03] data-[selected]:text-brand-silver transition-all"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 group-data-[selected]:bg-white/10 transition-colors">
                        <Icon size={18} weight="duotone" className="text-brand-silver/50 group-data-[selected]:text-brand-silver/80" />
                      </div>
                      <span className="font-medium">{label}</span>
                      <ArrowRight weight="bold" size={14} className="ml-auto text-brand-silver/10 group-data-[selected]:text-brand-silver/30 opacity-0 group-data-[selected]:opacity-100 -translate-x-2 group-data-[selected]:translate-x-0 transition-all" />
                    </Command.Item>
                  ))}
                </Command.Group>

                {tasks.length > 0 && (
                  <Command.Group
                    heading={
                      <div className="px-3 py-2 mt-4 text-[10px] font-bold text-brand-silver/20 uppercase tracking-[0.2em]">
                        Tasks
                      </div>
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
                        className="group flex items-center gap-3 px-3 py-3 text-sm text-brand-silver/80 rounded-xl cursor-pointer data-[selected]:bg-white/[0.03] data-[selected]:text-brand-silver transition-all"
                      >
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 group-data-[selected]:bg-white/10 transition-colors">
                          <div className={`w-2 h-2 rounded-full ${
                            task.priority === 'High' ? 'bg-brand-rose' : 
                            task.priority === 'Critical' ? 'bg-brand-rose shadow-[0_0_8px_var(--accent-rose)]' : 
                            'bg-brand-silver/20'
                          }`} />
                        </div>
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="font-medium truncate">{task.title}</span>
                          <span className="text-[10px] text-brand-silver/30 group-data-[selected]:text-brand-silver/50 transition-colors uppercase tracking-wider">{task.status}</span>
                        </div>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}
              </Command.List>

              <div className="border-t border-white/5 px-5 py-3 flex items-center gap-6 bg-brand-base/20">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-brand-silver/20 uppercase tracking-widest">Navigate</span>
                  <div className="flex gap-1">
                    <kbd className="px-1 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] font-bold text-brand-silver/40">↑</kbd>
                    <kbd className="px-1 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] font-bold text-brand-silver/40">↓</kbd>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-brand-silver/20 uppercase tracking-widest">Select</span>
                  <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] font-bold text-brand-silver/40">ENTER</kbd>
                </div>
              </div>
            </Command>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
