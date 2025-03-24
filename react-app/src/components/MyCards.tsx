import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import pokemonSpinner from "../assets/pokeballloading.gif";

interface Card {
    card_id: number;
    card_name: string;
    card_quality: string;
    is_validated: boolean;
    image_url: string;
}

interface PaginationInfo {
    current_page: number;
    total_pages: number;
    total_cards: number;
    has_next: boolean;
    has_previous: boolean;
}

const MyCards: React.FC = () => {
    const navigate = useNavigate();
    const [cards, setCards] = useState<Card[]>([]);
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    const fetchCards = async (page: number) => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await api.get(`/entry/my-cards?page=${page}`);
            setCards(response.data.cards);
            setPagination(response.data.pagination);
        } catch (err: any) {
            if (err.response) {
                setError(err.response.data.detail || "Failed to fetch cards");
            } else {
                setError("An unexpected error occurred");
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCards(currentPage);
    }, [currentPage]);

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
    };

    const handleEdit = (cardId: number) => {
        navigate('/entry/card-entry/update', { state: { cardId } });
    };

    const handleDelete = async (cardId: number) => {
        if (window.confirm('Are you sure you want to delete this card?')) {
            try {
                await api.delete(`/entry/card-entry/${cardId}`);
                fetchCards(currentPage); // Refresh the list
            } catch (err: any) {
                setError(err.response?.data?.detail || "Failed to delete card");
            }
        }
    };

    if (isLoading) {
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
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-5 text-center">My Cards</h1>
            
            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {cards.map((card) => (
                    <div key={card.card_id} className="bg-white rounded-lg shadow-lg p-4 relative">
                        {/* Action Buttons */}
                        <div className="absolute top-2 left-2 flex space-x-2">
                            <button
                                onClick={() => handleEdit(card.card_id)}
                                className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                                title="Edit Card"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                            </button>
                            <button
                                onClick={() => handleDelete(card.card_id)}
                                className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                title="Delete Card"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>

                        {/* Validation Status Badge */}
                        <div className="absolute top-2 right-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                card.is_validated 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-gray-100 text-gray-800'
                            }`}>
                                {card.is_validated ? 'VERIFIED' : 'UNVERIFIED'}
                            </span>
                        </div>

                        {/* Card Image */}
                        <div className="aspect-w-3 aspect-h-4 mb-4 mt-10">
                            <img 
                                src={card.image_url.startsWith('http') ? card.image_url : `http://127.0.0.1:8000${card.image_url}`}
                                alt={card.card_name}
                                className="w-full h-64 object-contain rounded-lg"
                            />
                        </div>

                        {/* Card Details */}
                        <div className="mt-4 text-center">
                            <h3 className="text-xl font-semibold mb-2">{card.card_name}</h3>
                            <p className="text-gray-600">Quality: {card.card_quality}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination Controls */}
            {pagination && (
                <div className="mt-8 flex justify-center items-center">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={!pagination.has_previous}
                            className={`px-4 py-2 rounded-md ${
                                pagination.has_previous
                                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                        >
                            Previous
                        </button>
                        <span className="text-gray-600 w-32 text-center">
                            Page {pagination.current_page} of {pagination.total_pages}
                        </span>
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={!pagination.has_next}
                            className={`px-4 py-2 rounded-md ${
                                pagination.has_next
                                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyCards; 