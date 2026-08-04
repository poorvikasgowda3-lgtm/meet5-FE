export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 8000
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Request timed out. Please check your connection and try again.");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export function getApiBase(): string {
  const configuredBase = (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE || "").replace(/\/$/, "");
  if (configuredBase) {
    return configuredBase.endsWith("/api") ? configuredBase : `${configuredBase}/api`;
  }

  return "/api";
}

import axios from 'axios';

const api = axios.create({
  baseURL: getApiBase(),
});

// Add a request interceptor to attach the JWT token
api.interceptors.request.use(
  (config) => {
    // In Next.js, localStorage is only available in the browser (client-side)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
