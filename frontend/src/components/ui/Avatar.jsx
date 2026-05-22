import { cn, getInitials, avatarColor } from '../../lib/utils';

const sizes = {
  xs: 'h-5 w-5 text-[9px]',
  sm: 'h-6 w-6 text-[10px]',
  md: 'h-7 w-7 text-xs',
  lg: 'h-9 w-9 text-sm',
  xl: 'h-12 w-12 text-base',
};

export default function Avatar({ name = '', size = 'md', src, className }) {
  const initials = getInitials(name);
  const color = avatarColor(name);

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('rounded-full object-cover shrink-0', sizes[size], className)}
      />
    );
  }

  return (
    <span
      aria-label={name}
      title={name}
      className={cn(
        'inline-flex items-center justify-center rounded-full font-semibold shrink-0 select-none',
        sizes[size],
        color,
        className
      )}
    >
      {initials || '?'}
    </span>
  );
}

export function AvatarGroup({ names = [], max = 3, size = 'sm' }) {
  const visible = names.slice(0, max);
  const overflow = names.length - max;

  return (
    <div className="flex -space-x-1.5">
      {visible.map((name) => (
        <Avatar
          key={name}
          name={name}
          size={size}
          className="ring-1 ring-brand-overlay"
        />
      ))}
      {overflow > 0 && (
        <span
          className={cn(
            'inline-flex items-center justify-center rounded-full bg-brand-highlight',
            'text-brand-silver/50 font-medium ring-1 ring-brand-overlay',
            sizes[size]
          )}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
}
