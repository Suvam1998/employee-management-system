import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Attach bearer token (fallback for environments where cross-site cookies are blocked)
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('ems_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export function extractError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string; details?: { field: string; message: string }[] };
    if (data?.details?.length) {
      return data.details.map((d) => `${d.field}: ${d.message}`).join(', ');
    }
    return data?.message || err.message;
  }
  return 'Something went wrong';
}
