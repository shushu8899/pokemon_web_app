import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './LoginPage.module.css'; // Use the same styles as login page

function ConfirmRegistrationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState(location.state?.email || '');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    if (!location.state?.email) {
      navigate('/register');
    }
  }, [location.state, navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate verification code format
    if (!/^\d{6}$/.test(verificationCode)) {
      setError('Please enter a valid 6-digit verification code');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await axios.post(`http://localhost:8000/confirmation?email=${encodeURIComponent(email)}&confirmation_code=${encodeURIComponent(verificationCode)}`);
      
      setSuccess('Email verified successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResendLoading(true);
    setError(null);
    
    try {
      await axios.post(`http://localhost:8000/resend-confirmation-code?email=${encodeURIComponent(email)}`);
      setSuccess('A new verification code has been sent to your email');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      setError('Failed to resend verification code. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginContainer}>
        <h2>Verify Your Email</h2>
        <p className="text-gray-600 text-sm mb-4">
          Please enter the 6-digit verification code sent to your email.
        </p>
        
        {error && <div className="text-red-500 mb-4">{error}</div>}
        {success && <div className="text-green-500 mb-4">{success}</div>}
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <div className="text-center mb-2">
              <label htmlFor="verificationCode">Verification Code:</label>
            </div>
            <input
              type="text"
              id="verificationCode"
              value={verificationCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setVerificationCode(value);
              }}
              placeholder="Enter 6-digit code"
              pattern="\d{6}"
              maxLength={6}
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
              {isLoading ? 'Verifying...' : 'Verify Account'}
            </button>
          </div>
        </form>

        <form className={styles.form}>
          <div className={styles.formGroup}>
            <button
              type="button"
              onClick={handleResendCode}
              disabled={resendLoading}
              className={styles.button}
            >
              {resendLoading ? 'Sending...' : 'Resend Verification Code'}
            </button>
          </div>
        </form>

        <p className={styles.link}>
          <a href="/register" className="text-blue-500 hover:text-blue-700">
            Return to registration
          </a>
        </p>
      </div>
    </div>
  );
}

export default ConfirmRegistrationPage;