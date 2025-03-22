import React, { useEffect, useState } from 'react';
import { getUserEmail } from '../services/auth-service';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import pokemonSpinner from "../assets/pokeballloading.gif";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar as faStarSolid } from '@fortawesome/free-solid-svg-icons';
import { faStar as faStarRegular } from '@fortawesome/free-regular-svg-icons';
import { getMyAuctions } from '../services/auction-creation';
import { MyAuction } from '../services/auction-creation';
import { getImageUrl } from '../utils/imageUtils';

interface UserProfile {
    UserID: number;
    Username: string;
    Email: string;
    NumberOfRating: number;
    CurrentRating: number;
    CognitoUserID: string;
}

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

const StarRating: React.FC<{ rating: number }> = ({ rating }) => {
    const totalStars = 5;
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    return (
        <div className="flex items-center">
            {[...Array(totalStars)].map((_, index) => (
                <FontAwesomeIcon
                    key={index}
                    icon={index < fullStars ? faStarSolid : faStarRegular}
                    className={index < fullStars ? "text-yellow-400" : "text-gray-300"}
                />
            ))}
            <span className="ml-2 text-gray-600">
                ({rating.toFixed(1)})
            </span>
        </div>
    );
};

const Profile: React.FC = () => {
    const navigate = useNavigate();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [auctions, setAuctions] = useState<MyAuction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [profileResponse, auctionsResponse] = await Promise.all([
                    api.get('/profile/info'),
                    getMyAuctions()
                ]);
                setProfile(profileResponse.data);
                setAuctions(auctionsResponse);
            } catch (err: any) {
                setError(err.response?.data?.detail || 'Failed to fetch data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
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

    if (!profile) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-gray-600 text-center">
                    <p className="text-xl font-bold">No Profile Found</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Profile Section */}
            <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8 mb-8">
                <h1 className="text-3xl font-bold mb-6 text-center">My Profile</h1>
                
                <div className="space-y-4">
                    <div className="flex border-b border-gray-200 py-3">
                        <span className="font-semibold w-1/3">Username:</span>
                        <span className="w-2/3">{profile.Username}</span>
                    </div>
                    
                    <div className="flex border-b border-gray-200 py-3">
                        <span className="font-semibold w-1/3">Rating:</span>
                        <span className="w-2/3">
                            <StarRating rating={profile.CurrentRating} />
                            <div className="text-sm text-gray-500 mt-1">
                                Based on {profile.NumberOfRating} {profile.NumberOfRating === 1 ? 'rating' : 'ratings'}
                            </div>
                        </span>
                    </div>
                </div>
            </div>

            {/* Auctions Section */}
            <div className="max-w-7xl mx-auto">
                <h2 className="text-2xl font-bold mb-6 text-center">My Auctions</h2>
                
                {auctions.length === 0 ? (
                    <div className="text-center text-gray-600 py-8">
                        You haven't created any auctions yet.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {auctions.map((auction) => (
                            <div key={auction.AuctionID} className="bg-white rounded-lg shadow-lg p-4 relative">
                                {/* Status Badge */}
                                <div className="absolute top-2 right-2">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyle(auction.Status)}`}>
                                        {auction.Status}
                                    </span>
                                </div>

                                {/* Card Image */}
                                <div className="aspect-w-3 aspect-h-4 mb-4 mt-6">
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
                                    <h3 className="text-lg font-semibold mb-2 truncate">{auction.CardName}</h3>
                                    {auction.HighestBidderID ? (
                                        <p className="text-gray-600">Current Bid: ${auction.HighestBid}</p>
                                    ) : (
                                        <>
                                            <p className="text-gray-600">Starting Bid: ${auction.StartingBid}</p>
                                            <p className="text-gray-600">Current Bid: $0</p>
                                        </>
                                    )}
                                    <p className="text-gray-600">Ends: {new Date(auction.EndTime).toLocaleDateString()}</p>
                                    
                                    <button
                                        onClick={() => handleViewDetails(auction.AuctionID)}
                                        className="mt-4 w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
                                    >
                                        View Details
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile; 