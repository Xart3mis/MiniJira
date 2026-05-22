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
