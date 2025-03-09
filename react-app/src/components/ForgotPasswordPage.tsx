// This page calls the reset-password endpoint to send a reset confirmation code to the user's email.

// src/components/ForgotPasswordPage.tsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import styles from './ForgotPasswordPage.module.css'; // Import the CSS module

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await axios.post(`http://localhost:8000/reset-password?email=${encodeURIComponent(email)}`);
      console.log('Reset confirmation code sent:', response.data);
      setSuccess('Reset confirmation code sent to your email.');
      setError('');
      // Redirect to the reset password page
      navigate('/reset-password', { state: { email } });
    } catch (error: any) {
      console.error('Failed to send reset confirmation code:', error.response.data);
      setError('Failed to send reset confirmation code. Please check your email and try again.');
      setSuccess('');
    }
  };

  return (
    <div className={styles.forgotPasswordPage}>
      <div className={styles.forgotPasswordContainer}>
        <h2>Forgot Password</h2>
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
          {error && <p style={{ color: 'red' }}>{error}</p>}
          {success && <p style={{ color: 'green' }}>{success}</p>}
          <button type="submit">Send Reset Confirmation Code</button>
        </form>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;