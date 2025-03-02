import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import FloatingPokemon from "./FloatingPokemon";
import { calculateTimeLeft } from "../utils/timeUtils.tsx"; // ✅ Import the function

// Define the Auction type based on FastAPI response
interface Auction {
  AuctionID: number;
  CardID: number;
  title: string;
  Status: string;
  HighestBid: number;
  IsValidated: boolean;
  CardName: string;
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
      console.log("API Response in React:", response.data); // ✅ Log response
      setAuctions(response.data.auctions);
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
    
    <div style={{ textAlign: "center"}}>
      <h1 
        className="font-roboto justify-center p-8 mt-8 mx-8"
        style = {{
          fontSize: "36px",
          fontWeight: "bold",
          borderRadius: "30px",
          border: "2px solid #FFCB05",

        }}
      
      >Pokémon Auction House</h1>
      <div style={{ padding: "20px", textAlign: "center", minHeight: "100vh" }}>
        {/* Floating Pokémon that moves & displays message */}
        <FloatingPokemon />
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
              <div key={auction.AuctionID} style={{
                border: "2px solid #FFD700",
                borderRadius: "12px",
                padding: "10px",
                textAlign: "center",
                backgroundColor: "#003366",
                boxShadow: "4px 4px 12px rgba(255, 215, 0, 0.2)",
                transition: "transform 0.3s ease-in-out",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                height: "450px",
                width: "400px", // Ensure the card fits well
                margin: "auto", // Centering the card
                transform: "scale(0.8)", // Initial scale
                transformOrigin: "center", // Scale from center
              }}

              onClick={() => {
                if (!auctionTimer.expired) {
                  navigate(`/bidding/${auction.AuctionID}`);
                }
              }} // ✅ Prevents navigation when expired
              
              onMouseOver={(e) => {
                if (!auctionTimer.expired) {
                  e.currentTarget.style.transform = "scale(1)";
                } else {
                  e.currentTarget.style.transform = "scale(0.8)"; // ✅ Ensures expired items stay the same
                }
              }}
              
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "scale(0.8)"; // ✅ Always reverts to original size
              }}
              
              className="glowing-box"
              
              >
                {/* Pokémon Image (70% height of card) */}
                <div style={{ flex: "70%", overflow: "hidden", display: "flex", justifyContent: "center" }}>
                  <img
                    src={auction.ImageURL}
                    alt={auction.CardName}
                    className="pokemon-image"
                  />
                </div>

                {/* Auction Details (30% height of card) */}
                <div style={{
                  flex: "30%",
                  padding: "10px",
                  fontSize: "14px",
                  lineHeight: "1.2", // Reduced line height for compact text
                  textAlign: "left",
                  color: "#FFD700" // Gold text for better readability
                }}>
                  <p><strong>🔹 ID:</strong> {auction.AuctionID}</p>
                  <p><strong>🏆 Card Name:</strong> {auction.CardName}</p>
                  <p><strong>💰 Highest Bid:</strong> ${auction.HighestBid}</p>

                  {/* Countdown Timer */}
                  <p style={{
                      fontSize: "14px",
                      fontWeight: "bold",
                      color: auctionTimer.expired 
                        ? "red" 
                        : (parseInt(auctionTimer.timeLeft) > 86400) // ✅ Less than 1 day (86400 seconds)
                          ? "yellow" 
                          : "#FFD700"
                    }}>
                      ⏳ {auctionTimer.expired ? "Auction Ended" : `Time Left: ${auctionTimer.timeLeft}`}
                  </p>
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
            className="p-2 text-black rounded bg-orange-200 hover:bg-orange-300"
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
  );
};

export default AuctionList;