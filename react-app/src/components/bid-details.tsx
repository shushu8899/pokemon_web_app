import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { getAuthorizationHeader } from '../services/auth-service';
import { getImageUrl } from '../utils/imageUtils';

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
        flex: '0 0 auto',
        width: '300px'
    },
    detailsSection: {
        flex: '1'
    },
    cardImage: {
        width: '100%',
        height: '100%',
        objectFit: 'contain' as const,
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

// Add CountdownTimer component
const CountdownTimer: React.FC<{ endTime: number }> = ({ endTime }) => {
    const [timeLeft, setTimeLeft] = useState<string>("");
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date().getTime();
            const endTimeMs = endTime * 1000; // Convert seconds to milliseconds
            const difference = endTimeMs - now;

            if (difference <= 0) {
                setIsExpired(true);
                setTimeLeft("Auction Ended");
                return;
            }

            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);

            let timeString = "";
            if (days > 0) timeString += `${days}d `;
            if (hours > 0 || days > 0) timeString += `${hours}h `;
            if (minutes > 0 || hours > 0 || days > 0) timeString += `${minutes}m `;
            timeString += `${seconds}s`;

            setTimeLeft(timeString);
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(timer);
    }, [endTime]);

    return (
        <div style={{ 
            padding: '10px',
            borderRadius: '8px',
            backgroundColor: isExpired ? '#dc2626' : '#d0f3dd',
            color: isExpired ? 'white' : 'black',
            display: 'inline-block',
            fontWeight: 'bold',
            marginTop: '10px'
        }}>
            {timeLeft}
        </div>
    );
};

