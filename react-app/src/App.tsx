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

// Type definition for search results
// interface SearchResult {
//   id: string;
//   CardName?: string;
//   Username?: string;
// }

// // Function to fetch search results
// const fetchSearchResults = async (
//   query: string,
//   setResults: (results: SearchResult[]) => void,
//   setLoading: (loading: boolean) => void
// ) => {
//   setLoading(true);
//   try {
//     const [cardResponse, profileResponse] = await Promise.all([
//       axios.get(`http://localhost:8000/search/cards?search_query=${query}`),
//       axios.get(`http://localhost:8000/search/profiles?search_query=${query}`)
//     ]);

//     // Combine both results
//     setResults([...cardResponse.data, ...profileResponse.data]);
//   } catch (error) {
//     console.error("Error during search", error);
//   } finally {
//     setLoading(false);
//   }
// };

function App() {
  return (
    <div className="bg-white min-h-screen">
      {/* Top Bar */}
      <div className="bg-white">
        {/* Logo */}
        <img src={Logo} alt="Auction Finder Logo" className="w-25 mx-auto py-3" />
        {/* Navigation Panel */}
        <div className="wrap items-center text-center max-w-4xl mx-auto">
          <div className="justify-center">
            <Link to="/">
              <button className="w-25 px-4 py-2 text-black bold-text border-b-4 border-gray-300 hover:bg-gray-100 font-bold">
                Main
              </button>
            </Link>
            <Link to="/auction/:id">
              <button className="w-25 px-4 py-2 text-black bold-text border-b-4 border-red-400 hover:bg-red-100 font-bold">
                Auction Details
              </button>
            </Link>
            <Link to="/search">
              <button className="w-25 px-4 py-2 text-black bold-text border-b-4 border-blue-400 hover:bg-blue-100 font-bold">
                Search for cards
              </button>
            </Link>
            <Link to="/login">
              <button className="w-25 px-4 py-2 text-black bold-text border-b-4 border-green-400 hover:bg-green-100 font-bold">
                Log in
              </button>
            </Link>
          </div>
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