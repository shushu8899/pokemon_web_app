import React, { createContext, useContext, useState, useEffect } from 'react';
import { clearAuthTokens, getUserEmail, isAuthenticated as checkAuth, setAuthTokens } from '../services/auth-service';

interface AuthContextType {
  isAuthenticated: boolean;
  user: { email: string | null } | null;
  login: (accessToken: string, email: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  login: () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ email: string | null } | null>(null);

  // Check authentication status when component mounts or localStorage changes
  useEffect(() => {
    const checkAuthStatus = () => {
      if (checkAuth()) {
        setIsAuthenticated(true);
        setUser({ email: getUserEmail() });
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    };

    checkAuthStatus();
    
    // Listen for storage events (in case of multiple tabs)
    window.addEventListener('storage', checkAuthStatus);
    return () => window.removeEventListener('storage', checkAuthStatus);
  }, []);

  const login = (accessToken: string, email: string) => {
    setAuthTokens(accessToken, email);
    setIsAuthenticated(true);
    setUser({ email });
    // Optionally store the token in sessionStorage/localStorage for direct access later
    sessionStorage.setItem('access_token', accessToken);  // or localStorage, based on your needs
  };

  const logout = () => {
    clearAuthTokens();
    setIsAuthenticated(false);
    setUser(null);
    // Clear token from storage on logout
    sessionStorage.removeItem('access_token');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 