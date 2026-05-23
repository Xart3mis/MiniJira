import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamsApi } from '../api/teams';
import toast from 'react-hot-toast';

export function useTeams() {
  return useQuery({
    queryKey: ['teams'],
    queryFn: teamsApi.getAll,
    placeholderData: (prev) => prev,
  });
}

export function useTeam(id) {
  return useQuery({
    queryKey: ['teams', id],
    queryFn: () => teamsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: teamsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Team created');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create team');
    },
  });
}

export function useUpdateTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => teamsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Team updated');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update team');
    },
  });
}

export function useDeleteTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: teamsApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Team deleted');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete team');
    },
  });
}

export function useAddMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ teamId, userId }) => teamsApi.addMember(teamId, userId),
    onMutate: async ({ teamId, userId }) => {
      await qc.cancelQueries({ queryKey: ['teams'] });
      await qc.cancelQueries({ queryKey: ['users'] });

      const prevTeams = qc.getQueryData(['teams']);
      const prevUsers = qc.getQueryData(['users']);

      qc.setQueryData(['teams'], (old = []) =>
        old.map((t) =>
          t.teamId === teamId
            ? { ...t, members: [...(t.members || []), userId] }
            : t
        )
      );

      qc.setQueryData(['users'], (old = []) =>
        old.map((u) => (u.userId === userId ? { ...u, teamId } : u))
      );

      return { prevTeams, prevUsers };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prevTeams !== undefined) qc.setQueryData(['teams'], ctx.prevTeams);
      if (ctx?.prevUsers !== undefined) qc.setQueryData(['users'], ctx.prevUsers);
      toast.error(err.response?.data?.message || 'Failed to add member');
    },
    onSuccess: () => {
      toast.success('Member added');
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['teams'] });
      qc.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useRemoveMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ teamId, userId }) => teamsApi.removeMember(teamId, userId),
    onMutate: async ({ teamId, userId }) => {
      await qc.cancelQueries({ queryKey: ['teams'] });
      await qc.cancelQueries({ queryKey: ['users'] });

      const prevTeams = qc.getQueryData(['teams']);
      const prevUsers = qc.getQueryData(['users']);

      qc.setQueryData(['teams'], (old = []) =>
        old.map((t) =>
          t.teamId === teamId
            ? { ...t, members: (t.members || []).filter((id) => id !== userId) }
            : t
        )
      );

      qc.setQueryData(['users'], (old = []) =>
        old.map((u) => (u.userId === userId ? { ...u, teamId: '' } : u))
      );

      return { prevTeams, prevUsers };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prevTeams !== undefined) qc.setQueryData(['teams'], ctx.prevTeams);
      if (ctx?.prevUsers !== undefined) qc.setQueryData(['users'], ctx.prevUsers);
      toast.error(err.response?.data?.message || 'Failed to remove member');
    },
    onSuccess: () => {
      toast.success('Member removed');
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['teams'] });
      qc.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
