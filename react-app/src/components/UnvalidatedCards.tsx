import React, { useState, useEffect } from "react";
import axios from "axios";
import { getAuthorizationHeader } from "../services/auth-service";
import { API_BASE_URL } from '../config';
import pokemonSpinner from "../assets/pokeballloading.gif";

interface Card {
  CardID: number;
  CardName: string;
  CardQuality: string;
  ImageURL: string;
  IsValidated: boolean;
  OwnerID: number;
}

interface VerificationResult {
  success: boolean;
  message: string;
  details: any;
}

const UnvalidatedCards: React.FC = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [showTcgIdModal, setShowTcgIdModal] = useState(false);
  const [tcgCardId, setTcgCardId] = useState<string>("");
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    fetchUnvalidatedCards();
  }, []);

  const fetchUnvalidatedCards = async () => {
    try {
      const authHeader = getAuthorizationHeader();
      if (!authHeader) {
        throw new Error('You must be logged in to view cards');
      }

      const response = await axios.get(
        `${API_BASE_URL}/entry/card-entry/unvalidated`,
        {
          headers: {
            'Authorization': authHeader,
          },
        }
      );

      setCards(response.data);
    } catch (error: any) {
      console.error("Error fetching unvalidated cards:", error);
      setError(error.response?.data?.detail || "Failed to fetch unvalidated cards");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCard = async (card: Card) => {
    setSelectedCard(card);
    setShowTcgIdModal(true);
  };

  const handleContinueVerification = async () => {
    if (!tcgCardId.trim()) {
      setError("Please enter a Pokemon TCG Card ID");
      return;
    }

    if (!selectedCard) {
      setError("No card selected for verification");
      return;
    }

    setLoading(true);
    setError(null);
    setShowTcgIdModal(false);

    try {
      const authHeader = getAuthorizationHeader();
      if (!authHeader) {
        throw new Error('You must be logged in to verify cards');
      }

      const formData = new FormData();
      formData.append('pokemon_tcg_id', tcgCardId);

      const response = await axios.post(
        `${API_BASE_URL}/verification/verify-card/${selectedCard.CardID}`,
        formData,
        {
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setVerificationResult({
        success: response.data.is_validated,
        message: response.data.is_validated 
          ? "Your card was verified successfully."
          : "Your card was not verified successfully.",
        details: response.data
      });
      setShowResults(true);

      // Refresh the cards list after successful verification
      if (response.data.is_validated) {
        fetchUnvalidatedCards();
      }

    } catch (error: any) {
      console.error("Error verifying card:", error);
      if (error.response?.status === 422) {
        setError("Invalid TCG Card ID format. Please check and try again.");
      } else if (error.response?.data?.detail) {
        setError(typeof error.response.data.detail === 'string' 
          ? error.response.data.detail 
          : "Verification failed. Please try again.");
      } else {
        setError("Verification failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
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
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Verify a Card</h1>
      
      {cards.length === 0 ? (
        <div className="text-center text-gray-500">
          No unvalidated cards found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => (
            <div key={card.CardID} className="bg-white rounded-lg shadow-md overflow-hidden">
              <img
                src={card.ImageURL.startsWith('http') 
                  ? card.ImageURL 
                  : `${API_BASE_URL}${card.ImageURL}`}
                alt={card.CardName}
                className="w-full h-48 object-contain p-4"
              />
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-2 text-center">{card.CardName}</h3>
                <p className="text-sm text-gray-500 mb-2 text-center">
                  Quality: {card.CardQuality}
                </p>
                <button
                  onClick={() => handleVerifyCard(card)}
                  className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
                >
                  Verify Card
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TCG ID Input Modal */}
      {showTcgIdModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4 text-center">Pokemon TCG Card ID</h3>
            <p className="text-sm text-gray-600 mb-4 text-center">
              Please key in Pokemon TCG Card ID. You may get the Pokemon TCG Card ID from{' '}
              <a 
                href="https://pokemoncard.io/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800"
              >
                pokemoncard.io
              </a>
            </p>
            <input
              type="text"
              value={tcgCardId}
              onChange={(e) => setTcgCardId(e.target.value)}
              placeholder="Enter Pokemon TCG Card ID"
              className="w-full p-2 border border-gray-300 rounded-md mb-4"
            />
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setShowTcgIdModal(false)}
                className="bg-gray-500 text-white px-6 py-2 rounded-full hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleContinueVerification}
                disabled={loading}
                className="bg-blue-500 text-white px-6 py-2 rounded-full hover:bg-blue-600 transition-colors disabled:bg-gray-400"
              >
                {loading ? (
                  <div className="flex items-center">
                    <img src={pokemonSpinner} alt="Loading..." className="w-5 h-5 mr-2" />
                    <span>Verifying...</span>
                  </div>
                ) : (
                  'Continue Verification'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verification Results Modal */}
      {showResults && verificationResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4 text-center">Verification Results</h3>
            <div className="mb-4">
              <p className={`text-lg font-medium text-center ${verificationResult.success ? 'text-green-600' : 'text-red-600'}`}>
                {verificationResult.message}
              </p>
            </div>
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => {
                  setShowResults(false);
                  if (verificationResult.success) {
                    fetchUnvalidatedCards();
                  } else {
                    setTcgCardId("");
                  }
                }}
                className="bg-blue-500 text-white px-6 py-2 rounded-full hover:bg-blue-600 transition-colors"
              >
                {verificationResult.success ? 'Close' : 'Try Again'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnvalidatedCards; 