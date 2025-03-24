// src/components/LoginPage.tsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import styles from './LoginPage.module.css';
import { useAuth } from '../context/AuthContext';

interface LoginResponse {
  message: string;
  tokens: {
    access_token: string;
  };
}

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get the return URL from location state, or default to '/'
  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post<LoginResponse>(
        `http://localhost:8000/login?email=${email}&password=${password}`
      );
      
      // Store tokens and update auth context
      login(response.data.tokens.access_token, email);
      
      // Navigate to the return URL
      navigate(from, { replace: true });
    } catch (error: any) {
      console.error('Login failed:', error.response?.data);
      setError(error.response?.data?.detail || 'Login failed. Please check your credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginContainer}>
        <h2>Login</h2>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p>
          <a href="/forgot-password" className="text-blue-500 hover:text-blue-700">
            Forgot Password?
          </a>
        </p>
        <p>
          Don't have an account?{' '}
          <a href="/register" className="text-blue-500 hover:text-blue-700">
            Register here
          </a>
        </p>
      </div>
    </div>
  );
}

export default Login;