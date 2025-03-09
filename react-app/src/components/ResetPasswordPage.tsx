// This page calls the confirm-password-reset endpoint to reset the user's password.
// Use the reset confirmation code from reset-password endpoint sent to the user's email to reset the password.

// src/components/ResetPasswordPage.tsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './ResetPasswordPage.module.css'; // Import the CSS module

function ResetPasswordPage() {
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || '');
  const [newPassword, setNewPassword] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await axios.post(`http://localhost:8000/confirm-password-reset?email=${encodeURIComponent(email)}&new_password=${encodeURIComponent(newPassword)}&reset_confirmation_code=${encodeURIComponent(resetCode)}`);
      console.log('Password reset successful:', response.data);
      setSuccess('Password reset successful. You can now log in with your new password.');
      setError('');
      // Delay the redirection to the login page
      setTimeout(() => {
        navigate('/login');
      }, 2000); // 2 seconds delay
    } catch (error: any) {
      console.error('Password reset failed:', error.response.data);
      setError('Password reset failed. Please check your details and try again.');
      setSuccess('');
    }
  };

  return (
    <div className={styles.resetPasswordPage}>
      <div className={styles.resetPasswordContainer}>
        <h2>Reset Password</h2>
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
            <label>New Password:</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Reset Confirmation Code:</label>
            <input
              type="text"
              value={resetCode}
              onChange={(e) => setResetCode(e.target.value)}
              required
            />
          </div>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          {success && <p style={{ color: 'green' }}>{success}</p>}
          <button type="submit">Reset Password</button>
        </form>
      </div>
    </div>
  );
}

export default ResetPasswordPage;