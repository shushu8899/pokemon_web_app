import { Routes, Route, Link, useLocation, useNavigate, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Logo from "../assets/logo.svg.png"; // Ensure you have the correct path to the logo
import { navigation, NAV_LINKS, PUBLIC_ROUTES, PROTECTED_ROUTES } from "../constants";
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="fixed z-50 w-full bg-white">
      <div className="flex items-center px-5 lg:px-7.5 xl:px-10 max-lg:px-4 h-18 shadow-lg bg-white">
        <Link to="/" className="block w-[12rem]">
          <img src={Logo} alt="Pokemonlogo" width={150} height={100} />
        </Link>

        {/* Main Navigation */}
        <nav className="relative z-2 space-x-30 flex items-center justify-center ml-auto bg-white h-full">
          {/* Main Links */}
          {NAV_LINKS.MAIN.map((item) => (
            <Link key={item.path} to={item.path}>
              <a className="w-40 py-2 font-bold transition-colors hover:text-[#0908ba]" >
                {item.label}
              </a>
            </Link>
          ))}

          {/* Card Dropdown */}
          <div className="relative inline-block text-left group">
            <button 
            className="py-2 text-black font-bold transition-colors hover:text-[#0908ba]" 
            style={{ fontFamily: "Roboto" }}>
              Card
            </button>
            <div className="absolute left-1/2 -translate-x-1/2 w-40 rounded-md shadow-lg bg-white opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 mt-5">
              <div className="py-2" role="menu">
                <Link to={PROTECTED_ROUTES.CARD_ENTRY} className="block px-4 py-2 text-gray-700">
                  <button className="text-black font-bold transition-colors hover:text-[#0908ba]">Upload Card</button>
                </Link>
                <Link to={PROTECTED_ROUTES.UNVALIDATED_CARDS} className="block px-4 py-2 text-gray-700">
                  <button className="text-black font-bold transition-colors hover:text-[#0908ba]">Verify Card</button>
                </Link>
                <Link to={PROTECTED_ROUTES.MY_CARDS} className="block px-4 py-2 text-gray-700">
                  <button className="text-black font-bold transition-colors hover:text-[#0908ba]">My Cards</button>
                </Link>
              </div>
            </div>
          </div>

          {/* Auction Dropdown */}
          <div className="relative inline-block text-left group">
            <button className="py-2 text-black font-bold transition-colors hover:text-[#0908ba]" 
            style={{fontFamily: "Roboto" }}>
              Auction
            </button>
            <div className="absolute left-1/2 -translate-x-1/2 w-40 rounded-md shadow-lg bg-white opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 mt-5">
              <div className="py-1" role="menu">
                <Link to={PROTECTED_ROUTES.CREATE_AUCTION} className="block px-4 py-2">
                  <button className="text-black font-bold transition-colors hover:text-[#0908ba]">Create Auction</button>
                </Link>
                <Link to={PROTECTED_ROUTES.MY_AUCTIONS} className="block px-4 py-2">
                  <button className="text-black font-bold transition-colors hover:text-[#0908ba]">My Auctions</button>
                </Link>
                <Link to={PROTECTED_ROUTES.WINNING_AUCTIONS} className="block px-4 py-2">
                  <button className="text-black font-bold transition-colors hover:text-[#0908ba]">Winning Bids</button>
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <div className="ml-auto flex items-center space-x-4">
          {/* Auth/Account Section */}
          {isAuthenticated ? (
            <div className="relative inline-block text-left group">
              <button className="py-2 text-black font-bold transition-colors hover:text-[#0908ba]" 
                style={{ fontFamily: "Roboto" }}>
                Account
              </button>
              <div className="absolute left-1/2 -translate-x-1/2 w-48 rounded-md shadow-lg bg-white opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 mt-5">
                <div className="py-1" role="menu">
                  <div className="block px-4 py-2 text-sm text-gray-500 border-b border-gray-200 truncate">
                    {user?.email}
                  </div>
                  <Link to={PROTECTED_ROUTES.PROFILE} className="block px-4 py-2">
                    <button className="text-black font-bold w-full text-left transition-colors hover:text-[#0908ba]">
                      Profile
                    </button>
                  </Link>
                  <button onClick={handleLogout} 
                    className="block w-full text-left px-4 py-2 text-black font-bold transition-colors hover:text-[#0908ba]">
                    Logout
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // Auth Links
            <>
              {NAV_LINKS.AUTH.map((item) => (
                <Link key={item.path} to={item.path}>
                  <button className="py-2 text-gray-500 font-bold transition-colors hover:text-[#0908ba]" style={{ fontFamily: "Roboto" }}>
                    {item.label}
                  </button>
                </Link>
              ))}
            </>
          )}

          {/* Search Button */}
          <Link to={PUBLIC_ROUTES.SEARCH}>
            <button className="w-20 py-2 text-gray-500 font-bold transition-colors hover:text-[#0908ba]" 
            style={{ borderRadius: "100px" }}>
              {"\u2315"}
            </button>
          </Link>
        </div>  
      </div>
    </div>
  );
};

export default Header;