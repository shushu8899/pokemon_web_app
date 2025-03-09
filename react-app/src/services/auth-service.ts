// Token management
export const setAuthTokens = (accessToken: string, email: string) => {
    // Store the raw access token without 'Bearer ' prefix
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
    const token = getAccessToken();
    return token ? `Bearer ${token}` : null;
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