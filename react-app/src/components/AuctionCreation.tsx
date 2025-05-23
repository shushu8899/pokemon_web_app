import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getValidatedCards,
  createAuction,
  ValidatedCard,
} from '../services/auction-creation';
import pikachuPattern from '../assets/pikachu_pattern.png';
import { getImageUrl } from '../utils/imageUtils';

// Interface for the form state
interface AuctionFormData {
  card_id: number;
  starting_bid: string;
  minimum_increment: string;
  auction_duration: number;
}

// Interface for the API request
interface AuctionAPIData {
  card_id: number;
  starting_bid: number;
  minimum_increment: number;
  auction_duration: number;
}

const AuctionCreation: React.FC = () => {
  const navigate = useNavigate();
  const [validatedCards, setValidatedCards] = useState<ValidatedCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [selectedCardDetails, setSelectedCardDetails] = useState<ValidatedCard | null>(null);
  const [formData, setFormData] = useState<AuctionFormData>({
    card_id: 0,
    starting_bid: '',
    minimum_increment: '',
    auction_duration: 24, // Default 24 hours
  });
  const [loading, setLoading] = useState(false);
  const [cardsLoading, setCardsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadValidatedCards();
  }, []);

  useEffect(() => {
    if (selectedCard) {
      const card = validatedCards.find(c => c.CardID === selectedCard);
      setSelectedCardDetails(card || null);
      setFormData(prev => ({
        ...prev,
        card_id: selectedCard
      }));
    } else {
      setSelectedCardDetails(null);
    }
  }, [selectedCard, validatedCards]);

  const loadValidatedCards = async () => {
    setCardsLoading(true);
    setError(null);
    try {
      const cards = await getValidatedCards();
      console.log('Received validated cards:', cards);
      setValidatedCards(cards);
    } catch (err: any) {
      console.error('Error loading validated cards:', err);
      setError(err.message || 'Failed to load validated cards. Please try again later.');
    } finally {
      setCardsLoading(false);
    }
  };

  const calculateEndTime = (durationHours: number): string => {
    const endTime = new Date();
    endTime.setHours(endTime.getHours() + durationHours);
    return endTime.toLocaleString();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    console.log(`Updating ${name} to:`, value);
    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: value
      };
      console.log('Updated form data:', updated);
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCard) {
      setError('Please select a card');
      return;
    }

    // Convert form data to numbers and validate
    const startingBid = Number(formData.starting_bid);
    const minIncrement = Number(formData.minimum_increment);
    const duration = formData.auction_duration;

    if (isNaN(startingBid) || startingBid <= 0) {
      setError('Starting bid must be greater than 0');
      return;
    }

    if (isNaN(minIncrement) || minIncrement <= 0) {
      setError('Minimum increment must be greater than 0');
      return;
    }

    if (duration < 1 || duration > 168) {
      setError('Auction duration must be between 1 and 168 hours');
      return;
    }

    setLoading(true);
    setError(null);

    // Format the data for the API
    const auctionData: AuctionAPIData = {
      card_id: selectedCard,
      starting_bid: startingBid,
      minimum_increment: minIncrement,
      auction_duration: duration
    };

    console.log('Submitting auction data:', auctionData);

    try {
      await createAuction(auctionData);
      navigate('/my-auctions');
    } catch (err: any) {
      console.error('Error creating auction:', err);
      if (err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          setError(err.response.data.detail.map((e: any) => e.msg).join(', '));
        } else {
          setError(err.response.data.detail);
        }
      } else {
        setError(err.message || 'Failed to create auction. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{
      background: `linear-gradient(rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0.95)), url(${pikachuPattern})`,
      backgroundAttachment: 'fixed',
      backgroundPosition: 'center',
      backgroundSize: '2000px',
      backgroundRepeat: 'repeat',
      position: 'relative',
      zIndex: 0,
      padding: '2rem'
    }}>
      <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center" style={{ fontFamily: "Roboto" }}>Create New Auction</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card Selection and Preview */}
          <div>
            <div className="bg-white p-6 rounded-lg shadow-md mb-4">
              <h2 className="text-xl font-semibold mb-4">Select Card</h2>
              <p className="text-sm text-gray-600 mb-4">Only verified cards can be auctioned.</p>
              {cardsLoading ? (
                <p className="text-gray-600">Loading validated cards...</p>
              ) : validatedCards.length === 0 ? (
                <p className="text-gray-600">No validated cards available. Please validate some cards first.</p>
              ) : (
                <select
                  value={selectedCard || ''}
                  onChange={(e) => setSelectedCard(parseInt(e.target.value))}
                  className="w-full p-2 border rounded mb-4"
                  required
                >
                  <option value="">Select a card...</option>
                  {validatedCards.map(card => {
                    console.log('Rendering card:', card);
                    return (
                      <option key={card.CardID} value={card.CardID}>
                        {card.CardName} ({card.CardQuality})
                      </option>
                    );
                  })}
                </select>
              )}

              {selectedCardDetails && (
                <div className="mt-4">
                  <img 
                    src={getImageUrl(selectedCardDetails.ImageURL)}
                    alt={selectedCardDetails.CardName}
                    className="w-full h-64 object-contain rounded-lg"
                  />
                  <h3 className="font-semibold">{selectedCardDetails.CardName}</h3>
                  <p className="text-sm text-gray-600">Quality: {selectedCardDetails.CardQuality}</p>
                </div>
              )}
            </div>
          </div>

          {/* Auction Details Form */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Auction Details</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-2">Starting Bid ($)</label>
                <input
                  type="number"
                  name="starting_bid"
                  value={formData.starting_bid}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              <div>
                <label className="block mb-2">Minimum Increment ($)</label>
                <input
                  type="number"
                  name="minimum_increment"
                  value={formData.minimum_increment}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              <div>
                <label className="block mb-2">Duration (hours)</label>
                <input
                  type="number"
                  name="auction_duration"
                  value={formData.auction_duration}
                  onChange={handleInputChange}
                  min="1"
                  max="168"
                  className="w-full p-2 border rounded"
                  required
                />
                <div className="text-sm text-gray-500 mt-1">
                  <p>End Time: {calculateEndTime(Number(formData.auction_duration))}</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !selectedCard || cardsLoading}
                className={`w-full py-2 px-4 rounded text-white ${
                  loading || !selectedCard || cardsLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                {loading ? 'Creating...' : 'Create Auction'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionCreation; 