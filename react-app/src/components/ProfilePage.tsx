import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import pokemonSpinner from "../assets/pokeballloading.gif";
import surprisedPikachu from "../assets/surprisedPikachu.png";
import { getImageUrl } from '../utils/imageUtils';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
// Import sprites
import sprite1 from '../assets/sprites/hgss_female1.png';
import sprite2 from '../assets/sprites/hgss_female2.png';
import sprite3 from '../assets/sprites/hgss_female3.png';
import sprite4 from '../assets/sprites/hgss_male1.png';
import sprite5 from '../assets/sprites/hgss_male2.png';
import sprite6 from '../assets/sprites/hgss_male3.png';
import sprite7 from '../assets/sprites/hgss_female4.png';
import sprite8 from '../assets/sprites/hgss_male4.png';
import sprite9 from '../assets/sprites/hgss_female5.png';
import sprite10 from '../assets/sprites/hgss_male5.png';
import sprite11 from '../assets/sprites/hgss_kid1.png';

const sprites = [sprite1, sprite2, sprite3, sprite4, sprite5, sprite6, sprite7, sprite8, sprite9, sprite10, sprite11];

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
  CardQuality?: string;
}

// Group auctions by status
type GroupedAuctions = {
  inProgress: UserAuction[];
  closed: UserAuction[];
  pending: UserAuction[];
  other: UserAuction[];
};

// Helper function to render star ratings
const RatingStars: React.FC<{ rating: number, count: number }> = ({ rating, count }) => {
  // Create an array to hold star elements
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  // Add full stars
  for (let i = 0; i < fullStars; i++) {
    stars.push(<FaStar key={`star-${i}`} className="text-yellow-500" />);
  }
  
  // Add half star if needed
  if (hasHalfStar) {
    stars.push(<FaStarHalfAlt key="half-star" className="text-yellow-500" />);
  }
  
  // Add empty stars
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  for (let i = 0; i < emptyStars; i++) {
    stars.push(<FaRegStar key={`empty-star-${i}`} className="text-yellow-500" />);
  }
  
  return (
    <div>
      <div className="flex items-center gap-1 mb-1">
        {stars}
      </div>
      <div className="text-sm text-gray-600">
        {rating.toFixed(1)} ({count} {count === 1 ? 'rating' : 'ratings'})
      </div>
    </div>
  );
};

const ProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [auctions, setAuctions] = useState<UserAuction[]>([]);
  const [groupedAuctions, setGroupedAuctions] = useState<GroupedAuctions>({
    inProgress: [],
    closed: [],
    pending: [],
    other: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to format price
  const formatPrice = (price: number | string | undefined): string => {
    if (price === undefined || price === null) return 'N/A';
    
    try {
      // Convert to number if it's a string
      const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
      return numericPrice.toFixed(2);
    } catch (error) {
      console.error('Error formatting price:', error);
      return 'Invalid Price';
    }
  };

  // Helper function to format date
  const formatDate = (timestamp: string | undefined): string => {
    if (!timestamp) return 'N/A';
    
    console.log('Formatting timestamp:', timestamp, 'Type:', typeof timestamp);
    
    try {
      // Handle ISO format strings (YYYY-MM-DDTHH:MM:SS)
      if (typeof timestamp === 'string') {
        // Handle SQLAlchemy/Python datetime format which might include timezone info
        if (timestamp.includes('T') || timestamp.includes('-')) {
          const date = new Date(timestamp);
          console.log('Parsed ISO date:', date);
          return date.toLocaleString();
        }
        
        // Handle numeric timestamp as string
        const numericTimestamp = parseInt(timestamp);
        console.log('Parsed numeric timestamp:', numericTimestamp);
        
        // If the timestamp is in seconds (Unix timestamp), convert to milliseconds
        // Most Unix timestamps are 10 digits for seconds, 13 for milliseconds
        if (numericTimestamp < 10000000000) {
          const date = new Date(numericTimestamp * 1000);
          console.log('Converted seconds to date:', date);
          return date.toLocaleString();
        } else {
          // Already in milliseconds
          const date = new Date(numericTimestamp);
          console.log('Converted milliseconds to date:', date);
          return date.toLocaleString();
        }
      }
      
      return String(timestamp);
    } catch (error) {
      console.error('Error formatting date:', error, 'Original value:', timestamp);
      return 'Invalid Date';
    }
  };

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
          
          let userAuctions: UserAuction[] = [];
          if (auctionsResponse.data && Array.isArray(auctionsResponse.data)) {
            userAuctions = auctionsResponse.data;
          } else if (auctionsResponse.data.auctions && Array.isArray(auctionsResponse.data.auctions)) {
            userAuctions = auctionsResponse.data.auctions;
          } else {
            console.error('Unexpected auction response format:', auctionsResponse.data);
            userAuctions = [];
          }
          
          setAuctions(userAuctions);
          
          // Group auctions by status
          const grouped: GroupedAuctions = {
            inProgress: [],
            closed: [],
            pending: [],
            other: []
          };
          
          userAuctions.forEach(auction => {
            if (auction.Status === 'In Progress') {
              grouped.inProgress.push(auction);
            } else if (auction.Status === 'Closed') {
              grouped.closed.push(auction);
            } else if (auction.Status === 'Pending') {
              grouped.pending.push(auction);
            } else {
              grouped.other.push(auction);
            }
          });
          
          console.log('Grouped auctions:', grouped);
          setGroupedAuctions(grouped);
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

  // Helper function to render an auction card
  const renderAuctionCard = (auction: UserAuction) => {
    const isInProgress = auction.Status === 'In Progress';
    
    return (
      <div key={auction.AuctionID} className="bg-white rounded-lg shadow-lg overflow-hidden transform transition-transform duration-300 hover:scale-105 hover:shadow-xl">
        {/* Status Badge */}
        <div className="absolute top-2 right-2">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            isInProgress ? 'bg-green-100 text-green-800' :
            auction.Status === 'Closed' ? 'bg-red-100 text-red-800' :
            auction.Status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {auction.Status}
          </span>
        </div>
        
        {/* Card Image */}
        <div className="mb-3 flex justify-center mt-10">
          <img
            src={getImageUrl(auction.ImageURL)}
            alt={auction.CardName}
            className="w-full h-48 object-contain rounded-lg"
            onError={(e) => {
              console.error(`Failed to load image: ${auction.ImageURL}`);
              e.currentTarget.src = surprisedPikachu;
            }}
          />
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-2">{auction.CardName}</h3>
          {auction.CardQuality && (
            <p className="text-gray-600"><strong>Quality:</strong> {auction.CardQuality}</p>
          )}
          {auction.HighestBid && (
            <p className="text-gray-600">
              <strong>Current Bid:</strong> ${formatPrice(auction.HighestBid)}
            </p>
          )}
          <p className="text-gray-600">
            <strong>{auction.Status === 'Closed' ? 'Ended' : 'Ends'}:</strong> {formatDate(auction.EndTime)}
          </p>
          
          {/* Add bid button for in-progress auctions */}
          {isInProgress && (
            <Link
              to={`/bid-details/${auction.AuctionID}`}
              className="mt-4 inline-block w-full py-2 px-4 bg-yellow-400 text-black text-center font-bold rounded hover:bg-yellow-500 transition-colors"
            >
              Bid Now
            </Link>
          )}
        </div>
      </div>
    );
  };

  // Function to render a section of auctions
  const renderAuctionSection = (title: string, auctionList: UserAuction[]) => {
    if (auctionList.length === 0) return null;
    
    return (
      <div className="mb-10">
        <h3 className="text-xl font-semibold mb-4 pb-2 border-b-2 border-yellow-400 text-center">{title}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {auctionList.map(auction => renderAuctionCard(auction))}
        </div>
      </div>
    );
  };

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
      <div className="flex flex-col md:flex-row gap-8">
        {/* Profile Header - Vertical box on left */}
        <div className="md:w-1/4">
          <div className="bg-white rounded-lg p-6 shadow-lg sticky top-4 h-auto min-h-[300px]">
            {/* Add sprite image above username */}
            <div className="flex justify-center mb-4">
              <img 
                src={sprites[Math.floor(Math.random() * sprites.length)]} 
                alt="Trainer sprite" 
                className="w-24 h-24 object-contain"
              />
            </div>
            
            <h1 className="font-bold mb-6 pb-2 border-b-2 border-yellow-400 text-center"
                style={{
                    fontSize: '15px',
                    fontWeight: 'bold',
                    marginBottom: '1rem',
                    paddingBottom: '0.5rem',
                    borderBottom: '2px solid #FFD700'
                }}
            >{profile.Username}'s Profile</h1>
            <div className="flex flex-col gap-4">
              <div className="text-lg">
                <p className="mb-2"><strong>Rating:</strong></p>
                <RatingStars 
                  rating={profile.CurrentRating} 
                  count={profile.NumberOfRating} 
                />
              </div>
              <p className="text-lg">
                <strong>Total Auctions:</strong> {auctions.length}
              </p>
            </div>
          </div>
        </div>

        {/* User's Auctions - Right side content */}
        <div className="md:w-3/4 lg:w-4/5">
          <h2 className="text-2xl font-bold mb-6 text-center">Auctions</h2>
          
          {auctions.length === 0 ? (
            <p className="text-center text-gray-500">No auctions found for this user.</p>
          ) : (
            <>
              {renderAuctionSection("In Progress Auctions", groupedAuctions.inProgress)}
              {renderAuctionSection("Pending Auctions", groupedAuctions.pending)}
              {renderAuctionSection("Closed Auctions", groupedAuctions.closed)}
              {renderAuctionSection("Other Auctions", groupedAuctions.other)}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 