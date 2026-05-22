import { useState, useEffect } from 'react';
import Input, { Textarea } from '../ui/Input';
import { Select } from '../ui/Select';
import Button from '../ui/Button';
import { useCreateProject, useUpdateProject } from '../../hooks/useProjects';
import { useTeams } from '../../hooks/useTeams';
import useAuthStore from '../../store/authStore';

export default function ProjectForm({ project, onClose }) {
  const { user } = useAuthStore();
  const isEditing = !!project;
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const { data: teams = [] } = useTeams();

  const [form, setForm] = useState({
    title: '',
    description: '',
    teamId: user?.teamId ?? '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (project) {
      setForm({
        title: project.title ?? '',
        description: project.description ?? '',
        teamId: project.teamId ?? '',
      });
    }
  }, [project]);

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
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      teamId: form.teamId,
    };
    if (isEditing) {
      updateProject.mutate({ id: project.projectId, data: payload }, { onSuccess: onClose });
    } else {
      createProject.mutate(payload, { onSuccess: onClose });
    }
  };

  const isPending = createProject.isPending || updateProject.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Project name"
        required
        placeholder="e.g. Backend refactor, Q3 roadmap..."
        value={form.title}
        onChange={(e) => set('title', e.target.value)}
        error={errors.title}
        autoFocus={!isEditing}
      />
      <Textarea
        label="Description"
        placeholder="What is this project about?"
        value={form.description}
        onChange={(e) => set('description', e.target.value)}
        rows={3}
      />
      <Select
        label="Team"
        required
        value={form.teamId}
        onValueChange={(v) => set('teamId', v)}
        placeholder="Select team"
        options={teams.map((t) => ({ value: t.teamId, label: t.name }))}
        error={errors.teamId}
      />
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" size="md" type="button" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" size="md" type="submit" loading={isPending}>
          {isEditing ? 'Save changes' : 'Create project'}
        </Button>
      </div>
    </form>
  );
}
