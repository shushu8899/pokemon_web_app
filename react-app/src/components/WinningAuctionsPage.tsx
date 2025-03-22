import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { getImageUrl } from '../utils/imageUtils';
import { getAuthorizationHeader, isAuthenticated } from '../services/auth-service';
import pokemonSpinner from "../assets/pokeballloading.gif";
import { motion, AnimatePresence } from "framer-motion";

interface WinningAuction {
  AuctionID: number;
  CardID: number;
  HighestBid: number;
  EndTime: string;
  IsValidated: boolean;
  CardName: string;
  CardQuality: string;
  ImageURL: string;
  Status: string;
  SellerID?: number;
  SellerUsername?: string;
}

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  sellerUsername: string;
  onRate: (rating: number) => void;
  auctionId: number;
}

const StarRating: React.FC<{ rating: number; onRate: (rating: number) => void }> = ({ rating, onRate }) => {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          className="focus:outline-none"
          onClick={() => onRate(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
        >
          <svg
            className={`w-8 h-8 ${
              star <= (hover || rating) ? 'text-yellow-400' : 'text-gray-300'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );
};

const RatingModal: React.FC<RatingModalProps> = ({ isOpen, onClose, sellerUsername, onRate, auctionId }) => {
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');

  const handleRate = async (selectedRating: number) => {
    setRating(selectedRating);
    try {
      const authHeader = getAuthorizationHeader();
      const formData = new FormData();
      formData.append('auction_id', auctionId.toString());
      formData.append('rating', selectedRating.toString());

      await axios.put(
        'http://127.0.0.1:8000/profile/rate-seller',
        formData,
        {
          headers: {
            'Authorization': authHeader
          }
        }
      );
      setMessage('Seller rated successfully!');
      onRate(selectedRating);
    } catch (error) {
      console.error('Error rating seller:', error);
      setMessage('Failed to rate seller. Please try again.');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4 text-center">Rate {sellerUsername}</h2>
            <div className="flex justify-center mb-4">
              <StarRating rating={rating} onRate={handleRate} />
            </div>
            {message && (
              <p className={`text-center ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
                {message}
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const getStatusStyle = (status: string) => {
  switch (status) {
    case 'Closed':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const WinningAuctionsPage: React.FC = () => {
  const [winningAuctions, setWinningAuctions] = useState<WinningAuction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAuction, setSelectedAuction] = useState<WinningAuction | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWinningAuctions = async () => {
      try {
        if (!isAuthenticated()) {
          navigate('/login');
          return;
        }

        const authHeader = getAuthorizationHeader();
        if (!authHeader) {
          navigate('/login');
          return;
        }

        console.log("Fetching winning auctions...");
        const response = await axios.get('http://127.0.0.1:8000/bidding/winning-auctions', {
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json'
          }
        });

        // Fetch seller usernames for each auction
        const auctionsWithUsernames = await Promise.all(
          response.data.map(async (auction: WinningAuction) => {
            try {
              // Get auction details to get seller username
              const auctionDetailsResponse = await axios.get(`http://127.0.0.1:8000/bidding/auction-details/${auction.AuctionID}`, {
                headers: {
                  'Authorization': authHeader,
                  'Content-Type': 'application/json'
                }
              });
              return {
                ...auction,
                SellerUsername: auctionDetailsResponse.data.SellerUsername || 'Unknown Seller'
              };
            } catch (error) {
              console.error(`Failed to fetch seller username for auction ${auction.AuctionID}:`, error);
              return {
                ...auction,
                SellerUsername: 'Unknown Seller'
              };
            }
          })
        );

        setWinningAuctions(auctionsWithUsernames);
      } catch (err: any) {
        console.error('Error fetching winning auctions:', err);
        if (err.response?.status === 401) {
          navigate('/login');
        } else if (err.response?.status === 404) {
          setError('No winning auctions found');
        } else {
          setError(err.response?.data?.detail || 'Failed to fetch winning auctions');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchWinningAuctions();
  }, [navigate]);

  const handleRateClick = (auction: WinningAuction) => {
    setSelectedAuction(auction);
  };

  const handleCloseRating = () => {
    setSelectedAuction(null);
  };

  const handleRateComplete = () => {
    // You could refresh the auctions here if needed
    setTimeout(() => {
      setSelectedAuction(null);
    }, 2000);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <img src={pokemonSpinner} alt="Loading..." className="w-16 h-16" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-600 text-center">
          <p className="text-xl font-bold">Error</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center" style={{ fontFamily: "Roboto" }}>Winning Bids</h1>
        
        {winningAuctions.length === 0 ? (
          <div className="text-center text-gray-600">
            <p>You haven't won any auctions yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {winningAuctions.map((auction) => (
              <div key={auction.AuctionID} className="bg-white rounded-lg shadow-lg p-4 relative">
                {/* Status Badge */}
                <div className="absolute top-2 right-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyle(auction.Status)}`}>
                    Closed
                  </span>
                </div>

                {/* Card Image */}
                <div className="aspect-w-3 aspect-h-4 mb-4 mt-10">
                  <img 
                    src={getImageUrl(auction.ImageURL)}
                    alt={auction.CardName}
                    className="w-full h-64 object-contain rounded-lg"
                  />
                </div>

                {/* Auction Details */}
                <div className="mt-4">
                  <h3 className="text-xl font-semibold mb-2">{auction.CardName}</h3>
                  <p className="text-gray-600">
                    <span className="font-bold">Quality:</span> {auction.CardQuality}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-bold">Winning Bid:</span> ${auction.HighestBid}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-bold">Ended:</span> {new Date(auction.EndTime).toLocaleString()}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-bold">Seller:</span> {auction.SellerUsername}
                  </p>
                  <button
                    onClick={() => handleRateClick(auction)}
                    className="mt-4 w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-2 px-4 rounded transition-colors"
                  >
                    Rate Seller
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedAuction && (
        <RatingModal
          isOpen={true}
          onClose={handleCloseRating}
          sellerUsername={selectedAuction.SellerUsername || 'Unknown Seller'}
          onRate={handleRateComplete}
          auctionId={selectedAuction.AuctionID}
        />
      )}
    </div>
  );
};

export default WinningAuctionsPage; 