import axios from 'axios';
import { getAuthorizationHeader, clearAuthTokens, isAuthenticated } from './auth-service';

// Create a custom axios instance
const api = axios.create({
    baseURL: 'http://127.0.0.1:8000',
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor to add auth token to requests
api.interceptors.request.use(
    (config) => {
        const authHeader = getAuthorizationHeader();
        if (authHeader) {
            config.headers.Authorization = authHeader;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle token expiration
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If the error is 401 and we haven't retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            // Only clear tokens if we were previously authenticated
            if (isAuthenticated()) {
                clearAuthTokens();
            }
            
            // Let the component handle the error and redirect
            return Promise.reject(new Error('Authentication failed. Please log in again.'));
        }

        return Promise.reject(error);
    }
);

export default api; 