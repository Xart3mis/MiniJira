import { useState, useRef, useEffect } from 'react';
import { MagnifyingGlass, Bell, Command } from '@phosphor-icons/react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import Avatar from '../ui/Avatar';
import NotificationPanel from '../notifications/NotificationPanel';
import useAuthStore from '../../store/authStore';
import useUiStore from '../../store/uiStore';
import { signOut } from '../../auth/cognito';
import { cn } from '../../lib/utils';

export default function TopBar() {
  const { user, clearAuth } = useAuthStore();
  const { openCommandPalette } = useUiStore();
  const [notifOpen, setNotifOpen] = useState(false);

  const handleSignOut = () => {
    signOut();
    clearAuth();
  };

  return (
    <header
      className="h-14 shrink-0 flex items-center gap-4 px-5 border-b border-[var(--border-subtle)]"
      style={{
        background: 'rgba(17, 18, 24, 0.82)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 30,
      }}
    >
      <button
        onClick={openCommandPalette}
        className={cn(
          'flex items-center gap-2 h-8 px-3 rounded-md text-sm flex-1 max-w-xs',
          'bg-brand-elevated border border-[var(--border-subtle)] text-brand-silver/60',
          'hover:border-[var(--border-default)] hover:text-brand-silver/80 transition-colors duration-150',
          'cursor-text'
        )}
        aria-label="Open command palette"
      >
        <MagnifyingGlass size={14} />
        <span className="flex-1 text-left">Search...</span>
        <kbd className="hidden sm:flex items-center gap-0.5 text-[10px] border border-[var(--border-subtle)] rounded px-1.5 py-0.5 font-mono text-brand-silver/50">
          <Command size={10} />K
        </kbd>
      </button>

      <div className="flex items-center gap-1 ml-auto">
        <div className="relative">
          <button
            onClick={() => setNotifOpen((o) => !o)}
            className="relative w-8 h-8 flex items-center justify-center rounded-md text-brand-silver/60 hover:text-brand-silver/90 hover:bg-brand-elevated transition-colors duration-150"
            aria-label="Notifications"
          >
            <Bell size={17} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-brand-rose" />
          </button>
          {notifOpen && (
            <NotificationPanel onClose={() => setNotifOpen(false)} />
          )}
        </div>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              className="flex items-center gap-2 h-8 pl-1 pr-2 rounded-md hover:bg-brand-elevated transition-colors duration-150 outline-none"
              aria-label="User menu"
            >
              <Avatar name={user?.name} size="sm" />
              <span className="hidden sm:block text-xs text-brand-silver/80 max-w-[100px] truncate">
                {user?.name ?? user?.email}
              </span>
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={6}
              className="z-50 w-48 bg-brand-elevated border border-[var(--border-default)] rounded-lg shadow-xl p-1 animate-slide-up"
            >
              <div className="px-3 py-2 border-b border-[var(--border-subtle)] mb-1">
                <p className="text-xs font-medium text-brand-silver/85 truncate">{user?.name}</p>
                <p className="text-[10px] text-brand-silver/60 truncate">{user?.email}</p>
                <p className="text-[10px] text-brand-rose mt-0.5">{user?.role}</p>
              </div>

              <DropdownMenu.Item
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-brand-silver/80 hover:text-brand-silver hover:bg-brand-highlight rounded cursor-pointer outline-none transition-colors"
                onClick={() => window.location.href = '/settings'}
              >
                Settings
              </DropdownMenu.Item>

              <DropdownMenu.Separator className="h-px bg-[var(--border-subtle)] my-1" />

              <DropdownMenu.Item
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-brand-rose hover:text-brand-rose hover:bg-[var(--accent-rose-muted)] rounded cursor-pointer outline-none transition-colors"
                onClick={handleSignOut}
              >
                Sign out
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}
