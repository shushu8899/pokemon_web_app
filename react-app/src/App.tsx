import { Routes, Route, Link } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import Logo from "./assets/logo.svg.png"; // Ensure the file exists in src/assets

// Components
import AuctionList from "./components/list-grp";
import BiddingPage from "./components/auction-details";
import SearchPage from "./components/SearchPage";

// Services
import { fetchSearchResults } from "./services/searchpage-service";

function App() {
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

        {/* Navigation Panel*/}
        <div className="ml-auto space-x-4">
          <Link to="/">
            <button className="w-40 py-2 text-black font-bold hover:bg-gray-100" style={{ borderRadius: "100px", border: "1px ", borderColor: "gray" }}>
              Main
            </button>
          </Link>
          <Link to="/auction/:id">
            <button className="w-40 py-2 text-black font-bold border-red-400 hover:bg-red-100" style={{ borderRadius: "100px" }}>
              Auction Details
            </button>
          </Link>
          <Link to="/login">
            <button className="w-32 py-2 text-black font-bold border-green-400 hover:bg-green-100" style={{ borderRadius: "100px" }}>
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