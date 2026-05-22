export const STATUSES = ['ToDo', 'InProgress', 'InReview', 'Done'];

export const STATUS_LABELS = {
  ToDo: 'To Do',
  InProgress: 'In Progress',
  InReview: 'In Review',
  Done: 'Done',
};

export const STATUS_COLORS = {
  ToDo: {
    dot: 'bg-brand-silver/50',
    badge: 'bg-brand-overlay text-brand-silver/90',
    border: 'border-brand-highlight',
    column: 'rgba(209,209,214,0.04)',
  },
  InProgress: {
    dot: 'bg-brand-rose',
    badge: 'bg-[var(--accent-rose-muted)] text-brand-rose',
    border: 'border-[var(--accent-rose-border)]',
    column: 'rgba(191,109,117,0.04)',
  },
  InReview: {
    dot: 'bg-[#9c8191]',
    badge: 'bg-[rgba(156,129,145,0.15)] text-[#d1b8c6]',
    border: 'border-[rgba(156,129,145,0.3)]',
    column: 'rgba(156,129,145,0.04)',
  },
  Done: {
    dot: 'bg-brand-teal',
    badge: 'bg-[var(--accent-teal-muted)] text-brand-teal',
    border: 'border-[var(--accent-teal-border)]',
    column: 'rgba(54,140,138,0.04)',
  },
};

export const PRIORITIES = ['High', 'Medium', 'Low'];

export const PRIORITY_COLORS = {
  High: {
    dot: 'bg-brand-rose',
    badge: 'bg-[var(--accent-rose-muted)] text-brand-rose',
    label: 'High',
  },
  Medium: {
    dot: 'bg-brand-silver/60',
    badge: 'bg-brand-overlay text-brand-silver/80',
    label: 'Medium',
  },
  Low: {
    dot: 'bg-brand-teal',
    badge: 'bg-[var(--accent-teal-muted)] text-brand-teal',
    label: 'Low',
  },
};

export const ROLES = ['Manager', 'Employee'];

export const NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: 'SquaresFour' },
  { label: 'Kanban', path: '/kanban', icon: 'Kanban' },
  { label: 'My Tasks', path: '/my-tasks', icon: 'ListChecks' },
  { label: 'Projects', path: '/projects', icon: 'FolderOpen' },
  { label: 'Analytics', path: '/analytics', icon: 'ChartBar', managerOnly: true },
  { label: 'Teams', path: '/teams', icon: 'UsersThree', managerOnly: true },
  { label: 'Settings', path: '/settings', icon: 'GearSix' },
];
