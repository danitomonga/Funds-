import axios from "axios";
import { getAccessToken, clearTokens } from "@/lib/auth";

// ============================================================================
// Axios Instance — single source for all API calls
//
// - Base URL from environment variable (VITE_API_URL)
// - Request interceptor injects JWT from localStorage
// - Response interceptor handles 401 → clear tokens → redirect to /login
// ============================================================================

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Request Interceptor: inject JWT ──

api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor: handle 401 ──

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearTokens();
      // Redirect to login — using window.location to ensure full page reload
      // and clearing any stale React state
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
