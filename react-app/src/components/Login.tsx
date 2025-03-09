import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api, { saveTokens, type LoginResponse } from '../services/api';
import pokemonSpinner from "../assets/pokeballloading.gif";

interface LocationState {
    from: string;
}

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    
    const navigate = useNavigate();
    const location = useLocation();
    const from = (location.state as LocationState)?.from || '/';

    useEffect(() => {
        const checkAuth = () => {
            console.log('Login: Checking existing authentication...');
            const token = localStorage.getItem('access_token');
            if (token) {
                console.log('Login: Token found, redirecting...');
                navigate('/', { replace: true });
            } else {
                console.log('Login: No token found, showing login form');
            }
            setIsCheckingAuth(false);
        };

        checkAuth();
    }, [navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            console.log('Login: Attempting login...');
            const response = await api.post<LoginResponse>('/login', {
                email,
                password
            });

            console.log('Login: Response received:', response.data.message);

            if (response.data.tokens) {
                console.log('Login: Tokens received, saving...');
                saveTokens(response.data);
                
                console.log('Login: Navigating to:', from);
                if (from === '/login') {
                    navigate('/', { replace: true });
                } else {
                    navigate(from, { replace: true });
                }
            }
        } catch (err: any) {
            console.error('Login error:', err);
            if (err.response) {
                setError(err.response.data.detail || 'Login failed');
            } else {
                setError("An unexpected error occurred");
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (isCheckingAuth) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <img src={pokemonSpinner} alt="Loading..." className="w-16 h-16" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Sign in to your account
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Please sign in to access this feature
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="email-address" className="sr-only">
                                Email address
                            </label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="rounded-md bg-red-50 p-4">
                            <div className="flex">
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-red-800">
                                        {error}
                                    </h3>
                                </div>
                            </div>
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                                isLoading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
                            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                        >
                            {isLoading ? (
                                <div className="flex items-center">
                                    <img src={pokemonSpinner} alt="Loading..." className="w-5 h-5 mr-2" />
                                    <span>Signing in...</span>
                                </div>
                            ) : (
                                'Sign in'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login; 