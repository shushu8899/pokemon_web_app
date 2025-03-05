import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion"; // ✅ Import Framer Motion
import axios from "axios";
import { calculateTimeLeft } from "../utils/timeUtils.tsx"; // ✅ Import the function

// Define the Auction details type
interface AuctionDetail {
    AuctionID: number;
    Status: string;
    HighestBid: number;
    CardName: string;
    ImageURL: string;
    EndTime: number;
}

// Define the bid request type
interface BidRequest {
    bid_value: number;
}

const BiddingPage: React.FC = () => {
    const { auctionID } = useParams<{ auctionID: string }>(); // Get auction ID from URL
    const [auction, setAuction] = useState<AuctionDetail | null>(null);
    const [bidAmount, setBidAmount] = useState<string>("");
    const [message, setMessage] = useState<string>("");
    const [showLoginPopup, setShowLoginPopup] = useState(false); // ✅ New state for login popup
    const [timer, setTimer] = useState<{ expired: boolean; timeLeft: string }>({
        expired: false,
        timeLeft: "Loading..."
      }); // ✅ Store timers


    useEffect(() => {
        if (auctionID) {
            fetchAuctionDetails();
        }
    }, [auctionID]);

    const fetchAuctionDetails = async () => {
        try {
            const response = await axios.get<AuctionDetail>(
                `http://127.0.0.1:8000/bidding/auction-details/${auctionID}`
            );
            setAuction(response.data);
        } catch (error) {
            console.error("Error fetching auction details:", error);
        }
    };

    useEffect(() => {
        const interval = setInterval(() => {
          setTimer((prevTimer) => {
            let newTimer = { ...prevTimer };
            if (auction) {
              newTimer = calculateTimeLeft(auction.EndTime); // ✅ Updates only this auction
            }
            return newTimer;
          });
        }, 1000); // ✅ Updates every second
      
        return () => clearInterval(interval); // ✅ Cleanup interval on unmount
      }, [auction]); // ✅ Only re-run if `auction` changes
      


    const handleBidChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setBidAmount(event.target.value);
    };

    const submitBid = async () => {
        if (!auction) return;

        const bidValue = parseFloat(bidAmount);
        if (isNaN(bidValue) || bidValue <= auction.HighestBid) {
            setMessage("Bid must be higher than the current highest bid!");
            return;
        }

        const token = localStorage.getItem("authToken"); // ✅ Retrieve stored token
        if (!token) {
            setShowLoginPopup(true); // ✅ Show the login popup
            return;
        }

        try {
            const bidData: BidRequest = {
                bid_value: bidValue
            };

            const response = await axios.post(
                `http://127.0.0.1:8000/bidding/place-bid/${auction.AuctionID}`,
                bidData,
                { headers: { Authorization: `Bearer ${token}` } } // ✅ Attach Auth Header
            );

            setMessage(response.data.message);
            setAuction((prev) => (prev ? { ...prev, HighestBid: bidValue } : prev)); // ✅ Update UI bid
        } catch (error) {
            console.error("Error placing bid:", error);
            setMessage("Failed to place bid. Please try again.");
        }
    };

    if (!auction) return <h2 style={{ color: "#FFD700", textAlign: "center" }}>Loading auction details...</h2>;

    return (
        <div style={{ padding: "20px", textAlign: "center", backgroundColor: "#001f3f", minHeight: "100vh" }}>
            <h2 style={{ color: "#FFD700", fontSize: "28px", fontWeight: "bold", marginBottom: "20px" }}>
                🛒 Bidding for {auction.CardName}
            </h2>

            {/* Auction Box */}
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="shimmer"
                style={{
                    border: "3px solid #FFD700",
                    borderRadius: "16px",
                    backgroundColor: "#003366",
                    boxShadow: "6px 6px 14px rgba(255, 215, 0, 0.3)",
                    padding: "20px",
                    width: "400px",
                    margin: "auto"
                }}
            >
                {/* Auction Image */}
                <img
                    src={auction.ImageURL}
                    alt={auction.CardName}
                    className="pokemon-image"
                />

                {/* Auction Details */}
                <div style={{
                    marginTop: "15px",
                    padding: "10px",
                    borderTop: "3px solid #FFD700",
                    fontSize: "16px",
                    lineHeight: "0.8",
                    textAlign: "left",
                    color: "#FFD700"
                }}>
                    <p><strong>🔹 Auction ID:</strong> {auction.AuctionID}</p>
                    <p><strong>📜 Status:</strong> {auction.Status}</p>
                    <p><strong>💰 Highest Bid:</strong> ${auction.HighestBid}</p>
                    <p><strong>🎴 Card Name:</strong> {auction.CardName}</p>
                                    {/* Countdown Timer */}
                    <p style={{
                        fontSize: "14px",
                        fontWeight: "bold",
                        color: timer.expired 
                        ? "red" 
                        : (parseInt(timer.timeLeft) > 86400) // ✅ Less than 1 day (86400 seconds)
                            ? "yellow" 
                            : "#FFD700"
                    }}>
                        ⏳ {timer.expired ? "Auction Ended" : `Time Left: ${timer.timeLeft}`}
                    </p>
                </div>
            </motion.div>

            {/* Bidding Input */}
            <div style={{ marginTop: "20px" }}>
                <input
                    type="number"
                    placeholder="Enter your bid"
                    value={bidAmount}
                    onChange={handleBidChange}
                    style={{
                        padding: "10px",
                        width: "200px",
                        fontSize: "16px",
                        borderRadius: "5px",
                        border: "1px solid #FFD700",
                        backgroundColor: "#003366",
                        color: "#FFD700",
                        textAlign: "center"
                    }}
                />
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={submitBid}
                    style={{
                        marginLeft: "10px",
                        padding: "10px 20px",
                        fontSize: "16px",
                        backgroundColor: "#FFD700",
                        border: "none",
                        borderRadius: "5px",
                        cursor: "pointer"
                    }}
                >
                    Place Bid
                </motion.button>
            </div>

            {/* Login Popup (Only Shows When Needed) */}
            {showLoginPopup && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    style={{
                        position: "fixed",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        backgroundColor: "#003366",
                        color: "#FFD700",
                        padding: "20px",
                        borderRadius: "12px",
                        boxShadow: "4px 4px 10px rgba(255, 215, 0, 0.3)",
                        textAlign: "center",
                        width: "300px"
                    }}
                >
                    <p style={{ fontSize: "18px", fontWeight: "bold" }}>⚠ Please log in to place a bid!</p>
                    <button
                        onClick={() => setShowLoginPopup(false)}
                        style={{
                            padding: "8px 16px",
                            backgroundColor: "#FFD700",
                            border: "none",
                            borderRadius: "5px",
                            cursor: "pointer",
                            fontSize: "16px",
                            marginTop: "10px"
                        }}
                    >
                        OK
                    </button>
                </motion.div>
            )}

            {/* Bid Status Message */}
            {message && <p style={{ color: "green", marginTop: "10px" }}>{message}</p>}
        </div>
    );
};

export default BiddingPage;
