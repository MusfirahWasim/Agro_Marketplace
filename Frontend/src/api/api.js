import axios from "axios";

const baseURL = import.meta.env.VITE_baseURL;

const api = axios.create({
  baseURL,
});

// attaches token to every request automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// On a 401, silently refresh the access token once and retry the
// original request — so an expired token doesn't force a manual
// re-login while a valid refresh token still exists.
//
// Uses a plain `axios.post` for the refresh call itself (not `api`),
// so this interceptor can never recursively trigger on its own request.
//
// isRefreshing + pendingQueue handle the case where several requests
// fire at once (e.g. multiple components loading data on page mount)
// and all hit 401 together — only the FIRST one actually calls
// /refresh; the rest wait in the queue and retry once it resolves,
// instead of each independently calling /refresh.
let isRefreshing = false;
let pendingQueue = [];

function resolvePendingQueue(error, token = null) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  pendingQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refresh_token = localStorage.getItem("refresh_token");
      const { data } = await axios.post(`${baseURL}/api/auth/refresh`, {
        refresh_token,
      });

      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);

      resolvePendingQueue(null, data.access_token);
      originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
      return api(originalRequest);
    } catch (refreshError) {
      resolvePendingQueue(refreshError, null);
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      window.location.href = "/login";
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;