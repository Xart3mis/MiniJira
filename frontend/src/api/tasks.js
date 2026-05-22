import client from './client';

const STATUS_NORMALIZE = {
  'To Do': 'ToDo',
  'In Progress': 'InProgress',
  'In Review': 'InReview',
  'Done': 'Done',
  'Blocked': 'ToDo',
};

const normalizeTask = (t) =>
  t?.status && STATUS_NORMALIZE[t.status]
    ? { ...t, status: STATUS_NORMALIZE[t.status] }
    : t;

export const tasksApi = {
  getAll: (params = {}) =>
    client.get('/api/tasks', { params }).then((r) => r.data.data.map(normalizeTask)),

  getById: (id) =>
    client.get(`/api/tasks/${id}`).then((r) => normalizeTask(r.data.data)),

  create: (data) =>
    client.post('/api/tasks', data).then((r) => r.data.data),

  update: (id, data) =>
    client.put(`/api/tasks/${id}`, data).then((r) => r.data.data),

  delete: (id) =>
    client.delete(`/api/tasks/${id}`).then((r) => r.data),

  getActivity: (id) =>
    client.get(`/api/tasks/${id}/activity`).then((r) => r.data.data),
};
