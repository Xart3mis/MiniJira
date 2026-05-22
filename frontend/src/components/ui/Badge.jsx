import { cn } from '../../lib/utils';
import { STATUS_COLORS, STATUS_LABELS, PRIORITY_COLORS } from '../../lib/constants';

export function StatusBadge({ status, className }) {
  const colors = STATUS_COLORS[status];
  if (!colors) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium tracking-wide',
        colors.badge,
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', colors.dot)} />
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function PriorityBadge({ priority, className }) {
  const colors = PRIORITY_COLORS[priority];
  if (!colors) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium',
        colors.badge,
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', colors.dot)} />
      {colors.label}
    </span>
  );
}

export function Badge({ children, variant = 'default', className }) {
  const variants = {
    default: 'bg-brand-elevated text-brand-silver/90 border border-[var(--border-default)]',
    rose: 'bg-[var(--accent-rose-muted)] text-brand-rose',
    teal: 'bg-[var(--accent-teal-muted)] text-brand-teal',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
