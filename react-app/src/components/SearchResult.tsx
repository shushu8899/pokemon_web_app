import React from "react";
import { Link } from "react-router-dom";
import surprisedPikachu from "../assets/surprisedPikachu.png";

interface SearchResult {
  id: string;
  _table?: string;
  CardName?: string;
  CardQuality?: string;
  Username?: string;
  CurrentRating?: string;
  Email?: string;
  AuctionID?: string;
  ImageURL?: string;
}

interface SearchResultsProps {
  results: SearchResult[];
  searchPerformed: boolean;
}

const SearchResults: React.FC<SearchResultsProps> = ({ results, searchPerformed }) => {
  console.log('SearchResults received:', { results, searchPerformed });
  
  // Log card-specific results for debugging
  const cardResults = results.filter(result => 
    result._table && result._table.toLowerCase().includes('card')
  );
  console.log('Card results:', cardResults);
  
  // Function to construct proper image URL
  const getImageUrl = (imageUrl: string | undefined): string => {
    if (!imageUrl) return '';
    
    const url = imageUrl.startsWith('http') 
      ? imageUrl 
      : imageUrl.startsWith('/') 
        ? `http://127.0.0.1:8000${imageUrl}`
        : `http://127.0.0.1:8000/${imageUrl}`;
    
    console.log(`Original URL: ${imageUrl}, Constructed URL: ${url}`);
    return url;
  };
  
  // Handle empty results
  if (searchPerformed && results.length === 0) {
    return (
      <div className="mt-4 py-8 flex flex-col items-center justify-center">
        <p>No results found.</p>
        <img src = {surprisedPikachu} alt="No results found" style={{ width: "200px"}}/>
      </div>
    );
  }

  // Group results by table name
  const groupedResults = results.reduce((groups, result) => {
    const tableName = result._table || 'Other';
    return {
      ...groups,
      [tableName]: [...(groups[tableName] || []), result]
    };
  }, {} as Record<string, SearchResult[]>);

  // Get table names that have results
  const tableNames = Object.keys(groupedResults);

  return (
    <div className="py-8">
      {tableNames.map(tableName => (
        <div key={tableName} className="mb-6 mx-8 md:mx-10">
          <h2 className="text-xl capitalize mb-4 px-2 font-bold">{tableName} Results</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groupedResults[tableName].map(result => {
              // Create appropriate link based on table type
              const content = (
                <div 
                  className="p-4 rounded-lg shadow-lg bg-yellow-300 hover:bg-yellow-400 transition-colors cursor-pointer"
                  style={{ 
                    borderRadius: "15px",
                    boxShadow: "5px 5px 4px rgba(105, 105, 104, 0.5)"
                  }}
                >
                  {/* Display card image if available and is a card result */}
                  {tableName.toLowerCase().includes('card') && (
                    <div className="mb-3 flex justify-center">
                      {result.ImageURL ? (
                        <>
                          <img 
                            src={getImageUrl(result.ImageURL)}
                            alt={result.CardName || "Pokemon Card"} 
                            className="w-full max-w-[200px] rounded-lg"
                            onError={(e) => {
                              console.error(`Failed to load image: ${result.ImageURL}, URL attempted: ${getImageUrl(result.ImageURL)}`);
                              e.currentTarget.src = surprisedPikachu; // Fallback image
                            }}
                          />
                          {/* Hidden debug info */ }
                          <div className="hidden">
                            Image Path: {result.ImageURL}<br/>
                            Processed URL: {getImageUrl(result.ImageURL)}
                          </div>
                        </>
                      ) : (
                        <div className="w-full max-w-[200px] h-[200px] bg-gray-200 rounded-lg flex items-center justify-center">
                          <p className="text-gray-500">No image available</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Display all properties of the result */}
                  {Object.entries(result).map(([key, value]) => (
                    key !== '_table' && key !== 'ImageURL' && (
                      <p key={key} className="py-1">
                        <strong>{key}:</strong> {value}
                      </p>
                    )
                  ))}
                </div>
              );

              // Wrap with appropriate link based on table type
              if (tableName.toLowerCase().includes('card')) {
                return (
                  <Link key={result.id} to={`/bidding/${result.AuctionID}`}>
                    {content}
                  </Link>
                );
              } else if (tableName.toLowerCase().includes('profile') || tableName.toLowerCase().includes('user')) {
                return (
                  <Link key={result.id} to={`/profile/${result.Username || result.id}`}>
                    {content}
                  </Link>
                );
              } else {
                return <div key={result.id}>{content}</div>;
              }
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SearchResults;
