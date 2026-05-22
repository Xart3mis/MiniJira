import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SquaresFour, Kanban, ListChecks, FolderOpen, ChartBar,
  UsersThree, GearSix, SignOut, ArrowLineLeft, ArrowLineRight,
} from '@phosphor-icons/react';
import { cn } from '../../lib/utils';
import Avatar from '../ui/Avatar';
import { Tooltip } from '../ui/Tooltip';
import useAuthStore from '../../store/authStore';
import useUiStore from '../../store/uiStore';
import { signOut } from '../../auth/cognito';

const NAV = [
  { label: 'Dashboard', path: '/dashboard', icon: SquaresFour },
  { label: 'Kanban', path: '/kanban', icon: Kanban },
  { label: 'My Tasks', path: '/my-tasks', icon: ListChecks },
  { label: 'Projects', path: '/projects', icon: FolderOpen },
  { label: 'Analytics', path: '/analytics', icon: ChartBar, managerOnly: true },
  { label: 'Teams', path: '/teams', icon: UsersThree, managerOnly: true },
  { label: 'Settings', path: '/settings', icon: GearSix },
];

function NavItem({ icon: Icon, label, path, collapsed }) {
  return (
    <Tooltip content={collapsed ? label : null} side="right">
      <NavLink
        to={path}
        className={({ isActive }) =>
          cn(
            'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors duration-150',
            'group relative',
            isActive
              ? 'bg-[var(--accent-rose-muted)] text-brand-rose'
              : 'text-brand-silver/45 hover:text-brand-silver/80 hover:bg-brand-elevated/60'
          )
        }
      >
        {({ isActive }) => (
          <>
            <Icon
              size={17}
              weight={isActive ? 'fill' : 'regular'}
              className="shrink-0"
            />
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden whitespace-nowrap font-medium"
                >
                  {label}
                </motion.span>
              )}
            </AnimatePresence>
          </>
        )}
      </NavLink>
    </Tooltip>
  );
}

export default function Sidebar() {
  const { collapsed, toggleSidebar } = useUiStore((s) => ({
    collapsed: s.sidebarCollapsed,
    toggleSidebar: s.toggleSidebar,
  }));
  const { user, clearAuth } = useAuthStore();
  const isManager = user?.role === 'Manager';

  const handleSignOut = () => {
    signOut();
    clearAuth();
  };

  const visibleNav = NAV.filter((item) => !item.managerOnly || isManager);

  return (
    <motion.aside
      animate={{ width: collapsed ? 56 : 220 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col h-full bg-brand-base border-r border-[var(--border-subtle)] overflow-hidden shrink-0"
    >
      <div className="flex items-center gap-2.5 px-3 h-14 border-b border-[var(--border-subtle)] shrink-0">
        <div className="w-7 h-7 rounded-md bg-brand-rose flex items-center justify-center shrink-0">
          <Kanban size={14} weight="fill" className="text-[#f0edee]" />
        </div>
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="font-semibold text-brand-silver text-sm tracking-tight whitespace-nowrap"
            >
              MiniJira
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {visibleNav.map((item) => (
          <NavItem key={item.path} {...item} collapsed={collapsed} />
        ))}
      </nav>

      <div className="border-t border-[var(--border-subtle)] px-2 py-2 space-y-0.5">
        <Tooltip content={collapsed ? 'Sign out' : null} side="right">
          <button
            onClick={handleSignOut}
            className={cn(
              'flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm',
              'text-brand-silver/35 hover:text-brand-rose hover:bg-[var(--accent-rose-muted)] transition-colors duration-150'
            )}
          >
            <SignOut size={17} className="shrink-0" />
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden whitespace-nowrap font-medium"
                >
                  Sign out
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </Tooltip>

        <div
          className={cn(
            'flex items-center gap-2.5 px-3 py-2 rounded-md',
            collapsed && 'justify-center'
          )}
        >
          <Avatar name={user?.name} size="sm" className="shrink-0" />
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden min-w-0"
              >
                <p className="text-xs font-medium text-brand-silver/70 truncate leading-none mb-0.5">
                  {user?.name ?? user?.email}
                </p>
                <p className="text-[10px] text-brand-silver/35 truncate leading-none">
                  {user?.role}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Tooltip content={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} side="right">
          <button
            onClick={toggleSidebar}
            className="flex items-center justify-center w-full h-7 rounded-md text-brand-silver/25 hover:text-brand-silver/50 hover:bg-brand-elevated/50 transition-colors duration-150"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ArrowLineRight size={14} /> : <ArrowLineLeft size={14} />}
          </button>
        </Tooltip>
      </div>
    </motion.aside>
  );
}
