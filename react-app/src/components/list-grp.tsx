import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import FloatingPokemon from "./FloatingPokemon";

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
}

const AuctionList: React.FC = () => {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [inputPage, setInputPage] = useState<string>("");
  const navigate = useNavigate();

  const fetchAuctions = async (pageNumber: number) => {
    try {
      const response = await axios.get<{ auctions: Auction[]; total_pages: number }>(
        `http://127.0.0.1:8000/bidding/auction-collection?page=${pageNumber}`
      );
      setAuctions(response.data.auctions);
      setTotalPages(response.data.total_pages);
    } catch (error) {
      console.error("Error fetching auctions:", error);
    }
  };

  useEffect(() => {
    fetchAuctions(page);
  }, [page]);

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

  const goToBiddingPage = (auctionID: number) => {
    navigate(`/bidding/${auctionID}`);
  };

  return (
    <div style={{ padding: "20px", textAlign: "center", backgroundColor: "#001f3f", minHeight: "100vh" }}>
      <h2 style={{ color: "#FFD700", fontSize: "28px", fontWeight: "bold", marginBottom: "20px" }}>
        🛒 Pokémon Auction House
      </h2>

      {/* Floating Pokémon that moves & displays message */}
      <FloatingPokemon />

      {/* Auction Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)", // Two Pokémon per row
        gap: "25px", // Increased gap for better spacing
        justifyContent: "center",
        padding: "20px"
      }}>
        {auctions.length > 0 ? (
          auctions.map((auction) => (
            <div key={auction.AuctionID} style={{
              border: "2px solid #FFD700",
              borderRadius: "12px",
              padding: "0px",
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
              onClick={() => goToBiddingPage(auction.AuctionID)}
              onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
              onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              {/* Pokémon Image (70% height of card) */}
              <div style={{ flex: "70%", overflow: "hidden", display: "flex", justifyContent: "center" }}>
                <img
                  src={auction.ImageURL}
                  alt={auction.CardName}
                  className="pokemon-image"
                  onClick={() => goToBiddingPage(auction.AuctionID)}
                />
              </div>

              {/* Auction Details (30% height of card) */}
              <div style={{
                flex: "10%",
                padding: "10px",
                borderTop: "2px solid #FFD700",
                fontSize: "8px",
                lineHeight: "0.3", // Reduced line height for compact text
                textAlign: "left",
                color: "#FFD700" // Gold text for better readability
              }}>
                <p><strong>🔹 ID:</strong> {auction.AuctionID}</p>
                <p><strong>🏆 Card Name:</strong> {auction.CardName}</p>
                <p><strong>💰 Highest Bid:</strong> ${auction.HighestBid}</p>
              </div>
            </div>
          ))
        ) : (
          <p style={{ color: "#FFD700", fontSize: "18px", textAlign: "center", fontWeight: "bold" }}>
            No Pokémon auctions available.
          </p>
        )}
      </div>

      {/* Pagination Controls */}
      <div style={{ marginTop: "30px" }}>
        <button
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          disabled={page === 1}
          style={{
            padding: "8px 16px",
            margin: "0 10px",
            backgroundColor: "#FFD700",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontSize: "16px"
          }}
        >
          ◀ Previous
        </button>

        <span style={{ margin: "0 15px", color: "#FFD700", fontSize: "18px", fontWeight: "bold" }}>
          Page {page} of {totalPages}
        </span>

        <button
          onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={page === totalPages}
          style={{
            padding: "8px 16px",
            margin: "0 10px",
            backgroundColor: "#FFD700",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontSize: "16px"
          }}
        >
          Next ▶
        </button>

        {/* Page Number Input */}
        <input
          type="number"
          value={inputPage}
          onChange={handlePageChange}
          placeholder="Go to page"
          style={{
            marginLeft: "15px",
            padding: "8px",
            width: "80px",
            fontSize: "16px",
            textAlign: "center",
            border: "1px solid #FFD700",
            backgroundColor: "#003366",
            color: "#FFD700",
            borderRadius: "5px"
          }}
        />
        <button
          onClick={goToPage}
          style={{
            marginLeft: "10px",
            padding: "8px 12px",
            fontSize: "16px",
            backgroundColor: "#FFD700",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer"
          }}
        >
          Go
        </button>
      </div>
    </div>
  );
};

export default AuctionList;
