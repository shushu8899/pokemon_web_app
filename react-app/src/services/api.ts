import axios from 'axios';

interface CognitoTokens {
    id_token: string;
    access_token: string;
    refresh_token: string;
}

interface LoginResponse {
    message: string;
    tokens: CognitoTokens;
}

// Token management functions
const saveTokens = (response: LoginResponse) => {
    if (!response.tokens) {
        throw new Error('No tokens in response');
    }
    
    localStorage.setItem('id_token', response.tokens.id_token);
    localStorage.setItem('access_token', response.tokens.access_token);
    localStorage.setItem('refresh_token', response.tokens.refresh_token);
};

const clearTokens = () => {
    localStorage.removeItem('id_token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
};

const getAccessToken = () => localStorage.getItem('access_token');
const getRefreshToken = () => localStorage.getItem('refresh_token');

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
        const accessToken = getAccessToken();
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
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

            try {
                // Try to refresh the token
                const refreshToken = getRefreshToken();
                if (refreshToken) {
                    const response = await axios.post<LoginResponse>('http://127.0.0.1:8000/refresh-token', {
                        refresh_token: refreshToken
                    });

                    if (response.data.tokens) {
                        // Save new tokens
                        saveTokens(response.data);
                        
                        // Retry the original request with new token
                        originalRequest.headers.Authorization = `Bearer ${response.data.tokens.access_token}`;
                        return axios(originalRequest);
                    }
                }
            } catch (refreshError) {
                // If refresh fails, clear tokens and redirect to login
                clearTokens();
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

console.log(localStorage.getItem('access_token'));

export { saveTokens, clearTokens, getAccessToken };
export type { LoginResponse };
export default api; 