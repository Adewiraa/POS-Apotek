import axios from "axios";

// Setup Axios instance dengan default config
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
  headers: {
    "Accept": "application/json",
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Interceptor untuk Token
apiClient.interceptors.request.use(
  (config) => {
    // Read from Zustand persist storage directly for simplicity in interceptor
    if (typeof window !== 'undefined') {
      const authStorage = localStorage.getItem("auth-storage");
      if (authStorage) {
        const { state } = JSON.parse(authStorage);
        if (state?.token) {
          config.headers.Authorization = `Bearer ${state.token}`;
        }
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global Error Handler
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error("Unauthorized: Session expired");
      if (typeof window !== 'undefined') {
        // Hapus cookie dan state lokal, lalu redirect
        document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
        localStorage.removeItem("auth-storage");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

