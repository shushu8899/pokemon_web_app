import React, { useEffect, useState } from 'react';
import { getUnvalidatedCards, UnvalidatedCard, verifyCard } from '../services/card-service';
import pokemonSpinner from "../assets/pokeballloading.gif";

const UnvalidatedCards: React.FC = () => {
  const [cards, setCards] = useState<UnvalidatedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verificationResults, setVerificationResults] = useState<{ [key: number]: { success: boolean; message: string } }>({});
  const [showResultsPopup, setShowResultsPopup] = useState(false);

  useEffect(() => {
    const fetchCards = async () => {
      try {
        const data = await getUnvalidatedCards();
        setCards(data);
      } catch (err: any) {
        setError(err.response?.data?.detail || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCards();
  }, []);

  const handleCardClick = (cardId: number) => {
    if (verifying) return; // Prevent selection while verification is in progress
    
    setSelectedCardId(prevId => prevId === cardId ? null : cardId);
  };

  const handleVerifyCards = async () => {
    if (!selectedCardId) {
      alert("Please select a card to verify");
      return;
    }

    setVerifying(true);
    setVerificationResults({});
    const results: { [key: number]: { success: boolean; message: string } } = {};

    try {
      const result = await verifyCard(selectedCardId);
      results[selectedCardId] = { 
        success: result.is_validated, 
        message: result.message 
      };
      
      // Only remove the card if verification was successful
      if (result.is_validated) {
        setCards(prev => prev.filter(card => card.CardID !== selectedCardId));
      }
    } catch (err: any) {
      results[selectedCardId] = { 
        success: false, 
        message: err.response?.data?.detail || err.message || 'Verification failed'
      };
    } finally {
      setVerificationResults(results);
      setVerifying(false);
      setShowResultsPopup(true);
    }
  };

  // Results Popup Component
  const ResultsPopup = () => {
    if (!showResultsPopup) return null;

    const result = selectedCardId ? verificationResults[selectedCardId] : null;
    const card = selectedCardId ? cards.find(c => c.CardID === selectedCardId) : null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 shadow-xl">
          <h2 className="text-2xl font-bold mb-4 text-center">Verification Result</h2>
          {card && result && (
            <div className="mb-4 p-4 rounded-lg border text-center">
              <div className="flex flex-col items-center gap-4">
                <img 
                  src={card.ImageURL.startsWith('http') 
                    ? card.ImageURL 
                    : `http://127.0.0.1:8000${card.ImageURL}`}
                  alt={card.CardName}
                  className="w-48 h-48 object-contain"
                />
                <div>
                  <p className="font-semibold text-lg">{card.CardName}</p>
                  <p className={`mt-2 text-lg font-medium ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                    {result.message}
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => {
                setShowResultsPopup(false);
                setSelectedCardId(null);
                setVerificationResults({});
              }}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
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
        <h1 className="text-3xl font-bold mb-6 text-center" style={{ fontFamily: "Roboto" }}>Verify Cards</h1>
        
        {cards.length === 0 ? (
          <div className="text-center text-gray-600 py-8">
            You don't have any cards pending verification.
          </div>
        ) : (
          <>
            <div className="text-center mb-4 text-gray-600">
              Click on a card to select it for verification
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {cards.map((card) => (
                <div
                  key={card.CardID}
                  className={`bg-white rounded-lg shadow-lg p-4 cursor-pointer transition-all duration-200 ${
                    selectedCardId === card.CardID ? 'ring-4 ring-yellow-400 transform scale-105' : 'hover:shadow-xl'
                  } ${verifying ? 'pointer-events-none opacity-50' : ''}`}
                  onClick={() => handleCardClick(card.CardID)}
                >
                  {/* Card Image */}
                  <div className="aspect-w-3 aspect-h-4 mb-4">
                    <img
                      src={card.ImageURL.startsWith('http') 
                        ? card.ImageURL 
                        : `http://127.0.0.1:8000${card.ImageURL}`}
                      alt={card.CardName}
                      className="w-full h-64 object-contain rounded-lg"
                    />
                  </div>

                  {/* Card Details */}
                  <div className="mt-4 text-center">
                    <h3 className="text-lg font-semibold mb-2">{card.CardName}</h3>
                    <p className="text-gray-600">Quality: {card.CardQuality}</p>
                    <div className="mt-4">
                      {verificationResults[card.CardID] ? (
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          verificationResults[card.CardID].success 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {verificationResults[card.CardID].message}
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                          Pending Validation
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Verify Button */}
            <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2">
              <button
                onClick={handleVerifyCards}
                disabled={verifying || !selectedCardId}
                className={`px-8 py-3 rounded-full shadow-lg text-white font-semibold transition-all duration-200 ${
                  selectedCardId && !verifying
                    ? 'bg-blue-500 hover:bg-blue-600'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                {verifying ? (
                  <div className="flex items-center">
                    <img src={pokemonSpinner} alt="Verifying..." className="w-5 h-5 mr-2" />
                    <span>Verifying Card...</span>
                  </div>
                ) : (
                  selectedCardId ? 'Verify Selected Card' : 'Select a Card to Verify'
                )}
              </button>
            </div>
          </>
        )}
        <ResultsPopup />
      </div>
    </div>
  );
};

export default UnvalidatedCards; 