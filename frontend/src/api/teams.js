import client from './client';

export const teamsApi = {
  getAll: () =>
    client.get('/api/teams').then((r) => r.data.data),

  getById: (id) =>
    client.get(`/api/teams/${id}`).then((r) => r.data.data),

  create: (data) =>
    client.post('/api/teams', data).then((r) => r.data.data),

  update: (id, data) =>
    client.put(`/api/teams/${id}`, data).then((r) => r.data.data),

  delete: (id) =>
    client.delete(`/api/teams/${id}`).then((r) => r.data),

  addMember: (teamId, userId) =>
    client.post(`/api/teams/${teamId}/members`, { userId }).then((r) => r.data),

  removeMember: (teamId, userId) =>
    client.delete(`/api/teams/${teamId}/members/${userId}`).then((r) => r.data),
};
