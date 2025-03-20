import React, { useState, useRef } from "react";
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
  const loadingTimerRef = useRef<number | null>(null);

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
      setSearchPerformed(false);
      return;
    }

    // Start the loading state
    setLoadingWithDelay(true);
    setSearchPerformed(true);

    try {
      // Use the custom loading setter
      await fetchSearchResults(query, setResults, setLoadingWithDelay);
    } catch (error) {
      console.error("Error fetching search results", error);
      setLoadingWithDelay(false);
    }
  };

  return (
    <div className="min-h-screen flex-col mt-8">
      <SearchBar onSearch={handleSearch} />
      {loading ? (
        <div className="mt-4 text-center py-8 flex flex-col items-center">
          <img src={pokemonSpinner} alt="Loading..." style={{ width: "100px", height: "100px" }}/>
          <p style={{ marginTop: "20px" }}>Loading...</p>
        </div>
      ) : (
        <SearchResults results={results} searchPerformed={searchPerformed} />
      )}
    </div>
  );
};

export default SearchPage;
