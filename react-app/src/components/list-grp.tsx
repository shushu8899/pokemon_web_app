import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import FloatingPokemon from "./FloatingPokemon";
import { calculateTimeLeft } from "../utils/timeUtils.tsx"; // ✅ Import the function
import bannerImage from "../assets/Pokemon Card Banner.png";

// Define the Auction type based on FastAPI response
interface Auction {
  AuctionID: number;
  CardID: number;
  title: string;
  Status: string;
  HighestBid: number;
  IsValidated: string;  // Changed from boolean to string
  CardName: string;     // This should be a string
  CardQuality: string;
  ImageURL: string;
  EndTime: number;
}

const AuctionList: React.FC = () => {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [inputPage, setInputPage] = useState<string>("");
  const [timers, setTimers] = useState<{ [key: number]: { expired: boolean; timeLeft: string } }>({}); // ✅ Store timers
  const navigate = useNavigate();

  const fetchAuctions = async (pageNumber: number) => {
    try {
      const response = await axios.get<{ auctions: Auction[]; total_pages: number }>(
        `http://127.0.0.1:8000/bidding/auction-collection?page=${pageNumber}`
      );
      console.log("API Response in React:", response.data);
      
      // Filter out ended auctions and sort by time remaining
      const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
      const filteredAndSortedAuctions = response.data.auctions
        .filter(auction => auction.EndTime > currentTime) // Filter out ended auctions
        .sort((a, b) => a.EndTime - b.EndTime); // Sort by end time (lowest to highest)
      
      setAuctions(filteredAndSortedAuctions);
      setTotalPages(response.data.total_pages);
    } catch (error) {
      console.error("Error fetching auctions:", error);
    }
  };

  useEffect(() => {
    fetchAuctions(page);
  }, [page]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimers((prevTimers) => {
        const newTimers = { ...prevTimers };
        auctions.forEach((auction) => {
          newTimers[auction.AuctionID] = calculateTimeLeft(auction.EndTime); // ✅ Uses fixed function
        });
        return newTimers;
      });
    }, 1000); // ✅ Updates every second
  
    return () => clearInterval(interval); // ✅ Cleanup interval on unmount
  }, [auctions]);

  const handlePageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputPage(event.target.value);
  };

  const goToPage = () => {
    const pageNumber = parseInt(inputPage);
    if (!isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= totalPages) {
      setPage(pageNumber);
    } else {
      alert("Invalid page number");
    }
  };


  return (
    <div className="min-h-screen bg-white">
      {/* Auction List Section */}
      <div className="container mx-auto px-4 py-8">
        <div style={{ textAlign: "center"}}>
          <div style={{ padding: "20px", textAlign: "center", minHeight: "100vh" }}>
            {/* Floating Pokémon that moves & displays message */}
            <FloatingPokemon />
            {/* Title */}
            <h2 className="text-3xl font-bold mb-8" style={{ color: "black", textAlign: "center" }}>
              Explore Active Listings
            </h2>
            {/* Auction Grid */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)", // Three Pokémon per row
              gap: "10px", // Increased gap for better spacing
              borderRadius: "12px", // ✅ Optional rounded corners
              justifyContent: "center",
            }}>
              {auctions.length > 0 ? auctions.map((auction) => {
                const auctionTimer = timers[auction.AuctionID] || { expired: false, timeLeft: "Loading..." };
              
                return (
                  <div key={auction.AuctionID} className="bg-white rounded-lg shadow-lg p-4 relative">
                    {/* Card Image */}
                    <div className="aspect-w-3 aspect-h-4 mb-4">
                      <img
                        src={auction.ImageURL.startsWith('http') ? auction.ImageURL : `http://127.0.0.1:8000${auction.ImageURL}`}
                        alt={auction.CardName}
                        className="w-full h-64 object-contain rounded-lg"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "https://via.placeholder.com/300x400?text=No+Image";
                        }}
                      />
                    </div>

                    {/* Auction Details */}
                    <div className="mt-4">
                      <h3 className="text-xl font-semibold mb-2">{auction.CardName}</h3>
                      <div className="space-y-2 text-gray-600">
                        <p><strong>🔹 Auction ID:</strong> {auction.AuctionID}</p>
                        <p><strong>🏆 Card Quality:</strong> {auction.CardQuality}</p>
                        <p><strong>💰 Current Bid:</strong> ${auction.HighestBid}</p>
                        <p className="text-sm">
                          ⏳ {auctionTimer.expired ? "Auction Ended" : `Time Left: ${auctionTimer.timeLeft}`}
                        </p>
                      </div>
                      {/* Place Bid Button */}
                      <button
                        onClick={() => navigate(`/bid-details/${auction.AuctionID}`)}
                        className="w-full mt-4 py-2 px-4 rounded-lg font-semibold transition-colors duration-200 cursor-pointer"
                        style={{ backgroundColor: "#FFCB05", color: "black" }}
                      >
                        Place Bid
                      </button>
                    </div>
                  </div>
                )
              }) : (
                <p style={{ color: "gold", fontSize: "18px", fontStyle: "italic", gridColumn: "2 / 3", alignSelf: "center"  }}>
                  No Pokémon auctions available.
                </p>
              )}
            </div>

            {/* Pagination Controls */}
            <div style={{ marginTop: "30px" }}>
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="p-2 text-black rounded bg-orange-200 hover:bg-orange-300"
                style={{ marginLeft: "10px", backgroundColor: "#FFCB05", color: "black" }}
              >
                Previous
              </button>

              <span style={{ margin: "0 15px", fontSize: "18px", fontWeight: "bold" }}>
                Page {page} of {totalPages}
              </span>

              <button
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages}
                className="p-2 text-black rounded"
                style={{ marginLeft: "10px", backgroundColor: "#FFCB05", color: "black" }}
              >
                Next
              </button>

              {/* Page Number Input */}
              <input
                type="number"
                value={inputPage}
                onChange={handlePageChange}
                placeholder="Go to page"
                className="p-2 text-black rounded"
                style={{
                  marginLeft: "15px",
                  // padding: "8px",
                  width: "120px",
                  fontSize: "16px",
                  textAlign: "left",
                  border: "1px solid #FFCB05",
                  backgroundColor: "white",
                  color: "#FFCB05",
                  // borderRadius: "5px"
                }}
              />
              <button
                onClick={goToPage}
                className="p-2 text-black rounded"
                style={{ marginLeft: "10px", backgroundColor: "#FFCB05", color: "black" }}
              >
                Go
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionList;