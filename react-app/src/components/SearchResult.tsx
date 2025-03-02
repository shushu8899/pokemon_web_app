import React from "react";
import surprisedPikachu from "../assets/surprisedPikachu.png";

interface SearchResult {
  id: string;
  _table?: string;
  CardName?: string;
  Username?: string;
  CurrentRating?: string;
  Email?: string;
  CardQuality?: string;
  AuctionName?: string;
  // Add other properties as needed
}

interface SearchResultsProps {
  results: SearchResult[];
  searchPerformed: boolean;
}

const SearchResults: React.FC<SearchResultsProps> = ({ results, searchPerformed }) => {
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
        <div key={tableName} className="mb-6 p-4">
          <h2 className="text-xl font-bold capitalize mb-2 px-8">{tableName} Results</h2>
          <ul className="space-y-2">
            {groupedResults[tableName].map(result => (
              <li key={result.id} className="py-2">
                {/* Display logic based on result properties */}
                <p>
                  {result.CardName ? `Card: ${result.CardName} (Card Quality: ${result.CardQuality})` : 
                   result.Username ? `${result.Username}` : 
                   `Item ID: ${result.id}`}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};


export default SearchResults;
