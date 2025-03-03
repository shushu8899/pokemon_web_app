import React, { useState } from "react";
import SearchBar from "./SearchBar";
import SearchResults from "./SearchResult";
import pokemonSpinner from "../assets/pokeballloading.gif";

interface SearchResult {
  id: string;
  CardName?: string;
  Username?: string;
}

interface SearchPageProps {
  fetchSearchResults: (
    query: string,
    setResults: (results: SearchResult[]) => void,
    setLoading: (loading: boolean) => void
  ) => Promise<void>;
}

const SearchPage: React.FC<SearchPageProps> = ({ fetchSearchResults }) => {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchPerformed, setSearchPerformed] = useState<boolean>(false);

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      setSearchPerformed(false);
      return;
    }

    setLoading(true);
    setSearchPerformed(true);

    try {
      await fetchSearchResults(query, setResults, setLoading);
      // Set short delay before loading results
      setTimeout(() => {
        setLoading(false);
      }, 1000); // 2 seconds delay
    } catch (error) {
      console.error("Error fetching search results", error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex-col">
      <SearchBar onSearch={handleSearch} />
      {loading ? (
        <div className="mt-4 text-center py-8 flex flex-col items-center">
          <img src={pokemonSpinner} alt="Loading..." style={{ width: "100px", height: "100px" }}/>
          <p style={{ marginTop: "20px" }}>Loading...</p>
        </div>
      ) : (
        <SearchResults results={results} searchPerformed={searchPerformed}  />
      )}
    </div>
  );
};

export default SearchPage;
