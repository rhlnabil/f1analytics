import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  timeout: 20000,   // ✅ 20s max — évite les chargements infinis
});

/* ===== Intercepteur requête : ajoute le JWT ===== */
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

/* ===== Intercepteur réponse ===== */
api.interceptors.response.use(
  res => res,
  err => {
    const status = err.response?.status;
    const url = err.config?.url || '';

    console.warn(`[API] ${status} on ${url}`);

    /* ✅ Ne JAMAIS déconnecter sur les endpoints publics
       (news, drivers, teams, races, standings...) */
    const isPublicEndpoint =
      url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/qr-login') ||
      url === '/news' ||
      url.startsWith('/news?') ||
      url.startsWith('/drivers') ||
      url.startsWith('/teams') ||
      url.startsWith('/races') ||
      url.startsWith('/circuits') ||
      url.startsWith('/results') ||
      url.startsWith('/standings') ||
      url.startsWith('/health');

    if (status === 401 && !isPublicEndpoint) {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      localStorage.removeItem('role');
      if (window.location.pathname.startsWith('/admin') ||
          window.location.pathname.startsWith('/fan')) {
        window.location.href = '/login';
      }
    }

    if (status === 403) {
      console.warn('⚠️ Accès refusé (403) — reste connecté');
    }

    return Promise.reject(err);
  }
);

export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data;
};

export const API_BASE = 'http://localhost:8080';

export default api;