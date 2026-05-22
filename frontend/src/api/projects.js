import client from './client';

export const projectsApi = {
  getAll: (params = {}) =>
    client.get('/api/projects', { params }).then((r) => r.data.data),

  getById: (id) =>
    client.get(`/api/projects/${id}`).then((r) => r.data.data),

  create: (data) =>
    client.post('/api/projects', data).then((r) => r.data.data),

  update: (id, data) =>
    client.put(`/api/projects/${id}`, data).then((r) => r.data.data),

  delete: (id) =>
    client.delete(`/api/projects/${id}`).then((r) => r.data),
};
