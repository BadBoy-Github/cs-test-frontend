import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Store navigate callback for 401 redirects
let navigateCallback = null;

export const setNavigateCallback = (callback) => {
  navigateCallback = callback;
};

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle token expiration
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, clear storage and redirect
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Use navigate callback if available, otherwise fallback to window.location
      if (navigateCallback && window.location.pathname !== '/') {
        navigateCallback('/');
      } else {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default API;