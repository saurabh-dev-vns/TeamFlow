import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  // The auth token now lives in an httpOnly cookie set by the server (not
  // in localStorage), so the browser needs to send credentials with every
  // request instead of us attaching an Authorization header manually.
  withCredentials: true,
});

// If the session is invalid/expired, clear local UI state and bounce to login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('teamflow_user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
