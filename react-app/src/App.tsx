import { Routes, Route, Link, useLocation } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import Logo from "./assets/logo.svg.png"; // Ensure the file exists in src/assets
import mainpic from "./assets/image_2025-03-02_15-25-55.png"; // Ensure the file exists in src/assets

// Components
import AuctionList from "./components/list-grp";
import BiddingPage from "./components/auction-details";
import SearchPage from "./components/SearchPage";


// Services
import { fetchSearchResults } from "./services/searchpage-service";

function App() {
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);


  return (
    <div className="bg-white min-h-screen flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center w-full px-6 py-3 shadow-md">
        {/* Logo */}
        <img
          src={Logo}
          alt="Auction Finder Logo"
          className="h-12 flex-shrink-0 mr-4"
        />

        {/* Navigation Panel */}
        <div className="ml-auto space-x-4">
          <Link to="/">
            <button className="w-40 py-2 text-black font-bold hover:bg-gray-100" style={{ borderRadius: "100px", fontFamily: "Roboto"}}>
              Main
            </button>
          </Link>
          <div className="relative inline-block text-left group">
            <button
              className="w-40 py-2 text-black font-bold border-red-400 hover:bg-red-100"
              style={{ borderRadius: "100px", fontFamily: "Roboto" }}
            >
              Auction
            </button>
            <div className="origin-top-right absolute left-0 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 hidden group-hover:block" >
              <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                <Link to="/auction/1" className="block px-4 py-2 text-gray-700 hover:bg-red-100" role="menuitem">
                  <button className="text-black font-bold">
                  Create auction
                  </button>
                </Link>
                <Link to="/verify-card" className="block px-4 py-2 text-gray-700 hover:bg-red-100" role="menuitem">
                  <button className="text-black font-bold">
                  Verify card
                  </button>
                </Link>
              </div>
            </div>
          </div>
          <Link to="/login">
            <button className="w-32 py-2 text-black font-bold border-green-400 hover:bg-green-100" style={{ borderRadius: "100px", fontFamily: "Roboto" }}>
              Account
            </button>
          </Link>
          <Link to="/search">
            <button className="w-10 py-2 text-black font-bold bg-blue-200" style={{ borderRadius: "100px" }}>
              {"\u2315"}
            </button>
          </Link>
        </div>
      </div>

      {/* Landing Page Content */}
      {location.pathname === "/" && (
        <div 
          className="grid grid-cols-1 md:grid-cols-2 p-8 mt-8 mx-8 md:my-8"
          style={{ 
            borderRadius: "50px", 
            boxShadow: "10px 10px 6px rgba(105, 105, 104, 0.5)", 
            height: "60vh",
            backgroundColor: "#FFCB05"}}>
          {/* Left Side - Text */}
          <div className="flex flex-col items-center justify-center space-y-6 font-roboto">
            <h1 className="text-4xl font-bold text-black">Welcome to Pokémon TCG Auction</h1>
            <p className="text-lg justify-center font-roboto" 
                style={{ color: "black"}}>
              Discover amazing auctions, bid with confidence, and find the best deals.
            </p>
            <button 
              className="px-6 py-3 bg-red-500 text-white hover:bg-gray-600 transition" 
              style={{ borderRadius: "100px" }}>
              Get Started
            </button>
          </div>

          {/* Right Side - Image */}
          <div className="justify-center p-1 flex">
            <img
              src={mainpic}
              alt="Landing page pic"
              className="rounded-lg justify-center " 
              style={{ borderRadius: "30px"}}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-grow mt-8">
        <Routes>
          <Route path="/" element={<AuctionList />} />
          <Route path="/search" element={<SearchPage fetchSearchResults={fetchSearchResults} />} />
          <Route path="/bidding/:auctionID" element={<BiddingPage />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;