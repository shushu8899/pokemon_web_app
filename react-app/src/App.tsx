import { Routes, Route, Link, useLocation, Navigate } from "react-router-dom";
import { useEffect } from "react";
import Logo from "./assets/logo.svg.png";
import bannerImage from "./assets/Pokemon Card Banner.png";
import { BrowserRouter as Router } from 'react-router-dom';

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

// Services
import { fetchSearchResults } from "./services/searchpage-service";

function App() {
  const location = useLocation();

  return (
    <div className="bg-white min-h-screen flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center w-full px-6 py-3 shadow-md relative z-50 bg-white">
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
          <Link to="/login">
            <button className="w-40 py-2 text-black font-bold hover:bg-yellow-500" style={{ borderRadius: "100px", fontFamily: "Roboto" }}>
              Login / Sign Up
            </button>
          </Link>
          <Link to="/search">
            <button className="w-10 py-2 text-black font-bold hover:bg-yellow-500" style={{ borderRadius: "100px" }}>
              {"\u2315"}
            </button>
          </Link>
        </div>
      </div>

      {/* Hero Banner Section - Only shown on main page */}
      {location.pathname === "/" && (
        <div className="relative h-[75vh] w-full" style={{ marginTop: "-48px" }}>
          <img
            src={bannerImage}
            alt="Pokemon Card Banner"
            className="w-full h-full object-cover"
          />
          <div 
            className="absolute inset-0 flex flex-col items-center justify-center text-center"
            style={{ background: 'rgba(0, 0, 0, 0.7)', paddingTop: '80px' }}
          >
            <h1 className="text-5xl font-bold text-white mb-4">
              Welcome to the Pokémon TCG Auction House
            </h1>
            <p className="text-xl text-white mb-6 max-w-2xl px-4">
              Discover amazing auctions, find the best deals, and bid with confidence.
            </p>
            <button 
              onClick={() => window.scrollTo({ top: window.innerHeight * 0.75, behavior: 'smooth' })}
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 px-8 rounded-full transform transition-transform hover:scale-105"
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
          <Route path="/bidding/:auctionID" element={<BiddingPage />} />
          <Route path="/upload-card" element={<UploadCard />} />
          <Route path="/create-auction" element={<AuctionCreation />} />
          <Route path="/my-cards" element={<MyCards />} />
          <Route path="/my-auctions" element={<MyAuctions />} />
          <Route path="/auction/:auctionId" element={<AuctionDetails />} />
          <Route path="/update-auction/:auctionId" element={<AuctionCreation />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegistrationPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          
          {/* Catch-all redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;