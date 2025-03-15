// src/components/RegistrationPage.tsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import styles from './LoginPage.module.css'; // Reusing the same styles as LoginPage

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  interface RegistrationResponse {
    message: string;
    user_sub: string;
    user_confirmed: boolean;
  }

  interface RegistrationError {
    response: {
      data: string;
    };
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post<RegistrationResponse>(
        `http://localhost:8000/registration?email=${email}&password=${password}`
      );
      console.log('Registration successful:', response.data);
      // Handle successful registration (e.g., redirect to login page)
      navigate('/login'); // Redirect to the login page
    } catch (error: any) {
      const registrationError: RegistrationError = error;
      console.error('Registration failed:', registrationError.response.data);
      setError('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginContainer}>
        <h2>Register</h2>
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
            {isLoading ? 'Registering...' : 'Register'}
          </button>
        </form>
        <p>
          Already have an account?{' '}
          <a href="/login" className="text-blue-500 hover:text-blue-700">
            Login here
          </a>
        </p>
      </div>
    </div>
  );
}

export default Register;