import { useState } from 'react';
import { Plus, X } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTeams, useCreateTeam, useUpdateTeam } from '../hooks/useTeams';
import TeamTable from '../components/teams/TeamTable';
import TeamMembersModal from '../components/teams/TeamMembersModal';
import Input, { Textarea } from '../components/ui/Input';
import Button from '../components/ui/Button';

function TeamForm({ team, onClose }) {
  const isEditing = !!team;
  const createTeam = useCreateTeam();
  const updateTeam = useUpdateTeam();

  const [form, setForm] = useState({
    name: team?.name ?? '',
    description: team?.description ?? '',
  });
  const [errors, setErrors] = useState({});

  const set = (key, val) => {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: null }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setErrors({ name: 'Team name is required' });
      return;
    }
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
    };
    if (isEditing) {
      updateTeam.mutate({ id: team.teamId, data: payload }, { onSuccess: onClose });
    } else {
      createTeam.mutate(payload, { onSuccess: onClose });
    }
  };

  const isPending = createTeam.isPending || updateTeam.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Team name"
        required
        placeholder="e.g. Backend, Design, Platform..."
        value={form.name}
        onChange={(e) => set('name', e.target.value)}
        error={errors.name}
        autoFocus={!isEditing}
      />
      <Textarea
        label="Description"
        placeholder="What does this team own?"
        value={form.description}
        onChange={(e) => set('description', e.target.value)}
        rows={2}
      />
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="ghost" size="md" type="button" onClick={onClose}>Cancel</Button>
        <Button variant="primary" size="md" type="submit" loading={isPending}>
          {isEditing ? 'Save' : 'Create team'}
        </Button>
      </div>
    </form>
  );
}

export default function TeamsPage() {
  const { data: teams = [], isLoading } = useTeams();
  const [formOpen, setFormOpen] = useState(false);
  const [editTeam, setEditTeam] = useState(null);
  const [membersTeam, setMembersTeam] = useState(null);

  const handleEdit = (team) => { setEditTeam(team); setFormOpen(true); };
  const handleClose = () => { setFormOpen(false); setEditTeam(null); };
  const handleManageMembers = (team) => setMembersTeam(team);
  const handleCloseMembers = () => setMembersTeam(null);

  return (
    <div className="px-6 py-6 max-w-[900px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-brand-silver">Teams</h1>
          <p className="text-sm text-brand-silver/35 mt-0.5">{teams.length} teams</p>
        </div>
        {!formOpen && (
          <Button
            variant="primary"
            size="sm"
            iconLeft={<Plus size={14} />}
            onClick={() => setFormOpen(true)}
          >
            New team
          </Button>
        )}
      </div>

      <AnimatePresence>
        {formOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden mb-6"
          >
            <div className="bg-brand-overlay border border-[var(--border-default)] rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-brand-silver">
                  {editTeam ? 'Edit team' : 'New team'}
                </h2>
                <button
                  onClick={handleClose}
                  className="w-6 h-6 flex items-center justify-center rounded text-brand-silver/25 hover:text-brand-silver/60 hover:bg-brand-elevated transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
              <TeamForm team={editTeam} onClose={handleClose} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <TeamTable
        teams={teams}
        isLoading={isLoading}
        onEdit={handleEdit}
        onManageMembers={handleManageMembers}
      />

      {membersTeam && (
        <TeamMembersModal team={membersTeam} onClose={handleCloseMembers} />
      )}
    </div>
  );
}
