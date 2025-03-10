import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './ConfirmRegistrationPage.module.css'; // Import the CSS module

function ConfirmRegistrationPage() {
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || '');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendMessage, setResendMessage] = useState('');
  const navigate = useNavigate();

  interface ConfirmationError {
    response: {
      data: {
        detail: string;
      };
    };
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(''); // Clear the error message when the user clicks the confirm button
    try {
      const response = await axios.post(`http://localhost:8000/confirmation?email=${encodeURIComponent(email)}&confirmation_code=${encodeURIComponent(confirmationCode)}`);
      console.log('Confirmation successful:', response.data);
      setSuccess('Confirmation successful! Please log in.');
      setError('');
      // Redirect to the login page after a delay
      setTimeout(() => {
        navigate('/login');
      }, 2000); // 2 seconds delay
    } catch (error: any) {
      const confirmationError: ConfirmationError = error;
        console.error('Confirmation failed:', confirmationError.response.data);
      setError(confirmationError.response.data.detail || 'Please check your details and try again.');
      setSuccess('');
    }
  };

  const handleResendCode = async () => {
    setError(''); // Clear the error message when the user clicks the resend button
    try {
      const response = await axios.post(`http://localhost:8000/resend-confirmation-code?email=${encodeURIComponent(email)}`);
      console.log('Resend confirmation code successful:', response.data);
      setResendMessage('Confirmation code resent successfully. Please enter the new confirmation code.');
      setError('');
      // Clear the error message after 2 seconds
      setTimeout(() => {
        setResendMessage('');
        }, 3000); // 3 seconds delay
    } catch (error: any) {
      console.error('Resend confirmation code failed:', error.response.data);
      setError('Failed to resend confirmation code. Please try again.');
      setResendMessage('');
    }
  };

  return (
    <div className={styles.confirmPage}>
      <div className={styles.confirmContainer}>
        <h2>Confirm Registration</h2>
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
            <label>Confirmation Code:</label>
            <input
              type="text"
              value={confirmationCode}
              onChange={(e) => setConfirmationCode(e.target.value)}
              required
            />
          </div>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          {success && <p style={{ color: 'green' }}>{success}</p>}
          {resendMessage && <p style={{ color: 'green' }}>{resendMessage}</p>}
          <button type="submit">Confirm</button>
        </form>
        <button onClick={handleResendCode} className={styles.resendButton}>Resend Confirmation Code</button>
      </div>
    </div>
  );
}

export default ConfirmRegistrationPage;