import React, { useState } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [query, setQuery] = useState<string>("");

  const handleSearch = () => {
    if (query.trim()) {
      onSearch(query);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-3xl">
      <h1 className="text-2xl font-bold mb-4 pb-2 border-b-2 border-yellow-400 w-full text-center">Find Your Next Great Deal</h1>
      
      <div className="flex w-full mt-2">
        <input 
          type="text" 
          value={query} 
          onChange={(e) => setQuery(e.target.value)} 
          onKeyDown={handleKeyPress}
          placeholder="Search for cards or profiles" 
          className="flex-1 p-3 pl-5 border border-yellow-400 rounded-l-full focus:outline-none"
        />
        <button 
          onClick={handleSearch} 
          className="bg-yellow-400 text-black px-6 py-3 rounded-r-full hover:bg-yellow-500 transition-colors font-medium"
        >
          Search
        </button>
      </div>
    </div>
  );
}

export default SearchBar;