const BidDetails: React.FC = () => {
    const { auctionID } = useParams<{ auctionID: string }>();
    const navigate = useNavigate();
    const [bidDetails, setBidDetails] = useState<BidDetails | null>(null);
    const [showBidModal, setShowBidModal] = useState(false);
    const [bidAmount, setBidAmount] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchBidDetails();
    }, [auctionID]);

    const fetchBidDetails = async () => {
        try {
            setIsLoading(true);
            const authHeader = getAuthorizationHeader();
            console.log("Token retrieved:", authHeader ? "Token exists" : "No token found");
            
            if (!authHeader) {
                setError("Please log in to view bid details");
                setShowErrorModal(true);
                navigate('/login');
                return;
            }

            // Get auction details using the general endpoint that any logged-in user can access
            console.log("Making request to:", `http://127.0.0.1:8000/bidding/auction-details/${auctionID}`);
            const auctionResponse = await axios.get(
                `http://127.0.0.1:8000/bidding/auction-details/${auctionID}`,
                { 
                    headers: { 
                        'Authorization': authHeader,
                        'Content-Type': 'application/json'
                    } 
                }
            );

            console.log("Auction response received:", auctionResponse.data);
            console.log("Image URL:", auctionResponse.data.ImageURL);

            // The response now includes SellerUsername and HighestBidderUsername
            const bidDetails: BidDetails = {
                ...auctionResponse.data,
                CurrentBid: auctionResponse.data.HighestBid || 0
            };

            console.log("Final bid details:", bidDetails);

            setBidDetails(bidDetails);
        } catch (error) {
            console.error("Error fetching bid details:", error);
            if (axios.isAxiosError(error)) {
                console.error("Error response:", error.response?.data);
                if (error.response?.status === 404) {
                    setError("Auction not found");
                } else if (error.response?.status === 401) {
                    setError("Your session has expired. Please log in again.");
                    navigate('/login');
                } else {
                    setError(error.response?.data?.detail || "Failed to load bid details");
                }
            } else {
                setError("An unexpected error occurred");
            }
            setShowErrorModal(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePlaceBid = async () => {
        if (!bidDetails || !bidAmount) {
            setError("Please enter a bid amount");
            setShowErrorModal(true);
            return;
        }

        const bidValue = parseFloat(bidAmount);
        if (isNaN(bidValue)) {
            setError("Please enter a valid number");
            setShowErrorModal(true);
            return;
        }

        if (bidValue <= bidDetails.CurrentBid) {
            setError(`Bid must be higher than the current bid of $${bidDetails.CurrentBid}`);
            setShowErrorModal(true);
            return;
        }

        if (bidValue < bidDetails.CurrentBid + bidDetails.MinimumIncrement) {
            setError(`Bid must be at least $${bidDetails.MinimumIncrement} higher than the current bid`);
            setShowErrorModal(true);
            return;
        }

        try {
            const authHeader = getAuthorizationHeader();
            if (!authHeader) {
                setError("Please log in to place a bid");
                setShowErrorModal(true);
                return;
            }

            console.log("Sending bid request with amount:", bidValue);
            const response = await axios.post(
                `http://127.0.0.1:8000/bidding/place-bid/${auctionID}`,
                bidValue,
                { 
                    headers: { 
                        'Authorization': authHeader,
                        'Content-Type': 'application/json'
                    } 
                }
            );

            console.log("Bid response:", response.data);
            setSuccessMessage("Bid placed successfully!");
            setShowBidModal(false);
            setBidAmount("");
            fetchBidDetails(); // Refresh the details
        } catch (error) {
            console.error("Error placing bid:", error);
            if (axios.isAxiosError(error)) {
                // Handle validation errors (422)
                if (error.response?.status === 422) {
                    const errorDetail = error.response.data.detail;
                    console.log("Validation error details:", errorDetail);
                    
                    // Handle different types of validation errors
                    if (Array.isArray(errorDetail)) {
                        // Handle array of validation errors
                        const firstError = errorDetail[0];
                        if (typeof firstError === 'object' && 'msg' in firstError) {
                            setError(firstError.msg);
                        } else if (typeof firstError === 'string') {
                            setError(firstError);
                        } else {
                            setError("Invalid bid amount");
                        }
                    } else if (typeof errorDetail === 'object' && 'msg' in errorDetail) {
                        // Handle object validation error
                        setError(errorDetail.msg);
                    } else if (typeof errorDetail === 'string') {
                        // Handle string validation error
                        setError(errorDetail);
                    } else {
                        setError("Invalid bid amount");
                    }
                } else {
                    setError(error.response?.data?.detail || "Failed to place bid");
                }
            } else {
                setError("An unexpected error occurred");
            }
            setShowErrorModal(true);
        }
    };

    if (isLoading) {
        return <div style={styles.container}>Loading...</div>;
    }

    if (!bidDetails) {
        return <div style={styles.container}>Auction not found</div>;
    }

    return (
        <div style={styles.container}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
                    Bid Details
                </h1>
                
                {/* Time Remaining moved to top right */}
                {bidDetails && (
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, fontWeight: 'bold', marginBottom: '5px' }}>Time Remaining:</p>
                        <CountdownTimer endTime={bidDetails.EndTime} />
                    </div>
                )}
            </div>

            <div style={styles.content}>
                {/* Left side - Card Image */}
                <div style={{
                    ...styles.imageSection,
                    height: '400px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <img 
                        src={getImageUrl(bidDetails.ImageURL)}
                        alt={bidDetails.CardName}
                        style={styles.cardImage}
                        onError={(e) => {
                            console.error("Image failed to load:", bidDetails.ImageURL);
                            e.currentTarget.src = "https://placehold.co/300x400/png?text=No+Image+Available";
                        }}
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
                        <p><strong>End Time:</strong> {new Date(bidDetails.EndTime * 1000).toLocaleString()}</p>
                    </div>

                    <button 
                        style={{
                            ...styles.bidButton,
                            opacity: new Date().getTime() > bidDetails.EndTime * 1000 ? 0.5 : 1,
                            cursor: new Date().getTime() > bidDetails.EndTime * 1000 ? 'not-allowed' : 'pointer'
                        }}
                        onClick={() => {
                            if (new Date().getTime() > bidDetails.EndTime * 1000) {
                                setError("This auction has ended");
                                setShowErrorModal(true);
                                return;
                            }
                            setShowBidModal(true);
                        }}
                    >
                        {new Date().getTime() > bidDetails.EndTime * 1000 ? 'Auction Ended' : 'Place Bid'}
                    </button>
                    
                    {/* Seller Profile Link Button */}
                    <Link 
                        to={`/profile/${bidDetails.SellerUsername}`}
                        style={{
                            ...styles.bidButton,
                            backgroundColor: '#dddddc',
                            color: 'black',
                            marginTop: '10px',
                            display: 'block',
                            textAlign: 'center',
                        }}
                    >
                        View Seller Profile
                    </Link>
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
                            onClick={(e) => e.stopPropagation()}
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

            {/* Error Modal */}
            <AnimatePresence>
                {showErrorModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={styles.overlay}
                        onClick={() => setShowErrorModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            style={styles.modal}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px', color: '#dc2626' }}>
                                Error
                            </h3>
                            
                            <p style={{ marginBottom: '20px' }}>{error}</p>
                            
                            <button
                                style={{
                                    ...styles.submitButton,
                                    backgroundColor: '#dc2626',
                                    color: 'white'
                                }}
                                onClick={() => {
                                    setShowErrorModal(false);
                                    if (error?.includes("Please log in")) {
                                        navigate('/login');
                                    }
                                }}
                            >
                                Close
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {successMessage && (
                <div style={{ 
                    position: 'fixed', 
                    bottom: '80px',
                    right: '20px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    padding: '15px 25px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                    zIndex: 1000
                }}>
                    {successMessage}
                </div>
            )}
        </div>
    );
};

export default BidDetails; 