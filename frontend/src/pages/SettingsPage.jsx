import { useState } from 'react';
import { useMe, useUpdateMe } from '../hooks/useUsers';
import { useUsers } from '../hooks/useUsers';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { SkeletonText } from '../components/ui/Skeleton';
import useAuthStore from '../store/authStore';

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const { data: me, isLoading } = useMe();
  const updateMe = useUpdateMe();

  const [form, setForm] = useState({ name: user?.name ?? '' });
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    updateMe.mutate(
      { id: user.userId, data: { name: form.name.trim() } },
      {
        onSuccess: () => {
          updateUser({ name: form.name.trim() });
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        },
      }
    );
  };

  return (
    <div className="px-6 py-6 max-w-[640px] mx-auto">
      <h1 className="text-lg font-semibold text-brand-silver mb-6">Settings</h1>

      <section className="mb-8">
        <h2 className="text-xs font-medium text-brand-silver/40 uppercase tracking-widest mb-4">
          Profile
        </h2>

        <div className="flex items-center gap-4 mb-5">
          <Avatar name={user?.name} size="xl" />
          <div>
            {isLoading ? (
              <SkeletonText lines={2} />
            ) : (
              <>
                <p className="text-sm font-medium text-brand-silver/80">{me?.name || user?.name}</p>
                <p className="text-xs text-brand-silver/35 mt-0.5">{user?.email}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge variant={user?.role === 'Manager' ? 'rose' : 'default'}>
                    {user?.role}
                  </Badge>
                  {user?.teamId && (
                    <Badge variant="teal">Team: {user.teamId.slice(0, 8)}</Badge>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Display name"
            value={form.name}
            onChange={(e) => setForm({ name: e.target.value })}
            placeholder="Your full name"
            required
          />
          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              size="md"
              type="submit"
              loading={updateMe.isPending}
            >
              Save changes
            </Button>
            {saved && (
              <span className="text-xs text-brand-teal">Saved</span>
            )}
          </div>
        </form>
      </section>

      <section className="mb-8">
        <h2 className="text-xs font-medium text-brand-silver/40 uppercase tracking-widest mb-4">
          Account
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2.5 border-b border-[var(--border-subtle)]">
            <span className="text-sm text-brand-silver/50">Email</span>
            <span className="text-sm text-brand-silver/40 font-mono">{user?.email}</span>
          </div>
          <div className="flex items-center justify-between py-2.5 border-b border-[var(--border-subtle)]">
            <span className="text-sm text-brand-silver/50">Role</span>
            <Badge variant={user?.role === 'Manager' ? 'rose' : 'default'}>{user?.role}</Badge>
          </div>
          <div className="flex items-center justify-between py-2.5 border-b border-[var(--border-subtle)]">
            <span className="text-sm text-brand-silver/50">Team ID</span>
            <span className="text-sm text-brand-silver/40 font-mono">
              {user?.teamId ?? 'Not assigned'}
            </span>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xs font-medium text-brand-silver/40 uppercase tracking-widest mb-4">
          Keyboard shortcuts
        </h2>
        <div className="space-y-2">
          {[
            { key: '⌘K', desc: 'Open command palette' },
            { key: 'Esc', desc: 'Close panel or palette' },
          ].map(({ key, desc }) => (
            <div key={key} className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)]">
              <span className="text-sm text-brand-silver/50">{desc}</span>
              <kbd className="text-[11px] font-mono text-brand-silver/35 border border-[var(--border-default)] rounded px-1.5 py-0.5">
                {key}
              </kbd>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
