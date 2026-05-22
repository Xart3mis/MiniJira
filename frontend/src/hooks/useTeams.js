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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams'] });
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('Member added');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to add member');
    },
  });
}

export function useRemoveMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ teamId, userId }) => teamsApi.removeMember(teamId, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams'] });
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('Member removed');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to remove member');
    },
  });
}
