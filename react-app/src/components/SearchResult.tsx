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
  AuctionStatus?: string;
  ImageURL?: string;
}

interface SearchResultsProps {
  results: SearchResult[];
  searchPerformed: boolean;
}

const SearchResults: React.FC<SearchResultsProps> = ({ results, searchPerformed }) => {
  console.log('SearchResults received:', { results, searchPerformed });
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
                  {tableName.toLowerCase().includes('card') && (result.ImageURL) && (
                    <div className="mb-3 flex justify-center">
                      <img 
                        src={result.ImageURL.startsWith('http') 
                        ? result.ImageURL 
                         : `http://127.0.0.1:8000${result.ImageURL}`}
                        alt={result.CardName || "Pokemon Card"} 
                        className="w-full max-w-[200px] rounded-lg"
                      />
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
