import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import styles from './LoginPage.module.css'; // Reusing the same styles as LoginPage

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Password validation states
  const [validations, setValidations] = useState({
    minLength: false,
    hasUpperCase: false,
    hasSpecialChar: false,
    hasNumber: false
  });

  // Check password requirements as user types
  useEffect(() => {
    setValidations({
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      hasNumber: /[0-9]/.test(password)
    });
  }, [password]);

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
    
    // Check if all password requirements are met
    if (!Object.values(validations).every(Boolean)) {
      setError('Please ensure all password requirements are met.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post<RegistrationResponse>(
        `http://localhost:8000/registration?email=${email}&password=${password}`
      );
      console.log('Registration successful:', response.data);
      // Redirect to confirmation page with email
      navigate('/confirm-registration', { state: { email } });
    } catch (error: any) {
      const registrationError: RegistrationError = error;
      console.error('Registration failed:', registrationError.response.data);
      setError(registrationError.response.data.detail || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginContainer}>
        <h2>Register</h2>
        {error && <div className="text-red-500 mb-4">{error}</div>}
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
            <label htmlFor="password">Password:</label>
            <div className="relative">
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={styles.input}
              />
              <div className="absolute left-full -top-5 ml-12 w-72">
                <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
                
                  <p className="text-gray-700 text-sm font-medium mb-2 pl-1">Your password needs to:</p>
                  <div style={{ lineHeight: '1' }}>
                    <div className={validations.minLength ? 'text-green-500' : 'text-red-500'}>
                      <span className="inline-block w-4">{validations.minLength ? '✓' : '✕'}</span>
                      <span className="text-xs">Contain at least 8 characters</span>
                    </div>
                    <div className={validations.hasUpperCase ? 'text-green-500' : 'text-red-500'}>
                      <span className="inline-block w-4">{validations.hasUpperCase ? '✓' : '✕'}</span>
                      <span className="text-xs">Contain at least one uppercase letter</span>
                    </div>
                    <div className={validations.hasNumber ? 'text-green-500' : 'text-red-500'}>
                      <span className="inline-block w-4">{validations.hasNumber ? '✓' : '✕'}</span>
                      <span className="text-xs">Contain at least one number</span>
                    </div>
                    <div className={validations.hasSpecialChar ? 'text-green-500' : 'text-red-500'}>
                      <span className="inline-block w-4">{validations.hasSpecialChar ? '✓' : '✕'}</span>
                      <span className="text-xs">Contain at least one special character</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className={styles.formGroup}>
            <button type="submit" disabled={isLoading} className={styles.button}>
              {isLoading ? 'Registering...' : 'Register'}
            </button>
          </div>
        </form>
        <p className={styles.link}>
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