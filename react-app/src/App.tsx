import { Routes, Route, Link, useLocation, useNavigate, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import bannerImage from "./assets/Pokemon Card Banner.png";
import pikachuPattern from "./assets/pikachu_pattern.png";
import { BrowserRouter as Router } from 'react-router-dom';
import { clearAuthTokens, getUserEmail, isAuthenticated } from './services/auth-service';

// Components
import Header from "./components/Header";
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
import Profile from './components/Profile';
import CardEntry from "./components/CardEntry";
import UnvalidatedCards from './components/UnvalidatedCards';

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
      <Header />
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
          <Route path="/search" element={<SearchPage fetchSearchResults={fetchSearchResults} />} />
          <Route path="/login" element={<LoginPage setIsLoggedIn={setIsLoggedIn} setUserEmail={setUserEmail} />} />
          <Route path="/register" element={<RegistrationPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          
          {/* Protected Routes */}
          <Route path="/card-entry" element={<ProtectedRoute><CardEntry /></ProtectedRoute>} />
          <Route path="/unvalidated-cards" element={<ProtectedRoute><UnvalidatedCards /></ProtectedRoute>} />
          <Route path="/my-cards" element={<ProtectedRoute><MyCards /></ProtectedRoute>} />
          <Route path="/entry/card-entry/update" element={<ProtectedRoute><EditCard /></ProtectedRoute>} />
          <Route path="/my-auctions" element={<ProtectedRoute><MyAuctions /></ProtectedRoute>} />
          <Route path="/create-auction" element={<ProtectedRoute><AuctionCreation /></ProtectedRoute>} />
          <Route path="/auction/:id" element={<ProtectedRoute><AuctionDetails /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          
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