import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import SearchBar from "./SearchBar";
import pokemonSpinner from "../assets/pokeballloading.gif";
import surprisedPikachu from "../assets/surprisedPikachu.png";
import axios from 'axios';
import { getImageUrl } from '../utils/imageUtils';
import { FaChevronLeft, FaChevronRight, FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
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

interface CardAuction {
  result_type: string;
  card: {
    OwnerID: string;
    CardName: string;
    CardQuality: string;
    ImageURL: string;
  };
  auction: {
    AuctionID: string;
    SellerID: string;
    Status: string;
    EndTime?: string;
    HighestBid?: number;
  };
}

interface Profile {
  result_type: string;
  Username: string;
  Email: string;
  CurrentRating: number;
  NumberOfRating: number;
}

interface SearchResult {
  result_type: string;
  [key: string]: any;
}

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

// Filter option types
type FilterOption = 'all' | 'ongoing' | 'past' | 'profiles';

const SearchPage: React.FC = () => {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchPerformed, setSearchPerformed] = useState<boolean>(false);
  const loadingTimerRef = useRef<number | null>(null);
  
  // Track categorized results for easier access
  const [ongoingAuctions, setOngoingAuctions] = useState<CardAuction[]>([]);
  const [pastAuctions, setPastAuctions] = useState<CardAuction[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  
  // Active filter state
  const [activeFilter, setActiveFilter] = useState<FilterOption>('all');

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
      
      // Should never reach here given our type definition, but for future proofing
      console.warn('Unexpected timestamp type:', typeof timestamp);
      return String(timestamp);
    } catch (error) {
      console.error('Error formatting date:', error, 'Original value:', timestamp);
      return 'Invalid Date';
    }
  };

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

  // Custom loading state setter that respects minimum display time
  const setLoadingWithDelay = (isLoading: boolean) => {
    if (isLoading) {
      // If turning loading on, just do it immediately
      setLoading(true);
      
      // Clear any existing timers
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
    } else {
      // If turning loading off, ensure minimum 2 second display time
      if (!loadingTimerRef.current) {
        loadingTimerRef.current = setTimeout(() => {
          setLoading(false);
          loadingTimerRef.current = null;
        }, 2000);
      }
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      setOngoingAuctions([]);
      setPastAuctions([]);
      setProfiles([]);
      setSearchPerformed(false);
      return;
    }

    // Start the loading state
    setLoadingWithDelay(true);
    setSearchPerformed(true);

    try {
      // Call the search_all_tables endpoint with the updated structure
      console.log(`Making API request to: http://127.0.0.1:8000/search/all?query=${encodeURIComponent(query)}`);
      const response = await axios.get(`http://127.0.0.1:8000/search/all?query=${encodeURIComponent(query)}`);
      console.log('Search response:', response.data);
      
      if (!response.data) {
        console.error('No data returned from API');
        throw new Error('No data returned from API');
      }
      
      // Process the results based on the structure
      const { allResults, ongoing, past, profileResults } = processResults(response.data);
      
      // Update state with processed results
      console.log('Processed results:', { 
        all: allResults.length, 
        ongoing: ongoing.length,
        past: past.length,
        profiles: profileResults.length
      });
      
      setResults(allResults);
      setOngoingAuctions(ongoing);
      setPastAuctions(past);
      setProfiles(profileResults);
      
    } catch (error) {
      console.error("Error fetching search results:", error);
      setResults([]);
      setOngoingAuctions([]);
      setPastAuctions([]);
      setProfiles([]);
    } finally {
      setLoadingWithDelay(false);
    }
  };

  // Process the results based on the new structure
  const processResults = (responseData: any) => {
    const allResults: SearchResult[] = [];
    const ongoing: CardAuction[] = [];
    const past: CardAuction[] = [];
    const profileResults: Profile[] = [];
    
    console.log('Processing response data:', responseData);
    
    // Check if response has proper structure
    if (!responseData.results) {
      console.error('Response data missing results property:', responseData);
      return { allResults, ongoing, past, profileResults };
    }
    
    // Handle profile results
    if (responseData.results.Profile && Array.isArray(responseData.results.Profile)) {
      console.log('Found Profile results:', responseData.results.Profile.length);
      responseData.results.Profile.forEach((item: Profile) => {
        allResults.push(item);
        profileResults.push(item);
      });
    }
    
    // Handle CardAuction results
    if (responseData.results.CardAuction && Array.isArray(responseData.results.CardAuction)) {
      console.log('Found CardAuction results:', responseData.results.CardAuction.length);
      responseData.results.CardAuction.forEach((item: CardAuction) => {
        allResults.push(item);
        
        // Debug timestamp format
        if (item.auction?.EndTime) {
          console.log('EndTime format:', item.auction.EndTime, 'Type:', typeof item.auction.EndTime);
        }
        
        // Categorize by status
        if (item.auction?.Status === 'In Progress') {
          ongoing.push(item);
        } else {
          past.push(item);
        }
      });
    }
    
    console.log('Finished processing results:', { 
      allResults: allResults.length,
      ongoing: ongoing.length,
      past: past.length,
      profiles: profileResults.length
    });
    
    return { allResults, ongoing, past, profileResults };
  };

  // Filter pills component
  const FilterPills = () => {
    return (
      <div className="flex flex-wrap justify-center gap-3 my-6">
        <button 
          onClick={() => setActiveFilter('all')}
          className={`px-5 py-2 rounded-full font-medium transition-colors ${
            activeFilter === 'all' 
              ? 'bg-yellow-400 text-black' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All Results ({results.length})
        </button>
        
        <button 
          onClick={() => setActiveFilter('ongoing')}
          className={`px-5 py-2 rounded-full font-medium transition-colors ${
            activeFilter === 'ongoing' 
              ? 'bg-yellow-400 text-black' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Ongoing Auctions ({ongoingAuctions.length})
        </button>
        
        <button 
          onClick={() => setActiveFilter('past')}
          className={`px-5 py-2 rounded-full font-medium transition-colors ${
            activeFilter === 'past' 
              ? 'bg-yellow-400 text-black' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Past Auctions ({pastAuctions.length})
        </button>
        
        <button 
          onClick={() => setActiveFilter('profiles')}
          className={`px-5 py-2 rounded-full font-medium transition-colors ${
            activeFilter === 'profiles' 
              ? 'bg-yellow-400 text-black' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          User Profiles ({profiles.length})
        </button>
      </div>
    );
  };

  // Render auction card
  const renderOngoingAuctionCard = (item: CardAuction, index: number) => (
    <div key={`ongoing-${index}`} className="p-4 rounded-lg shadow-lg bg-white relative transform transition-transform duration-300 hover:scale-105 hover:shadow-xl">
      {/* Status Badge */}
      <div className="absolute top-2 right-2">
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
          {item.auction.Status}
        </span>
      </div>
      
      {/* Card Image */}
      <div className="mb-3 flex justify-center">
        <img 
          src={getImageUrl(item.card.ImageURL)}
          alt={item.card.CardName}
          className="w-full h-48 object-contain rounded-lg"
          onError={(e) => {
            e.currentTarget.src = surprisedPikachu; // Fallback image
          }}
        />
      </div>
      
      {/* Card Details */}
      <h3 className="text-lg font-semibold mb-2">{item.card.CardName}</h3>
      <p><strong>Quality:</strong> {item.card.CardQuality}</p>
      {item.auction.HighestBid !== undefined && (
        <p><strong>Current Bid:</strong> ${formatPrice(item.auction.HighestBid)}</p>
      )}
      {item.auction.EndTime && (
        <p><strong>Ends:</strong> {formatDate(item.auction.EndTime)}</p>
      )}
      
      {/* Action Button */}
      <Link 
        to={`/bid-details/${item.auction.AuctionID}`}
        className="mt-4 block w-full py-2 px-4 bg-yellow-400 text-black text-center font-bold rounded hover:bg-yellow-500 transition-colors"
      >
        Place Bid
      </Link>
    </div>
  );

  // Render past auction card
  const renderPastAuctionCard = (item: CardAuction, index: number) => (
    <div key={`past-${index}`} className="p-4 rounded-lg shadow-lg bg-gray-200 relative transform transition-transform duration-300 hover:scale-105 hover:shadow-xl">
      {/* Status Badge */}
      <div className="absolute top-2 right-2">
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
          {item.auction.Status}
        </span>
      </div>
      
      {/* Card Image */}
      <div className="mb-3 flex justify-center">
        <img 
          src={getImageUrl(item.card.ImageURL)}
          alt={item.card.CardName}
          className="w-full h-48 object-contain rounded-lg"
          onError={(e) => {
            e.currentTarget.src = surprisedPikachu; // Fallback image
          }}
        />
      </div>
      
      {/* Card Details */}
      <h3 className="text-lg font-semibold mb-2">{item.card.CardName}</h3>
      <p><strong>Quality:</strong> {item.card.CardQuality}</p>
      {item.auction.HighestBid !== undefined && (
        <p><strong>Final Bid:</strong> ${formatPrice(item.auction.HighestBid)}</p>
      )}
      {item.auction.EndTime && (
        <p><strong>Ended:</strong> {formatDate(item.auction.EndTime)}</p>
      )}
      
      {/* Status indicator */}
      <div className="mt-4 block w-full py-2 px-4 bg-gray-300 text-gray-700 text-center font-bold rounded">
        Auction Ended
      </div>
    </div>
  );

  // Render profile card
  const renderProfileCard = (profile: Profile, index: number) => (
    <Link to={`/profile/${profile.Username}`} key={`profile-${index}`} className="block transform transition-transform duration-300 hover:scale-105">
      <div className="p-6 rounded-lg shadow-lg bg-[#fbeda5] hover:bg-yellow-400 transition-colors h-full">
        {/* Add sprite image above username */}
        <div className="flex justify-center mb-4">
          <img 
            src={sprites[Math.floor(Math.random() * sprites.length)]} 
            alt="Trainer sprite" 
            className="w-16 h-16 object-contain"
          />
        </div>
        <h3 className="text-xl font-semibold mb-4 text-center">{profile.Username}</h3>
        <RatingStars 
          rating={profile.CurrentRating || 0} 
          count={profile.NumberOfRating || 0} 
        />
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen flex-col mt-8">
      <div className="flex justify-center items-center mb-6">
      <SearchBar onSearch={handleSearch} />
      </div>

      {loading ? (
        <div className="mt-4 text-center py-8 flex flex-col items-center">
          <img src={pokemonSpinner} alt="Loading..." style={{ width: "100px", height: "100px" }}/>
          <p style={{ marginTop: "20px" }}>Loading...</p>
        </div>
      ) : (
        <div className="container mx-auto px-4">
          {/* Only show filter pills if search was performed and there are results */}
          {searchPerformed && results.length > 0 && <FilterPills />}
          
          {/* Render content based on active filter */}
          {searchPerformed && !loading && (
            <>
              {/* All Results */}
              {activeFilter === 'all' && (
                <>
                  {/* Show ongoing auctions */}
                  {ongoingAuctions.length > 0 && (
                    <div className="mb-10">
                      <h2 className="text-2xl font-bold mb-4 pb-2 border-b-2 border-yellow-400 text-center">Ongoing Auctions</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {ongoingAuctions.map((item, index) => renderOngoingAuctionCard(item, index))}
                      </div>
                    </div>
                  )}
                  
                  {/* Show past auctions */}
                  {pastAuctions.length > 0 && (
                    <div className="mb-10">
                      <h2 className="text-2xl font-bold mb-4 pb-2 border-b-2 border-yellow-400 text-center">Past Auctions</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pastAuctions.map((item, index) => renderPastAuctionCard(item, index))}
                      </div>
                    </div>
                  )}
                  
                  {/* Show profiles */}
                  {profiles.length > 0 && (
                    <div className="mb-10">
                      <h2 className="text-2xl font-bold mb-4 pb-2 border-b-2 border-yellow-400 text-center">User Profiles</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {profiles.map((profile, index) => renderProfileCard(profile, index))}
                      </div>
                    </div>
                  )}
                </>
              )}
              
              {/* Ongoing Auctions Filter */}
              {activeFilter === 'ongoing' && ongoingAuctions.length > 0 && (
                <div className="mb-10">
                  <h2 className="text-2xl font-bold mb-4 pb-2 border-b-2 border-yellow-400 text-center">Ongoing Auctions</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {ongoingAuctions.map((item, index) => renderOngoingAuctionCard(item, index))}
                  </div>
                </div>
              )}
              
              {/* Past Auctions Filter */}
              {activeFilter === 'past' && pastAuctions.length > 0 && (
                <div className="mb-10">
                  <h2 className="text-2xl font-bold mb-4 pb-2 border-b-2 border-yellow-400 text-center">Past Auctions</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pastAuctions.map((item, index) => renderPastAuctionCard(item, index))}
                  </div>
                </div>
              )}
              
              {/* Profiles Filter */}
              {activeFilter === 'profiles' && profiles.length > 0 && (
                <div className="mb-10">
                  <h2 className="text-2xl font-bold mb-4 pb-2 border-b-2 border-yellow-400 text-center">User Profiles</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {profiles.map((profile, index) => renderProfileCard(profile, index))}
                  </div>
                </div>
              )}
            </>
          )}
          
          {/* No results message */}
          {searchPerformed && !loading && results.length === 0 && (
            <div className="mt-4 py-8 flex flex-col items-center justify-center">
              <p>No results found.</p>
              <img src={surprisedPikachu} alt="No results found" style={{ width: "200px" }}/>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchPage;
