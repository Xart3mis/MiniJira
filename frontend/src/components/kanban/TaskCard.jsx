import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { ChatCircle, Paperclip, CalendarBlank } from '@phosphor-icons/react';
import { cn, formatDate, isOverdue, daysUntil } from '../../lib/utils';
import { PRIORITY_COLORS } from '../../lib/constants';
import Avatar from '../ui/Avatar';
import useUiStore from '../../store/uiStore';

export default function TaskCard({ task, isDragOverlay = false }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.taskId,
    data: { task },
  });
  const openTaskPanel = useUiStore((s) => s.openTaskPanel);

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging && !isDragOverlay ? 0.35 : 1,
  };

  const overdue = isOverdue(task.deadline);
  const days = daysUntil(task.deadline);
  const priorityColor = PRIORITY_COLORS[task.priority];

  return (
    <div
      ref={!isDragOverlay ? setNodeRef : undefined}
      style={style}
      {...(!isDragOverlay ? { ...listeners, ...attributes } : {})}
      className="touch-none"
    >
      <motion.div
        layout
        layoutId={isDragOverlay ? undefined : `card-${task.taskId}`}
        whileHover={isDragOverlay ? {} : { y: -1 }}
        transition={{ duration: 0.15 }}
        onClick={() => !isDragOverlay && openTaskPanel(task.taskId)}
        className={cn(
          'group bg-brand-overlay rounded-lg border border-[var(--border-default)] p-3 cursor-pointer',
          'hover:border-[var(--border-strong)] hover:bg-brand-elevated transition-colors duration-150',
          isDragOverlay && 'shadow-2xl border-[var(--border-strong)] rotate-1 scale-[1.02]'
        )}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <p className="text-sm text-brand-silver leading-snug line-clamp-2 flex-1 min-w-0">
            {task.title}
          </p>
          {priorityColor && (
            <span
              className={cn(
                'w-2 h-2 rounded-full shrink-0 mt-1',
                priorityColor.dot
              )}
              title={`Priority: ${task.priority}`}
            />
          )}
        </div>

        {task.description && (
          <p className="text-xs text-brand-silver/65 mb-2.5 line-clamp-1">{task.description}</p>
        )}

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {task.deadline && (
              <span
                className={cn(
                  'flex items-center gap-1 text-[10px] font-mono',
                  overdue
                    ? 'text-brand-rose'
                    : days !== null && days <= 2
                    ? 'text-amber-300'
                    : 'text-brand-silver/60'
                )}
              >
                <CalendarBlank size={10} />
                {overdue ? 'Overdue' : formatDate(task.deadline)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {task.commentCount > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] text-brand-silver/60">
                <ChatCircle size={11} />
                {task.commentCount}
              </span>
            )}
            {task.imageUrl && (
              <Paperclip size={11} className="text-brand-silver/60" />
            )}
            {task.assigneeName && (
              <Avatar name={task.assigneeName} size="xs" />
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
