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
  const [isAuthenticated, setIsAuthenticated] = useState(() => checkAuth());
  const [user, setUser] = useState<{ email: string | null } | null>(() => {
    const email = getUserEmail();
    return email ? { email } : null;
  });

  // Check authentication status when component mounts or localStorage changes
  useEffect(() => {
    const checkAuthStatus = () => {
      const authStatus = checkAuth();
      if (authStatus) {
        setIsAuthenticated(true);
        setUser({ email: getUserEmail() });
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    };

    // Check auth status immediately
    checkAuthStatus();
    
    // Listen for storage events (in case of multiple tabs)
    window.addEventListener('storage', checkAuthStatus);
    return () => window.removeEventListener('storage', checkAuthStatus);
  }, []);

  const login = (accessToken: string, email: string) => {
    setAuthTokens(accessToken, email);
    setIsAuthenticated(true);
    setUser({ email });
  };

  const logout = () => {
    clearAuthTokens();
    setIsAuthenticated(false);
    setUser(null);
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