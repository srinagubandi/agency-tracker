/**
 * Axios API Client
 *
 * Centralised HTTP client for all API calls.
 * Automatically attaches the JWT from localStorage to every request.
 * Handles 401 responses by redirecting to the login page.
 */
import axios from "axios";

const API_BASE = "/api/v1";

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// ─── Request interceptor — attach JWT ─────────────────────────────────────────
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response interceptor — handle 401 ───────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/signin";
    }
    return Promise.reject(error);
  }
);

export default apiClient;
