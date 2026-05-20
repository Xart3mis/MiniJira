import axios from 'axios';

const baseURL = import.meta.env.VITE_BACKEND_URL
  || import.meta.env.REACT_APP_BACKEND_URL
  || 'http://localhost:5000';

const api = axios.create({
  baseURL
});

api.interceptors.request.use((config) => {
  const raw = localStorage.getItem('minijira_auth');
  if (raw) {
    try {
      const auth = JSON.parse(raw);
      if (auth?.token) {
        config.headers.Authorization = `Bearer ${auth.token}`;
      }
    } catch (error) {
      localStorage.removeItem('minijira_auth');
    }
  }
  return config;
});

export default api;
