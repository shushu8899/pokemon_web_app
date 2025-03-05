// src/components/LoginPage.tsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import styles from './LoginPage.module.css'; // Import the CSS module

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  interface LoginResponse {
    data: {
      accessToken: string; // Replace 'any' with the actual type if known
    };
  }

  interface LoginError {
    response: {
      data: string;
    };
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response: LoginResponse = await axios.post(`http://localhost:8000/login?email=${email}&password=${password}`);
      console.log('Login successful:', response.data);
      // Store the access token in local storage - so that it can be retrieved later
      localStorage.setItem('accessToken', response.data.accessToken);
      // Handle successful login (e.g., save tokens, redirect to dashboard)
      navigate('/'); // Redirect to a dashboard or home page: dashboard use '/dashboard', home page use '/'
    } catch (error: any) {
      const loginError: LoginError = error;
      console.error('Login failed:', loginError.response.data);
      setError('Login failed. Please check your credentials and try again.');
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