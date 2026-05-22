import client from './client';

export const usersApi = {
  getMe: () =>
    client.get('/api/users/me').then((r) => r.data.data),

  getAll: (params = {}) =>
    client.get('/api/users', { params }).then((r) => r.data.data),

  getById: (id) =>
    client.get(`/api/users/${id}`).then((r) => r.data.data),

  create: (data) =>
    client.post('/api/users', data).then((r) => r.data.data),

  update: (id, data) =>
    client.put(`/api/users/${id}`, data).then((r) => r.data.data),
};
