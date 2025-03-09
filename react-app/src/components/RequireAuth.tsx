import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import pokemonSpinner from "../assets/pokeballloading.gif";

interface RequireAuthProps {
    children: React.ReactNode;
}

const RequireAuth: React.FC<RequireAuthProps> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const location = useLocation();

    useEffect(() => {
        const checkAuth = () => {
            console.log('Checking authentication...');
            const token = localStorage.getItem('access_token');
            console.log('Token exists:', !!token);
            setIsAuthenticated(!!token);
            setIsLoading(false);
        };

        checkAuth();
    }, []);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <img src={pokemonSpinner} alt="Loading..." className="w-16 h-16" />
            </div>
        );
    }

    console.log('Authentication state:', isAuthenticated);
    console.log('Current location:', location.pathname);

    if (!isAuthenticated) {
        console.log('Not authenticated, redirecting to login...');
        return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }

    console.log('Authenticated, rendering protected content...');
    return <>{children}</>;
};

export default RequireAuth; 