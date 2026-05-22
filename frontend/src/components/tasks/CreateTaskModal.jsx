import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from '@phosphor-icons/react';
import { useCreateTask } from '../../hooks/useTasks';
import { useUsers } from '../../hooks/useUsers';
import { useProjects } from '../../hooks/useProjects';
import { useTeams } from '../../hooks/useTeams';
import Input, { Textarea } from '../ui/Input';
import { Select } from '../ui/Select';
import Button from '../ui/Button';
import useUiStore from '../../store/uiStore';
import useAuthStore from '../../store/authStore';
import { PRIORITIES, STATUSES, STATUS_LABELS } from '../../lib/constants';

const initialForm = {
  title: '',
  description: '',
  priority: 'Medium',
  status: 'ToDo',
  deadline: '',
  assigneeId: '',
  projectId: '',
  teamId: '',
};

export default function CreateTaskModal() {
  const { closeCreateTask } = useUiStore();
  const { user } = useAuthStore();
  const [form, setForm] = useState({ ...initialForm, teamId: user?.teamId ?? '' });
  const [errors, setErrors] = useState({});

  const createTask = useCreateTask();
  const { data: users = [] } = useUsers();
  const { data: projects = [] } = useProjects();
  const { data: teams = [] } = useTeams();

  const assignableUsers = users.filter(
    (u) => !form.teamId || u.teamId === form.teamId
  );

  const set = (key, val) => {
    setForm((f) => ({ ...f, [key]: val }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: null }));
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.teamId) errs.teamId = 'Team is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const payload = {
      ...form,
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      assigneeId: form.assigneeId || undefined,
      projectId: form.projectId || undefined,
      deadline: form.deadline || undefined,
    };
    createTask.mutate(payload, { onSuccess: closeCreateTask });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={closeCreateTask}
      >
        <div className="absolute inset-0 bg-brand-base/70 backdrop-blur-sm" aria-hidden="true" />

        <motion.div
          initial={{ scale: 0.96, opacity: 0, y: 8 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 4 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-lg bg-brand-overlay rounded-xl border border-[var(--border-default)] shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
            <h2 className="text-sm font-semibold text-brand-silver">Create Task</h2>
            <button
              onClick={closeCreateTask}
              className="w-7 h-7 flex items-center justify-center rounded text-brand-silver/30 hover:text-brand-silver/70 hover:bg-brand-elevated transition-colors"
            >
              <X size={15} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
            <Input
              label="Title"
              required
              placeholder="What needs to be done?"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              error={errors.title}
              autoFocus
            />

            <Textarea
              label="Description"
              placeholder="Add context or acceptance criteria..."
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={3}
            />

            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Priority"
                value={form.priority}
                onValueChange={(v) => set('priority', v)}
                options={PRIORITIES.map((p) => ({ value: p, label: p }))}
              />
              <Select
                label="Status"
                value={form.status}
                onValueChange={(v) => set('status', v)}
                options={STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Team"
                required
                value={form.teamId}
                onValueChange={(v) => { set('teamId', v); set('assigneeId', ''); }}
                placeholder="Select team"
                options={teams.map((t) => ({ value: t.teamId, label: t.name }))}
                error={errors.teamId}
              />
              <Select
                label="Assignee"
                value={form.assigneeId}
                onValueChange={(v) => set('assigneeId', v)}
                placeholder="Unassigned"
                options={assignableUsers.map((u) => ({ value: u.userId, label: u.name || u.email }))}
                disabled={!form.teamId}
              />
            </div>

            {projects.length > 0 && (
              <Select
                label="Project"
                value={form.projectId}
                onValueChange={(v) => set('projectId', v)}
                placeholder="No project"
                options={projects.map((p) => ({ value: p.projectId, label: p.title }))}
              />
            )}

            <Input
              label="Deadline"
              type="date"
              value={form.deadline}
              onChange={(e) => set('deadline', e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
              <Button variant="ghost" size="md" type="button" onClick={closeCreateTask}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                type="submit"
                loading={createTask.isPending}
              >
                Create task
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
