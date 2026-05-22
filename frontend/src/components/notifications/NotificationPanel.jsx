import { useRef, useEffect } from 'react';
import { Bell, X } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { useTasks } from '../../hooks/useTasks';
import { StatusBadge } from '../ui/Badge';
import { formatRelative } from '../../lib/utils';
import useAuthStore from '../../store/authStore';
import { SkeletonRow } from '../ui/Skeleton';

export default function NotificationPanel({ onClose }) {
  const panelRef = useRef(null);
  const { user } = useAuthStore();
  const { data: tasks = [], isLoading } = useTasks();

  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const myTasks = tasks
    .filter((t) => t.assigneeId === user?.userId)
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
    .slice(0, 10);

  return (
    <motion.div
      ref={panelRef}
      initial={{ opacity: 0, y: -6, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.97 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      className="absolute right-0 top-10 w-80 bg-brand-elevated border border-[var(--border-default)] rounded-xl shadow-2xl z-50 overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <Bell size={14} className="text-brand-silver/50" />
          <span className="text-sm font-medium text-brand-silver/70">Your Tasks</span>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center rounded text-brand-silver/25 hover:text-brand-silver/60 transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      <div className="max-h-[320px] overflow-y-auto">
        {isLoading ? (
          <div className="px-4 py-2">
            {[0, 1, 2].map((i) => <SkeletonRow key={i} />)}
          </div>
        ) : myTasks.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-xs text-brand-silver/25">No tasks assigned to you</p>
          </div>
        ) : (
          <div className="p-2">
            {myTasks.map((task) => (
              <div
                key={task.taskId}
                className="flex items-start gap-2.5 px-2 py-2.5 rounded-lg hover:bg-brand-highlight transition-colors cursor-default"
              >
                <div className="mt-0.5">
                  <StatusBadge status={task.status} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-brand-silver/70 font-medium truncate">{task.title}</p>
                  <p className="text-[10px] text-brand-silver/25 font-mono mt-0.5">
                    {formatRelative(task.updatedAt || task.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
