import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyAuctions } from '../services/auction-creation';
import { MyAuction } from '../services/auction-creation';
import pokemonSpinner from "../assets/pokeballloading.gif";
import { getImageUrl } from '../utils/imageUtils';

const getStatusStyle = (status: string) => {
  switch (status) {
    case 'In Progress':
      return 'bg-green-100 text-green-800';
    case 'Closed':
      return 'bg-red-100 text-red-800';
    case 'Pending':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const MyAuctions: React.FC = () => {
  const navigate = useNavigate();
  const [auctions, setAuctions] = useState<MyAuction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAuctions = async () => {
      try {
        const data = await getMyAuctions();
        setAuctions(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadAuctions();
  }, []);

  const handleViewDetails = (auctionId: number) => {
    navigate(`/auction/${auctionId}`);
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

  if (auctions.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-gray-600">
          You haven't created any auctions yet.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center" style={{ fontFamily: "Roboto" }}>My Auctions</h1>
        
        {/* Auctions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {auctions.map((auction) => (
            <div key={auction.AuctionID} className="bg-white rounded-lg shadow-lg p-4 relative">
              {/* Status Badge */}
              <div className="absolute top-2 right-2">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyle(auction.Status)}`}>
                  {auction.Status}
                </span>
              </div>

              {/* Card Image */}
              <div className="aspect-w-3 aspect-h-4 mb-4 mt-10">
                {auction.ImageURL && (
                  <img
                    src={getImageUrl(auction.ImageURL)}
                    alt={auction.CardName}
                    className="w-full h-64 object-contain rounded-lg"
                  />
                )}
              </div>

              {/* Auction Details */}
              <div className="mt-4 text-center">
                <h3 className="text-xl font-semibold mb-2">{auction.CardName}</h3>
                <p className="text-gray-600">Quality: {auction.CardQuality}</p>
                <p className="text-gray-600">
                  Current Bid: {auction.HighestBidderID ? `$${auction.HighestBid}` : 'None'}
                </p>
                {!auction.HighestBidderID && (
                  <p className="text-gray-600">Starting Bid: ${auction.HighestBid}</p>
                )}
                <p className="text-gray-600">Ends: {new Date(auction.EndTime).toLocaleString()}</p>
                <button 
                  onClick={() => handleViewDetails(auction.AuctionID)}
                  className="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition-colors"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MyAuctions; 