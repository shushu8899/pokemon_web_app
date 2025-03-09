// src/components/RegistrationPage.tsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

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
      data: string;
    };
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await axios.post<RegistrationResponse>(`http://localhost:8000/registration?email=${email}&password=${password}`);      console.log('Registration successful:', response.data);
      // Handle successful registration (e.g., redirect to login page)
      navigate('/login'); // Redirect to the login page
    } catch (error: any) {
      const registrationError: RegistrationError = error;
      console.error('Registration failed:', registrationError.response.data);
      setError('Registration failed. Please try again.');
    }
  };

  return (
    <div>
      <h2>Register</h2>
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
    </div>
  );
}

export default Register;