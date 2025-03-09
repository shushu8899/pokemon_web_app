import { Routes, Route, Link, useLocation, useNavigate, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Logo from "./assets/logo.svg.png";
import bannerImage from "./assets/Pokemon Card Banner.png";
import pikachuPattern from "./assets/pikachu_pattern.png";
import { BrowserRouter as Router } from 'react-router-dom';
import { clearAuthTokens, getUserEmail, isAuthenticated } from './services/auth-service';

// Components
import AuctionList from "./components/list-grp";
import BiddingPage from "./components/auction-details";
import SearchPage from "./components/SearchPage";
import UploadCard from "./components/verify-card";
import AuctionCreation from "./components/AuctionCreation";
import MyCards from "./components/MyCards";
import MyAuctions from "./components/MyAuctions";
import AuctionDetails from './components/AuctionDetails';
import LoginPage from "./components/LoginPage";
import RegistrationPage from "./components/RegistrationPage";
import ForgotPasswordPage from "./components/ForgotPasswordPage";
import ResetPasswordPage from "./components/ResetPasswordPage";
import EditCard from './components/EditCard';

// Services
import { fetchSearchResults } from "./services/searchpage-service";

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation();
  
  if (!isAuthenticated()) {
    // Redirect to login page with the return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    // Check login status when component mounts
    if (isAuthenticated()) {
      const email = getUserEmail();
      setIsLoggedIn(true);
      setUserEmail(email);
    }
  }, []);

  const handleLogout = () => {
    clearAuthTokens();
    setIsLoggedIn(false);
    setUserEmail(null);
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center w-full px-6 py-3 bg-white fixed top-0 left-0 right-0 z-[100] shadow-[0_8px_16px_-4px_rgba(0,0,0,0.1),0_4px_6px_-2px_rgba(0,0,0,0.05)] border-b border-gray-100">
        {/* Logo */}
        <img
          src={Logo}
          alt="Auction Finder Logo"
          className="h-12 flex-shrink-0 mr-4"
        />

        {/* Navigation Panel */}
        <div className="ml-auto flex items-center gap-4">
          <Link to="/">
            <button className="w-40 py-2 text-black font-bold hover:bg-yellow-500" style={{ borderRadius: "100px", fontFamily: "Roboto"}}>
              Main
            </button>
          </Link>
          <div className="relative inline-block text-left group">
            <button
              className="w-40 py-2 text-black font-bold hover:bg-yellow-500"
              style={{ borderRadius: "100px", fontFamily: "Roboto" }}
            >
              Card
            </button>
            <div className="origin-top-right absolute left-0 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 hidden group-hover:block z-50" >
              <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                <Link to="/upload-card" className="block px-4 py-2 text-gray-700 hover:bg-yellow-500" role="menuitem">
                  <button className="text-black font-bold">
                    Upload Card
                  </button>
                </Link>
                <Link to="/my-cards" className="block px-4 py-2 text-gray-700 hover:bg-yellow-500" role="menuitem">
                  <button className="text-black font-bold">
                    My Cards
                  </button>
                </Link>
              </div>
            </div>
          </div>
          <div className="relative inline-block text-left group">
            <button
              className="w-40 py-2 text-black font-bold hover:bg-yellow-500"
              style={{ borderRadius: "100px", fontFamily: "Roboto" }}
            >
              Auction
            </button>
            <div className="origin-top-right absolute left-0 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 hidden group-hover:block z-50" >
              <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                <Link to="/create-auction" className="block px-4 py-2 text-gray-700 hover:bg-yellow-500" role="menuitem">
                  <button className="text-black font-bold">
                    Create Auction
                  </button>
                </Link>
                <Link to="/my-auctions" className="block px-4 py-2 text-gray-700 hover:bg-yellow-500" role="menuitem">
                  <button className="text-black font-bold">
                    My Auctions
                  </button>
                </Link>
              </div>
            </div>
          </div>
          
          {/* Conditional rendering of Login/Account button */}
          {isLoggedIn ? (
            <div className="relative inline-block text-left group">
              <button
                className="w-40 py-2 text-black font-bold hover:bg-yellow-500"
                style={{ borderRadius: "100px", fontFamily: "Roboto" }}
              >
                Account
              </button>
              <div 
                className="absolute right-0 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 hidden group-hover:block z-50"
                style={{ 
                  minWidth: '200px',
                  width: userEmail ? `${Math.max(200, userEmail.length * 8)}px` : '200px',
                  top: 'calc(100% - 5px)'  // Reduce the gap between button and menu
                }}
              >
                <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                  <div className="block px-4 py-2 text-sm text-gray-500 border-b border-gray-200 truncate">
                    {userEmail}
                  </div>
                  <Link to="/profile" className="block px-4 py-2 text-gray-700 hover:bg-yellow-500" role="menuitem">
                    <button className="text-black font-bold w-full text-left">
                      Profile
                    </button>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-black font-bold hover:bg-yellow-500"
                    role="menuitem"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <Link to="/login">
              <button className="w-40 py-2 text-black font-bold hover:bg-yellow-500" style={{ borderRadius: "100px", fontFamily: "Roboto" }}>
                Login / Sign Up
              </button>
            </Link>
          )}

          <Link to="/search">
            <button className="w-10 py-2 text-black font-bold hover:bg-yellow-500" style={{ borderRadius: "100px" }}>
              {"\u2315"}
            </button>
          </Link>
        </div>
      </div>

      {/* Spacer for fixed navbar */}
      <div className="h-[72px]"></div>

      {/* Banner Image */}
      {location.pathname === "/" && (
        <div className="relative h-[75vh] z-[1]">
          <img
            src={bannerImage}
            alt="Pokemon Card Banner"
            className="w-full h-full object-cover"
          />
          <div 
            className="absolute inset-0 flex flex-col items-center justify-center text-center"
            style={{ background: 'rgba(0, 0, 0, 0.6)' }}
          >
            <h1 className="text-5xl font-bold text-white mb-6" style={{ fontFamily: "Roboto" }}>
              Welcome to the Pokémon TCG Auction House
            </h1>
            <p className="text-xl text-white mb-8 max-w-2xl px-4" style={{ fontFamily: "Roboto" }}>
              Discover amazing auctions, find the best deals, and bid with confidence.
            </p>
            <button 
              onClick={() => window.scrollTo({ top: window.innerHeight * 0.75, behavior: 'smooth' })}
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 px-8 rounded-full transform transition-transform hover:scale-105"
              style={{ fontFamily: "Roboto" }}
            >
              Get Started
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-grow">
        <Routes>
          <Route path="/" element={<AuctionList />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegistrationPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          
          {/* Protected Routes */}
          <Route path="/upload-card" element={<ProtectedRoute><UploadCard /></ProtectedRoute>} />
          <Route path="/my-cards" element={<ProtectedRoute><MyCards /></ProtectedRoute>} />
          <Route path="/entry/card-entry/update" element={<ProtectedRoute><EditCard /></ProtectedRoute>} />
          <Route path="/my-auctions" element={<ProtectedRoute><MyAuctions /></ProtectedRoute>} />
          <Route path="/create-auction" element={<ProtectedRoute><AuctionCreation /></ProtectedRoute>} />
          <Route path="/auction/:id" element={<ProtectedRoute><AuctionDetails /></ProtectedRoute>} />
          
          {/* Public Routes */}
          <Route path="/bidding/:auctionID" element={<BiddingPage />} />
          
          {/* Catch-all redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;