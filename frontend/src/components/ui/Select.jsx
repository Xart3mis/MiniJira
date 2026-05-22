import * as RadixSelect from '@radix-ui/react-select';
import { CaretDown, Check } from '@phosphor-icons/react';
import { cn } from '../../lib/utils';

const CLEAR_SENTINEL = '__all__';

export function Select({
  label,
  value,
  onValueChange,
  placeholder = 'Select...',
  options = [],
  error,
  required,
  disabled,
  className,
}) {
  const toRadix = (v) => (v === '' ? CLEAR_SENTINEL : v);
  const fromRadix = (v) => (v === CLEAR_SENTINEL ? '' : v);

  const normalizedOptions = options.map((opt) =>
    opt.value === '' ? { ...opt, value: CLEAR_SENTINEL } : opt
  );

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-medium text-brand-silver/70 tracking-wide uppercase">
          {label}
          {required && <span className="text-brand-rose ml-0.5">*</span>}
        </label>
      )}
      <RadixSelect.Root value={toRadix(value)} onValueChange={(v) => onValueChange(fromRadix(v))} disabled={disabled}>
        <RadixSelect.Trigger
          className={cn(
            'inline-flex items-center justify-between h-9 w-full rounded-md px-3 text-sm',
            'bg-brand-elevated text-brand-silver border border-[var(--border-default)]',
            'transition-colors duration-150 select-none',
            'data-[placeholder]:text-brand-silver/30',
            'focus:outline-none focus:border-brand-rose focus:ring-1 focus:ring-brand-rose/30',
            'disabled:opacity-40 disabled:cursor-not-allowed',
            error && 'border-brand-rose/60',
            className
          )}
        >
          <RadixSelect.Value placeholder={placeholder} />
          <RadixSelect.Icon>
            <CaretDown size={14} className="text-brand-silver/40" />
          </RadixSelect.Icon>
        </RadixSelect.Trigger>

        <RadixSelect.Portal>
          <RadixSelect.Content
            className="z-50 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-md bg-brand-elevated border border-[var(--border-default)] shadow-xl"
            position="popper"
            sideOffset={4}
          >
            <RadixSelect.Viewport className="p-1">
              {normalizedOptions.map((opt) => (
                <RadixSelect.Item
                  key={opt.value}
                  value={opt.value}
                  disabled={opt.disabled}
                  className={cn(
                    'relative flex items-center gap-2 px-3 py-1.5 text-sm text-brand-silver rounded',
                    'cursor-pointer select-none outline-none',
                    'data-[highlighted]:bg-brand-highlight data-[highlighted]:text-brand-silver',
                    'data-[disabled]:opacity-40 data-[disabled]:cursor-not-allowed'
                  )}
                >
                  <RadixSelect.ItemIndicator>
                    <Check size={12} className="text-brand-rose" />
                  </RadixSelect.ItemIndicator>
                  <RadixSelect.ItemText>{opt.label}</RadixSelect.ItemText>
                </RadixSelect.Item>
              ))}
            </RadixSelect.Viewport>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>
      {error && <p className="text-xs text-brand-rose">{error}</p>}
    </div>
  );
}
