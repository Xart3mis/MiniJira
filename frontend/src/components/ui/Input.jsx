import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

const Input = forwardRef(function Input(
  { label, error, helper, className, required, id, ...props },
  ref
) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-medium text-brand-silver/80 tracking-wide uppercase"
        >
          {label}
          {required && <span className="text-brand-rose ml-0.5">*</span>}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={cn(
          'h-9 w-full rounded-md px-3 text-sm bg-brand-elevated text-brand-silver',
          'border border-[var(--border-default)] placeholder:text-brand-silver/65',
          'transition-colors duration-150',
          'focus:outline-none focus:border-brand-rose focus:ring-1 focus:ring-brand-rose/30',
          error && 'border-brand-rose/60 focus:border-brand-rose focus:ring-brand-rose/30',
          props.disabled && 'opacity-40 cursor-not-allowed',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-brand-rose">{error}</p>}
      {helper && !error && <p className="text-xs text-brand-silver/70">{helper}</p>}
    </div>
  );
});

export default Input;

export function Textarea({ label, error, helper, className, required, id, ...props }) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-medium text-brand-silver/80 tracking-wide uppercase"
        >
          {label}
          {required && <span className="text-brand-rose ml-0.5">*</span>}
        </label>
      )}
      <textarea
        id={inputId}
        rows={4}
        className={cn(
          'w-full rounded-md px-3 py-2 text-sm bg-brand-elevated text-brand-silver',
          'border border-[var(--border-default)] placeholder:text-brand-silver/65',
          'transition-colors duration-150 resize-none',
          'focus:outline-none focus:border-brand-rose focus:ring-1 focus:ring-brand-rose/30',
          error && 'border-brand-rose/60',
          props.disabled && 'opacity-40 cursor-not-allowed',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-brand-rose">{error}</p>}
      {helper && !error && <p className="text-xs text-brand-silver/70">{helper}</p>}
    </div>
  );
}
