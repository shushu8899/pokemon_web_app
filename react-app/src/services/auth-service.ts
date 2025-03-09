// Token management
export const setAuthTokens = (accessToken: string, email: string) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('user_email', email);
};

// Get the raw access token
export const getAccessToken = () => {
    const token = localStorage.getItem('access_token');
    return token;
};

// Get the access token with Bearer prefix for Authorization header
export const getAuthorizationHeader = () => {
    const token = localStorage.getItem('access_token');
    return token ? `Bearer ${token}` : '';
};

// Get the user email
export const getUserEmail = () => {
    return localStorage.getItem('user_email');
};

// Clear authentication tokens
export const clearAuthTokens = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_email');
};

export const isAuthenticated = () => {
    return !!localStorage.getItem('access_token');
}; 