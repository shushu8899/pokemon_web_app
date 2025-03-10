import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import styles from './RegistrationPage.module.css'; // Import the CSS module

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  interface RegistrationResponse {
    message: string;
    user_sub: string;
    user_confirmed: boolean;
  }

  interface RegistrationError {
    response: {
      data: {
        detail: string;
      };
    };
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await axios.post<RegistrationResponse>(`http://localhost:8000/registration?email=${email}&password=${password}`);      
      console.log('Registration successful:', response.data);
      // Handle successful registration (e.g., redirect to confirm registration page)
      navigate('/confirm-registration', { state: { email } });
    } catch (error: any) {
      const registrationError: RegistrationError = error;
      console.error('Registration failed:', registrationError.response.data);
      setError(registrationError.response.data.detail || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className={styles.registerPage}>
      <div className={styles.registerContainer}>
        <h2 className={styles.boldText}>Sign Up</h2>
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
          <button type="submit">Register</button>
        </form>
        <p>
          Already have an account? 
          <Link to="/login" className={styles.signUpLink}>
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;