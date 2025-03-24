import React from 'react';
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import bannerImage from "./assets/Pokemon Card Banner.png";
import pikachuPattern from "./assets/pikachu_pattern.png";
import { clearAuthTokens, getUserEmail, isAuthenticated } from './services/auth-service';

// Components
import Header from "./components/Header";
import AuctionList from "./components/list-grp";
import ChatAssistant from "./components/ChatAssistant";
import BidDetails from "./components/bid-details";
import SearchPage from "./components/SearchPage";
import UploadCard from "./components/verify-card";
import AuctionCreation from "./components/AuctionCreation";
import MyCards from "./components/MyCards";
import MyAuctions from "./components/MyAuctions";
import WinningAuctionsPage from "./components/WinningAuctionsPage";
import AuctionDetails from './components/AuctionDetails';
import LoginPage from "./components/LoginPage";
import RegistrationPage from "./components/RegistrationPage";
import ForgotPasswordPage from "./components/ForgotPasswordPage";
import ResetPasswordPage from "./components/ResetPasswordPage";
import EditCard from './components/EditCard';
import Profile from './components/Profile';
import CardEntry from "./components/CardEntry";
import UnvalidatedCards from './components/UnvalidatedCards';
import ConfirmRegistrationPage from './components/ConfirmRegistrationPage';
import ProfilePage from './components/ProfilePage';

// Services
import { fetchSearchResults } from "./services/searchpage-service";

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  
  // If not authenticated, redirect to login page
  if (!isAuthenticated) {
    // Save the attempted URL for redirect after login
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen">
        <Header />
        {/* Spacer for fixed navbar */}
        <div className="h-16"></div>
        
        {/* Banner Image */}
        <Routes>
          <Route path="/" element={
            <>
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
              <AuctionList />
            </>
          } />
          <Route path="/search" element={<SearchPage fetchSearchResults={fetchSearchResults} />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegistrationPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/confirm-registration" element={<ConfirmRegistrationPage />} />
          
          {/* Protected Routes */}
          <Route path="/card-entry" element={<ProtectedRoute><CardEntry /></ProtectedRoute>} />
          <Route path="/unvalidated-cards" element={<ProtectedRoute><UnvalidatedCards /></ProtectedRoute>} />
          <Route path="/my-cards" element={<ProtectedRoute><MyCards /></ProtectedRoute>} />
          <Route path="/entry/card-entry/update" element={<ProtectedRoute><EditCard /></ProtectedRoute>} />
          <Route path="/my-auctions" element={<ProtectedRoute><MyAuctions /></ProtectedRoute>} />
          <Route path="/winning-auctions" element={<ProtectedRoute><WinningAuctionsPage /></ProtectedRoute>} />
          <Route path="/create-auction" element={<ProtectedRoute><AuctionCreation /></ProtectedRoute>} />
          <Route path="/auction/:id" element={<ProtectedRoute><AuctionDetails /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/profile/:username" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/bid-details/:auctionID" element={<ProtectedRoute><BidDetails /></ProtectedRoute>} />
          
          {/* Catch-all redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        {/* Chat Assistant (Floating at Bottom-Right) */}
        <ChatAssistant />
      </div>
    </AuthProvider>
  );
}

export default App;