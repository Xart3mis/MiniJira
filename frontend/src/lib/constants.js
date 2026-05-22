export const STATUSES = ['ToDo', 'InProgress', 'InReview', 'Done'];

export const STATUS_LABELS = {
  ToDo: 'To Do',
  InProgress: 'In Progress',
  InReview: 'In Review',
  Done: 'Done',
};

export const STATUS_COLORS = {
  ToDo: {
    dot: 'bg-brand-silver/40',
    badge: 'bg-[rgba(188,186,187,0.1)] text-brand-silver/70',
    border: 'border-[rgba(188,186,187,0.15)]',
    column: 'rgba(188,186,187,0.06)',
  },
  InProgress: {
    dot: 'bg-brand-rose',
    badge: 'bg-[var(--accent-rose-muted)] text-brand-rose',
    border: 'border-[var(--accent-rose-border)]',
    column: 'rgba(144,78,85,0.04)',
  },
  InReview: {
    dot: 'bg-[#7a5a6e]',
    badge: 'bg-[rgba(122,90,110,0.12)] text-[#b09ab0]',
    border: 'border-[rgba(122,90,110,0.25)]',
    column: 'rgba(122,90,110,0.04)',
  },
  Done: {
    dot: 'bg-brand-teal',
    badge: 'bg-[var(--accent-teal-muted)] text-brand-teal',
    border: 'border-[var(--accent-teal-border)]',
    column: 'rgba(37,106,105,0.04)',
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
    dot: 'bg-brand-silver/50',
    badge: 'bg-[rgba(188,186,187,0.08)] text-brand-silver/60',
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
