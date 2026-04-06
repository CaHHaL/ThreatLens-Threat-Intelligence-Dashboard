import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// Use environment variable for API base
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost/api';

const api = axios.create({
    baseURL: `${BASE_URL}/v1`,
    withCredentials: true, // Crucial for sending/receiving HttpOnly cookies (refresh token)
});

// Axios Request Interceptor
// Injects the Access Token into the Authorization header
api.interceptors.request.use(
    (config) => {
        const { accessToken } = useAuthStore.getState();
        if (accessToken) {
            config.headers['Authorization'] = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Axios Response Interceptor
// Detects 401s specifically linked to Access Token expiration, uses exact refresh endpoint, then retries original request
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });

    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Reject immediately if we got a 401 on the refresh endpoint itself
        if (originalRequest.url === '/auth/refresh') {
            return Promise.reject(error);
        }

        // Identify an unauthorized error likely due to expired token
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                // Enqueue concurrent requests while refresh occurs
                return new Promise(function (resolve, reject) {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers['Authorization'] = 'Bearer ' + token;
                    return api(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // The endpoint uses the HttpOnly refresh token cookie implicitly
                const refreshResponse = await axios.post(`${BASE_URL}/v1/auth/refresh`, {}, { withCredentials: true });
                const { access_token } = refreshResponse.data;

                // Update the central store
                useAuthStore.getState().setAuth(useAuthStore.getState().user, access_token);

                // Process delayed queue
                processQueue(null, access_token);

                // Retry the original request
                originalRequest.headers['Authorization'] = `Bearer ${access_token}`;
                return api(originalRequest);

            } catch (refreshError) {
                processQueue(refreshError, null);
                // If refresh fails, forcefully log out the user
                useAuthStore.getState().logout();
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;
