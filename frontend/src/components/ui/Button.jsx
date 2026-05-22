import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

const variants = {
  primary: 'bg-brand-rose hover:bg-[#a05860] text-[#f0edee] border border-[rgba(144,78,85,0.4)]',
  secondary:
    'bg-brand-elevated hover:bg-brand-highlight text-brand-silver border border-[var(--border-default)] hover:border-[var(--border-strong)]',
  ghost: 'bg-transparent hover:bg-brand-elevated text-brand-silver/70 hover:text-brand-silver',
  teal: 'bg-brand-teal hover:bg-[#2c7d7c] text-[#e8f0f0] border border-[rgba(37,106,105,0.4)]',
  danger: 'bg-[var(--accent-rose-muted)] hover:bg-[rgba(144,78,85,0.22)] text-brand-rose border border-[var(--accent-rose-border)]',
};

const sizes = {
  sm: 'h-7 px-3 text-xs gap-1.5',
  md: 'h-8 px-3.5 text-sm gap-2',
  lg: 'h-10 px-4 text-sm gap-2',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  loading,
  children,
  iconLeft,
  iconRight,
  ...props
}) {
  return (
    <motion.button
      whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
      transition={{ duration: 0.1 }}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-md transition-colors duration-150 select-none',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <svg
          className="animate-spin h-3.5 w-3.5 shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      ) : (
        iconLeft && <span className="shrink-0">{iconLeft}</span>
      )}
      {children && <span>{children}</span>}
      {!loading && iconRight && <span className="shrink-0">{iconRight}</span>}
    </motion.button>
  );
}
