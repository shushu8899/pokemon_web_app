import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import pokemonSpinner from "../assets/pokeballloading.gif";

interface ProfileInfo {
  UserID: string;
  Username: string;
  Email: string;
  NumberOfRating: number;
  CurrentRating: number;
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
  const [profile, setProfile] = useState<ProfileInfo | null>(null);
  const [auctions, setAuctions] = useState<UserAuction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        // First get the user's profile info from the search endpoint
        const searchResponse = await axios.get(`http://127.0.0.1:8000/search/profiles?search_query=${username}`);
        console.log('Search response:', searchResponse.data);
        
        // Find the matching profile
        const userProfile = searchResponse.data.find((profile: any) => 
          profile.Username.toLowerCase() === username?.toLowerCase()
        );

        if (!userProfile) {
          throw new Error('Profile not found');
        }

        setProfile(userProfile);

        // Now fetch their auctions using their UserID
        const auctionsResponse = await axios.get(`http://127.0.0.1:8000/auction/seller/${userProfile.UserID}`);
        setAuctions(auctionsResponse.data);
        
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile data');
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
              <strong>Rating:</strong> {profile.CurrentRating} ({profile.NumberOfRating} ratings)
            </p>
          </div>
          <div>
            <p className="text-lg"><strong>User ID:</strong> {profile.UserID}</p>
            <p className="text-lg"><strong>Total Auctions:</strong> {auctions.length}</p>
          </div>
        </div>
      </div>

      {/* Active Auctions */}
      <h2 className="text-2xl font-bold mb-6">Active Auctions</h2>
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
                <strong>Ends:</strong> {new Date(auction.EndTime).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
        {auctions.length === 0 && (
          <p className="col-span-full text-center text-gray-500">No active auctions found.</p>
        )}
      </div>
    </div>
  );
};

export default ProfilePage; 