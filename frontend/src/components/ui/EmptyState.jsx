import { cn } from '../../lib/utils';
import Button from './Button';

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  actionLabel,
  className,
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 py-12 px-6 text-center',
        className
      )}
    >
      {Icon && (
        <div className="w-10 h-10 rounded-full bg-brand-elevated flex items-center justify-center">
          <Icon size={20} className="text-brand-silver/30" weight="duotone" />
        </div>
      )}
      <div className="space-y-1">
        <p className="text-sm font-medium text-brand-silver/60">{title}</p>
        {description && <p className="text-xs text-brand-silver/35 max-w-[240px]">{description}</p>}
      </div>
      {action && actionLabel && (
        <Button variant="secondary" size="sm" onClick={action}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
