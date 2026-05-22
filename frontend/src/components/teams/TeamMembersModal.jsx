import { useState } from 'react';
import { X, UserPlus, Trash } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUsers } from '../../hooks/useUsers';
import { useAddMember, useRemoveMember } from '../../hooks/useTeams';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import { Select } from '../ui/Select';

export default function TeamMembersModal({ team, onClose }) {
  const [selectedUserId, setSelectedUserId] = useState('');

  const { data: allUsers = [] } = useUsers();
  const addMember = useAddMember();
  const removeMember = useRemoveMember();

  // Use team.members[] as the authoritative source so we're never
  // blocked by a stale or mismatched user.teamId field.
  const memberIds = new Set(team.members || []);
  const currentMembers = allUsers.filter((u) => memberIds.has(u.userId));

  // Available = not a Manager, not already a member, and not on another team
  const availableUsers = allUsers.filter(
    (u) =>
      u.role !== 'Manager' &&
      !memberIds.has(u.userId) &&
      (!u.teamId || u.teamId === '')
  );

  const addOptions = availableUsers.map((u) => ({
    value: u.userId,
    label: u.name || u.email,
  }));

  const handleAdd = () => {
    if (!selectedUserId) return;
    addMember.mutate(
      { teamId: team.teamId, userId: selectedUserId },
      { onSuccess: () => setSelectedUserId('') }
    );
  };

  const handleRemove = (userId) => {
    removeMember.mutate({ teamId: team.teamId, userId });
  };

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          key="panel"
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.18 }}
          className="w-full max-w-md bg-brand-overlay border border-[var(--border-default)] rounded-xl shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
            <div>
              <h2 className="text-sm font-semibold text-brand-silver">
                Manage members
              </h2>
              <p className="text-xs text-brand-silver/35 mt-0.5">{team.name}</p>
            </div>
            <button
              onClick={onClose}
              className="w-6 h-6 flex items-center justify-center rounded text-brand-silver/25 hover:text-brand-silver/60 hover:bg-brand-elevated transition-colors"
              aria-label="Close"
            >
              <X size={14} />
            </button>
          </div>

          {/* Current members */}
          <div className="px-5 py-4">
            <p className="text-xs font-medium text-brand-silver/35 uppercase tracking-wide mb-3">
              Current members
              <span className="ml-1.5 font-mono">{currentMembers.length}</span>
            </p>

            {currentMembers.length === 0 ? (
              <p className="text-xs text-brand-silver/30 italic py-2">No members yet</p>
            ) : (
              <ul className="space-y-1">
                {currentMembers.map((user) => (
                  <li
                    key={user.userId}
                    className="flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-brand-elevated/40 group transition-colors"
                  >
                    <Avatar name={user.name || user.email} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-brand-silver/80 truncate">{user.name || user.email}</p>
                      {user.name && (
                        <p className="text-xs text-brand-silver/35 truncate">{user.email}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemove(user.userId)}
                      disabled={removeMember.isPending}
                      className="w-6 h-6 flex items-center justify-center rounded text-brand-silver/20 hover:text-brand-rose hover:bg-[var(--accent-rose-muted)] opacity-0 group-hover:opacity-100 transition-all"
                      aria-label={`Remove ${user.name || user.email}`}
                    >
                      <Trash size={12} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Add member */}
          <div className="px-5 pb-5 border-t border-[var(--border-subtle)] pt-4">
            <p className="text-xs font-medium text-brand-silver/35 uppercase tracking-wide mb-3">
              Add member
            </p>
            {availableUsers.length === 0 ? (
              <p className="text-xs text-brand-silver/30 italic">
                No unassigned employees available
              </p>
            ) : (
              <div className="flex gap-2">
                <div className="flex-1">
                  <Select
                    value={selectedUserId}
                    onValueChange={setSelectedUserId}
                    placeholder="Select an employee..."
                    options={addOptions}
                  />
                </div>
                <Button
                  variant="teal"
                  size="md"
                  iconLeft={<UserPlus size={14} />}
                  onClick={handleAdd}
                  disabled={!selectedUserId}
                  loading={addMember.isPending}
                >
                  Add
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
