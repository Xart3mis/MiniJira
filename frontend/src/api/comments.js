import client from './client';

export const commentsApi = {
  getByTask: (taskId) =>
    client.get(`/api/tasks/${taskId}/comments`).then((r) => r.data.data),

  create: (taskId, data) =>
    client.post(`/api/tasks/${taskId}/comments`, data).then((r) => r.data.data),
};
