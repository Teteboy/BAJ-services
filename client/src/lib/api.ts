import axios, { AxiosError, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios';
import type { PaginatedResponse } from '@/types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('baj_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<{ message?: string }>) => {
    const url = error.config?.url ?? '';
    const isAuthCheck = url.includes('/auth/me') || url.includes('/auth/login');
    if (error.response?.status === 401 && !isAuthCheck) {
      localStorage.removeItem('baj_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

export async function get<T>(url: string, params?: Record<string, unknown>) {
  const res = await api.get<T>(url, { params });
  return res.data;
}

export async function getList<T>(url: string, params?: Record<string, unknown>) {
  const res = await api.get<PaginatedResponse<T>>(url, { params });
  return res.data;
}

export async function post<T>(url: string, data?: unknown) {
  const res = await api.post<T>(url, data);
  return res.data;
}

export async function patch<T>(url: string, data?: unknown) {
  const res = await api.patch<T>(url, data);
  return res.data;
}

export async function put<T>(url: string, data?: unknown) {
  const res = await api.put<T>(url, data);
  return res.data;
}

export async function del<T>(url: string) {
  const res = await api.delete<T>(url);
  return res.data;
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message || 'An error occurred';
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
}
