import { cn } from '../../lib/utils';

export function Skeleton({ className }) {
  return (
    <div
      className={cn('rounded shimmer', className)}
      style={{
        background:
          'linear-gradient(90deg, rgba(188,186,187,0.04) 0%, rgba(188,186,187,0.09) 50%, rgba(188,186,187,0.04) 100%)',
        backgroundSize: '400px 100%',
        animation: 'shimmer 1.8s infinite linear',
      }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-brand-overlay rounded-lg border border-[var(--border-subtle)] p-3 space-y-2.5">
      <Skeleton className="h-3.5 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <div className="flex items-center justify-between pt-1">
        <Skeleton className="h-4 w-16 rounded-full" />
        <Skeleton className="h-5 w-5 rounded-full" />
      </div>
    </div>
  );
}

export function SkeletonText({ lines = 3 }) {
  const widths = ['w-full', 'w-5/6', 'w-4/6', 'w-3/4', 'w-2/3'];
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn('h-3', widths[i % widths.length])} />
      ))}
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <Skeleton className="h-7 w-7 rounded-full shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3 w-2/5" />
        <Skeleton className="h-2.5 w-1/4" />
      </div>
      <Skeleton className="h-4 w-14 rounded-full" />
    </div>
  );
}
