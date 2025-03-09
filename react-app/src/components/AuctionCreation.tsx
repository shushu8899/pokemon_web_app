import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getValidatedCards,
  createAuction,
  ValidatedCard,
  AuctionFormData,
  CreatedAuction
} from '../services/auction-creation';

const AuctionCreation: React.FC = () => {
  const navigate = useNavigate();
  const [validatedCards, setValidatedCards] = useState<ValidatedCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [selectedCardDetails, setSelectedCardDetails] = useState<ValidatedCard | null>(null);
  const [formData, setFormData] = useState<AuctionFormData>({
    starting_bid: 0,
    minimum_increment: 0,
    auction_duration: 24, // Default 24 hours
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadValidatedCards();
  }, []);

  useEffect(() => {
    if (selectedCard) {
      const card = validatedCards.find(c => c.CardID === selectedCard);
      setSelectedCardDetails(card || null);
    } else {
      setSelectedCardDetails(null);
    }
  }, [selectedCard, validatedCards]);

  const loadValidatedCards = async () => {
    const cards = await getValidatedCards();
    setValidatedCards(cards);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCard) {
      setError('Please select a card');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await createAuction({
        ...formData,
        card_id: selectedCard
      });
      if (result) {
        // Redirect to the auction details page or my auctions page
        navigate('/my-auctions');
      }
    } catch (err) {
      setError('Failed to create auction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Create New Auction</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Card Selection and Preview */}
        <div>
          <div className="bg-white p-6 rounded-lg shadow-md mb-4">
            <h2 className="text-xl font-semibold mb-4">Select Card</h2>
            <select
              value={selectedCard || ''}
              onChange={(e) => setSelectedCard(parseInt(e.target.value))}
              className="w-full p-2 border rounded mb-4"
              required
            >
              <option value="">Select a card...</option>
              {validatedCards.map(card => (
                <option key={card.CardID} value={card.CardID}>
                  {card.Name}
                </option>
              ))}
            </select>

            {selectedCardDetails && (
              <div className="mt-4">
                <img
                  src={selectedCardDetails.ImageURL}
                  alt={selectedCardDetails.Name}
                  className="w-full rounded-lg shadow-md mb-2"
                />
                <h3 className="font-semibold">{selectedCardDetails.Name}</h3>
                <p className="text-sm text-gray-600">{selectedCardDetails.Description}</p>
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
              <p className="text-sm text-gray-500 mt-1">Maximum duration: 7 days (168 hours)</p>
            </div>

            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading || !selectedCard}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:bg-blue-300"
            >
              {loading ? 'Creating...' : 'Create Auction'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuctionCreation; 