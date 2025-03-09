// src/components/LoginPage.tsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import styles from './LoginPage.module.css'; // Import the CSS module
import { setAuthTokens } from '../services/auth-service';

interface LoginResponse {
  message: string;
  tokens: {
    id_token: string;
    access_token: string;
    refresh_token: string;
  };
}

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await axios.post<LoginResponse>(`http://localhost:8000/login?email=${email}&password=${password}`);
      console.log('Login successful:', response.data);
      
      // Store the authentication tokens using the auth service
      // We're using the access_token for Bearer authentication
      setAuthTokens(response.data.tokens.access_token, email);
      
      // Redirect to home page
      navigate('/');
    } catch (error: any) {
      console.error('Login failed:', error.response?.data);
      setError(error.response?.data?.detail || 'Login failed. Please check your credentials and try again.');
    }
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginContainer}>
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          <div>
            <label>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <button type="submit">Log In</button>
        </form>
        <p>
          <Link to="/forgot-password" className={styles.forgotPasswordLink}>
            Forgot Password?
          </Link>
        </p>
        <p>
          Don't have an account? 
          <Link to="/register" className={styles.signUpLink}>
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;