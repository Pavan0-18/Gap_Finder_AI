import axios from "axios";

const envApiUrl = import.meta.env.VITE_API_URL;
export const API_BASE_URL = envApiUrl
  ? (envApiUrl.endsWith("/api/v1") ? envApiUrl : `${envApiUrl.replace(/\/$/, "")}/api/v1`)
  : "/api/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("gapfinder_token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("gapfinder_token");
      localStorage.removeItem("gapfinder_user");
      if (window.location.pathname !== "/login" && window.location.pathname !== "/register") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);
