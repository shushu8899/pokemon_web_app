import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

interface BidDetails {
    AuctionID: number;
    CardID: number;
    CardName: string;
    CardQuality: string;
    ImageURL: string;
    SellerID: number;
    SellerUsername: string;
    CurrentBid: number;
    HighestBidderID: number | null;
    HighestBidderUsername: string | null;
    MinimumIncrement: number;
    EndTime: number;
    Status: string;
}

const styles = {
    container: {
        padding: '20px',
        maxWidth: '1200px',
        margin: '20px auto',
        backgroundColor: 'white',
        minHeight: '100vh'
    },
    content: {
        display: 'flex',
        gap: '40px',
        marginTop: '20px'
    },
    imageSection: {
        flex: '1',
        maxWidth: '500px'
    },
    detailsSection: {
        flex: '1'
    },
    cardImage: {
        width: '100%',
        height: 'auto',
        borderRadius: '10px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
    },
    bidButton: {
        backgroundColor: '#FFCB05',
        color: 'black',
        padding: '12px 24px',
        borderRadius: '8px',
        border: 'none',
        fontSize: '16px',
        fontWeight: 'bold',
        cursor: 'pointer',
        marginTop: '20px',
        width: '100%'
    },
    modal: {
        position: 'fixed' as const,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        width: '400px'
    },
    overlay: {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)'
    },
    input: {
        width: '100%',
        padding: '10px',
        marginTop: '10px',
        borderRadius: '6px',
        border: '1px solid #ddd',
        fontSize: '16px'
    },
    submitButton: {
        backgroundColor: '#FFCB05',
        color: 'black',
        padding: '10px 20px',
        borderRadius: '6px',
        border: 'none',
        fontSize: '16px',
        fontWeight: 'bold',
        cursor: 'pointer',
        marginTop: '20px',
        width: '100%'
    }
};

const BidDetails: React.FC = () => {
    const { auctionID } = useParams<{ auctionID: string }>();
    const navigate = useNavigate();
    const [bidDetails, setBidDetails] = useState<BidDetails | null>(null);
    const [showBidModal, setShowBidModal] = useState(false);
    const [bidAmount, setBidAmount] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchBidDetails();
    }, [auctionID]);

    const fetchBidDetails = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem("authToken");
            if (!token) {
                setError("Please log in to view bid details");
                return;
            }

            // Get auction details using the correct endpoint
            const auctionResponse = await axios.get(
                `http://127.0.0.1:8000/auction-details/${auctionID}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Get seller's username
            const sellerResponse = await axios.get(
                `http://127.0.0.1:8000/profiles/${auctionResponse.data.SellerID}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Get highest bidder's username if exists
            let highestBidderUsername = null;
            if (auctionResponse.data.HighestBidderID) {
                const bidderResponse = await axios.get(
                    `http://127.0.0.1:8000/profiles/${auctionResponse.data.HighestBidderID}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                highestBidderUsername = bidderResponse.data.Username;
            }

            // Combine all the data
            const bidDetails: BidDetails = {
                ...auctionResponse.data,
                SellerUsername: sellerResponse.data.Username,
                HighestBidderUsername: highestBidderUsername,
                CurrentBid: auctionResponse.data.HighestBid || 0
            };

            setBidDetails(bidDetails);
        } catch (error) {
            console.error("Error fetching bid details:", error);
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 404) {
                    setError("Auction not found");
                } else {
                    setError(error.response?.data?.detail || "Failed to load bid details");
                }
            } else {
                setError("An unexpected error occurred");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handlePlaceBid = async () => {
        if (!bidDetails || !bidAmount) return;

        const bidValue = parseFloat(bidAmount);
        if (isNaN(bidValue) || bidValue <= bidDetails.CurrentBid) {
            setError("Bid must be higher than the current bid");
            return;
        }

        try {
            const token = localStorage.getItem("authToken");
            if (!token) {
                setError("Please log in to place a bid");
                return;
            }

            const response = await axios.post(
                `http://127.0.0.1:8000/bidding/place-bid/${auctionID}`,
                { bid_value: bidValue },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setSuccessMessage("Bid placed successfully!");
            setShowBidModal(false);
            setBidAmount("");
            fetchBidDetails(); // Refresh the details
        } catch (error) {
            console.error("Error placing bid:", error);
            setError("Failed to place bid");
        }
    };

    if (isLoading) {
        return <div style={styles.container}>Loading...</div>;
    }

    if (error) {
        return <div style={styles.container}>{error}</div>;
    }

    if (!bidDetails) {
        return <div style={styles.container}>Auction not found</div>;
    }

    return (
        <div style={styles.container}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>
                Bid Details
            </h1>

            <div style={styles.content}>
                {/* Left side - Card Image */}
                <div style={styles.imageSection}>
                    <img 
                        src={bidDetails.ImageURL} 
                        alt={bidDetails.CardName}
                        style={styles.cardImage}
                    />
                </div>

                {/* Right side - Details */}
                <div style={styles.detailsSection}>
                    <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '20px' }}>
                        {bidDetails.CardName}
                    </h2>
                    
                    <div style={{ marginBottom: '20px' }}>
                        <p><strong>Card Quality:</strong> {bidDetails.CardQuality}</p>
                        <p><strong>Seller:</strong> {bidDetails.SellerUsername}</p>
                        <p><strong>Current Bid:</strong> ${bidDetails.CurrentBid}</p>
                        <p><strong>Highest Bidder:</strong> {bidDetails.HighestBidderUsername || 'No bids yet'}</p>
                        <p><strong>Minimum Increment:</strong> ${bidDetails.MinimumIncrement}</p>
                    </div>

                    <button 
                        style={styles.bidButton}
                        onClick={() => setShowBidModal(true)}
                    >
                        Place Bid
                    </button>
                </div>
            </div>

            {/* Bid Modal */}
            <AnimatePresence>
                {showBidModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={styles.overlay}
                        onClick={() => setShowBidModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            style={styles.modal}
                        >
                            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>
                                Place Your Bid
                            </h3>
                            
                            <p>Current Bid: ${bidDetails.CurrentBid}</p>
                            <p>Minimum Increment: ${bidDetails.MinimumIncrement}</p>
                            
                            <input
                                type="number"
                                placeholder="Enter your bid amount"
                                value={bidAmount}
                                onChange={(e) => setBidAmount(e.target.value)}
                                style={styles.input}
                            />

                            {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
                            
                            <button
                                style={styles.submitButton}
                                onClick={handlePlaceBid}
                            >
                                Submit Bid
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {successMessage && (
                <div style={{ 
                    position: 'fixed', 
                    bottom: '20px', 
                    right: '20px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    padding: '15px 25px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                }}>
                    {successMessage}
                </div>
            )}
        </div>
    );
};

export default BidDetails; 