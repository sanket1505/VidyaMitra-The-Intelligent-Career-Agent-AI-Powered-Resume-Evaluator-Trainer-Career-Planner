import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const TOKEN_KEY = 'vidyamitra_token';
const REFRESH_TOKEN_KEY = 'vidyamitra_refresh_token';
const USER_ID_KEY = 'vidyamitra_user_id';

const api = axios.create({
  baseURL: apiBaseUrl,
});

const authClient = axios.create({
  baseURL: apiBaseUrl,
});

const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_ID_KEY);
};

const goToLogin = () => {
  if (typeof window === 'undefined') return;
  if (!window.location.pathname.startsWith('/login')) {
    window.location.assign('/login');
  }
};

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

let refreshPromise: Promise<string | null> | null = null;

const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) return null;

  try {
    const res = await authClient.post('/auth/refresh', { refresh_token: refreshToken });
    const nextToken = res.data?.access_token as string | undefined;
    const nextRefreshToken = res.data?.refresh_token as string | undefined;

    if (!nextToken) return null;

    localStorage.setItem(TOKEN_KEY, nextToken);
    if (nextRefreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, nextRefreshToken);
    }

    return nextToken;
  } catch (e) {
    console.error('Token refresh failed:', e);
    return null;
  }
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers = config.headers || {};
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const originalRequest = error.config as RetriableRequestConfig | undefined;

    if (status !== 401 || !originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    const requestUrl = String(originalRequest.url || '');
    if (requestUrl.includes('/auth/login') || requestUrl.includes('/auth/signup') || requestUrl.includes('/auth/refresh')) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }

    const nextToken = await refreshPromise;
    if (!nextToken) {
      clearSession();
      goToLogin();
      return Promise.reject(error);
    }

    originalRequest.headers = originalRequest.headers || {};
    (originalRequest.headers as Record<string, string>).Authorization = `Bearer ${nextToken}`;

    return api(originalRequest);
  },
);

export default api;

