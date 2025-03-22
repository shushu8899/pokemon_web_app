import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000';

const TOKEN_KEY = 'auth_token';
const USER_EMAIL_KEY = 'user_email';

// Token management
export const setAuthTokens = (accessToken: string, email: string) => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(USER_EMAIL_KEY, email);
};

// Get the raw access token
export const getAccessToken = () => {
    return localStorage.getItem(TOKEN_KEY);
};

// Get the access token with Bearer prefix for Authorization header
export const getAuthorizationHeader = () => {
    const token = localStorage.getItem(TOKEN_KEY);
    return token ? `Bearer ${token}` : null;
};

// Get the user email
export const getUserEmail = () => {
    return localStorage.getItem(USER_EMAIL_KEY);
};

// Clear authentication tokens
export const clearAuthTokens = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_EMAIL_KEY);
};

export const login = async (username: string, password: string) => {
    try {
        const response = await axios.post(`${API_URL}/auth/login`, {
            username,
            password
        });
        
        if (response.data.access_token) {
            // Store the token in localStorage
            localStorage.setItem(TOKEN_KEY, response.data.access_token);
            return response.data;
        }
        throw new Error('No access token received');
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
};

export const logout = () => {
    clearAuthTokens();
};

export const isAuthenticated = () => {
    return !!localStorage.getItem(TOKEN_KEY);
}; 