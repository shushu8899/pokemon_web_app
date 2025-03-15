// This page calls the reset-password endpoint to send a reset confirmation code to the user's email.

// src/components/ForgotPasswordPage.tsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import styles from './LoginPage.module.css'; // Using the same styles as login page

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginContainer}>
        <h2>Forgot Password</h2>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        {success && <div className="text-green-500 mb-4">{success}</div>}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={styles.input}
            />
          </div>
          <div className={styles.formGroup}>
            <button 
              type="submit" 
              disabled={isLoading}
              className={styles.button}
            >
              {isLoading ? 'Sending...' : 'Send Reset Confirmation Code'}
            </button>
          </div>
        </form>
        <p className={styles.link}>
          Remember your password?{' '}
          <a href="/login" className="text-blue-500 hover:text-blue-700">
            Back to login
          </a>
        </p>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;