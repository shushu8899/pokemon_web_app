import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import pokemonSpinner from "../assets/pokeballloading.gif";
import surprisedPikachu from "../assets/surprisedPikachu.png";

interface UserProfile {
  Username: string;
  Email: string;
  CurrentRating: number;
  NumberOfRating: number;
  UserID: string;
}

interface UserAuction {
  AuctionID: string;
  CardName: string;
  ImageURL?: string;
  Status: string;
  HighestBid?: number;
  EndTime: string;
}

const ProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [auctions, setAuctions] = useState<UserAuction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        console.log(`Fetching profile for username: ${username}`);
        
        // First get the profile info
        const profileResponse = await axios.get<UserProfile>(`http://127.0.0.1:8000/profile/${username}`);
        console.log('Profile data:', profileResponse.data);
        setProfile(profileResponse.data);
        
        // Fetch auctions for this user using the updated search_auctions endpoint
        try {
          // Get the user's ID from the profile response
          const userId = profileResponse.data.UserID;
          
          // Call the search_auctions endpoint - still using Auction_search parameter
          // but now the service treats it as a user ID
          const auctionsResponse = await axios.get(`http://127.0.0.1:8000/search/auctions?Auction_search=${userId}`);
          console.log('User auctions:', auctionsResponse.data);
          
          if (auctionsResponse.data && Array.isArray(auctionsResponse.data)) {
            setAuctions(auctionsResponse.data);
          } else if (auctionsResponse.data.auctions && Array.isArray(auctionsResponse.data.auctions)) {
            setAuctions(auctionsResponse.data.auctions);
          } else {
            console.error('Unexpected auction response format:', auctionsResponse.data);
            setAuctions([]);
          }
        } catch (auctionErr: any) {
          console.error('Error fetching auctions:', auctionErr);
          if (auctionErr.response) {
            console.error('Auction error response:', auctionErr.response.data);
            console.error('Auction error status:', auctionErr.response.status);
          }
          // Still show the profile even if auctions fail to load
        }
      } catch (err: any) {
        console.error('Error fetching profile:', err);
        setError(`Failed to load profile data: ${err.message}`);
        if (err.response) {
          console.error('Response data:', err.response.data);
          console.error('Response status:', err.response.status);
        }
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchProfileData();
    }
  }, [username]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <img src={pokemonSpinner} alt="Loading..." className="w-24 h-24 mx-auto"/>
          <p className="mt-4">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">{error || 'Profile not found'}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="bg-yellow-300 rounded-lg p-6 shadow-lg mb-8">
        <h1 className="text-3xl font-bold mb-4">{profile.Username}'s Profile</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-lg"><strong>Email:</strong> {profile.Email}</p>
            <p className="text-lg">
              <strong>Rating:</strong> {profile.CurrentRating} 
              ({profile.NumberOfRating} ratings)
            </p>
          </div>
          <div>
            <p className="text-lg"><strong>User ID:</strong> {profile.UserID}</p>
            <p className="text-lg"><strong>Total Auctions:</strong> {auctions.length}</p>
          </div>
        </div>
      </div>

      {/* User's Auctions */}
      <h2 className="text-2xl font-bold mb-6">Auctions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {auctions.map(auction => (
          <div key={auction.AuctionID} className="bg-white rounded-lg shadow-lg overflow-hidden">
            {auction.ImageURL && (
              <div className="h-48 overflow-hidden">
                <img 
                  src={auction.ImageURL.startsWith('http') 
                    ? auction.ImageURL 
                    : `http://127.0.0.1:8000${auction.ImageURL}`}
                  alt={auction.CardName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error(`Failed to load image: ${auction.ImageURL}`);
                    e.currentTarget.src = surprisedPikachu;
                  }}
                />
              </div>
            )}
            <div className="p-4">
              <h3 className="text-xl font-semibold mb-2">{auction.CardName}</h3>
              <p className="text-gray-600"><strong>Status:</strong> {auction.Status}</p>
              {auction.HighestBid && (
                <p className="text-gray-600"><strong>Current Bid:</strong> ${auction.HighestBid}</p>
              )}
              <p className="text-gray-600">
                <strong>Ends:</strong> {new Date(Number(auction.EndTime) * 1000).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
        {auctions.length === 0 && (
          <p className="col-span-full text-center text-gray-500">No auctions found for this user.</p>
        )}
      </div>
    </div>
  );
};

export default ProfilePage; 